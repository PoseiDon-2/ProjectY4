<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationRequest;
use App\Models\DonationSlip;
use App\Models\Notification;
use App\Models\PointsTransaction;
use App\Models\User;
use App\Enums\DonationRequestStatus;
use App\Services\TrustLevelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class SlipController extends Controller
{
    /**
     * ผู้บริจาคส่งสลิป (สร้างรายการรอตรวจ)
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'donation_request_id' => ['required', 'string', 'uuid', 'exists:donation_requests,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'payment_method' => ['required', Rule::in(['promptpay', 'bank', 'credit'])],
            'slip' => ['required', 'file', 'image', 'max:5120'],
            'client_verdict' => ['nullable', 'string'],
            'client_reasons' => ['nullable', 'array'],
            'client_reasons.*' => ['string'],
        ]);

        $dr = DonationRequest::findOrFail($data['donation_request_id']);

        // ตรวจสอบว่าคำขอยังเปิดรับบริจาคอยู่หรือไม่
        if ($dr->status === DonationRequestStatus::COMPLETED) {
            return response()->json([
                'error' => 'คำขอนี้บริจาคครบจำนวนเป้าหมายแล้ว ไม่สามารถรับบริจาคเพิ่มได้',
                'current_amount' => $dr->current_amount,
                'goal_amount' => $dr->goal_amount,
            ], 422);
        }

        // ป้องกันโอนเกินเป้า
        if ($dr->goal_amount && $dr->current_amount) {
            $remaining = max(0, $dr->goal_amount - $dr->current_amount);
            if ($remaining <= 0) {
                return response()->json([
                    'error' => 'คำขอนี้บริจาคครบจำนวนเป้าหมายแล้ว',
                    'current_amount' => $dr->current_amount,
                    'goal_amount' => $dr->goal_amount,
                ], 422);
            }
            if ($data['amount'] > $remaining) {
                return response()->json([
                    'error' => "ยอดเงินเกินกว่ายอดที่ยังขาดอยู่ (ยอดที่ขาด: ฿" . number_format($remaining, 2) . ")",
                    'remaining' => $remaining,
                    'max_amount' => $remaining,
                ], 422);
            }
        }

        $path = $request->file('slip')->store('slips', 'public');

        $slip = DonationSlip::create([
            'donation_request_id' => $dr->id,
            'donor_id' => Auth::id(),
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'],
            'slip_path' => $path,
            'status' => 'pending',
            'client_verdict' => $data['client_verdict'] ?? null,
            'client_reasons' => $data['client_reasons'] ?? [],
        ]);

        $baseUrl = request()->getSchemeAndHttpHost();
        
        return response()->json([
            'success' => true,
            'slip_id' => $slip->id,
            'slip_url' => $baseUrl . '/storage/' . $path,
            'message' => 'อัปโหลดสลิปสำเร็จ รอผู้จัดอนุมัติ',
        ], 201);
    }

    /**
     * รายการสลิปรอตรวจของ Organizer
     * รองรับ query parameter: donation_request_id (optional) เพื่อกรองสลิปตาม donation request
     */
    public function pendingForOrganizer(Request $request)
    {
        $userId = Auth::id();
        $donationRequestId = $request->query('donation_request_id');

        $query = DonationSlip::query()
            ->where('status', 'pending')
            ->whereHas('donationRequest', function($q) use ($userId) {
                $q->where('organizer_id', $userId);
            });

        // ถ้ามี donation_request_id ให้กรองเฉพาะ donation request นั้น
        if ($donationRequestId) {
            $query->where('donation_request_id', $donationRequestId);
        }

        $query->with(['donationRequest:id,title,goal_amount,current_amount', 'donor:id,first_name,last_name'])
            ->latest();

        // ถ้ามี donation_request_id ให้ดึงทั้งหมด (ไม่ paginate) เพื่อให้แสดงครบ
        if ($donationRequestId) {
            $slips = $query->get();
            // เพิ่ม URL สำหรับสลิป (สำหรับ Collection)
            $slips->transform(function($s) {
                if ($s->slip_path) {
                    // สร้าง URL ที่ถูกต้องโดยใช้ request()->getSchemeAndHttpHost()
                    $baseUrl = request()->getSchemeAndHttpHost();
                    $s->slip_url = $baseUrl . '/storage/' . $s->slip_path;
                }
                return $s;
            });
            return response()->json($slips);
        } else {
            $slips = $query->paginate(20);
            // เพิ่ม URL สำหรับสลิป (สำหรับ Paginated Collection)
            $slips->getCollection()->transform(function($s) {
                if ($s->slip_path) {
                    // สร้าง URL ที่ถูกต้องโดยใช้ request()->getSchemeAndHttpHost()
                    $baseUrl = request()->getSchemeAndHttpHost();
                    $s->slip_url = $baseUrl . '/storage/' . $s->slip_path;
                }
                return $s;
            });
            return response()->json($slips);
        }
    }

    /**
     * รายการสลิปของผู้บริจาค (สำหรับแจ้งเตือนสถานะ)
     */
    public function mySlips(Request $request)
    {
        $userId = Auth::id();

        $slips = DonationSlip::query()
            ->where('donor_id', $userId)
            ->with(['donationRequest:id,title,goal_amount,current_amount,status'])
            ->latest()
            ->paginate(20);

        $slips->getCollection()->transform(function ($s) {
            if ($s->slip_path) {
                // สร้าง URL ที่ถูกต้องโดยใช้ request()->getSchemeAndHttpHost()
                $baseUrl = request()->getSchemeAndHttpHost();
                $s->slip_url = $baseUrl . '/storage/' . $s->slip_path;
            }
            return $s;
        });

        return response()->json($slips);
    }

    /**
     * อนุมัติสลิป
     */
    public function approve($id)
    {
        $userId = Auth::id();
        $slip = DonationSlip::with('donationRequest')->findOrFail($id);

        if (!$slip->donationRequest || $slip->donationRequest->organizer_id !== $userId) {
            return response()->json(['error' => 'ไม่มีสิทธิ์'], 403);
        }
        if ($slip->status !== 'pending') {
            return response()->json(['error' => 'สลิปนี้ถูกตรวจแล้ว'], 422);
        }

        $isCompleted = false;
        $completedAt = null;

        DB::transaction(function() use ($slip, $userId, &$isCompleted, &$completedAt) {
            $slip->update([
                'status' => 'verified',
                'verified_by' => $userId,
                'verified_at' => now(),
            ]);

            // ให้คะแนนผู้บริจาค (เมื่อมี donor_id) น้อยกว่า 100 ได้ 5 คะแนน, 100 ขึ้นไปได้ 1 บาทละ 1 แต้ม
            if ($slip->donor_id) {
                $amount = (float) $slip->amount;
                $points = $amount < 100 ? 5 : (int) floor($amount);
                if ($points > 0) {
                    $dr = $slip->donationRequest;
                    $title = $dr ? $dr->title : 'คำขอบริจาค';
                    PointsTransaction::create([
                        'id' => 'ptx_' . uniqid(),
                        'user_id' => $slip->donor_id,
                        'type' => 'earned',
                        'amount' => $points,
                        'source' => 'donation',
                        'description' => "Money donation ฿" . number_format($amount, 2) . " - {$title}",
                        'date' => now(),
                        'related_id' => 'slip_' . $slip->id,
                    ]);
                }
            }

            // อัปเดตยอดสะสม
            $dr = $slip->donationRequest;
            if ($dr) {
                $oldAmount = (float)($dr->current_amount ?? 0);
                $newAmount = $oldAmount + (float)$slip->amount;
                $dr->current_amount = $newAmount;

                // ตรวจสอบว่าครบจำนวนแล้วหรือยัง
                $wasCompleted = $dr->status === DonationRequestStatus::COMPLETED;
                $isNowCompleted = $dr->goal_amount && $newAmount >= $dr->goal_amount;

                if ($isNowCompleted && !$wasCompleted) {
                    // เปลี่ยนสถานะเป็น COMPLETED เมื่อครบจำนวน
                    $dr->status = DonationRequestStatus::COMPLETED;
                    $isCompleted = true;
                    $completedAt = now();

                    // สร้างการแจ้งเตือนให้ Organizer
                    Notification::create([
                        'id' => Str::uuid(),
                        'user_id' => $dr->organizer_id,
                        'message' => "🎉 คำขอ '{$dr->title}' บริจาคครบจำนวนเป้าหมายแล้ว! (฿" . number_format($newAmount, 2) . " / ฿" . number_format($dr->goal_amount, 2) . ")",
                        'type' => 'donation_completed',
                        'is_read' => false,
                        'created_at' => now(),
                    ]);

                    // สร้างการแจ้งเตือนให้ผู้บริจาคที่ส่งสลิปล่าสุด
                    if ($slip->donor_id) {
                        Notification::create([
                            'id' => Str::uuid(),
                            'user_id' => $slip->donor_id,
                            'message' => "🎉 คำขอ '{$dr->title}' บริจาคครบจำนวนเป้าหมายแล้ว! ขอบคุณสำหรับการบริจาคของคุณ",
                            'type' => 'donation_completed',
                            'is_read' => false,
                            'created_at' => now(),
                        ]);
                    }
                }

                $dr->supporters = DonationSlip::where('donation_request_id', $dr->id)
                    ->where('status', 'verified')
                    ->pluck('donor_id')
                    ->unique()
                    ->count();
                $dr->save();
            }

            if ($slip->donor_id) {
                User::where('id', $slip->donor_id)->increment('total_donated', (float) $slip->amount);
                User::where('id', $slip->donor_id)->increment('donation_count', 1);
            }
        });

        try {
            if ($slip->donor_id) {
                $donor = User::find($slip->donor_id);
                if ($donor) {
                    app(TrustLevelService::class)->updateUserTrust($donor);
                }
            }
            $dr = $slip->donationRequest;
            if ($dr && $dr->organizer_id) {
                $organizer = User::find($dr->organizer_id);
                if ($organizer) {
                    app(TrustLevelService::class)->updateUserTrust($organizer);
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('Trust level update after slip approve failed: ' . $e->getMessage());
        }

        $message = $isCompleted 
            ? 'อนุมัติสลิปแล้ว และคำขอบริจาคครบจำนวนเป้าหมายแล้ว! 🎉'
            : 'อนุมัติสลิปแล้ว';

        return response()->json([
            'success' => true, 
            'message' => $message,
            'is_completed' => $isCompleted,
            'completed_at' => $completedAt?->toISOString(),
        ]);
    }

    /**
     * ปฏิเสธสลิป
     */
    public function reject(Request $request, $id)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $userId = Auth::id();
        $slip = DonationSlip::with('donationRequest')->findOrFail($id);

        if (!$slip->donationRequest || $slip->donationRequest->organizer_id !== $userId) {
            return response()->json(['error' => 'ไม่มีสิทธิ์'], 403);
        }
        if ($slip->status !== 'pending') {
            return response()->json(['error' => 'สลิปนี้ถูกตรวจแล้ว'], 422);
        }

        $slip->update([
            'status' => 'rejected',
            'verified_by' => $userId,
            'verified_at' => now(),
            'rejection_reason' => $data['reason'],
        ]);

        return response()->json(['success' => true, 'message' => 'ปฏิเสธสลิปแล้ว']);
    }

    /**
     * รายการสลิปทั้งหมดของ Donation Request (สำหรับแสดงประวัติ)
     * รองรับ query parameter: status (optional) เพื่อกรองตามสถานะ
     */
    public function getByDonationRequest(Request $request, $donationRequestId)
    {
        $userId = Auth::id();
        
        // ตรวจสอบว่าเป็น organizer ของ donation request นี้
        $dr = DonationRequest::findOrFail($donationRequestId);
        if ($dr->organizer_id !== $userId) {
            return response()->json(['error' => 'ไม่มีสิทธิ์'], 403);
        }

        $query = DonationSlip::query()
            ->where('donation_request_id', $donationRequestId)
            ->with([
                'donor:id,first_name,last_name,email',
                'verifiedBy:id,first_name,last_name'
            ])
            ->latest();

        // กรองตาม status ถ้ามี
        if ($request->has('status')) {
            $status = $request->query('status');
            if (in_array($status, ['pending', 'verified', 'rejected'])) {
                $query->where('status', $status);
            }
        }

        $slips = $query->get();

        // เพิ่ม URL สำหรับสลิป
        $slips->transform(function($s) {
            if ($s->slip_path) {
                $baseUrl = request()->getSchemeAndHttpHost();
                $s->slip_url = $baseUrl . '/storage/' . $s->slip_path;
            }
            return $s;
        });

        // สรุปข้อมูล
        $summary = [
            'total' => $slips->count(),
            'pending' => $slips->where('status', 'pending')->count(),
            'verified' => $slips->where('status', 'verified')->count(),
            'rejected' => $slips->where('status', 'rejected')->count(),
            'total_amount' => $slips->where('status', 'verified')->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $slips,
            'summary' => $summary,
        ]);
    }

    /**
     * ดาวน์โหลดรูปสลิป
     */
    public function download($id)
    {
        $userId = Auth::id();
        $slip = DonationSlip::with('donationRequest')->findOrFail($id);

        // ตรวจสอบสิทธิ์ (ต้องเป็น organizer ของ donation request)
        if (!$slip->donationRequest || $slip->donationRequest->organizer_id !== $userId) {
            return response()->json(['error' => 'ไม่มีสิทธิ์'], 403);
        }

        if (!Storage::disk('public')->exists($slip->slip_path)) {
            return response()->json(['error' => 'ไม่พบไฟล์สลิป'], 404);
        }

        $filePath = Storage::disk('public')->path($slip->slip_path);
        $fileName = 'slip_' . $slip->id . '_' . basename($slip->slip_path);

        return response()->download($filePath, $fileName);
    }

    /**
     * ยอดที่ยังขาด (สำหรับ clamp input)
     */
    public function remaining($requestId)
    {
        $dr = DonationRequest::findOrFail($requestId);
        if ($dr->goal_amount && $dr->current_amount !== null) {
            $remaining = max(0, $dr->goal_amount - $dr->current_amount);
            return response()->json(['remaining' => $remaining]);
        }
        return response()->json(['remaining' => null]);
    }
}
