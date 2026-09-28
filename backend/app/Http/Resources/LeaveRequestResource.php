<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class LeaveRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'employee_number' => $this->user->employee_number,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'avatar_url' => $this->user->avatar_url ? (str_starts_with($this->user->avatar_url, 'http') ? $this->user->avatar_url : url($this->user->avatar_url)) : null,
                    'department' => $this->user->department?->name,
                    'position' => $this->user->position,
                ];
            }),
            'leave_type_id' => $this->leave_type_id,
            'leave_type' => new LeaveTypeResource($this->whenLoaded('leaveType')),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'total_days' => (float) $this->total_days,
            'half_day_type' => $this->half_day_type ?? 'none',
            'reason' => $this->reason,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'approver' => $this->whenLoaded('approver', function () {
                return [
                    'id' => $this->approver->id,
                    'name' => $this->approver->name,
                ];
            }),
            'rejection_reason' => $this->rejection_reason,
            'attachment_url' => $this->attachment_path ? url(Storage::url($this->attachment_path)) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'submitted_at' => $this->created_at?->format('Y-m-d H:i'),
            'submitted_ago' => $this->created_at?->diffForHumans(),
            'is_overdraft' => (function () {
                if ($this->leaveType && ! $this->leaveType->is_paid) return false;
                $year = $this->start_date ? (int) $this->start_date->format('Y') : (int) date('Y');
                $entitlement = \App\Models\LeaveEntitlement::where('user_id', $this->user_id)
                    ->where('leave_type_id', $this->leave_type_id)
                    ->where('year', $year)
                    ->first();
                $allocatedDays = (float) ($entitlement ? $entitlement->allocated_days : ($this->leaveType->default_days ?? 0));
                $alreadyUsedDays = (float) \App\Models\LeaveRequest::where('user_id', $this->user_id)
                    ->where('leave_type_id', $this->leave_type_id)
                    ->where('id', '!=', $this->id)
                    ->where('status', 'approved')
                    ->whereYear('start_date', $year)
                    ->sum('total_days');
                $remaining = max(0, $allocatedDays - $alreadyUsedDays);
                return $this->total_days > $remaining;
            })(),
            'overdraft_days' => (function () {
                if ($this->leaveType && ! $this->leaveType->is_paid) return 0;
                $year = $this->start_date ? (int) $this->start_date->format('Y') : (int) date('Y');
                $entitlement = \App\Models\LeaveEntitlement::where('user_id', $this->user_id)
                    ->where('leave_type_id', $this->leave_type_id)
                    ->where('year', $year)
                    ->first();
                $allocatedDays = (float) ($entitlement ? $entitlement->allocated_days : ($this->leaveType->default_days ?? 0));
                $alreadyUsedDays = (float) \App\Models\LeaveRequest::where('user_id', $this->user_id)
                    ->where('leave_type_id', $this->leave_type_id)
                    ->where('id', '!=', $this->id)
                    ->where('status', 'approved')
                    ->whereYear('start_date', $year)
                    ->sum('total_days');
                $remaining = max(0, $allocatedDays - $alreadyUsedDays);
                return $this->total_days > $remaining ? round($this->total_days - $remaining, 1) : 0;
            })(),
        ];
    }
}
