<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\DonationRequest;
use App\Enums\StoryStatus;
use App\Services\TrustLevelService;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoryController extends Controller
{
    // ─── GET /organizer/stories ───────────────────────────────────
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $stories = Story::with(['donationRequest:id,title'])
            ->where('organizer_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $stories,
        ]);
    }

    // ─── POST /organizer/stories ──────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        $request->merge([
            'is_scheduled' => filter_var($request->input('is_scheduled'), FILTER_VALIDATE_BOOLEAN)
        ]);

        $isScheduled = filter_var($request->input('is_scheduled'), FILTER_VALIDATE_BOOLEAN);
        $mediaType   = $request->input('media_type', 'image');

        $mediaRule = $mediaType === 'video'
            ? 'required|file|mimetypes:video/mp4,video/webm,video/quicktime|max:102400' 
            : 'required|file|image|mimes:jpeg,png,jpg,webp|max:5120'; 

        $request->validate([
            'title'               => 'required|string|max:255',
            'content'             => 'required|string|min:10|max:500',
            'type'                => ['required', Rule::in(['progress', 'milestone', 'thank_you', 'completion'])],
            'media_type'          => ['required', Rule::in(['image', 'video'])],
            'media'               => $mediaRule,
            'duration'            => 'required|integer|min:1|max:60',
            'donation_request_id' => [
                'required',
                Rule::exists('donation_requests', 'id')->where('organizer_id', $user->id),
            ],
            'show_time'           => ['required', Rule::in(['immediately', '24_hours', '3_days', '1_week'])],
            'is_scheduled'        => 'required|boolean',
            'scheduled_time'      => 'required_if:is_scheduled,true|nullable|date|after:now',
        ]);

        DB::beginTransaction();
        try {
            $mediaPath = $request->file('media')->store(
                'stories/' . $user->id,
                'public'
            );

            $isPublished = !$isScheduled;
            $publishedAt = $isPublished ? now() : null;

            $story = new Story([
                'organizer_id'        => $user->id,
                'donation_request_id' => $request->input('donation_request_id'),
                'title'               => $request->input('title'),
                'content'             => $request->input('content'),
                'type'                => $request->input('type'),
                'media_type'          => $mediaType,
                'media_path'          => $mediaPath,
                'duration'            => $request->input('duration'),
                'show_time'           => $request->input('show_time'),
                'is_scheduled'        => $isScheduled,
                'scheduled_time'      => $isScheduled ? $request->input('scheduled_time') : null,
                'is_published'        => $isPublished,
                'published_at'        => $publishedAt,
                'views'               => 0,
                'likes'               => 0,
            ]);

            if (method_exists($story, 'computeExpiresAt')) {
                $story->expires_at = $publishedAt ? $story->computeExpiresAt($publishedAt) : null;
            }
            
            $story->save();
            DB::commit();

            try {
                if (class_exists(TrustLevelService::class)) {
                    app(TrustLevelService::class)->updateUserTrust($user);
                }
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => $isScheduled ? 'กำหนดเวลาเผยแพร่ Story สำเร็จ' : 'เผยแพร่ Story สำเร็จ',
                'data'    => $story->load('donationRequest:id,title'),
            ], 201);
            
        } catch (\Throwable $e) {
            DB::rollBack();
            if (isset($mediaPath)) {
                Storage::disk('public')->delete($mediaPath);
            }
            \Log::error('Error creating story: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้าง Story',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    // ─── GET /organizer/stories/{id} ─────────────────────────────
    public function show(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        $story = Story::with('donationRequest:id,title')->find($id);

        if (!$story) return response()->json(['error' => 'Story not found'], 404);

        if ($story->organizer_id !== $user->id) return response()->json(['error' => 'Unauthorized'], 403);

        return response()->json([
            'success' => true, 
            'data' => $story,
        ]);
    }

    // ─── PUT/PATCH /organizer/stories/{id} ──────────────────────
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $story = Story::findOrFail($id);

        if ($story->organizer_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->merge([
            'is_scheduled' => filter_var($request->input('is_scheduled', $story->is_scheduled), FILTER_VALIDATE_BOOLEAN)
        ]);

        $isScheduled = $request->input('is_scheduled');
        $mediaType   = $request->input('media_type', $story->media_type);

        $mediaRule = $mediaType === 'video'
            ? 'nullable|file|mimetypes:video/mp4,video/webm,video/quicktime|max:102400'
            : 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120';

        $request->validate([
            'title'               => 'sometimes|required|string|max:255',
            'content'             => 'sometimes|required|string|min:10|max:500',
            'type'                => ['sometimes', 'required', Rule::in(['progress', 'milestone', 'thank_you', 'completion'])],
            'media_type'          => ['sometimes', 'required', Rule::in(['image', 'video'])],
            'media'               => $mediaRule,
            'duration'            => 'sometimes|required|integer|min:1|max:60',
            'show_time'           => ['sometimes', 'required', Rule::in(['immediately', '24_hours', '3_days', '1_week'])],
            'is_scheduled'        => 'sometimes|required|boolean',
            'scheduled_time'      => 'required_if:is_scheduled,true|nullable|date',
        ]);

        DB::beginTransaction();
        try {
            if ($request->hasFile('media')) {
                if ($story->media_path) {
                    Storage::disk('public')->delete($story->media_path);
                }
                $mediaPath = $request->file('media')->store('stories/' . $user->id, 'public');
                $story->media_path = $mediaPath;
            }

            if ($request->has('title')) $story->title = $request->input('title');
            if ($request->has('content')) $story->content = $request->input('content');
            if ($request->has('type')) $story->type = $request->input('type');
            if ($request->has('media_type')) $story->media_type = $mediaType;
            if ($request->has('duration')) $story->duration = $request->input('duration');
            if ($request->has('show_time')) $story->show_time = $request->input('show_time');
            
            if ($request->has('is_scheduled')) {
                $story->is_scheduled = $isScheduled;
                $story->scheduled_time = $isScheduled ? $request->input('scheduled_time') : null;
                
                // ถ้ายกเลิกตั้งเวลา ให้เปลี่ยนสถานะเป็น Publish
                if (!$isScheduled && !$story->is_published) {
                    $story->is_published = true;
                    $story->published_at = now();
                }
            }

            $story->save();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'อัปเดต Story สำเร็จ',
                'data'    => $story->load('donationRequest:id,title'),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Error updating story: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการอัปเดต Story',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    // ─── DELETE /organizer/stories/{id} ──────────────────────────
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $story = Story::findOrFail($id);

        if ($story->organizer_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($story->media_path) {
            Storage::disk('public')->delete($story->media_path);
        }

        $story->delete();

        return response()->json(['success' => true, 'message' => 'ลบ Story สำเร็จ']);
    }

    // ─── GET /stories (Public) ───────────────────────────────────
    public function publicIndex()
    {
        try {
            $stories = Story::with(['organizer', 'donationRequest'])
                ->where('is_published', true)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stories
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error in StoryController::publicIndex: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล Story',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // ─── GET /stories/{id} (Public Show) ─────────────────────────
    public function publicShow($id): JsonResponse
    {
        try {
            $story = Story::with(['organizer', 'donationRequest'])
                ->where('is_published', true)
                ->findOrFail($id);

            $nextStory = Story::where('donation_request_id', $story->donation_request_id)
                ->where('is_published', true)
                ->where('created_at', '>', $story->created_at)
                ->orderBy('created_at', 'asc')
                ->first();

            $story->next_id = $nextStory ? $nextStory->id : null;

            return response()->json([
                'success' => true,
                'data' => $story
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบ Story ที่ต้องการ',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการโหลดข้อมูล Story',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // ─── GET /stories/donation-request/{id} ──────────────────────
    public function getStoriesByDonationRequest($donationRequestId)
    {
        try {
            $stories = Story::with(['organizer', 'donationRequest'])
                ->where('donation_request_id', $donationRequestId)
                ->where('is_published', true)
                ->orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stories
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getStoriesByDonationRequest: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch stories',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // ─── POST /stories/{id}/view ─────────────────────────────────
    public function recordView($id): JsonResponse
    {
        try {
            $story = Story::find($id);

            if (!$story) {
                return response()->json(['error' => 'Story not found'], 404);
            }

            $story->increment('views');

            return response()->json([
                'success' => true,
                'message' => 'บวกยอดวิวสำเร็จ',
                'views' => $story->views
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึกยอดวิว',
            ], 500);
        }
    }

    // ─── POST /stories/{id}/like ─────────────────────────────────
    public function toggleLike($id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Like feature not implemented yet'
        ]);
    }
}