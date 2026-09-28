<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\PasswordReset;

class AuthController extends Controller
{
    /**
     * Authenticate and login the user.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $user = Auth::user();

        if ($user->status !== 'active') {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Your account is pending activation or has been deactivated.'],
            ]);
        }

        $request->session()->regenerate();
        $token = $user->createToken('auth_token')->plainTextToken;

        \App\Models\AuditLog::log($user, 'auth.login', 'user', [
            'email' => $user->email,
            'description' => "User {$user->name} logged into the system.",
        ]);

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user->load(['department', 'manager'])),
        ]);
    }

    /**
     * Logout user and invalidate session.
     */
    public function logout(Request $request): Response
    {
        if ($user = $request->user()) {
            \App\Models\AuditLog::log($user, 'auth.logout', 'user', [
                'email' => $user->email,
                'description' => "User {$user->name} logged out.",
            ]);
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * Get current authenticated user details.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load(['department', 'manager'])),
        ]);
    }

    /**
     * Trigger forgotten password reset link email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)]);
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Reset password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'status' => 'active'
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)]);
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Update profile details (name, phone, address).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id, 'id')->whereNull('deleted_at')],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:50'],
        ]);

        $data['name'] = trim("{$data['first_name']} {$data['last_name']}");

        // Record Old Values for Detailed Audit Log Diff
        $oldData = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'birth_date' => $user->birth_date ? substr((string)$user->birth_date, 0, 10) : null,
            'gender' => $user->gender,
        ];

        $user->update($data);

        // Compute Detailed Field Diffs
        $changes = [];
        foreach ($data as $field => $newValue) {
            if ($field === 'name') continue; // Skip aggregate name field as first_name & last_name are tracked
            $oldValue = $oldData[$field] ?? null;

            $oldStr = ($oldValue === null || $oldValue === '' || $oldValue === '(empty)') ? null : (string)$oldValue;
            $newStr = ($newValue === null || $newValue === '' || $newValue === '(empty)') ? null : (string)$newValue;

            if ($field === 'birth_date') {
                if ($oldStr) $oldStr = substr($oldStr, 0, 10);
                if ($newStr) $newStr = substr($newStr, 0, 10);
            }

            if ($oldStr !== $newStr) {
                if ($oldStr === null && $newStr === null) continue;

                $changes[$field] = [
                    'from' => $oldStr,
                    'to' => $newStr,
                ];
            }
        }

        if (!empty($changes)) {
            $summaryParts = [];
            foreach ($changes as $field => $diff) {
                $fromTxt = $diff['from'] ?? 'Not Set';
                $toTxt = $diff['to'] ?? 'Not Set';
                $summaryParts[] = "{$field} ('{$fromTxt}' → '{$toTxt}')";
            }
            $description = "Updated profile fields: " . implode(', ', $summaryParts);

            \App\Models\AuditLog::log($user, 'profile.updated', 'user', [
                'user_id' => $user->id,
                'email' => $user->email,
                'changes' => $changes,
                'description' => $description,
            ]);
        }

        return response()->json([
            'message' => 'Profile details updated successfully.',
            'user' => new UserResource($user->fresh(['department', 'manager'])),
        ]);
    }

    /**
     * Upload user profile avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar_url' => \Illuminate\Support\Facades\Storage::url($path)]);
        }

        return response()->json([
            'message' => 'Avatar photo updated successfully.',
            'user' => new UserResource($user->fresh(['department', 'manager'])),
        ]);
    }

    /**
     * Change user password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password provided is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        return response()->json([
            'message' => 'Your password has been changed successfully.',
        ]);
    }
}
