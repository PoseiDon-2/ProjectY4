<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DonationRequest;
use App\Enums\DonationRequestStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRequestController extends Controller
{
    public function getPendingRequests(Request $request): JsonResponse
    {
        $requests = DonationRequest::with('organizer')
            ->where('status', DonationRequestStatus::PENDING)
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'title' => $request->title,
                    'organizer' => $request->organizer->first_name . ' ' . $request->organizer->last_name,
                    'category' => $request->category,
                    'goal_amount' => (float) $request->goal_amount,
                    'submitted_date' => $request->created_at->format('Y-m-d H:i:s'),
                    'status' => $request->status
                ];
            });

        return response()->json($requests);
    }

    public function approveRequest(Request $request, $id): JsonResponse
    {
        $donationRequest = DonationRequest::findOrFail($id);

        $donationRequest->update([
            'status' => DonationRequestStatus::APPROVED,
            'approved_at' => now(),
            'approved_by' => $request->user()->id
        ]);

        return response()->json(['message' => 'Request approved successfully']);
    }

    public function rejectRequest(Request $request, $id): JsonResponse
    {
        $donationRequest = DonationRequest::findOrFail($id);

        $donationRequest->update([
            'status' => DonationRequestStatus::REJECTED,
            'rejected_at' => now()
        ]);

        return response()->json(['message' => 'Request rejected successfully']);
    }
}