<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserBehavior;
use App\Enums\UserInteractionType;
use Illuminate\Validation\Rule;

class UserBehaviorController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validation (ปรับให้รับ Integer)
        $validated = $request->validate([
            'session_id'          => 'required|string',
            'donation_request_id' => 'required|exists:donation_requests,id',

            // แก้ตรงนี้: รับค่าเป็นตัวเลข (Integer) ที่ถูกต้องตาม Enum
            'action_type'         => ['required', 'integer', Rule::enum(UserInteractionType::class)],

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
            // $oldAction เป็น Enum Object อัตโนมัติ (เพราะ Cast ใน Model)
            $oldAction = $existingBehavior->action_type;

            // $newActionInput เป็น Integer (1, 2, 3, 4) จาก Request
            $newActionInput = $validated['action_type'];

            // กำหนดความสำคัญ (Key เป็น Integer ตาม Enum)
            $priority = [
                UserInteractionType::SWIPE_LIKE->value => 1,   // สำคัญที่สุด
                UserInteractionType::SWIPE_PASS->value => 1,   // สำคัญเท่ากัน (ไม่ต้องการเห็นซ้ำ)
                UserInteractionType::CLICK_DETAIL->value => 2,
                UserInteractionType::VIEW_STORY->value => 3,   // สำคัญน้อยสุด
            ];
            // ดึงค่า Priority (ถ้าไม่มีให้เป็น 0)
            $oldPriority = $priority[$oldAction->value] ?? 0;
            $newPriority = $priority[$newActionInput] ?? 0;

            // ถ้า Action ใหม่ มีความสำคัญ "น้อยกว่า" Action เดิมที่มีอยู่แล้ว -> ห้ามอัปเดต
            if ($newPriority < $oldPriority) {
                // อัปเดตเพราะใหม่สำคัญกว่า
                $existingBehavior->update([
                    'action_type' => $validated['action_type'],
                    'duration_ms' => $validated['duration_ms'] ?? $existingBehavior->duration_ms,
                    'meta_data'   => $validated['meta_data'] ?? $existingBehavior->meta_data
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Updated: New action has higher priority.',
                    'data'    => $existingBehavior
                ]);
            } else {
                // ข้ามเพราะเดิมสำคัญกว่าหรือเท่ากัน
                return response()->json([
                    'success' => true,
                    'message' => 'Skipped: Existing action has equal or higher priority.',
                    'data'    => $existingBehavior
                ]);
            }
        }

        // 4. บันทึกข้อมูล
        // ใช้ updateOrCreate โดยส่ง Integer เข้าไปได้เลย Laravel จะจัดการ Cast ให้เอง
        $behavior = UserBehavior::updateOrCreate(
            [
                'session_id'          => $validated['session_id'],
                'donation_request_id' => $validated['donation_request_id'],
            ],
            [
                'user_id'     => $userId,
                'action_type' => $validated['action_type'], // ส่งเลข 1, 2, 3, 4 ลงไป
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
