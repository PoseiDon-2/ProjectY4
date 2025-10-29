<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DonationRequest;
use App\Models\Donation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Enums\UserRole;

class AdminController extends Controller
{
    public function getStats(Request $request): JsonResponse
    {
        try {
            $totalUsers = User::count();
            $totalOrganizers = User::where('role', UserRole::ORGANIZER)->count();
            $totalRequests = DonationRequest::count();
            $pendingRequests = DonationRequest::where('status', 'pending')->count();
            $activeRequests = DonationRequest::where('status', 'approved')->count();
            
            $totalRaised = Donation::sum('amount') ?? 0;

            return response()->json([
                'totalUsers' => $totalUsers,
                'totalOrganizers' => $totalOrganizers,
                'totalRequests' => $totalRequests,
                'pendingRequests' => $pendingRequests,
                'totalRaised' => (float) $totalRaised,
                'activeRequests' => $activeRequests
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching stats: ' . $e->getMessage()
            ], 500);
        }
    }
}