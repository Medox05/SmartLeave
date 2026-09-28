import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Mail, Phone, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import type { User } from '../../types';
import { useTranslation } from '../../context/LanguageContext';

interface EmployeeHoverCardProps {
  user: User | {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    position?: string | null;
    department?: { name: string } | null;
    status?: string;
    phone?: string | null;
    employee_number?: string;
    roles?: string[];
  };
  children?: React.ReactNode;
}

export const EmployeeHoverCard: React.FC<EmployeeHoverCardProps> = ({ user, children }) => {
  const { t, tRole, tStatus } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const cardHeight = 220;
      const cardWidth = 288;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Smart vertical positioning: if space below is limited, show above
      const showAbove = spaceBelow < cardHeight && rect.top > cardHeight;
      const top = showAbove ? rect.top - cardHeight - 6 : rect.bottom + 6;

      // Horizontal positioning bounded inside viewport
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - cardWidth - 12));

      setCoords({ top, left });
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const statusVariantMap: Record<string, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    pending: 'warning',
    inactive: 'danger',
  };

  const roleName = user.position || (user.roles && user.roles[0] ? tRole(user.roles[0]) : t('role_staff_member', 'Staff Member'));

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={`/employees/${user.id}`}
        className="group inline-flex items-center gap-3 hover:opacity-90 transition-all cursor-pointer"
      >
        {children || (
          <>
            <Avatar name={user.name} src={user.avatar_url} size="sm" />
            <div className="text-left">
              <p className="font-semibold text-slate-800 text-xs group-hover:text-brand-600 group-hover:underline transition-colors">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
            </div>
          </>
        )}
      </Link>

      {/* Floating Hover Card Portal */}
      {isOpen &&
        createPortal(
          <div
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed z-[99999] w-72 bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 p-4 text-left transition-all animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} src={user.avatar_url} size="md" />
                <div className="overflow-hidden text-left">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{user.name}</h4>
                  <p className="text-xs text-brand-600 font-medium truncate">{roleName}</p>
                </div>
              </div>
              {user.status && (
                <Badge variant={statusVariantMap[user.status] || 'default'} className="capitalize text-[10px] shrink-0">
                  {tStatus(user.status)}
                </Badge>
              )}
            </div>

            {/* Details List */}
            <div className="flex flex-col gap-2 text-xs text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              {user.department?.name && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user.department.name}</span>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}

              {user.employee_number && (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-500">{user.employee_number}</span>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <Link
              to={`/employees/${user.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] rounded-xl transition-all shadow-sm"
            >
              <span>{t('view_full_profile', 'View Full Profile')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>,
          document.body
        )}
    </div>
  );
};
