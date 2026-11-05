import React from 'react';
import {
  Home,
  UserPlus,
  Users,
  Calendar,
  FileText,
  Upload,
  Headphones,
  LogOut,
  ArrowRight,
  X,
  Clock,
  Compass,
} from 'lucide-react';
import { Logo } from '../../common/Logo';
import { useApp } from '../../../context/AppContext';

interface SecretariatSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSupportModal: () => void;
  onLogout?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SecretariatSidebar: React.FC<SecretariatSidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSupportModal,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) => {
  const { state } = useApp();

  const pendingCount = (state.pendingRegistrations || []).filter((p) => p.status === 'PENDENTE').length;

  const navItems = [
    {
      id: 'sec_home',
      label: 'Painel Geral',
      icon: Home,
    },
    {
      id: 'sec_new_student',
      label: 'Novo Aluno (Cadastro)',
      icon: UserPlus,
    },
    {
      id: 'sec_pending_queue',
      label: 'Fila de Pendentes',
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'sec_students',
      label: 'Alunos & Matrículas',
      icon: Users,
    },
    {
      id: 'sec_classes',
      label: 'Turmas & Horários',
      icon: Calendar,
    },
    {
      id: 'sec_documents',
      label: 'Documentos dos Alunos',
      icon: FileText,
    },
    {
      id: 'sec_counselor',
      label: 'Orientador Educacional',
      icon: Compass,
    },
    {
      id: 'sec_import',
      label: 'Importar Planilhas',
      icon: Upload,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100">
            <Logo size="md" />

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            <p className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Menu da Secretaria
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentTab === item.id ||
                (item.id === 'sec_home' && (!currentTab || currentTab === 'sec_home'));

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#075e38] text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                        isActive
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Support Card & Logout */}
        <div className="p-4 space-y-2.5 border-t border-slate-100 bg-white">
          {/* Suporte Widget */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075e38] flex items-center justify-center flex-shrink-0">
                <Headphones className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-none">Suporte Think Green</p>
                <p className="text-[10px] text-slate-400 mt-0.5">(11) 97249-9370</p>
              </div>
            </div>

            <a
              href="https://wa.me/5511972499370?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20sistema%20Think%20Green"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left text-xs font-bold text-[#075e38] hover:text-emerald-800 flex items-center justify-between group pt-1 cursor-pointer"
              title="Falar no WhatsApp (11) 97249-9370"
            >
              <span>Fale com o suporte</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Sair da conta */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>
    </>
  );
};
