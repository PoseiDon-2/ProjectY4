<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Enums\UserRole;

class AdminUserController extends Controller
{
    public function getUsers(Request $request): JsonResponse
    {
        try {
            $users = User::with(['donations', 'donationRequests'])
                ->get()
                ->map(function ($user) {
                    $data = [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'role' => strtolower($user->role->value),
                        'join_date' => $user->created_at->format('Y-m-d H:i:s'),
                        'is_verified' => (bool) $user->is_email_verified,
                        'status' => strtolower($user->status->value),
                    ];

                    if ($user->role === UserRole::DONOR) {
                        $data['total_donated'] = (float) ($user->total_donated ?? 0);
                        $data['donation_count'] = $user->donation_count ?? 0;
                    } elseif ($user->role === UserRole::ORGANIZER) {
                        $data['requests_created'] = $user->donationRequests->count();
                        $data['documents_verified'] = (bool) $user->documents_verified;
                    }

                    return $data;
                });

            return response()->json($users);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching users: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteUser(Request $request, $id): JsonResponse
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found'
                ], 404);
            }
            
            if ($user->id === $request->user()->id) {
                return response()->json([
                    'message' => 'Cannot delete your own account'
                ], 403);
            }

            $user->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting user: ' . $e->getMessage()
            ], 500);
        }
    }
}