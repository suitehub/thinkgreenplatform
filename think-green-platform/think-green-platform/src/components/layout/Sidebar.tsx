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
  BarChart3,
  Shield,
  Zap,
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
  const { currentUser, switchRole, state } = useApp();

  const getRoleNavItems = (role: UserRole) => {
    switch (role) {
      case 'STUDENT':
        return [
          { id: 'student_home', label: 'Início', icon: Home },
          { id: 'student_courses', label: 'Minhas Matrículas', icon: BookOpen },
          { id: 'student_lms', label: 'Ambiente AVA / Aulas', icon: BookMarked, badge: 'LMS' },
          { id: 'student_assignments', label: 'Atividades & Trabalhos', icon: FileCheck },
          { id: 'student_grades', label: 'Minhas Notas', icon: Award },
          { id: 'student_attendance', label: 'Frequência & Presença', icon: CalendarCheck },
          { id: 'student_finance', label: 'Financeiro & Recibos', icon: CreditCard },
          { id: 'student_documents', label: 'Meus Documentos', icon: FileText },
        ];

      case 'TEACHER':
        return [
          { id: 'teacher_home', label: 'Painel do Professor', icon: Home },
          { id: 'teacher_classes', label: 'Minhas Turmas', icon: BookOpen },
          { id: 'teacher_attendance', label: 'Fazer Chamada', icon: CalendarCheck },
          { id: 'teacher_grades', label: 'Lançar Notas', icon: Award },
          { id: 'teacher_lessons', label: 'Aulas & Materiais (AVA)', icon: BookMarked },
          { id: 'teacher_assignments', label: 'Corrigir Trabalhos', icon: FileCheck },
        ];

      case 'SECRETARIAT':
        return [
          { id: 'sec_home', label: 'Painel da Secretaria', icon: Home },
          { id: 'sec_new_student', label: 'Novo Aluno (Cadastro)', icon: UserPlus, highlight: true },
          { id: 'sec_students', label: 'Alunos & Cadastros', icon: Users },
          { id: 'sec_enrollments', label: 'Matrículas & Cursos', icon: Layers },
          { id: 'sec_classes', label: 'Turmas & Horários', icon: BookOpen },
          { id: 'sec_documents', label: 'Documentos dos Alunos', icon: FileText },
          { id: 'sec_import', label: 'Importar Planilhas', icon: Database },
        ];

      case 'FINANCE':
        return [
          { id: 'fin_home', label: 'Painel Financeiro', icon: Home },
          { id: 'fin_charges', label: 'Mensalidades & Cobrança', icon: CreditCard },
          { id: 'fin_cash_register', label: 'Controle de Caixa (PDV)', icon: Wallet, highlight: true },
          { id: 'fin_receipts', label: 'Recibos Emitidos', icon: Receipt },
          { id: 'fin_inadimplencia', label: 'Inadimplência & Status', icon: ShieldAlert },
          { id: 'fin_reports', label: 'Relatórios Financeiros', icon: PieChart },
        ];

      case 'ACADEMIC':
        return [
          { id: 'acad_home', label: 'Painel Acadêmico', icon: Home },
          { id: 'acad_courses', label: 'Cursos & Disciplinas', icon: Layers },
          { id: 'acad_classes', label: 'Turmas & Professores', icon: BookOpen },
          { id: 'acad_assessments', label: 'Avaliações & Regras', icon: Award },
          { id: 'acad_attendance', label: 'Auditoria de Frequência', icon: CalendarCheck },
          { id: 'acad_reports', label: 'Desempenho Geral', icon: PieChart },
        ];

      case 'ACCOUNTING':
        return [
          { id: 'acc_home', label: 'Painel Contábil', icon: Home },
          { id: 'acc_transactions', label: 'Receitas & Despesas', icon: CreditCard },
          { id: 'acc_cost_centers', label: 'Centros de Custo', icon: Layers },
          { id: 'acc_closing', label: 'Fechamento Mensal (DRE)', icon: FileText },
          { id: 'acc_reports', label: 'Relatórios Gerenciais', icon: PieChart },
        ];

      case 'ADMINISTRATION':
      case 'SUPER_ADMIN':
        return [
          { id: 'admin_home', label: 'Visão Geral 360°', icon: Home },
          { id: 'admin_users', label: 'Usuários & Permissões', icon: Users },
          { id: 'admin_rules', label: 'Regras de Negócio (Gates)', icon: ShieldAlert, highlight: true },
          { id: 'admin_audit', label: 'Auditoria (Audit Logs)', icon: FileText },
          { id: 'admin_importer', label: 'Migração de Planilhas', icon: Database },
          { id: 'admin_settings', label: 'Configurações Globais', icon: Settings },
        ];

      default:
        return [{ id: 'general_home', label: 'Início', icon: Home }];
    }
  };

  const navItems = getRoleNavItems(currentUser.role);

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
            Navegação do Módulo
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

        {/* Quick Persona Demo Switcher */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Simular Perfil
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => {
                switchRole('STUDENT');
                setCurrentTab('student_home');
              }}
              className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'STUDENT'
                  ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Aluno (STU)</span>
            </button>

            <button
              onClick={() => {
                switchRole('TEACHER');
                setCurrentTab('teacher_home');
              }}
              className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'TEACHER'
                  ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Professor</span>
            </button>

            <button
              onClick={() => {
                switchRole('SECRETARIAT');
                setCurrentTab('sec_home');
              }}
              className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'SECRETARIAT'
                  ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Secretaria</span>
            </button>

            <button
              onClick={() => {
                switchRole('FINANCE');
                setCurrentTab('fin_home');
              }}
              className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'FINANCE'
                  ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Financeiro</span>
            </button>

            <button
              onClick={() => {
                switchRole('ACCOUNTING');
                setCurrentTab('acc_home');
              }}
              className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'ACCOUNTING'
                  ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Contábil</span>
            </button>

            <button
              onClick={() => {
                switchRole('SUPER_ADMIN');
                setCurrentTab('admin_home');
              }}
              className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all flex items-center gap-1.5 ${
                currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMINISTRATION'
                  ? 'border-purple-600 bg-purple-100 text-purple-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
