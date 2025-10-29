<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DonationRequestController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminRequestController;
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