import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutGrid,
  Shield,
  Store,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface AssignedModulesMenuProps {
  /** Extra classes for the wrapper (positioning inside each module header). */
  className?: string;
}

const ROLE_META: Partial<
  Record<UserRole, { label: string; icon: React.ElementType; activeClass: string }>
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    icon: Shield,
    activeClass: 'bg-purple-50 text-purple-900',
  },
  TEACHER: {
    label: 'Professor',
    icon: BookOpen,
    activeClass: 'bg-emerald-50 text-emerald-900',
  },
  SECRETARIAT: {
    label: 'Secretaria',
    icon: FileText,
    activeClass: 'bg-teal-50 text-teal-900',
  },
  RECEPTION: {
    label: 'Recepção',
    icon: Store,
    activeClass: 'bg-indigo-50 text-indigo-900',
  },
  FINANCE: {
    label: 'Financeiro',
    icon: DollarSign,
    activeClass: 'bg-amber-50 text-amber-900',
  },
  ACCOUNTING: {
    label: 'Contábil',
    icon: BarChart3,
    activeClass: 'bg-blue-50 text-blue-900',
  },
  STUDENT: {
    label: 'Aluno',
    icon: GraduationCap,
    activeClass: 'bg-purple-50 text-purple-900',
  },
};

/**
 * Lists only the modules (roles) that the Super Admin assigned to the signed-in
 * employee, so multi-role users can switch between their own areas. It renders
 * nothing when the employee owns a single module.
 */
export const AssignedModulesMenu: React.FC<AssignedModulesMenuProps> = ({ className = '' }) => {
  const { currentUser, switchRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const assignedRoles = (
    currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role]
  ).filter((role): role is UserRole => role !== 'PENDING' && Boolean(ROLE_META[role]));

  if (assignedRoles.length <= 1) return null;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        title="Alternar entre os módulos autorizados para você"
      >
        <LayoutGrid className="w-3.5 h-3.5 text-[#075e38]" />
        <span className="hidden sm:inline">Meus módulos</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Módulos autorizados
          </p>

          {assignedRoles.map((role) => {
            const meta = ROLE_META[role];
            if (!meta) return null;
            const Icon = meta.icon;
            const isActive = currentUser.role === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (!isActive) switchRole(role);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                  isActive
                    ? `${meta.activeClass} font-bold`
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{meta.label}</span>
                {isActive && (
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-70">
                    Atual
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
