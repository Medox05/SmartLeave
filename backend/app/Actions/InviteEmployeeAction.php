<?php

namespace App\Actions;

use App\Models\User;
use App\Notifications\EmployeeInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class InviteEmployeeAction
{
    /**
     * Invite a new employee.
     *
     * @param array{
     *     first_name: string,
     *     last_name: string,
     *     email: string,
     *     department_id: int|null,
     *     manager_id: int|null,
     *     position: string|null,
     *     employment_type: string,
     *     hire_date: string|null,
     *     contract_end_date: string|null,
     *     role: string
     * } $data
     * @return User
     */
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::withTrashed()->where('email', $data['email'])->first();

            if ($user) {
                if ($user->trashed()) {
                    $user->restore();
                }
                $user->update([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'password' => Hash('sha256', Str::random(40)),
                    'department_id' => $data['department_id'] ?? null,
                    'manager_id' => $data['manager_id'] ?? null,
                    'position' => $data['position'] ?? null,
                    'employment_type' => $data['employment_type'],
                    'hire_date' => $data['hire_date'] ?? null,
                    'contract_end_date' => $data['contract_end_date'] ?? null,
                    'status' => 'pending',
                ]);
            } else {
                $user = User::create([
                    'employee_number' => 'TEMP-' . Str::upper(Str::random(8)),
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'password' => Hash('sha256', Str::random(40)),
                    'department_id' => $data['department_id'] ?? null,
                    'manager_id' => $data['manager_id'] ?? null,
                    'position' => $data['position'] ?? null,
                    'employment_type' => $data['employment_type'],
                    'hire_date' => $data['hire_date'] ?? null,
                    'contract_end_date' => $data['contract_end_date'] ?? null,
                    'status' => 'pending',
                ]);
            }

            // Assign employee number based on auto-incrementing ID
            $employeeNumber = 'EMP-' . str_pad($user->id, 5, '0', STR_PAD_LEFT);
            $user->update(['employee_number' => $employeeNumber]);

            // Assign role using Spatie
            $user->assignRole($data['role']);

            // Generate signed URL targeting backend route
            // The route name will be 'api.invitation.verify'
            $backendSignedUrl = URL::temporarySignedRoute(
                'api.invitation.verify',
                now()->addHours(24),
                ['user' => $user->id]
            );

            // Reconstruct signed URL to point to the frontend app
            $parsedUrl = parse_url($backendSignedUrl);
            parse_str($parsedUrl['query'] ?? '', $queryParams);

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/setup-password?' . http_build_query([
                'user' => $user->id,
                'expires' => $queryParams['expires'] ?? '',
                'signature' => $queryParams['signature'] ?? '',
            ]);

            // Send notification
            $user->notify(new EmployeeInvitationNotification($frontendUrl));

            return $user;
        });
    }
}
