<?php

namespace App\Actions;

use App\Models\Department;

class UpdateDepartmentAction
{
    /**
     * Update an existing department.
     */
    public function execute(Department $department, array $data): Department
    {
        $department->update([
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'manager_id' => $data['manager_id'] ?? null,
        ]);

        return $department;
    }
}
