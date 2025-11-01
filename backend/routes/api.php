<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DonationRequestController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminRequestController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\StoryStatController;
use Illuminate\Http\Request;
use App\Enums\UserRole;

Route::prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOTP']);
    Route::post('verify-otp', [AuthController::class, 'verifyOTP']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('donations', [AuthController::class, 'donations']);
    });
});

// === DONATION REQUESTS APIs ===
Route::prefix('donation-requests')->group(function () {
    Route::get('/', [DonationRequestController::class, 'index']);
    Route::get('/categories', [DonationRequestController::class, 'categories']);
    Route::get('/{id}', [DonationRequestController::class, 'show']);
});

Route::middleware(['auth:sanctum'])->prefix('donation-requests')->group(function () {
    Route::get('/my/requests', [DonationRequestController::class, 'myRequests']);
    Route::post('/', [DonationRequestController::class, 'store']);
    Route::put('/{id}', [DonationRequestController::class, 'update']);
    Route::delete('/{id}', [DonationRequestController::class, 'destroy']);
});

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
});

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
});

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
// === ORGANIZER STORIES MANAGEMENT APIs ===
Route::middleware(['auth:sanctum', 'organizer'])->prefix('organizer')->group(function () {

    Route::get('/stories', [StoryController::class, 'index']);
    Route::post('/stories', [StoryController::class, 'store']);
    Route::get('/stories/{id}', [StoryController::class, 'show']);
    Route::put('/stories/{id}', [StoryController::class, 'update']);
    Route::delete('/stories/{id}', [StoryController::class, 'destroy']);

    Route::get('/stats', [StoryStatController::class, 'index']);
    Route::get('/donation-requests', [DonationRequestController::class, 'getOrganizerRequestsForStories']);
    Route::get('/dashboard-stats', [DonationRequestController::class, 'getOrganizerDashboardStats']);
});