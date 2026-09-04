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
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';

interface AdminOverviewTabProps {
  setCurrentTab: (tab: string) => void;
  onOpenResetModal: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  setCurrentTab,
  onOpenResetModal,
}) => {
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
          title="Alunos Cadastrados"
          value={state.students.length}
          subtitle={`${activeStudentsCount} alunos ativos`}
          icon={GraduationCap}
          color="purple"
          onClick={() => setCurrentTab('sec_students')}
        />
        <StatCard
          title="Matrículas Ativas"
          value={activeEnrollmentsCount}
          subtitle={`${activeClassesCount} turmas abertas`}
          icon={Layers}
          color="emerald"
          onClick={() => setCurrentTab('sec_enrollments')}
        />
        <StatCard
          title="Usuários & Acessos"
          value={state.users.length}
          subtitle={`${activeUsersCount} contas ativas`}
          icon={Users}
          color="sky"
          onClick={() => setCurrentTab('admin_users')}
        />
        <StatCard
          title="Receita Arrecadada"
          value={`${totalCollected.toLocaleString('pt-BR')} ${settings.currencySymbol}`}
          subtitle={`${pendingCharges.length} parcelas em aberto`}
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
              <h3 className="font-bold text-slate-900 text-sm">Status do Sistema & Travas</h3>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operacional
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Motor de Gates Financeiros:</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {activeRulesCount} Regras Ativas
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Bloqueio Provas / AVA:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${
                settings.enableAutomaticExamGates
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {settings.enableAutomaticExamGates ? 'Automático Ligado' : 'Desativado'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Critério Mínimo de Aprovação:</span>
              <span className="font-bold text-slate-800">
                {settings.minimumPassingGrade || 60} pts • {settings.attendanceRequirementPercent || 75}% freq.
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-600 font-medium">Unidade & Moeda:</span>
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
              Configurar Regras de Gate & Simulação
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
                Módulos do Sistema & Acesso Rápido
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Navegue diretamente para qualquer área operacional com permissão total de Super Admin
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
                <p className="font-bold text-slate-900 group-hover:text-emerald-900">Secretaria & Matrículas</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {state.students.length} alunos cadastrados • Gestão de dossiês e turmas
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
                <p className="font-bold text-slate-900 group-hover:text-amber-900">Financeiro & Caixa (PDV)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cobranças, emissão de recibos e conferência de caixa
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
                <p className="font-bold text-slate-900 group-hover:text-sky-900">Coordenação Acadêmica</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {state.classes.length} turmas • Gestão de docentes, provas e presença
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
                <p className="font-bold text-slate-900 group-hover:text-blue-900">Contabilidade & DRE</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Centros de custo, receitas e despesas consolidadas
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
              Gerenciar Usuários ({state.users.length})
            </button>

            <button
              onClick={() => setCurrentTab('admin_importer')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              Importar Planilha Google/Excel
            </button>

            <button
              onClick={() => setCurrentTab('admin_settings')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              Configurações do Centro
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
              Últimas Ações de Auditoria (Audit Logs)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rastreamento contínuo e imutável de alterações em todos os módulos
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('admin_audit')}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          >
            Ver todos ({state.auditLogs?.length || 0})
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
                    {typeof log.details === 'string' ? log.details : typeof log.newValue === 'string' ? log.newValue : 'Ação registrada'}
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
