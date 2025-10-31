<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\DonationRequest;
use App\Enums\StoryStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StoryController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'donation_request_id' => 'required|exists:donation_requests,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:500',
            'type' => 'required|in:progress,milestone,thank_you,completion',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB
            'duration' => 'required|integer|min:1|max:60',
        ]);

        $donationRequest = DonationRequest::where('id', $validated['donation_request_id'])
            ->where('organizer_id', $user->id)
            ->first();

        if (!$donationRequest) {
            return response()->json(['error' => 'Donation request not found or access denied'], 404);
        }

        DB::beginTransaction();

        try {
            $imagePath = null;
            $imageUrl = null;

            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                $folderPath = 'stories/' . date('Y/m');
                $fileName = Str::random(20) . '.' . $imageFile->getClientOriginalExtension();

                $imagePath = $imageFile->storeAs($folderPath, $fileName, 'public');

                if ($imagePath) {
                    $imageUrl = Storage::disk('public')->url($imagePath);
                    Log::info('Image uploaded successfully', ['path' => $imagePath, 'url' => $imageUrl]);
                } else {
                    throw new \Exception('Failed to save image to local storage');
                }
            }

            $story = Story::create([
                'id' => Str::uuid(),
                'title' => $validated['title'],
                'content' => $validated['content'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(6),
                'images' => [$imageUrl], // array ของ URL
                'videos' => null,
                'type' => $validated['type'],
                'duration' => $validated['duration'],
                'status' => StoryStatus::PUBLISHED,
                'author_id' => $user->id,
                'donation_request_id' => $validated['donation_request_id'],
                'published_at' => now(),
                'views' => 0,
                'image_path' => $imagePath, // path เช่น stories/2025/10/abc123.jpg
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $story->load('donationRequest'),
                'message' => 'Story created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating story: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create story',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();

        DB::beginTransaction();

        try {
            $story = Story::with('donationRequest')->find($id);

            if (!$story) {
                return response()->json(['error' => 'Story not found'], 404);
            }

            if ($story->author_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'content' => 'sometimes|string|max:500',
                'status' => 'sometimes|in:' . implode(',', array_column(StoryStatus::cases(), 'value')),
                'type' => 'sometimes|in:progress,milestone,thank_you,completion',
                'duration' => 'sometimes|integer|min:1|max:60',
                'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            $updateData = $validated;

            // อัพเดท slug ถ้ามี title ใหม่
            if (isset($validated['title'])) {
                $updateData['slug'] = Str::slug($validated['title']) . '-' . Str::random(6);
            }

            // อัพเดท published_at ถ้าเปลี่ยนเป็น PUBLISHED ครั้งแรก
            if (isset($validated['status']) && $validated['status'] === StoryStatus::PUBLISHED->value && $story->status !== StoryStatus::PUBLISHED) {
                $updateData['published_at'] = now();
            }

            // จัดการรูปภาพใหม่
            if ($request->hasFile('image')) {
                // ลบรูปเก่า
                if ($story->image_path && Storage::disk('public')->exists($story->image_path)) {
                    Storage::disk('public')->delete($story->image_path);
                    Log::info('Old image deleted', ['path' => $story->image_path]);
                }

                $imageFile = $request->file('image');
                $folderPath = 'stories/' . date('Y/m');
                $fileName = Str::random(20) . '.' . $imageFile->getClientOriginalExtension();
                $newImagePath = $imageFile->storeAs($folderPath, $fileName, 'public');

                if ($newImagePath) {
                    $newImageUrl = Storage::disk('public')->url($newImagePath);
                    $updateData['images'] = [$newImageUrl];
                    $updateData['image_path'] = $newImagePath;
                } else {
                    throw new \Exception('Failed to save new image');
                }
            }

            $story->update($updateData);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $story->fresh(),
                'message' => 'Story updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating story: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update story',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function destroy($id)
    {
        $user = Auth::user();

        DB::beginTransaction();

        try {
            $story = Story::find($id);

            if (!$story) {
                return response()->json(['error' => 'Story not found'], 404);
            }

            if ($story->author_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // ลบรูปจากเครื่อง
            if ($story->image_path && Storage::disk('public')->exists($story->image_path)) {
                Storage::disk('public')->delete($story->image_path);
                Log::info('Image deleted from storage', ['path' => $story->image_path]);
            }

            $story->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Story deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting story: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete story',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // อัพเดท methods อื่นๆ ให้ตรงกับโครงสร้างตาราง
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = DonationRequest::with(['stories' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }])->where('organizer_id', $user->id);

        if ($request->has('donation_request_id')) {
            $query->where('id', $request->donation_request_id);
        }

        $donationRequests = $query->get();

        return response()->json([
            'success' => true,
            'data' => $donationRequests,
            'message' => 'Stories retrieved successfully'
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = Auth::user();
        $story = Story::with('donationRequest')->find($id);

        if (!$story) {
            return response()->json(['error' => 'Story not found'], 404);
        }

        // ตรวจสอบว่าเป็น owner หรือไม่ (ใช้ author_id)
        if ($story->author_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $story,
            'message' => 'Story retrieved successfully'
        ]);
    }

    // Public methods
    public function publicIndex(Request $request)
    {
        $stories = Story::with('donationRequest')
            ->where('status', StoryStatus::PUBLISHED)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stories
        ]);
    }

    public function publicShow($id)
    {
        $story = Story::with('donationRequest')
            ->where('status', StoryStatus::PUBLISHED)
            ->find($id);

        if (!$story) {
            return response()->json(['error' => 'Story not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $story
        ]);
    }

    public function getStoriesByDonationRequest($donationRequestId)
    {
        $stories = Story::with('donationRequest')
            ->where('donation_request_id', $donationRequestId)
            ->where('status', StoryStatus::PUBLISHED)
            ->orderBy('published_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stories
        ]);
    }

    public function recordView($id)
    {
        $story = Story::find($id);

        if (!$story) {
            return response()->json(['error' => 'Story not found'], 404);
        }

        $story->increment('views');

        return response()->json([
            'success' => true,
            'message' => 'View recorded successfully'
        ]);
    }

    public function toggleLike($id)
    {
        // เนื่องจากตารางไม่มี field likes แล้ว อาจต้องสร้างตารางใหม่สำหรับ like
        // สำหรับตอนนี้ให้ข้ามไปก่อน
        return response()->json([
            'success' => true,
            'message' => 'Like feature not implemented yet'
        ]);
    }
}
