<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status !== 'active') {
            // Revoke all tokens for inactive user
            $user->tokens()->delete();

            return response()->json([
                'message' => 'Your account is inactive or has been deactivated. Access denied.',
            ], 401);
        }

        return $next($request);
    }
}
