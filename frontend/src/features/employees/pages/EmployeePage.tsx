import React from 'react';
import { Card } from '../../../components/ui';
import { Users } from 'lucide-react';

export const EmployeePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
        <p className="text-xs text-slate-500 mt-1">Add, edit, and organize company staff members.</p>
      </div>

      <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
        <div className="bg-brand-50 p-4 rounded-full text-brand-600 mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Employee Profiles System</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
          The employee organization chart, employee number registers, and detailed contracts will be fully implemented in **Sprint 2**.
        </p>
      </Card>
    </div>
  );
};

export default EmployeePage;
