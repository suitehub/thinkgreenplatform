import React, { useState } from 'react';
import { Bell, ChevronDown, Menu, LogOut, HelpCircle } from 'lucide-react';
import { User as UserType } from '../../../types';
import { AssignedModulesMenu } from '../../common/AssignedModulesMenu';
import { useApp } from '../../../context/AppContext';

interface SecretariatTopbarProps {
  currentUser: UserType;
  onOpenMobileMenu: () => void;
  onOpenSupportModal: () => void;
  onLogout?: () => void;
}

export const SecretariatTopbar: React.FC<SecretariatTopbarProps> = ({
  currentUser,
  onOpenMobileMenu,
  onOpenSupportModal,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { state, markAllNotificationsRead } = useApp();

  const notifications = state.notifications
    .filter(
      (n) =>
        n.targetRole === 'ALL' ||
        n.targetRole === 'SECRETARIAT' ||
        n.userId === currentUser.id
    )
    .slice(0, 10);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const userInitials =
    currentUser.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';

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

      {/* Right: Notifications Bell + User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <AssignedModulesMenu />
        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-600 flex items-center justify-center relative transition-colors cursor-pointer"
            title="Notificações da Secretaria"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#10b981] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase">Notificações</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">
                    {unreadCount} nova(s)
                  </span>
                </div>
                <button
                  onClick={() => {
                    markAllNotificationsRead();
                    setShowNotifications(false);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Marcar todas como lidas
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-slate-400 text-xs font-medium">
                    Nenhuma notificação no momento.
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="py-3 px-1 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
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
            }}
            className="flex items-center gap-3 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/80"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#075e38] border border-emerald-200 flex items-center justify-center font-black text-xs shadow-2xs flex-shrink-0 overflow-hidden">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {currentUser.role === 'SECRETARIAT' ? 'Secretária' : 'Administrador'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {currentUser.name}
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
