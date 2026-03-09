<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DonationRequestController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminRequestController;
use App\Http\Controllers\Api\AdminTrustLevelController;
use App\Http\Controllers\Api\AdminRewardController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\StoryStatController;
use App\Http\Controllers\Api\SlipController;
use App\Http\Controllers\Api\ItemDonationController;
use App\Http\Controllers\Api\VolunteerApplicationController;
use App\Http\Controllers\Api\OrganizerApprovalController;
use App\Http\Controllers\Api\PointsController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\TrustController;
use App\Http\Controllers\Api\DonationHistoryController;
use App\Http\Controllers\Api\FavoriteController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Enums\UserRole;
use App\Http\Controllers\Api\UserBehaviorController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;



Route::prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOTP']);
    Route::post('verify-otp', [AuthController::class, 'verifyOTP']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::get('me', [AuthController::class, 'me']);
        Route::patch('me', [AuthController::class, 'updateProfile']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('donations', [AuthController::class, 'donations']);
    });
});

<<<<<<< HEAD
<<<<<<< HEAD
// === POINTS API ===
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/points', [PointsController::class, 'index']);
    Route::post('/points/spend', [PointsController::class, 'spend']);
});

// === DONATION HISTORY (profile) ===
Route::middleware('auth:sanctum')->get('/me/donation-history', [DonationHistoryController::class, 'index']);

// === FAVORITES (รายการที่สนใจ) ===
Route::middleware('auth:sanctum')->get('/me/favorites', [FavoriteController::class, 'index']);
Route::middleware('auth:sanctum')->post('/me/favorites', [FavoriteController::class, 'store']);
Route::middleware('auth:sanctum')->delete('/me/favorites/{request_id}', [FavoriteController::class, 'destroy']);

// === TRUST LEVEL API ===
Route::middleware('auth:sanctum')->get('/me/trust', [TrustController::class, 'me']);
Route::get('/trust-levels', [TrustController::class, 'levels']);
Route::get('/users/{id}/trust', [TrustController::class, 'show']);

// === REWARDS (catalog + redeem) ===
Route::get('/rewards', [RewardController::class, 'index']);
Route::middleware('auth:sanctum')->get('/me/rewards', [RewardController::class, 'myRewards']);
Route::middleware('auth:sanctum')->post('/rewards/redeem', [RewardController::class, 'redeem']);
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

// === DONATION REQUESTS APIs ===
Route::prefix('donation-requests')->group(function () {
    Route::get('/', [DonationRequestController::class, 'index']);
    Route::get('/categories', [DonationRequestController::class, 'categories']);
    Route::get('/{id}', [DonationRequestController::class, 'show']);
});

<<<<<<< HEAD
<<<<<<< HEAD
// === DONATION SLIPS APIs (public info) ===
Route::get('/donations/remaining/{id}', [SlipController::class, 'remaining']);
=======
Route::get('/recommendations', [RecommendationController::class, 'getRecommendations']);

Route::post('/user-behaviors', [UserBehaviorController::class, 'store']);
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5
=======
Route::get('/recommendations', [RecommendationController::class, 'getRecommendations']);

Route::post('/user-behaviors', [UserBehaviorController::class, 'store']);
>>>>>>> b4a27171bb1247e78798fdb04c8516b2b29e17f5

Route::middleware(['auth:sanctum'])->prefix('donation-requests')->group(function () {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::get('/my/requests', [DonationRequestController::class, 'myRequests']);
    Route::post('/', [DonationRequestController::class, 'store']);
    Route::put('/{id}', [DonationRequestController::class, 'update']);
    Route::delete('/{id}', [DonationRequestController::class, 'destroy']);
});

// === DONATION SLIPS APIs (auth) ===
Route::middleware(['auth:sanctum'])->prefix('donations')->group(function () {
    Route::post('/slips', [SlipController::class, 'store']);
    Route::get('/slips/my', [SlipController::class, 'mySlips']);
});

// === ITEM DONATIONS (donor submit) ===
Route::middleware(['auth:sanctum'])->post('/item-donations', [ItemDonationController::class, 'store']);

// === VOLUNTEER APPLICATIONS (donor submit) ===
Route::middleware(['auth:sanctum'])->post('/volunteer-applications', [VolunteerApplicationController::class, 'store']);

// === STORIES APIs ===
Route::prefix('stories')->group(function () {
    // Public stories routes
    Route::get('/', [StoryController::class, 'publicIndex']);
    Route::get('/{id}', [StoryController::class, 'publicShow']);
    Route::get('/donation-request/{donationRequestId}', [StoryController::class, 'getStoriesByDonationRequest']);
});

Route::middleware(['auth:sanctum'])->prefix('stories')->group(function () {
    // Story interactions
    Route::post('/{id}/view', [StoryController::class, 'recordView']);
    Route::post('/{id}/like', [StoryController::class, 'toggleLike']);
});

// === ORGANIZER STORIES MANAGEMENT APIs ===
Route::middleware(['auth:sanctum'])->prefix('organizer')->group(function () {
    // Stories management
    Route::get('/stories', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(StoryController::class)->index($request);
        } catch (\Exception $e) {
            \Log::error('Organizer stories error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::post('/stories', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(StoryController::class)->store($request);
        } catch (\Exception $e) {
            \Log::error('Create story error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::get('/stories/{id}', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(StoryController::class)->show($request, $id);
        } catch (\Exception $e) {
            \Log::error('Get story error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::put('/stories/{id}', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(StoryController::class)->update($request, $id);
        } catch (\Exception $e) {
            \Log::error('Update story error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::delete('/stories/{id}', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(StoryController::class)->destroy($request, $id);
        } catch (\Exception $e) {
            \Log::error('Delete story error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    // Story stats
    Route::get('/stats', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(StoryStatController::class)->index($request);
        } catch (\Exception $e) {
            \Log::error('Story stats error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    // === ORGANIZER DONATION REQUESTS FOR STORY CREATION ===
    Route::get('/donation-requests', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(DonationRequestController::class)->getOrganizerRequestsForStories($request);
        } catch (\Exception $e) {
            \Log::error('Get organizer donation requests error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    // === ORGANIZER DASHBOARD STATS ===
    Route::get('/dashboard-stats', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            return app(DonationRequestController::class)->getOrganizerDashboardStats($request);
        } catch (\Exception $e) {
            \Log::error('Organizer dashboard stats error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    // === ORGANIZER APPROVALS (items + volunteers) ===
    Route::get('/item-donations/pending', [OrganizerApprovalController::class, 'pendingItemDonations']);
    Route::post('/item-donations/{id}/approve', [OrganizerApprovalController::class, 'approveItemDonation']);
    Route::post('/item-donations/{id}/reject', [OrganizerApprovalController::class, 'rejectItemDonation']);
    Route::get('/volunteer-applications/pending', [OrganizerApprovalController::class, 'pendingVolunteerApplications']);
    Route::post('/volunteer-applications/{id}/approve', [OrganizerApprovalController::class, 'approveVolunteerApplication']);
    Route::post('/volunteer-applications/{id}/reject', [OrganizerApprovalController::class, 'rejectVolunteerApplication']);

    // === ORGANIZER SLIPS APPROVAL ===
    Route::get('/slips/pending', [SlipController::class, 'pendingForOrganizer']);
    Route::get('/slips/request/{donationRequestId}', [SlipController::class, 'getByDonationRequest']);
    Route::get('/slips/{id}/download', [SlipController::class, 'download']);
    Route::post('/slips/{id}/approve', [SlipController::class, 'approve']);
    Route::post('/slips/{id}/reject', [SlipController::class, 'reject']);
});

Route::get('/users', [AdminUserController::class, 'getUsers']);

// === ADMIN APIs ===
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // ใช้ inline admin check ที่รองรับทั้ง Enum object และ string
    Route::get('/stats', function (Request $request) {
        try {
            $user = $request->user();

            // Debug logging
            \Log::info('Admin access attempt', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_role_type' => gettype($user->role),
                'user_role_value' => $user->role instanceof \App\Enums\UserRole ? $user->role->value : $user->role
            ]);

            // ตรวจสอบ role (รองรับทั้ง Enum object และ string)
            $userRole = $user->role;
            if ($userRole instanceof \App\Enums\UserRole) {
                // ถ้าเป็น Enum object
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                // ถ้าเป็น string
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                \Log::warning('Admin access denied', [
                    'user_id' => $user->id,
                    'user_role' => $userRole
                ]);
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            \Log::info('Admin access granted', [
                'user_id' => $user->id
            ]);

            return app(AdminController::class)->getStats($request);
        } catch (\Exception $e) {
            \Log::error('Admin stats error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::get('/requests/pending', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminRequestController::class)->getPendingRequests($request);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::post('/requests/{id}/approve', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminRequestController::class)->approveRequest($request, $id);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::post('/requests/{id}/reject', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminRequestController::class)->rejectRequest($request, $id);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    // === USER MANAGEMENT ROUTES ===
    Route::get('/users', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminUserController::class)->getUsers($request);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::post('/users', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminUserController::class)->createUser($request);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::get('/users/{id}', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminUserController::class)->getUser($request, $id);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::put('/users/{id}', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminUserController::class)->updateUser($request, $id);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::delete('/users/{id}', function (Request $request, $id) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper($userRole), ['ADMIN']);
            }

            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }

            return app(AdminUserController::class)->deleteUser($request, $id);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::get('/trust-levels', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;
            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
            }
            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }
            return app(AdminTrustLevelController::class)->index();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::put('/trust-levels', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;
            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
            }
            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }
            return app(AdminTrustLevelController::class)->update($request);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    // === ADMIN REWARDS (reward catalog) ===
    Route::get('/rewards', function (Request $request) {
        $user = $request->user();
        $userRole = $user->role;
        if ($userRole instanceof \App\Enums\UserRole) {
            $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
        } else {
            $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
        }
        if (!$isAdmin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return app(AdminRewardController::class)->index();
    });
    Route::post('/rewards', function (Request $request) {
        $user = $request->user();
        $userRole = $user->role;
        if ($userRole instanceof \App\Enums\UserRole) {
            $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
        } else {
            $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
        }
        if (!$isAdmin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return app(AdminRewardController::class)->store($request);
    });
    Route::put('/rewards/{id}', function (Request $request, $id) {
        $user = $request->user();
        $userRole = $user->role;
        if ($userRole instanceof \App\Enums\UserRole) {
            $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
        } else {
            $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
        }
        if (!$isAdmin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return app(AdminRewardController::class)->update($request, $id);
    });
    Route::delete('/rewards/{id}', function (Request $request, $id) {
        $user = $request->user();
        $userRole = $user->role;
        if ($userRole instanceof \App\Enums\UserRole) {
            $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
        } else {
            $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
        }
        if (!$isAdmin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return app(AdminRewardController::class)->destroy($id);
    });
});

// === FILE UPLOAD APIs ===
Route::middleware(['auth:sanctum'])->prefix('upload')->group(function () {
    Route::post('/story-image', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;

            if ($userRole instanceof \App\Enums\UserRole) {
                $isOrganizer = $userRole === \App\Enums\UserRole::ORGANIZER;
            } else {
                $isOrganizer = in_array(strtoupper($userRole), ['ORGANIZER']);
            }

            if (!$isOrganizer) {
                return response()->json(['message' => 'Unauthorized. Organizer access required.'], 403);
            }

            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB
            ]);

            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('story-images', 'public');
                $imageUrl = Storage::url($imagePath);

                return response()->json([
                    'success' => true,
                    'url' => $imageUrl,
                    'message' => 'Image uploaded successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No image file provided'
            ], 400);
        } catch (\Exception $e) {
            \Log::error('Image upload error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });

    Route::post('/reward-image', function (Request $request) {
        try {
            $user = $request->user();
            $userRole = $user->role;
            if ($userRole instanceof \App\Enums\UserRole) {
                $isAdmin = $userRole === \App\Enums\UserRole::ADMIN;
            } else {
                $isAdmin = in_array(strtoupper((string) $userRole), ['ADMIN']);
            }
            if (!$isAdmin) {
                return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
            }
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            ]);
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('rewards', 'public');
                $relativeUrl = Storage::url($imagePath);
                $imageUrl = config('app.url') . $relativeUrl;
                return response()->json([
                    'success' => true,
                    'url' => $imageUrl,
                    'message' => 'Image uploaded successfully',
                ]);
            }
            return response()->json(['success' => false, 'message' => 'No image file provided'], 400);
        } catch (\Exception $e) {
            \Log::error('Reward image upload error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    });
});

Route::post('/donation-requests/{id}/approve', [DonationRequestController::class, 'approveRequest']);
Route::post('/donation-requests/{id}/reject', [DonationRequestController::class, 'rejectRequest']);
Route::post('/donation-requests/{id}/approve-edit', [DonationRequestController::class, 'approveEditRequest']);

Route::get('/users/{id}', [UserController::class, 'show']);
// === HEALTH CHECK ===
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now()->toISOString(),
        'service' => 'Donation API'
    ]);
});

// === FALLBACK ROUTE ===
Route::fallback(function () {
    return response()->json([
        'message' => 'API endpoint not found. Please check the documentation.',
        'available_endpoints' => [
            'auth' => '/api/auth/*',
            'donation-requests' => '/api/donation-requests/*',
            'stories' => '/api/stories/*',
            'organizer' => '/api/organizer/*',
            'admin' => '/api/admin/*',
            'upload' => '/api/upload/*'
        ]
    ], 404);
});
