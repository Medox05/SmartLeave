import React from 'react';
import { Card } from '../../../components/ui';
import { Building2 } from 'lucide-react';

export const DepartmentPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Departments</h2>
        <p className="text-xs text-slate-500 mt-1">Structure company divisions and assign managers.</p>
      </div>

      <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
        <div className="bg-brand-50 p-4 rounded-full text-brand-600 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Corporate Divisions</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
          The department allocation matrices, division managers, and department code schemas will be fully operational in **Sprint 2**.
        </p>
      </Card>
    </div>
  );
};

export default DepartmentPage;
