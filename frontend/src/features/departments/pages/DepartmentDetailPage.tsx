import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { departmentService } from '../../../services/departmentService';
import { Card, Badge, Avatar } from '../../../components/ui';
import { Building2, ArrowLeft, Users, Mail } from 'lucide-react';
import type { User } from '../../../types';

export const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentService.getDepartment(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-md w-1/4" />
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Department not found or unavailable.</p>
        <Link to="/departments" className="mt-4 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Return to Departments Directory
        </Link>
      </div>
    );
  }

  const dept = data.data;
  const members: User[] = data.members || [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div>
        <Link
          to="/departments"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Departments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{dept.name}</h2>
                <Badge variant="default">{dept.code}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Department Division Details & Active Staff Ledger
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Manager info */}
        <Card className="md:col-span-2 flex items-center gap-4">
          {dept.manager ? (
            <>
              <Avatar name={dept.manager.name} src={dept.manager.avatar_url} size="lg" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  Department Manager
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">{dept.manager.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {dept.manager.email}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 text-slate-500 text-xs italic">
              No Manager assigned to this department division.
            </div>
          )}
        </Card>

        {/* Member Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between text-white">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Staff Members</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{dept.users_count ?? members.length}</h3>
          </div>
          <div className="p-3 bg-slate-800 text-brand-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Member Table List */}
      <Card title="Department Members" subtitle={`Active employees assigned to ${dept.name}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employment Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar_url} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.employee_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      {member.position || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <Badge variant="default">{member.employment_type}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/employees/${member.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                    No active employees currently assigned to this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DepartmentDetailPage;
