import React from 'react';
import { Card } from '../../../components/ui';
import { CalendarRange } from 'lucide-react';

export const LeavePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Absence & Leave Logs</h2>
        <p className="text-xs text-slate-500 mt-1">Submit, evaluate, and approve time-off requests.</p>
      </div>

      <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
        <div className="bg-brand-50 p-4 rounded-full text-brand-600 mb-4">
          <CalendarRange className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Absence Workflows</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
          Request workflows, leave ledger audits, document uploads, and dynamic approvals/rejections will be fully functional in **Sprint 3**.
        </p>
      </Card>
    </div>
  );
};

export default LeavePage;
