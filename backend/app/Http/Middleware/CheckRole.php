<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Enums\UserRole;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $userRole = $user->role;
        $hasRole = false;

        if ($userRole instanceof UserRole) {
            $hasRole = $userRole->value === strtoupper($role);
        } else {
            $hasRole = strtoupper($userRole) === strtoupper($role);
        }

        if (!$hasRole) {
            return response()->json(['message' => "Unauthorized. {$role} access required."], 403);
        }

        return $next($request);
    }
}
