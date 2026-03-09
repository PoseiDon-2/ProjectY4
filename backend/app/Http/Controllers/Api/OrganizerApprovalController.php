<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemDonation;
use App\Models\VolunteerApplication;
use App\Models\DonationRequest;
use App\Models\PointsTransaction;
use App\Enums\ItemDonationStatus;
use App\Enums\VolunteerStatus;
use Illuminate\Http\Request;

class OrganizerApprovalController extends Controller
{
    private const VOLUNTEER_RATES = [
        'professional' => 20,
        'skilled' => 15,
        'general' => 10,
    ];
    private const VOLUNTEER_MIN_POINTS = 30;

    private function isOrganizer($user): bool
    {
        $role = $user->role;
        if ($role instanceof \App\Enums\UserRole) {
            return $role === \App\Enums\UserRole::ORGANIZER;
        }
        return in_array(strtoupper((string) $role), ['ORGANIZER']);
    }

    /**
     * Get pending item donations for organizer's requests.
     */
    public function pendingItemDonations(Request $request)
    {
        if (!$this->isOrganizer($request->user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requestIds = DonationRequest::where('organizer_id', $request->user()->id)->pluck('id');
        $items = ItemDonation::whereIn('donation_request_id', $requestIds)
            ->where('status', ItemDonationStatus::PENDING_REVIEW)
            ->with(['donationRequest:id,title', 'donor:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $items]);
    }

    /**
     * Approve item donation.
     */
    public function approveItemDonation(Request $request, string $id)
    {
        if (!$this->isOrganizer($request->user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item = ItemDonation::findOrFail($id);
        $dr = DonationRequest::find($item->donation_request_id);
        if (!$dr || $dr->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($item->status !== ItemDonationStatus::PENDING_REVIEW) {
            return response()->json(['message' => 'รายการนี้ได้ดำเนินการแล้ว'], 422);
        }

        $value = (float) ($item->estimated_value ?? 0);
        $points = $value < 100 ? 5 : (int) floor($value);
        if ($item->delivery_method === 'drop-off') {
            $points = (int) round($points * 1.5);
        }

        $item->update([
            'status' => ItemDonationStatus::APPROVED,
            'points_earned' => $points,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        PointsTransaction::create([
            'id' => 'ptx_' . uniqid(),
            'user_id' => $item->donor_id,
            'type' => 'earned',
            'amount' => $points,
            'source' => 'donation',
            'description' => "Item donation: {$item->items_needed} (มูลค่า ฿" . number_format($value, 0) . ")",
            'date' => now(),
            'related_id' => $item->id,
        ]);

        return response()->json([
            'message' => 'อนุมัติสำเร็จ',
            'data' => $item->fresh(),
        ]);
    }

    /**
     * Reject item donation.
     */
    public function rejectItemDonation(Request $request, string $id)
    {
        if (!$this->isOrganizer($request->user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item = ItemDonation::findOrFail($id);
        $dr = DonationRequest::find($item->donation_request_id);
        if (!$dr || $dr->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($item->status !== ItemDonationStatus::PENDING_REVIEW) {
            return response()->json(['message' => 'รายการนี้ได้ดำเนินการแล้ว'], 422);
        }

        $item->update(['status' => ItemDonationStatus::REJECTED]);

        return response()->json(['message' => 'ปฏิเสธเรียบร้อย']);
    }

    /**
     * Get pending volunteer applications for organizer's requests.
     */
    public function pendingVolunteerApplications(Request $request)
    {
        if (!$this->isOrganizer($request->user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requestIds = DonationRequest::where('organizer_id', $request->user()->id)->pluck('id');
        $apps = VolunteerApplication::whereIn('request_id', $requestIds)
            ->where('status', VolunteerStatus::APPLIED)
            ->with(['request:id,title', 'volunteer:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $apps]);
    }

    /**
     * Approve volunteer application.
     */
    public function approveVolunteerApplication(Request $request, string $id)
    {
        if (!$this->isOrganizer($request->user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'actual_hours' => ['required', 'numeric', 'min:0.5'],
        ]);

        $app = VolunteerApplication::findOrFail($id);
        $dr = DonationRequest::find($app->request_id);
        if (!$dr || $dr->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($app->status !== VolunteerStatus::APPLIED) {
            return response()->json(['message' => 'รายการนี้ได้ดำเนินการแล้ว'], 422);
        }

        $hours = (float) $validated['actual_hours'];
        $skills = is_string($app->skills) ? json_decode($app->skills, true) : (array) $app->skills;
        $skills = is_array($skills) ? $skills : [];
        $skillType = in_array('professional', $skills) ? 'professional'
            : (array_intersect(['creative', 'coordination', 'cooking'], $skills) ? 'skilled' : 'general');
        $rate = self::VOLUNTEER_RATES[$skillType] ?? self::VOLUNTEER_RATES['general'];
        $points = max(self::VOLUNTEER_MIN_POINTS, (int) ceil($hours * $rate));

        $app->update([
            'status' => VolunteerStatus::APPROVED,
            'hours_committed' => (int) round($hours),
            'approved_at' => now(),
        ]);

        $dr->increment('volunteers_received');

        PointsTransaction::create([
            'id' => 'ptx_' . uniqid(),
            'user_id' => $app->volunteer_id,
            'type' => 'earned',
            'amount' => $points,
            'source' => 'donation',
            'description' => "Volunteer: {$dr->title} ({$hours} ชม.)",
            'date' => now(),
            'related_id' => $app->id,
        ]);

        return response()->json([
            'message' => 'อนุมัติสำเร็จ',
            'data' => $app->fresh(),
        ]);
    }

    /**
     * Reject volunteer application.
     */
    public function rejectVolunteerApplication(Request $request, string $id)
    {
        if (!$this->isOrganizer($request->user())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $app = VolunteerApplication::findOrFail($id);
        $dr = DonationRequest::find($app->request_id);
        if (!$dr || $dr->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($app->status !== VolunteerStatus::APPLIED) {
            return response()->json(['message' => 'รายการนี้ได้ดำเนินการแล้ว'], 422);
        }

        $app->update(['status' => VolunteerStatus::REJECTED]);

        return response()->json(['message' => 'ปฏิเสธเรียบร้อย']);
    }
}
