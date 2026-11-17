import React from 'react';
import {
  Home,
  Users,
  UserPlus,
  BookOpen,
  GraduationCap,
  CreditCard,
  Receipt,
  Wallet,
  CalendarCheck,
  Award,
  BookMarked,
  FileCheck,
  FileText,
  PieChart,
  ShieldAlert,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  DollarSign,
  FileSpreadsheet,
  BarChart3,
  Shield,
  Zap,
  Smartphone,
  Store,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { currentUser, switchRole, state, logout } = useApp();

  const getRoleNavItems = (role: UserRole) => {
    switch (role) {
      case 'STUDENT':
        return [
          { id: 'student_home', label: 'Home', icon: Home },
          { id: 'student_courses', label: 'My Enrollments', icon: BookOpen },
          { id: 'student_lms', label: 'LMS Environment / Classes', icon: BookMarked, badge: 'LMS' },
          { id: 'student_assignments', label: 'Activities & Assignments', icon: FileCheck },
          { id: 'student_grades', label: 'My Grades', icon: Award },
          { id: 'student_attendance', label: 'Attendance & Presence', icon: CalendarCheck },
          { id: 'student_finance', label: 'Finance & Receipts', icon: CreditCard },
          { id: 'student_documents', label: 'My Documents', icon: FileText },
        ];

      case 'TEACHER':
        return [
          { id: 'teacher_home', label: 'Teacher Dashboard', icon: Home },
          { id: 'teacher_classes', label: 'My Classes', icon: BookOpen },
          { id: 'teacher_attendance', label: 'Take Attendance', icon: CalendarCheck },
          { id: 'teacher_grades', label: 'Enter Grades', icon: Award },
          { id: 'teacher_lessons', label: 'Classes & Materials (LMS)', icon: BookMarked },
          { id: 'teacher_assignments', label: 'Grade Assignments', icon: FileCheck },
          { id: 'acc_employee_portal', label: 'Request Reimbursement (Expenses)', icon: Receipt },
        ];

      case 'SECRETARIAT':
        return [
          { id: 'sec_home', label: 'Registrar\'s Office Dashboard', icon: Home },
          { id: 'sec_new_student', label: 'New Student (Registration)', icon: UserPlus, highlight: true },
          { id: 'sec_students', label: 'Students & Records', icon: Users },
          { id: 'sec_enrollments', label: 'Enrollments & Courses', icon: Layers },
          { id: 'sec_classes', label: 'Classes & Schedules', icon: BookOpen },
          { id: 'sec_documents', label: 'Student Documents', icon: FileText },
          { id: 'sec_import', label: 'Import Spreadsheets', icon: Database },
          { id: 'acc_employee_portal', label: 'Request Reimbursement (Expenses)', icon: Receipt },
        ];

      case 'FINANCE':
        return [
          { id: 'fin_home', label: 'Finance Dashboard', icon: Home },
          { id: 'fin_charges', label: 'Tuition & Billing', icon: CreditCard },
          { id: 'fin_cash_register', label: 'Cash Register Control (POS)', icon: Wallet, highlight: true },
          { id: 'fin_receipts', label: 'Issued Receipts', icon: Receipt },
          { id: 'fin_inadimplencia', label: 'Delinquency & Status', icon: ShieldAlert },
          { id: 'fin_reports', label: 'Financial Reports', icon: PieChart },
        ];

      case 'ACCOUNTING':
        return [
          { id: 'acc_home', label: 'Accounting Dashboard (Rony)', icon: Home },
          { id: 'acc_revenues', label: 'Receipts (Inflows)', icon: CreditCard },
          { id: 'acc_expenses', label: 'Expenses & Official Spreadsheet', icon: FileSpreadsheet, highlight: true },
          { id: 'acc_reimbursements', label: 'Pending Reimbursements', icon: Receipt },
          { id: 'acc_employee_portal', label: 'Reimbursement Portal (App)', icon: Smartphone },
        ];

      case 'SUPER_ADMIN':
        return [
          { id: 'admin_home', label: '360° Overview', icon: Home },
          { id: 'admin_users', label: 'Users & Permissions', icon: Users },
          { id: 'admin_registration', label: 'Employee Registration', icon: UserPlus },
          { id: 'admin_rules', label: 'Business Rules (Gates)', icon: ShieldAlert, highlight: true },
          { id: 'admin_audit', label: 'Audit (Audit Logs)', icon: FileText },
          { id: 'admin_importer', label: 'Spreadsheet Migration', icon: Database },
          { id: 'admin_settings', label: 'Global Settings', icon: Settings },
        ];

      default:
        return [{ id: 'general_home', label: 'Home', icon: Home }];
    }
  };

  const navItems = getRoleNavItems(currentUser.role);

  const assignedRoles = (
    currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role]
  ).filter((role) => role !== 'PENDING');

  const roleMeta: Record<
    string,
    { label: string; icon: React.ElementType; tab: string; activeClass: string }
  > = {
    STUDENT: {
      label: 'Student',
      icon: GraduationCap,
      tab: 'student_home',
      activeClass: 'border-purple-600 bg-purple-100 text-purple-900',
    },
    TEACHER: {
      label: 'Teacher',
      icon: BookOpen,
      tab: 'teacher_home',
      activeClass: 'border-emerald-600 bg-emerald-100 text-emerald-900',
    },
    SECRETARIAT: {
      label: 'Registrar\'s Office',
      icon: FileText,
      tab: 'sec_home',
      activeClass: 'border-teal-600 bg-teal-100 text-teal-900',
    },
    RECEPTION: {
      label: 'Reception',
      icon: Store,
      tab: 'rec_payment',
      activeClass: 'border-indigo-600 bg-indigo-100 text-indigo-900',
    },
    FINANCE: {
      label: 'Finance',
      icon: DollarSign,
      tab: 'fin_home',
      activeClass: 'border-amber-600 bg-amber-100 text-amber-900',
    },
    ACCOUNTING: {
      label: 'Accounting',
      icon: BarChart3,
      tab: 'acc_home',
      activeClass: 'border-blue-600 bg-blue-100 text-blue-900',
    },
    SUPER_ADMIN: {
      label: 'Super Admin',
      icon: Shield,
      tab: 'admin_home',
      activeClass: 'border-purple-600 bg-purple-100 text-purple-900',
    },
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Logo size="md" />
        </div>

        {/* User Persona Profile Card */}
        <div className="p-3.5 mx-3 mt-3 mb-1 bg-slate-50/90 rounded-2xl border border-slate-100 flex items-center gap-3">
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover border border-purple-200 shadow-2xs flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
              {currentUser.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentUser.role}
              </span>
              {currentUser.studentId && (
                <span className="font-mono text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {currentUser.studentId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Module Navigation
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-xs'
                    : item.highlight
                    ? 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Roles assigned to this employee (multi-role access) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-600" />
              {assignedRoles.length > 1 ? 'My modules' : 'Authorized module'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {assignedRoles.map((role) => {
              const meta = roleMeta[role];
              if (!meta) return null;
              const Icon = meta.icon;
              const isActive = currentUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    setCurrentTab(meta.tab);
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? `${meta.activeClass} font-bold`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sign out */}
          <button
            onClick={() => {
              setIsOpenMobile(false);
              logout();
            }}
            className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
