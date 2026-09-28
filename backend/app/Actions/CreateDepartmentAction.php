<?php

namespace App\Actions;

use App\Models\Department;

class CreateDepartmentAction
{
    /**
     * Create a new department or restore a soft-deleted department.
     */
    public function execute(array $data): Department
    {
        $code = strtoupper($data['code']);
        
        $department = Department::withTrashed()
            ->where('name', $data['name'])
            ->orWhere('code', $code)
            ->first();

        if ($department) {
            if ($department->trashed()) {
                $department->restore();
            }
            $department->update([
                'name' => $data['name'],
                'code' => $code,
                'manager_id' => $data['manager_id'] ?? null,
            ]);
            return $department;
        }

        return Department::create([
            'name' => $data['name'],
            'code' => $code,
            'manager_id' => $data['manager_id'] ?? null,
        ]);
    }
}
