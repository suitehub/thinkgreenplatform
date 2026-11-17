import React from 'react';
import {
  Users,
  ShieldAlert,
  FileText,
  Database,
  GraduationCap,
  Layers,
  CreditCard,
  Building2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Settings,
  UserPlus,
  Lock,
  Activity,
  Server,
  BookOpen,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';

interface AdminOverviewTabProps {
  setCurrentTab: (tab: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ setCurrentTab }) => {
  const { state } = useApp();

  const activeStudentsCount = state.students.filter((s) => s.status === 'ATIVO').length;
  const activeEnrollmentsCount = state.enrollments.filter((e) => e.status === 'ATIVA').length;
  const activeClassesCount = state.classes.filter((c) => c.status === 'ACTIVE').length;
  const activeUsersCount = state.users.filter((u) => u.status === 'ACTIVE').length;

  const totalCollected = state.receipts.reduce((acc, r) => acc + r.amount, 0);
  const pendingCharges = state.charges.filter((c) => c.status === 'PENDENTE' || c.status === 'EM ATRASO');
  const totalPendingAmount = pendingCharges.reduce((acc, c) => acc + c.amount, 0);

  const recentLogs = (state.auditLogs || []).slice(0, 6);

  const settings = state.settings || {
    centerName: 'Think Green Community Center',
    location: 'Cairo, Egypt (مصر)',
    currencySymbol: 'EGP',
    enableAutomaticExamGates: true,
    enableAutomaticClassroomGates: true,
    rulesConfig: {
      rule1_classroomRequiresFirstPayment: true,
      rule2_exam1RequiresSecondPayment: true,
      rule3_finalExamRequiresFullPayment: true,
    },
  };

  const activeRulesCount = [
    settings.rulesConfig?.rule1_classroomRequiresFirstPayment,
    settings.rulesConfig?.rule2_exam1RequiresSecondPayment,
    settings.rulesConfig?.rule3_finalExamRequiresFullPayment,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* 360° KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Registered Students"
          value={state.students.length}
          subtitle={`${activeStudentsCount} active students`}
          icon={GraduationCap}
          color="purple"
          onClick={() => setCurrentTab('sec_students')}
        />
        <StatCard
          title="Active Enrollments"
          value={activeEnrollmentsCount}
          subtitle={`${activeClassesCount} open classes`}
          icon={Layers}
          color="emerald"
          onClick={() => setCurrentTab('sec_enrollments')}
        />
        <StatCard
          title="Users & Access"
          value={state.users.length}
          subtitle={`${activeUsersCount} active accounts`}
          icon={Users}
          color="sky"
          onClick={() => setCurrentTab('admin_users')}
        />
        <StatCard
          title="Revenue Collected"
          value={`${totalCollected.toLocaleString('en-US')} ${settings.currencySymbol}`}
          subtitle={`${pendingCharges.length} open installments`}
          icon={CreditCard}
          color="amber"
          onClick={() => setCurrentTab('fin_home')}
        />
      </div>

      {/* Second Row: System Health + Quick Operations Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* System Health & Business Rules Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">System Status & Gates</h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Financial Gates Engine:</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {activeRulesCount} Active Rules
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Exam / LMS Lock:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                settings.enableAutomaticExamGates
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {settings.enableAutomaticExamGates ? 'Automation Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Minimum Passing Criteria:</span>
              <span className="font-bold text-slate-800">
                {settings.minimumPassingGrade || 60} pts • Attendance Informational (No failing)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Unit & Currency:</span>
              <span className="font-bold text-slate-800">
                {settings.location} ({settings.currencySymbol})
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentTab('admin_rules')}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
              Configure Gate Rules & Simulation
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Module Navigation Hub */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                System Modules & Quick Access
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Navigate directly to any operational area with full Super Admin permission
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <button
              onClick={() => setCurrentTab('sec_home')}
              className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-emerald-900">Secretariat & Enrollments</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {state.students.length} registered students • Student records and class management
                </p>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('fin_home')}
              className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left group flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-amber-900">Finance & Cashier (POS)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Charges, receipt issuance and cash reconciliation
                </p>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('acad_home')}
              className="p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-all text-left group flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-sky-900">Academic Coordination</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {state.classes.length} classes • Teacher, exam and attendance management
                </p>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('acc_home')}
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group flex items-start gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 group-hover:text-blue-900">Accounting & P&L</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cost centers, consolidated revenue and expenses
                </p>
              </div>
            </button>
          </div>

          {/* Quick Actions Row */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentTab('admin_users')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-600" />
              Manage Users ({state.users.length})
            </button>

            <button
              onClick={() => setCurrentTab('admin_importer')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              Import Google/Excel Spreadsheet
            </button>

            <button
              onClick={() => setCurrentTab('admin_settings')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              Center Settings
            </button>
          </div>
        </div>
      </div>

      {/* Third Row: Recent Audit Stream */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Latest Audit Actions (Audit Logs)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Continuous, immutable tracking of changes across all modules
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('admin_audit')}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            View all ({state.auditLogs?.length || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg transition-colors">
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded shrink-0">
                  {log.action}
                </span>
                <div>
                  <p className="font-bold text-slate-900">
                    {log.userName} <span className="font-normal text-slate-500">• {log.module}</span>
                  </p>
                  <p className="text-slate-600 text-[11px] truncate max-w-xl">
                    {typeof log.details === 'string' ? log.details : typeof log.newValue === 'string' ? log.newValue : 'Action logged'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap self-end sm:self-center">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
