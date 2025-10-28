<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DonationRequestController;

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
// Public endpoints
Route::prefix('donation-requests')->group(function () {
    Route::get('/', [DonationRequestController::class, 'index']);
    Route::get('/categories', [DonationRequestController::class, 'categories']);
    Route::get('/{id}', [DonationRequestController::class, 'show']);
});

// Organizer endpoints (protected)
Route::middleware(['auth:sanctum'])->prefix('donation-requests')->group(function () {
    Route::get('/my/requests', [DonationRequestController::class, 'myRequests']);
    Route::post('/', [DonationRequestController::class, 'store']);
    Route::put('/{id}', [DonationRequestController::class, 'update']);
    Route::delete('/{id}', [DonationRequestController::class, 'destroy']);
});

// === ADMIN DASHBOARD APIs ===
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    // 1. สถิติภาพรวม
    Route::get('/stats', [AdminController::class, 'stats'])
        ->name('stats');

    // 2. คำขอรออนุมัติ
    Route::get('/requests/pending', [AdminController::class, 'pendingRequests'])
        ->name('requests.pending');

    // 3. จัดการผู้ใช้
    Route::get('/users', [AdminController::class, 'users'])
        ->name('users.index');

    // 4. อนุมัติ / ปฏิเสธคำขอ
    Route::post('/requests/{id}/approve', [AdminController::class, 'approveRequest'])
        ->name('requests.approve');
    Route::post('/requests/{id}/reject', [AdminController::class, 'rejectRequest'])
        ->name('requests.reject');

    // 5. ลบผู้ใช้
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser'])
        ->name('users.delete');
});