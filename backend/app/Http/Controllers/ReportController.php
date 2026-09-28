<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Get summary metrics and chart breakdowns for HR reports.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            abort(403, 'Unauthorized action.');
        }

        $year = (int) $request->input('year', date('Y'));

        // Query scope based on role
        $requestQuery = LeaveRequest::whereYear('start_date', $year);

        if ($user->hasRole('Manager') && ! $user->hasAnyRole(['Admin', 'HR'])) {
            $requestQuery->whereHas('user', function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                  ->orWhere('department_id', $user->department_id);
            });
        }

        $allRequests = (clone $requestQuery)->get();
        $approvedRequests = $allRequests->where('status', 'approved');

        $totalDaysTaken = (float) $approvedRequests->sum('total_days');
        $approvedCount = $approvedRequests->count();
        $pendingCount = $allRequests->where('status', 'pending')->count();
        $rejectedCount = $allRequests->where('status', 'rejected')->count();

        $isManager = $user->hasRole('Manager') && ! $user->hasAnyRole(['Admin', 'HR']);

        // Department breakdown
        $deptQuery = Department::withCount('users');
        if ($isManager && $user->department_id) {
            $deptQuery->where('id', $user->department_id);
        }
        $departments = $deptQuery->get();
        $departmentBreakdown = [];

        foreach ($departments as $dept) {
            $deptDays = (float) LeaveRequest::whereYear('start_date', $year)
                ->where('status', 'approved')
                ->whereHas('user', function ($q) use ($dept, $isManager, $user) {
                    $q->where('department_id', $dept->id);
                    if ($isManager) {
                        $q->where(function ($sub) use ($user) {
                            $sub->where('manager_id', $user->id)
                                ->orWhere('department_id', $user->department_id);
                        });
                    }
                })
                ->sum('total_days');

            $departmentBreakdown[] = [
                'department_id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'staff_count' => $dept->users_count,
                'total_days_taken' => $deptDays,
            ];
        }

        // Leave Type breakdown
        $leaveTypes = LeaveType::where('is_active', true)->get();
        $leaveTypeBreakdown = [];

        foreach ($leaveTypes as $type) {
            $typeQuery = LeaveRequest::whereYear('start_date', $year)
                ->where('status', 'approved')
                ->where('leave_type_id', $type->id);

            if ($isManager) {
                $typeQuery->whereHas('user', function ($q) use ($user) {
                    $q->where('manager_id', $user->id)
                      ->orWhere('department_id', $user->department_id);
                });
            }

            $typeDays = (float) (clone $typeQuery)->sum('total_days');
            $typeCount = (clone $typeQuery)->count();

            $leaveTypeBreakdown[] = [
                'leave_type_id' => $type->id,
                'name' => $type->name,
                'code' => $type->code,
                'color' => $type->color,
                'total_days' => $typeDays,
                'request_count' => $typeCount,
            ];
        }

        return response()->json([
            'year' => $year,
            'metrics' => [
                'total_days_taken' => $totalDaysTaken,
                'approved_count' => $approvedCount,
                'pending_count' => $pendingCount,
                'rejected_count' => $rejectedCount,
                'avg_absence_days' => $approvedCount > 0 ? round($totalDaysTaken / $approvedCount, 1) : 0,
            ],
            'department_breakdown' => $departmentBreakdown,
            'leave_type_breakdown' => $leaveTypeBreakdown,
        ]);
    }

    /**
     * Stream CSV export of leave requests ledger formatted cleanly for Excel.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            abort(403, 'Unauthorized action.');
        }

        $query = LeaveRequest::query()
            ->with(['user.department', 'leaveType', 'approver']);

        // Filters
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($deptId = $request->input('department_id')) {
            $query->whereHas('user', fn ($q) => $q->where('department_id', $deptId));
        }

        if ($leaveTypeId = $request->input('leave_type_id')) {
            $query->where('leave_type_id', $leaveTypeId);
        }

        if ($year = $request->input('year')) {
            $query->whereYear('start_date', $year);
        }

        $fileName = 'smartleave_attendance_ledger_' . date('Y-m-d_His') . '.csv';
        $requests = $query->latest()->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $cleanText = function (?string $text): string {
            if (empty($text)) {
                return '';
            }
            $cleaned = trim($text);
            // Strip duplicate wrapping quotes
            $cleaned = preg_replace('/^"+|"+$/', '', $cleaned);
            // Replace linebreaks and tabs with clean single spaces
            $cleaned = str_replace(["\r\n", "\r", "\n", "\t", '"'], [' ', ' ', ' ', ' ', "'"], $cleaned);
            return preg_replace('/\s+/', ' ', $cleaned);
        };

        $callback = function () use ($requests, $cleanText) {
            $file = fopen('php://output', 'w');

            // Add UTF-8 BOM for Microsoft Excel compatibility
            fprintf($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, [
                'Request ID',
                'Employee ID',
                'Employee Name',
                'Email Address',
                'Department',
                'Position',
                'Leave Policy',
                'Start Date',
                'End Date',
                'Schedule',
                'Total Working Days',
                'Status',
                'Employee Reason / Notes',
                'Approver Name',
                'Rejection Reason',
                'Submission Date',
            ]);

            foreach ($requests as $req) {
                fputcsv($file, [
                    '#' . $req->id,
                    $req->user?->employee_number ?? ('EMP-' . str_pad($req->user_id, 4, '0', STR_PAD_LEFT)),
                    $req->user?->name ?? 'N/A',
                    $req->user?->email ?? 'N/A',
                    $req->user?->department?->name ?? 'N/A',
                    $req->user?->position ?? 'N/A',
                    $req->leaveType?->name ?? 'N/A',
                    $req->start_date?->toDateString(),
                    $req->end_date?->toDateString(),
                    $req->half_day_type !== 'none' ? ucfirst($req->half_day_type) : 'Full Day',
                    $req->total_days,
                    ucfirst($req->status),
                    $cleanText($req->reason),
                    $req->approver?->name ?? 'N/A',
                    $cleanText($req->rejection_reason),
                    $req->created_at?->format('Y-m-d H:i'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
