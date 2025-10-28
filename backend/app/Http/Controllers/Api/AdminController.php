<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationRequest;
use App\Models\User;
use App\Models\Donation;
use App\Enums\DonationRequestStatus;
use App\Enums\DonationStatus;
use App\Enums\UserRole;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * ดึงสถิติภาพรวม
     */
    public function stats()
    {
        $totalRaised = Donation::where('status', DonationStatus::COMPLETED)
            ->sum('amount');

        return response()->json([
            'totalUsers' => User::where('role', UserRole::DONOR)->count(),
            'totalOrganizers' => User::where('role', UserRole::ORGANIZER)->count(),
            'totalRequests' => DonationRequest::count(),
            'pendingRequests' => DonationRequest::where('status', DonationRequestStatus::PENDING)->count(),
            'totalRaised' => (float) $totalRaised,
            'activeRequests' => DonationRequest::where('status', DonationRequestStatus::ACTIVE)->count(),
        ]);
    }

    /**
     * ดึงคำขอที่รออนุมัติ
     */
    public function pendingRequests()
    {
        $requests = DonationRequest::with(['organizer:id,first_name,last_name', 'category'])
            ->where('status', DonationRequestStatus::PENDING)
            ->select('id', 'title', 'organizer_id', 'category_id', 'target_amount', 'created_at')
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'title' => $req->title,
                    'organizer' => trim("{$req->organizer->first_name} {$req->organizer->last_name}"),
                    'category' => $req->category?->name ?? 'ไม่ระบุ',
                    'goal_amount' => (float) $req->target_amount,
                    'submitted_date' => $req->created_at->toDateTimeString(),
                    'status' => 'pending'
                ];
            });

        return response()->json($requests);
    }

    /**
     * อนุมัติคำขอ
     */
    public function approveRequest($id)
    {
        $request = DonationRequest::findOrFail($id);

        if ($request->status !== DonationRequestStatus::PENDING) {
            return response()->json(['message' => 'คำขอไม่อยู่ในสถานะรออนุมัติ'], 400);
        }

        $request->update([
            'status' => DonationRequestStatus::APPROVED,
            'approved_by' => auth('sanctum')->id(),
            'approved_at' => now(),
        ]);

        return response()->json(['message' => 'อนุมัติสำเร็จ']);
    }

    /**
     * ปฏิเสธคำขอ
     */
    public function rejectRequest($id)
    {
        $request = DonationRequest::findOrFail($id);

        if ($request->status !== DonationRequestStatus::PENDING) {
            return response()->json(['message' => 'คำขอไม่อยู่ในสถานะรออนุมัติ'], 400);
        }

        $request->update(['status' => DonationRequestStatus::REJECTED]);

        return response()->json(['message' => 'ปฏิเสธสำเร็จ']);
    }

    /**
     * ดึงรายชื่อผู้ใช้ทั้งหมด
     */
    public function users()
    {
        $users = User::select('id', 'first_name', 'last_name', 'email', 'role', 'documents_verified', 'created_at')
            ->get()
            ->map(function ($user) {
                $data = [
                    'id' => $user->id,
                    'name' => trim("{$user->first_name} {$user->last_name}"),
                    'email' => $user->email,
                    'role' => $this->mapRole($user->role),
                    'join_date' => $user->created_at->toDateTimeString(),
                    'is_verified' => (bool) $user->documents_verified,
                ];

                if ($user->role === UserRole::DONOR) {
                    $totalDonated = Donation::where('donor_id', $user->id)
                        ->where('status', DonationStatus::COMPLETED)
                        ->sum('amount');
                    $data['total_donated'] = (float) $totalDonated;
                }

                if ($user->role === UserRole::ORGANIZER) {
                    $requestsCreated = DonationRequest::where('organizer_id', $user->id)->count();
                    $data['requests_created'] = $requestsCreated;
                }

                return $data;
            });

        return response()->json($users);
    }

    /**
     * ลบผู้ใช้
     */
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->role === UserRole::ADMIN) {
            return response()->json(['message' => 'ไม่สามารถลบผู้ดูแลระบบได้'], 403);
        }

        // ลบข้อมูลที่เกี่ยวข้อง
        DonationRequest::where('organizer_id', $user->id)->delete();
        Donation::where('donor_id', $user->id)->delete();

        $user->delete();

        return response()->json(['message' => 'ลบผู้ใช้สำเร็จ']);
    }

    /**
     * แปลง role enum → string ที่ Frontend ใช้
     */
    private function mapRole($role)
    {
        return match ($role->value) {
            'DONOR' => 'user',
            'ORGANIZER' => 'organizer',
            'ADMIN' => 'admin',
            default => 'user',
        };
    }
}
