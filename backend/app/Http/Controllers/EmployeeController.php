<?php

namespace App\Http\Controllers;

use App\Actions\UpdateEmployeeAction;
use App\Actions\UploadAvatarAction;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EmployeeController extends Controller
{
    /**
     * Display a paginated listing of employees.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with(['department', 'manager', 'roles']);

        // Filter by Search (Name, Email, Employee Number)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_number', 'like', "%{$search}%");
            });
        }

        // Filter by Department
        if ($departmentId = $request->input('department_id')) {
            $query->where('department_id', $departmentId);
        }

        // Filter by Employment Type
        if ($employmentType = $request->input('employment_type')) {
            $query->where('employment_type', $employmentType);
        }

        // Filter by Status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by Role
        if ($role = $request->input('role')) {
            $query->role($role);
        }

        $perPage = (int) $request->input('per_page', 15);
        $employees = $query->latest()->paginate($perPage);

        return response()->json(UserResource::collection($employees)->response()->getData(true));
    }

    /**
     * Get list of managers for selection dropdowns.
     */
    public function managers(): JsonResponse
    {
        $managers = User::query()
            ->where('status', 'active')
            ->select(['id', 'first_name', 'last_name', 'email', 'position'])
            ->get();

        return response()->json([
            'data' => $managers->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'position' => $m->position,
            ]),
        ]);
    }

    /**
     * Display the specified employee profile.
     */
    public function show(User $employee): JsonResponse
    {
        $employee->load(['department', 'manager', 'subordinates']);

        return response()->json([
            'data' => new UserResource($employee),
            'subordinates' => UserResource::collection($employee->subordinates),
        ]);
    }

    /**
     * Update the specified employee record.
     */
    public function update(UpdateEmployeeRequest $request, User $employee, UpdateEmployeeAction $action): JsonResponse
    {
        $updatedEmployee = $action->execute($employee, $request->validated());

        \App\Models\AuditLog::log(
            $request->user(),
            'user.updated',
            'user',
            [
                'employee_id' => $employee->id,
                'employee_name' => $updatedEmployee->name,
                'email' => $updatedEmployee->email,
                'department' => $updatedEmployee->department?->name,
            ]
        );

        return response()->json([
            'message' => 'Employee profile updated successfully.',
            'data' => new UserResource($updatedEmployee),
        ]);
    }

    /**
     * Upload avatar image for an employee.
     */
    public function uploadAvatar(Request $request, User $employee, UploadAvatarAction $action): JsonResponse
    {
        if ($request->user()->id !== $employee->id && ! $request->user()->can('users.edit')) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ]);

        $updatedEmployee = $action->execute($employee, $request->file('avatar'));

        return response()->json([
            'message' => 'Avatar uploaded successfully.',
            'data' => new UserResource($updatedEmployee->load(['department', 'manager'])),
        ]);
    }

    /**
     * Toggle status (active/inactive) of an employee.
     */
    public function toggleStatus(Request $request, User $employee): JsonResponse
    {
        if (! $request->user()->can('users.edit')) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $newStatus = $request->input('status');
        $employee->update(['status' => $newStatus]);

        if ($newStatus === 'inactive') {
            $employee->tokens()->delete();
        }

        \App\Models\AuditLog::log(
            $request->user(),
            'user.status_toggled',
            'user',
            [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'email' => $employee->email,
                'status' => $newStatus,
                'summary' => $newStatus === 'inactive' ? "Deactivated employee {$employee->name}" : "Activated employee {$employee->name}",
            ]
        );

        return response()->json([
            'message' => "Employee status updated to {$employee->status}.",
            'data' => new UserResource($employee->load(['department', 'manager'])),
        ]);
    }

    /**
     * Admin set/reset password for an employee and activate account directly.
     */
    public function setPassword(Request $request, User $employee): JsonResponse
    {
        if (! $request->user()->can('users.edit')) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $employee->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->input('password')),
            'status' => 'active',
        ]);

        \App\Models\AuditLog::log(
            $request->user(),
            'user.password_reset',
            'user',
            [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'email' => $employee->email,
            ]
        );

        return response()->json([
            'message' => "Password set and account activated for {$employee->name}.",
            'data' => new UserResource($employee->fresh(['department', 'manager'])),
        ]);
    }

    /**
     * Remove the specified employee (soft delete).
     */
    public function destroy(Request $request, User $employee): Response
    {
        if (! $request->user()->can('users.delete')) {
            abort(403, 'Unauthorized action.');
        }

        if ($request->user()->id === $employee->id) {
            abort(400, 'You cannot delete your own account.');
        }

        $empName = $employee->name;
        $empEmail = $employee->email;
        $employee->tokens()->delete();
        $employee->delete();

        \App\Models\AuditLog::log(
            $request->user(),
            'user.deleted',
            'user',
            [
                'employee_name' => $empName,
                'email' => $empEmail,
            ]
        );

        return response()->noContent();
    }
}
