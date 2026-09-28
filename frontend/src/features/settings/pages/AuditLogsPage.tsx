import React from 'react';
import { Card } from '../../../components/ui';
import { ShieldCheck } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Security Audit Logs</h2>
        <p className="text-xs text-slate-500 mt-1">Review system logs, IP addresses, and administrative activities.</p>
      </div>

      <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
        <div className="bg-brand-50 p-4 rounded-full text-brand-600 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Administrative Logs</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
          Comprehensive database audit trails, security transaction archives, and logs filtering will be released in **Sprint 5**.
        </p>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
