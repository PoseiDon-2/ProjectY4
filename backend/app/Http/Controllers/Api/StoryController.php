<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
<<<<<<< HEAD
<<<<<<< HEAD
use App\Models\DonationRequest;
use App\Enums\StoryStatus;
use App\Services\TrustLevelService;
=======
use App\Enums\UserRole;
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
use App\Enums\UserRole;
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
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
            ->forOrganizer($user->id)
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

        // แยก Rule ของ media ออกมาให้ชัดเจน
        $mediaRule = $mediaType === 'video'
            ? 'required|file|mimetypes:video/mp4,video/webm,video/quicktime|max:102400' // ปรับเป็น 102400 (100MB)
            : 'required|file|image|mimes:jpeg,png,jpg,webp|max:5120';

        // Validation
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
        ], [
            'title.required'               => 'กรุณากรอกหัวข้อ Story',
            'content.required'             => 'กรุณากรอกเนื้อหา Story',
            'content.min'                  => 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร',
            'content.max'                  => 'เนื้อหาต้องไม่เกิน 500 ตัวอักษร',
            'media.required'               => 'กรุณาเลือกรูปภาพหรือวิดีโอ',
            'media.image'                  => 'ไฟล์ต้องเป็นรูปภาพเท่านั้น (jpeg, png, jpg, webp)',
            'media.mimes'                  => 'ไฟล์ต้องเป็นรูปภาพเท่านั้น (jpeg, png, jpg, webp)',
            'media.mimetypes'              => 'ไฟล์วิดีโอต้องเป็น MP4, WebM หรือ MOV',
            'media.max'                    => 'ขนาดไฟล์เกินที่กำหนด',
            'donation_request_id.required' => 'กรุณาเลือกคำขอบริจาค',
            'donation_request_id.exists'   => 'คำขอบริจาคไม่ถูกต้อง หรือไม่ใช่ของคุณ',
            'scheduled_time.required_if'   => 'กรุณากำหนดเวลาที่ต้องการเผยแพร่',
            'scheduled_time.after'         => 'เวลาที่กำหนดต้องเป็นเวลาในอนาคต',
        ]);

        DB::beginTransaction();
        try {
            // ── Upload media ──────────────────────────────────────
            $mediaPath = $request->file('media')->store(
                'stories/' . $user->id,
                'public'
            );

            // ── กำหนดสถานะ ────────────────────────────────────────
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

            // คำนวณ expires_at หลัง fill show_time และ published_at
            $story->expires_at = $publishedAt ? $story->computeExpiresAt($publishedAt) : null;
            $story->save();

            DB::commit();

            try {
                $organizer = $user;
                if ($organizer) {
                    app(TrustLevelService::class)->updateUserTrust($organizer);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Trust level update after story create failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => $isScheduled
                    ? 'กำหนดเวลาเผยแพร่ Story สำเร็จ'
                    : 'เผยแพร่ Story สำเร็จ',
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
    public function show(\Illuminate\Http\Request $request, $id): JsonResponse
    {
        $story = Story::with('donationRequest:id,title')
            ->forOrganizer(Auth::id())
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $story]);
    }

    // ─── DELETE /organizer/stories/{id} ──────────────────────────
    public function destroy(int $id): JsonResponse
    {
        $story = Story::forOrganizer(Auth::id())->findOrFail($id);

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
            // ดึงข้อมูล Story ที่ถูก publish แล้ว พร้อมข้อมูลผู้จัดและโปรเจกต์
            $stories = \App\Models\Story::with(['organizer', 'donationRequest'])
                ->where('is_published', true) // ดึงเฉพาะอันที่เผยแพร่แล้ว
                ->latest() // เรียงจากใหม่ไปเก่า
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stories
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการดึงข้อมูล Story',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ─── GET /stories/{id} (Public Show) ─────────────────────────
    // ✅ เพิ่มฟังก์ชันนี้เพื่อใช้ดู Story รายตัวสำหรับฝั่งหน้าบ้าน (ไม่ต้องล็อกอิน)
    // ─── GET /stories/{id} (Public Show) ─────────────────────────
    public function publicShow($id): JsonResponse
    {
        try {
            $story = Story::with(['organizer', 'donationRequest'])->findOrFail($id);

            // 🌟 ค้นหา Story ถัดไปของ "โครงการเดียวกัน" โดยใช้เวลาสร้าง (created_at) แทน ID
            $nextStory = Story::where('donation_request_id', $story->donation_request_id)
                ->where('is_published', true)
                ->where('created_at', '>', $story->created_at) // ดึงอันที่ถูกสร้างทีหลังตัวปัจจุบัน
                ->orderBy('created_at', 'asc')                 // เรียงจากเก่าไปใหม่
                ->first();

            $story->next_id = $nextStory ? $nextStory->id : null;

            return response()->json($story, 200);
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

    // ─── POST /stories/{id}/view ─────────────────────────────────
    // ฟังก์ชันสำหรับบวกยอดวิว (+1) เมื่อมีคนกดดู Story
    public function recordView($id): JsonResponse
    {
        try {
            // หา Story จาก ID (ไม่ต้องใช้ Auth เพราะใครๆ ก็กดดูและเพิ่มวิวได้)
            $story = Story::findOrFail($id);

            // สั่งบวกยอดวิวขึ้น 1
            $story->increment('views');

            return response()->json([
                'success' => true,
                'message' => 'บวกยอดวิวสำเร็จ',
                'views' => $story->views
            ]);
        } catch (\Exception $e) {
            \Log::error('Error recording view: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึกยอดวิว',
                'error' => $e->getMessage()
            ], 500);
        }
    }
<<<<<<< HEAD
<<<<<<< HEAD

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
        try {
            $stories = Story::with('donationRequest')
                ->where('status', StoryStatus::PUBLISHED->value)
                ->whereNotNull('published_at')
                ->orderBy('published_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stories
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in StoryController::publicIndex: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch stories',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function publicShow($id)
    {
        try {
            $story = Story::with('donationRequest')
                ->where('status', StoryStatus::PUBLISHED->value)
                ->whereNotNull('published_at')
                ->find($id);

            if (!$story) {
                return response()->json(['error' => 'Story not found'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $story
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in StoryController::publicShow: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch story',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function getStoriesByDonationRequest($donationRequestId)
    {
        try {
            $stories = Story::with('donationRequest')
                ->where('donation_request_id', $donationRequestId)
                ->where('status', StoryStatus::PUBLISHED->value)
                ->whereNotNull('published_at')
                ->orderBy('published_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stories
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in StoryController::getStoriesByDonationRequest: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch stories',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
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
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
}
