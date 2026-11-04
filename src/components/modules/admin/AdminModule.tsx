import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  FileText,
  Settings,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  Shield,
  Sliders,
  MapPin,
  Building2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../common/Modal';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminRulesTab } from './AdminRulesTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminImporterTab } from './AdminImporterTab';
import { AdminSettingsTab } from './AdminSettingsTab';

interface AdminModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ currentTab, setCurrentTab }) => {
  const { state, resetToDefaultData } = useApp();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetSuccessFeedback, setResetSuccessFeedback] = useState(false);

  const activeTab = currentTab.startsWith('admin_') ? currentTab : 'admin_home';

  const navItems = [
    {
      id: 'admin_home',
      label: 'Visão Geral 360°',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'admin_users',
      label: 'Usuários & Permissões',
      icon: Users,
      badge: state.users?.length || 0,
    },
    {
      id: 'admin_rules',
      label: 'Regras de Negócio (Gates)',
      icon: ShieldAlert,
      badge: '3 Regras',
    },
    {
      id: 'admin_audit',
      label: 'Auditoria (Audit Logs)',
      icon: FileText,
      badge: state.auditLogs?.length || 0,
    },
    {
      id: 'admin_importer',
      label: 'Migração de Planilhas',
      icon: Database,
      badge: 'CSV/Excel',
    },
    {
      id: 'admin_settings',
      label: 'Configurações Globais',
      icon: Settings,
      badge: null,
    },
  ];

  const handleConfirmReset = () => {
    resetToDefaultData();
    setIsResetModalOpen(false);
    setResetSuccessFeedback(true);
    setTimeout(() => setResetSuccessFeedback(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Module Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#075e38] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-100 font-bold'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 px-1">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaurar dados padrão de teste"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
            <span>Restaurar Demo</span>
          </button>
        </div>
      </div>

      {resetSuccessFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Banco de dados restaurado para os dados padrão do Think Green Community Center!
        </div>
      )}

      {/* Tab Content Router */}
      <div className="min-h-[400px]">
        {activeTab === 'admin_home' && (
          <AdminOverviewTab
            setCurrentTab={setCurrentTab}
            onOpenResetModal={() => setIsResetModalOpen(true)}
          />
        )}

        {activeTab === 'admin_users' && <AdminUsersTab />}

        {activeTab === 'admin_rules' && <AdminRulesTab />}

        {activeTab === 'admin_audit' && <AdminAuditTab />}

        {activeTab === 'admin_importer' && (
          <AdminImporterTab setCurrentTab={setCurrentTab} />
        )}

        {activeTab === 'admin_settings' && (
          <AdminSettingsTab onOpenResetModal={() => setIsResetModalOpen(true)} />
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Restaurar Banco de Dados Padrão"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção: Esta ação substituirá os dados locais</p>
              <p className="text-[11px] mt-0.5 text-amber-800">
                Todos os alunos, cobranças, notas e transações serão restaurados para a massa de dados inicial de demonstração do Cairo.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
            >
              Confirmar e Restaurar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
