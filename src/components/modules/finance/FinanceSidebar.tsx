import React from 'react';
import {
  Home,
  CreditCard,
  Wallet,
  Receipt,
  Clock,
  FileSpreadsheet,
  Headphones,
  ArrowRight,
  LogOut,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface FinanceSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSupportModal?: () => void;
}

export const FinanceSidebar: React.FC<FinanceSidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSupportModal,
}) => {
  const { switchRole } = useApp();

  const navItems = [
    {
      id: 'fin_overview',
      label: 'Painel Geral',
      icon: Home,
      aliases: ['fin_home', 'fin_overview', ''],
    },
    {
      id: 'fin_charges',
      label: 'Mensalidades & Cobranças',
      icon: CreditCard,
      aliases: ['fin_charges'],
    },
    {
      id: 'fin_cash_register',
      label: 'Controle de Caixa',
      icon: Wallet,
      aliases: ['fin_cash_register'],
    },
    {
      id: 'fin_receipts',
      label: 'Recibos Emitidos',
      icon: Receipt,
      aliases: ['fin_receipts'],
    },
    {
      id: 'fin_inadimplencia',
      label: 'Inadimplência & Status',
      icon: Clock,
      aliases: ['fin_inadimplencia'],
    },
    {
      id: 'fin_reports',
      label: 'Relatórios Financeiros',
      icon: FileSpreadsheet,
      aliases: ['fin_reports'],
    },
  ];

  const isTabActive = (item: typeof navItems[0]) => {
    if (item.id === 'fin_overview') {
      return (
        currentTab === 'fin_overview' ||
        currentTab === 'fin_home' ||
        !currentTab ||
        currentTab === 'finance'
      );
    }
    return item.aliases.includes(currentTab);
  };

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-3.5 flex flex-col flex-shrink-0 lg:self-start lg:sticky lg:top-24 space-y-3">
      {/* Navigation List */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isTabActive(item);

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                active
                  ? 'bg-[#075e38] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Role Vision Switcher in Sidebar (Demo) */}
      <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Ver como outro perfil
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <button
            onClick={() => switchRole('STUDENT')}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:text-purple-900 hover:border-purple-300 font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Acessar Portal do Aluno"
          >
            <GraduationCap className="w-3 h-3 text-purple-600 flex-shrink-0" />
            <span className="truncate">Aluno (STU)</span>
          </button>

          <button
            onClick={() => switchRole('TEACHER')}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Acessar Painel do Professor"
          >
            <BookOpen className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span className="truncate">Professor</span>
          </button>

          <button
            onClick={() => switchRole('SECRETARIAT')}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Acessar Secretaria"
          >
            <Users className="w-3 h-3 text-[#075e38] flex-shrink-0" />
            <span className="truncate">Secretaria</span>
          </button>

          <button
            onClick={() => switchRole('ACCOUNTING')}
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Acessar Contábil"
          >
            <BarChart3 className="w-3 h-3 text-blue-600 flex-shrink-0" />
            <span className="truncate">Contábil</span>
          </button>

          <button
            onClick={() => switchRole('SUPER_ADMIN')}
            className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:text-purple-900 hover:border-purple-300 font-semibold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Acessar Direção / Super Admin"
          >
            <Shield className="w-3 h-3 text-purple-600 flex-shrink-0" />
            <span className="truncate">Administração 360°</span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Suporte Card & Logout */}
      <div className="pt-2 space-y-2 border-t border-slate-100">
        {/* Support Card */}
        <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <Headphones className="w-3.5 h-3.5 text-[#075e38]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-none">Suporte</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Precisa de ajuda?</p>
            </div>
          </div>

          <a
            href="https://wa.me/5511972499370?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20m%C3%B3dulo%20Financeiro%20Think%20Green"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left text-xs font-bold text-[#075e38] hover:text-emerald-800 flex items-center justify-between group pt-0.5 cursor-pointer"
            title="WhatsApp Suporte: (11) 97249-9370"
          >
            <span>Fale com o suporte</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Sair da conta */}
        <button
          onClick={() => switchRole('STUDENT')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};
