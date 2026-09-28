<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeaveTypeResource;
use App\Models\LeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LeaveTypeController extends Controller
{
    /**
     * Display a listing of leave types.
     */
    public function index(Request $request): JsonResponse
    {
        $query = LeaveType::query();

        // Optional filter for active only
        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        $leaveTypes = $query->orderBy('name')->get();

        return response()->json([
            'data' => LeaveTypeResource::collection($leaveTypes),
        ]);
    }

    /**
     * Store a newly created leave type.
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->can('settings.manage') && ! $request->user()->hasRole('Admin')) {
            abort(403, 'Unauthorized action.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:leave_types,name'],
            'code' => ['required', 'string', 'max:10', 'uppercase', 'unique:leave_types,code'],
            'description' => ['nullable', 'string'],
            'default_days' => ['required', 'integer', 'min:0', 'max:365'],
            'is_paid' => ['required', 'boolean'],
            'requires_attachment' => ['required', 'boolean'],
            'color' => ['required', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ]);

        $leaveType = LeaveType::create($data);

        \App\Models\AuditLog::log($request->user(), 'policy.created', 'policy', [
            'policy_name' => $leaveType->name,
            'code' => $leaveType->code,
            'default_days' => $leaveType->default_days,
            'description' => "Created new leave policy {$leaveType->name} ({$leaveType->code}) with {$leaveType->default_days} default days.",
        ]);

        return response()->json([
            'message' => 'Leave type created successfully.',
            'data' => new LeaveTypeResource($leaveType),
        ], 201);
    }

    /**
     * Update the specified leave type.
     */
    public function update(Request $request, LeaveType $leaveType): JsonResponse
    {
        if (! $request->user()->can('settings.manage') && ! $request->user()->hasRole('Admin')) {
            abort(403, 'Unauthorized action.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:leave_types,name,'.$leaveType->id],
            'code' => ['required', 'string', 'max:10', 'uppercase', 'unique:leave_types,code,'.$leaveType->id],
            'description' => ['nullable', 'string'],
            'default_days' => ['required', 'integer', 'min:0', 'max:365'],
            'is_paid' => ['required', 'boolean'],
            'requires_attachment' => ['required', 'boolean'],
            'color' => ['required', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ]);

        $leaveType->update($data);

        \App\Models\AuditLog::log($request->user(), 'policy.updated', 'policy', [
            'policy_name' => $leaveType->name,
            'code' => $leaveType->code,
            'default_days' => $leaveType->default_days,
            'description' => "Updated leave policy {$leaveType->name}.",
        ]);

        return response()->json([
            'message' => 'Leave type updated successfully.',
            'data' => new LeaveTypeResource($leaveType),
        ]);
    }

    /**
     * Remove the specified leave type.
     */
    public function destroy(Request $request, LeaveType $leaveType): Response
    {
        if (! $request->user()->can('settings.manage') && ! $request->user()->hasRole('Admin')) {
            abort(403, 'Unauthorized action.');
        }

        $pName = $leaveType->name;

        // Mark inactive so it no longer appears in balance cards
        $leaveType->update(['is_active' => false]);

        // Remove associated entitlements
        \App\Models\LeaveEntitlement::where('leave_type_id', $leaveType->id)->delete();

        // Hard delete policy record
        $leaveType->delete();

        \App\Models\AuditLog::log($request->user(), 'policy.deleted', 'policy', [
            'policy_name' => $pName,
            'description' => "Deleted leave policy {$pName}.",
        ]);

        return response()->noContent();
    }
}
