<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateEmployeeAction
{
    /**
     * Update an employee profile.
     */
    public function execute(User $employee, array $data): User
    {
        return DB::transaction(function () use ($employee, $data) {
            $employee->update([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'gender' => $data['gender'] ?? null,
                'address' => $data['address'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'manager_id' => $data['manager_id'] ?? null,
                'position' => $data['position'] ?? null,
                'employment_type' => $data['employment_type'],
                'hire_date' => $data['hire_date'] ?? null,
                'contract_end_date' => $data['contract_end_date'] ?? null,
            ]);

            if (!empty($data['role'])) {
                $employee->syncRoles([$data['role']]);
            }

            return $employee->fresh(['department', 'manager']);
        });
    }
}
