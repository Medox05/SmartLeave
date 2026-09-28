<?php

namespace App\Http\Controllers;

use App\Actions\InviteEmployeeAction;
use App\Actions\AcceptInvitationAction;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class InvitationController extends Controller
{
    /**
     * Invite a new employee.
     * Route protected by 'can:users.create'
     */
    public function invite(Request $request, InviteEmployeeAction $inviteAction): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users', 'email')->whereNull('deleted_at')],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'position' => ['nullable', 'string', 'max:255'],
            'employment_type' => ['required', 'string', 'in:Full-time,Part-time,Contractor,Intern'],
            'hire_date' => ['nullable', 'date'],
            'contract_end_date' => ['nullable', 'date', 'after_or_equal:hire_date'],
            'role' => ['required', 'string', 'in:Admin,HR,Manager,Employee'],
        ]);

        $user = $inviteAction->execute($data);

        \App\Models\AuditLog::log($request->user(), 'user.invited', 'user', [
            'email' => $user->email,
            'name' => $user->name,
            'role' => $data['role'],
            'description' => "Invited new team member {$user->name} ({$user->email}) with role {$data['role']}.",
        ]);

        $backendSignedUrl = URL::temporarySignedRoute(
            'api.invitation.verify',
            now()->addHours(24),
            ['user' => $user->id]
        );
        $parsedUrl = parse_url($backendSignedUrl);
        parse_str($parsedUrl['query'] ?? '', $queryParams);

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/setup-password?' . http_build_query([
            'user' => $user->id,
            'expires' => $queryParams['expires'] ?? '',
            'signature' => $queryParams['signature'] ?? '',
        ]);

        return response()->json([
            'message' => 'Employee invited successfully and email sent.',
            'user' => new UserResource($user),
            'invitation_url' => $frontendUrl,
        ], 201);
    }

    /**
     * Get or regenerate activation link for pending employee.
     */
    public function getInvitationUrl(User $user): JsonResponse
    {
        $backendSignedUrl = URL::temporarySignedRoute(
            'api.invitation.verify',
            now()->addHours(24),
            ['user' => $user->id]
        );
        $parsedUrl = parse_url($backendSignedUrl);
        parse_str($parsedUrl['query'] ?? '', $queryParams);

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/setup-password?' . http_build_query([
            'user' => $user->id,
            'expires' => $queryParams['expires'] ?? '',
            'signature' => $queryParams['signature'] ?? '',
        ]);

        return response()->json([
            'invitation_url' => $frontendUrl,
        ]);
    }

    /**
     * Verify the signed invitation URL parameters.
     */
    public function verify(Request $request): JsonResponse
    {
        if (! $request->hasValidSignature()) {
            return response()->json(['message' => 'The invitation link has expired or is invalid.'], 403);
        }

        $userId = $request->query('user');
        $user = User::findOrFail($userId);

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'This invitation has already been accepted.'], 400);
        }

        return response()->json([
            'message' => 'Invitation link is valid.',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ]
        ]);
    }

    /**
     * Accept the invitation, verifying signature and setting new password.
     */
    public function accept(Request $request, AcceptInvitationAction $acceptAction): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Manually verify the signature against the verify route to check security
        $verifyUrl = URL::route('api.invitation.verify', [
            'user' => $request->query('user'),
            'expires' => $request->query('expires'),
            'signature' => $request->query('signature'),
        ]);

        if (! URL::hasValidSignature($verifyUrl)) {
            return response()->json(['message' => 'The invitation link has expired or is invalid.'], 403);
        }

        $userId = $request->query('user');
        $user = User::findOrFail($userId);

        if ($user->status !== 'pending') {
            return response()->json(['message' => 'This invitation has already been accepted.'], 400);
        }

        $user = $acceptAction->execute($user, $request->input('password'));

        \App\Models\AuditLog::log($user, 'user.invitation_accepted', 'user', [
            'email' => $user->email,
            'description' => "User {$user->name} accepted invitation and activated account.",
        ]);

        // Log the user in directly
        auth()->login($user);
        $request->session()->regenerate();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Your password has been set and your account is now active.',
            'token' => $token,
            'user' => new UserResource($user->load(['department', 'manager'])),
        ]);
    }
}
