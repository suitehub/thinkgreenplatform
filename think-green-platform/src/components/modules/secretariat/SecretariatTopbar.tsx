import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  User,
  Shield,
  LogOut,
  CheckCircle,
  HelpCircle,
  GraduationCap,
  BookOpen,
  Sparkles,
  CreditCard,
  BarChart3,
  Users,
} from 'lucide-react';
import { User as UserType, UserRole } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface SecretariatTopbarProps {
  currentUser: UserType;
  onOpenMobileMenu: () => void;
  onOpenSupportModal: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onLogout?: () => void;
}

export const SecretariatTopbar: React.FC<SecretariatTopbarProps> = ({
  currentUser,
  onOpenMobileMenu,
  onOpenSupportModal,
  onLogout,
}) => {
  const { switchRole, switchUserById, state } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Nova matrícula pendente de documento',
      desc: 'Aluno Tarek Mahmoud precisa enviar cópia do RG.',
      time: 'Há 12 min',
      unread: true,
    },
    {
      id: 2,
      title: 'Turma Inglês Intermediário B em alta',
      desc: 'Restam apenas poucas vagas disponíveis.',
      time: 'Há 1 hora',
      unread: true,
    },
    {
      id: 3,
      title: 'Importação de alunos processada',
      desc: 'Registros sincronizados com o banco de dados.',
      time: 'Há 3 horas',
      unread: false,
    },
    {
      id: 4,
      title: 'Liberação de acesso financeiro',
      desc: 'Pagamento de mensalidade registrado no caixa central.',
      time: 'Ontem',
      unread: false,
    },
  ];

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Title + Subtitle */}
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-tight tracking-tight uppercase">
            PAINEL DA SECRETARIA
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
            Gestão Escolar Inteligente • Think Green Platform
          </p>
        </div>
      </div>

      {/* Right: Role Switcher + Notifications Bell + User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Role / Vision Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-[#075e38] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Alternar entre visão de Aluno, Professor, Secretária, Financeiro e Admin"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Visão:</span>
            <span className="font-black">Secretaria</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-[#075e38]" />
          </button>

          {/* Role Switching Dropdown Menu */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 z-50 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#075e38]" />
                  Trocar Visão do Sistema
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
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50/80 text-[#075e38] font-bold rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#075e38] text-white flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#075e38] leading-none">Visão da Secretaria</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Painel Ativo (Atual)</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchRole('FINANCE');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-colors font-medium text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">Visão do Financeiro</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Caixa PDV & Recibos</p>
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

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              setShowRoleMenu(false);
            }}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-600 flex items-center justify-center relative transition-colors cursor-pointer"
            title="Notificações da Secretaria"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#10b981] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
              8
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase">Notificações</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">
                    8 novas
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Marcar todas como lidas
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="py-3 px-1 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{notif.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowRoleMenu(false);
            }}
            className="flex items-center gap-3 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/80"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs flex-shrink-0"
            />

            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {currentUser.role === 'SECRETARIAT' ? 'Secretária' : 'Administrador'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {currentUser.name || 'Mona Abdelrahman'}
              </p>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-fade-in text-xs">
              <div className="p-3 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#075e38] border border-emerald-200">
                  Secretaria Ativa
                </span>
              </div>

              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSupportModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Central de Ajuda</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair do Painel</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
