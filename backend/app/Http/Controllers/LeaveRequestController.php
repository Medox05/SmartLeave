<?php

namespace App\Http\Controllers;

use App\Actions\CalculateLeaveDurationAction;
use App\Http\Resources\LeaveRequestResource;
use App\Models\AppNotification;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of leave requests.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = LeaveRequest::query()
            ->with(['user.department', 'leaveType', 'approver']);

        $scope = $request->input('scope', 'auto');

        if ($scope === 'mine') {
            $query->where('user_id', $user->id);
        } elseif ($user->hasRole('Manager') && ! $user->hasAnyRole(['Admin', 'HR'])) {
            // Manager strictly sees direct reports & department members only
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                  ->orWhere('department_id', $user->department_id);
            });
        } elseif ($user->hasRole('Employee') && ! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            $query->where('user_id', $user->id);
        }
        // HR and Admin see all by default unless filtered

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Leave type filter
        if ($leaveTypeId = $request->input('leave_type_id')) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        // Year filter
        if ($year = $request->input('year')) {
            $query->whereYear('start_date', $year);
        }

        // Department filter
        if ($departmentId = $request->input('department_id')) {
            $query->whereHas('user', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if ($request->boolean('all')) {
            $requests = $query->latest()->get();
            return response()->json([
                'data' => LeaveRequestResource::collection($requests),
            ]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $requests = $query->latest()->paginate($perPage);

        return response()->json(LeaveRequestResource::collection($requests)->response()->getData(true));
    }

    /**
     * Calculate duration for a potential leave request.
     */
    public function calculateDuration(Request $request, CalculateLeaveDurationAction $calculator): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'half_day_type' => ['nullable', 'string', 'in:none,morning,afternoon'],
        ]);

        $duration = $calculator->execute(
            $request->input('start_date'),
            $request->input('end_date'),
            $request->input('half_day_type', 'none')
        );

        return response()->json([
            'duration' => $duration,
        ]);
    }

    /**
     * Store a newly created leave request.
     */
    public function store(Request $request, CalculateLeaveDurationAction $calculator): JsonResponse
    {
        $leaveType = LeaveType::findOrFail($request->input('leave_type_id'));

        $rules = [
            'leave_type_id' => ['required', 'integer', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'half_day_type' => ['nullable', 'string', 'in:none,morning,afternoon'],
            'reason' => ['nullable', 'string'],
            'attachment' => [$leaveType->requires_attachment ? 'required' : 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
        ];

        $data = $request->validate($rules);

        // Calculate net duration
        $duration = $calculator->execute(
            $data['start_date'],
            $data['end_date'],
            $data['half_day_type'] ?? 'none'
        );

        $user = $request->user();
        $year = (int) date('Y', strtotime($data['start_date']));

        // 1. Enforce Overdraft Policy from System Settings
        $allowOverdraft = \App\Models\Setting::get('allow_overdraft', true);
        if (! $allowOverdraft && $leaveType->is_paid) {
            $entitlement = \App\Models\LeaveEntitlement::where('user_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('year', $year)
                ->first();

            $allocatedDays = (float) ($entitlement ? $entitlement->allocated_days : ($leaveType->default_days ?? 0));
            $alreadyUsedDays = (float) \App\Models\LeaveRequest::where('user_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('status', 'approved')
                ->whereYear('start_date', $year)
                ->sum('total_days');

            $remainingBalance = max(0, $allocatedDays - $alreadyUsedDays);

            if ($duration > $remainingBalance) {
                return response()->json([
                    'message' => "Overdraft is disabled in System Settings. Your remaining balance for {$leaveType->name} is {$remainingBalance} days, but this request requires {$duration} days.",
                ], 422);
            }
        }

        // 2. Enforce Policy Attachment Requirement
        if ($leaveType->requires_attachment && ! $request->hasFile('attachment')) {
            return response()->json([
                'message' => "An attachment or supporting document is required for {$leaveType->name}.",
            ], 422);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'leave_type_id' => $data['leave_type_id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'total_days' => $duration,
            'half_day_type' => $data['half_day_type'] ?? 'none',
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
            'attachment_path' => $attachmentPath,
        ]);

        // Notify HR & Admin about new leave submission
        $recipients = User::role(['Admin', 'HR'])->get();
        foreach ($recipients as $recipient) {
            if ($recipient->id !== $request->user()->id) {
                AppNotification::create([
                    'user_id' => $recipient->id,
                    'title' => 'New Leave Application',
                    'message' => "{$request->user()->name} applied for {$leaveType->name} ({$duration}d).",
                    'type' => 'leave_submitted',
                    'data' => ['request_id' => $leaveRequest->id],
                ]);
            }
        }

        \App\Models\AuditLog::log($request->user(), 'leave.submitted', 'leave', [
            'request_id' => $leaveRequest->id,
            'leave_type' => $leaveType->name,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days' => $duration,
            'description' => "Submitted {$leaveType->name} application ({$duration} days).",
        ]);

        return response()->json([
            'message' => 'Leave request submitted successfully.',
            'data' => new LeaveRequestResource($leaveRequest->load(['user.department', 'leaveType'])),
        ], 201);
    }

    /**
     * Approve the specified leave request.
     */
    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $user = $request->user();

        // Authorization check: Admin, HR & Manager can approve leave applications
        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            abort(403, 'Unauthorized. Only Managers, HR and Admin can approve leave requests.');
        }

        // Manager scoping: Managers can only approve requests for their direct reports or team
        if ($user->hasRole('Manager') && ! $user->hasAnyRole(['Admin', 'HR'])) {
            $isSubordinate = $leaveRequest->user?->manager_id === $user->id ||
                             ($user->department_id && $leaveRequest->user?->department_id === $user->department_id);
            if (! $isSubordinate) {
                return response()->json([
                    'message' => 'Managers can only approve leave requests for their own direct reports and team members.',
                ], 403);
            }
        }

        // Prevent self-approval (Conflict of Interest Guard)
        if ($leaveRequest->user_id === $user->id && ! $user->hasRole('Admin')) {
            return response()->json([
                'message' => 'Self-approval is not permitted. Your leave application must be approved by a System Administrator or another HR Manager.',
            ], 422);
        }

        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => $user->id,
        ]);

        // Notify requester employee
        AppNotification::create([
            'user_id' => $leaveRequest->user_id,
            'title' => 'Leave Request Approved! 🎉',
            'message' => "Your request for {$leaveRequest->leaveType?->name} ({$leaveRequest->start_date?->toDateString()} → {$leaveRequest->end_date?->toDateString()}) was approved by {$user->name}.",
            'type' => 'leave_approved',
            'data' => ['request_id' => $leaveRequest->id],
        ]);

        \App\Models\AuditLog::log($user, 'leave.approved', 'leave', [
            'request_id' => $leaveRequest->id,
            'employee_id' => $leaveRequest->user_id,
            'leave_type' => $leaveRequest->leaveType?->name,
            'days' => $leaveRequest->total_days,
            'description' => "Approved {$leaveRequest->leaveType?->name} request for {$leaveRequest->user?->name}.",
        ]);

        return response()->json([
            'message' => 'Leave request approved successfully.',
            'data' => new LeaveRequestResource($leaveRequest->fresh(['user.department', 'leaveType', 'approver'])),
        ]);
    }

    /**
     * Reject the specified leave request.
     */
    public function reject(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $user = $request->user();

        // Authorization check: Admin, HR & Manager can reject leave applications
        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            abort(403, 'Unauthorized. Only Managers, HR and Admin can reject leave requests.');
        }

        // Manager scoping: Managers can only reject requests for their direct reports or team
        if ($user->hasRole('Manager') && ! $user->hasAnyRole(['Admin', 'HR'])) {
            $isSubordinate = $leaveRequest->user?->manager_id === $user->id ||
                             ($user->department_id && $leaveRequest->user?->department_id === $user->department_id);
            if (! $isSubordinate) {
                return response()->json([
                    'message' => 'Managers can only reject leave requests for their own direct reports and team members.',
                ], 403);
            }
        }

        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        // Notify requester employee
        AppNotification::create([
            'user_id' => $leaveRequest->user_id,
            'title' => 'Leave Request Declined',
            'message' => "Your request for {$leaveRequest->leaveType?->name} was declined: {$request->input('rejection_reason')}",
            'type' => 'leave_rejected',
            'data' => ['request_id' => $leaveRequest->id],
        ]);

        \App\Models\AuditLog::log($user, 'leave.rejected', 'leave', [
            'request_id' => $leaveRequest->id,
            'employee_id' => $leaveRequest->user_id,
            'leave_type' => $leaveRequest->leaveType?->name,
            'rejection_reason' => $request->input('rejection_reason'),
            'description' => "Rejected leave request for {$leaveRequest->leaveType?->name}.",
        ]);

        return response()->json([
            'message' => 'Leave request rejected.',
            'data' => new LeaveRequestResource($leaveRequest->fresh(['user.department', 'leaveType', 'approver'])),
        ]);
    }

    /**
     * Cancel the specified leave request.
     */
    public function cancel(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $user = $request->user();

        if ($leaveRequest->user_id !== $user->id && ! $user->hasAnyRole(['Admin', 'HR'])) {
            abort(403, 'Unauthorized to cancel this request.');
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending leave requests can be cancelled.'], 422);
        }

        $leaveRequest->update([
            'status' => 'cancelled',
        ]);

        // Notify HR & Admin about cancelled request
        $recipients = User::role(['Admin', 'HR'])->get();
        foreach ($recipients as $recipient) {
            if ($recipient->id !== $user->id) {
                AppNotification::create([
                    'user_id' => $recipient->id,
                    'title' => 'Leave Application Cancelled',
                    'message' => "{$user->name} cancelled their {$leaveRequest->leaveType?->name} application.",
                    'type' => 'leave_cancelled',
                    'data' => ['request_id' => $leaveRequest->id],
                ]);
            }
        }

        \App\Models\AuditLog::log($user, 'leave.cancelled', 'leave', [
            'request_id' => $leaveRequest->id,
            'leave_type' => $leaveRequest->leaveType?->name,
            'description' => "Cancelled leave application for {$leaveRequest->leaveType?->name}.",
        ]);

        return response()->json([
            'message' => 'Leave request cancelled.',
            'data' => new LeaveRequestResource($leaveRequest->fresh(['user.department', 'leaveType'])),
        ]);
    }

    /**
     * Get approved team leave schedule for calendar timeline.
     */
    public function calendar(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));

        $approvedLeaves = LeaveRequest::with(['user.department', 'leaveType'])
            ->where('status', 'approved')
            ->where(function ($q) use ($year) {
                $q->whereYear('start_date', $year)
                  ->orWhereYear('end_date', $year);
            })
            ->orderBy('start_date')
            ->get();

        return response()->json([
            'data' => LeaveRequestResource::collection($approvedLeaves),
        ]);
    }
}
