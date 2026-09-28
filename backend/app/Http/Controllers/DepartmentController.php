<?php

namespace App\Http\Controllers;

use App\Actions\CreateDepartmentAction;
use App\Actions\UpdateDepartmentAction;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\UserResource;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Department::query()
            ->with(['manager'])
            ->withCount('users');

        // Optional unpaginated dropdown format
        if ($request->boolean('all')) {
            return response()->json([
                'data' => DepartmentResource::collection($query->get()),
            ]);
        }

        // Search filtering
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $departments = $query->latest()->paginate($perPage);

        return response()->json(DepartmentResource::collection($departments)->response()->getData(true));
    }

    /**
     * Display the specified department with members.
     */
    public function show(Department $department): JsonResponse
    {
        $department->load(['manager', 'users' => function ($q) {
            $q->where('status', 'active');
        }])->loadCount('users');

        return response()->json([
            'data' => new DepartmentResource($department),
            'members' => UserResource::collection($department->users),
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(StoreDepartmentRequest $request, CreateDepartmentAction $action): JsonResponse
    {
        $department = $action->execute($request->validated());

        \App\Models\AuditLog::log($request->user(), 'department.created', 'department', [
            'department_name' => $department->name,
            'code' => $department->code,
            'description' => "Created department {$department->name} ({$department->code}).",
        ]);

        return response()->json([
            'message' => 'Department created successfully.',
            'data' => new DepartmentResource($department->load('manager')->loadCount('users')),
        ], 201);
    }

    /**
     * Update the specified department.
     */
    public function update(UpdateDepartmentRequest $request, Department $department, UpdateDepartmentAction $action): JsonResponse
    {
        $department = $action->execute($department, $request->validated());

        \App\Models\AuditLog::log($request->user(), 'department.updated', 'department', [
            'department_name' => $department->name,
            'code' => $department->code,
            'description' => "Updated department {$department->name}.",
        ]);

        return response()->json([
            'message' => 'Department updated successfully.',
            'data' => new DepartmentResource($department->load('manager')->loadCount('users')),
        ]);
    }

    /**
     * Remove the specified department (soft delete).
     */
    public function destroy(Request $request, Department $department): Response
    {
        if (! $request->user()->can('departments.manage')) {
            abort(403, 'Unauthorized action.');
        }

        $dName = $department->name;
        $department->delete();

        \App\Models\AuditLog::log($request->user(), 'department.deleted', 'department', [
            'department_name' => $dName,
            'description' => "Deleted department {$dName}.",
        ]);

        return response()->noContent();
    }

    /**
     * Assign staff members to this department.
     */
    public function assignMembers(Request $request, Department $department): JsonResponse
    {
        if (! $request->user()->can('departments.manage')) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'user_ids' => ['present', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $userIds = $request->input('user_ids', []);

        // Reassign selected users to this department
        \App\Models\User::whereIn('id', $userIds)->update(['department_id' => $department->id]);

        return response()->json([
            'message' => 'Department staff updated successfully.',
            'data' => new DepartmentResource($department->fresh(['manager'])->loadCount('users')),
        ]);
    }
}
