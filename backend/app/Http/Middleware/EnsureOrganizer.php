<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Enums\UserRole;

class EnsureOrganizer
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $role = $user->role;

        $isOrganizer = ($role instanceof UserRole)
            ? $role === UserRole::ORGANIZER
            : in_array(strtoupper($role), ['ORGANIZER']);

        if (!$isOrganizer) {
            return response()->json([
                'message' => 'Unauthorized. Organizer access required.'
            ], 403);
        }

        return $next($request);
    }
}