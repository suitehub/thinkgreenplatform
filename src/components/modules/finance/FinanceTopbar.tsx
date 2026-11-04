import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  User,
  Shield,
  LogOut,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  CreditCard,
  Building2,
  Lock,
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ThinkGardenLogo } from '../../common/ThinkGardenLogos';

interface FinanceTopbarProps {
  onOpenNotifications?: () => void;
  onOpenSupport?: () => void;
}

export const FinanceTopbar: React.FC<FinanceTopbarProps> = ({
  onOpenNotifications,
  onOpenSupport,
}) => {
  const { currentUser, switchRole, switchUserById, state, logout } = useApp();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadNotifications = state.notifications.filter(
    (n) => !n.read && (n.targetRole === 'ALL' || n.targetRole === 'FINANCE' || n.targetRole === currentUser.role)
  );

  return (
    <header className="w-full bg-white border-b border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Think Green Platform Logo */}
      <div className="flex items-center gap-6">
        <ThinkGardenLogo />

        <div className="hidden md:block h-7 w-px bg-slate-200" />

        {/* Title & Subtitle */}
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
            PAINEL FINANCEIRO
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
            Gestão financeira completa e inteligente
          </p>
        </div>
      </div>

      {/* Right: Vision Switcher + Notifications + User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Role / Vision Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setIsNotifOpen(false);
              setIsProfileMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Alternar entre visão de Aluno, Professor, Secretária, Financeiro e Admin"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Visão:</span>
            <span className="font-black">Financeiro</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-amber-700" />
          </button>

          {/* Role Switching Dropdown Menu */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 z-50 animate-in fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Trocar Visão do Sistema (Demo)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selecione o perfil para testar o sistema:
                </p>
              </div>

              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('STUDENT');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition-colors font-medium text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">Visão do Aluno (STU)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Portal do Estudante & AVA</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('TEACHER');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors font-medium text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#075e38] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">Visão do Professor</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Diário de Classe & Chamadas</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('SECRETARIAT');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors font-medium text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#075e38] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">Visão da Secretaria</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Matrículas, Turmas & Alunos</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('FINANCE');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-amber-50/90 text-amber-950 font-bold rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-950 leading-none">Visão do Financeiro</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Painel Ativo (Atual)</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('ACCOUNTING');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-colors font-medium text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">Visão Contábil</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">DRE & Centros de Custo</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('SUPER_ADMIN');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition-colors font-medium text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">Super Admin / Direção</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Regras de Negócio & Auditoria</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setShowRoleMenu(false);
              setIsProfileMenuOpen(false);
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notificações do Financeiro"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#075e38] text-white text-[9.5px] font-black rounded-full flex items-center justify-center border-2 border-white">
              {unreadNotifications.length > 0 ? unreadNotifications.length : '8'}
            </span>
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="font-bold text-xs text-slate-900">Notificações Financeiras</h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ativas
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <p className="font-bold text-slate-900 text-[11px]">Pagamento Recebido</p>
                  <p className="text-slate-600 text-[11px]">
                    Ahmed Mohamed efetuou a quitação da 2ª Parcela (EGP 480,00).
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Hoje às 10:24</span>
                </div>
                <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                  <p className="font-bold text-amber-900 text-[11px]">Vencimento Próximo</p>
                  <p className="text-slate-600 text-[11px]">
                    23 cobranças vencem nos próximos 7 dias no valor de EGP 24.310,00.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Ontem</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill / Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setShowRoleMenu(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 overflow-hidden flex items-center justify-center text-amber-800 font-bold text-xs">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                'JA'
              )}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 block leading-tight">
                {currentUser.role === 'SECRETARIAT'
                  ? 'Secretária'
                  : currentUser.role === 'FINANCE'
                  ? 'Financeiro'
                  : 'Gestor Financeiro'}
              </span>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.name || 'Julia Albuquerque'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
              </div>

              <div className="py-1">
                <span className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Alternar Visão de Usuário
                </span>
                <button
                  onClick={() => {
                    switchRole('FINANCE');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-950 font-bold rounded-lg flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Painel Financeiro (Ativo)
                </button>
                <button
                  onClick={() => {
                    switchRole('SECRETARIAT');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-slate-700 rounded-lg font-medium flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-[#075e38]" /> Painel Secretaria
                </button>
                <button
                  onClick={() => {
                    switchRole('TEACHER');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-slate-700 rounded-lg font-medium flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#075e38]" /> Painel do Professor
                </button>
                <button
                  onClick={() => {
                    switchRole('STUDENT');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-700 rounded-lg font-medium flex items-center gap-2"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Portal do Aluno
                </button>
                <button
                  onClick={() => {
                    switchRole('ACCOUNTING');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 rounded-lg font-medium flex items-center gap-2"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> Visão Contábil
                </button>
                <button
                  onClick={() => {
                    switchRole('SUPER_ADMIN');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-700 rounded-lg font-medium flex items-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" /> Administração Geral
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg font-bold flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
