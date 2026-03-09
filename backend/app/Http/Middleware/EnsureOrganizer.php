<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrganizer
{
    public function handle(Request $request, Closure $next): Response
    {

        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'กรุณาเข้าสู่ระบบก่อน',
            ], 401);
        }

        if (Auth::user()->role !== UserRole::ORGANIZER) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
            ], 403);
        }

        return $next($request);
    }
}