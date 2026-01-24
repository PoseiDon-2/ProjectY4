<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserBehavior;
use App\Enums\UserInteractionType;

class UserBehaviorController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validation
        $validated = $request->validate([
            'session_id'          => 'required|string',
            'donation_request_id' => 'required|exists:donation_requests,id',
            'action_type'         => 'required|string|in:' . implode(',', array_column(UserInteractionType::cases(), 'value')),
            'duration_ms'         => 'nullable|integer',
            'meta_data'           => 'nullable'
        ]);

        $userId = Auth::guard('sanctum')->id();

        // 2. ค้นหา Record เดิมก่อน
        $existingBehavior = UserBehavior::where('session_id', $validated['session_id'])
            ->where('donation_request_id', $validated['donation_request_id'])
            ->first();

        // 3. Logic ป้องกันการเขียนทับ (Priority Logic)
        if ($existingBehavior) {
            $oldAction = $existingBehavior->action_type; // เป็น Enum (เพราะมี casting ใน Model)
            $newAction = UserInteractionType::tryFrom($validated['action_type']);

            // กำหนดความสำคัญ (3 = สูงสุด, 1 = ต่ำสุด)
            $priority = [
                UserInteractionType::SWIPE_LIKE->value => 3,
                UserInteractionType::SWIPE_PASS->value => 3,
                UserInteractionType::CLICK_DETAIL->value => 2,
                UserInteractionType::VIEW_STORY->value => 1,
            ];

            $oldPriority = $priority[$oldAction->value] ?? 0;
            $newPriority = $priority[$newAction->value] ?? 0;

            // ถ้า Action ใหม่ มีความสำคัญ "น้อยกว่า" Action เดิมที่มีอยู่แล้ว -> ห้ามอัปเดต
            // เช่น: เดิมเป็น swipe_pass (3) แล้วมี view_story (1) ส่งเข้ามาทับ -> เราจะไม่เซฟ
            if ($newPriority < $oldPriority) {
                return response()->json([
                    'success' => true,
                    'message' => 'Skipped: Higher priority action exists.',
                    'data'    => $existingBehavior
                ]);
            }
        }

        // 4. บันทึกข้อมูล (ถ้าผ่านเงื่อนไขด้านบนมาได้ หรือยังไม่มีข้อมูล)
        // ใช้ updateOrCreate เหมือนเดิม แต่ตอนนี้ปลอดภัยแล้ว
        $behavior = UserBehavior::updateOrCreate(
            [
                'session_id'          => $validated['session_id'],
                'donation_request_id' => $validated['donation_request_id'],
            ],
            [
                'user_id'     => $userId,
                'action_type' => $validated['action_type'],
                'duration_ms' => $request->input('duration_ms', 0),
                'meta_data'   => $validated['meta_data'] ?? null
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'User behavior recorded successfully',
            'data'    => $behavior
        ]);
    }
}