import React from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  FileText,
  Settings,
  LayoutDashboard,
  Shield,
  Sliders,
  MapPin,
  Building2,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminRegistrationTab } from './AdminRegistrationTab';
import { AdminRulesTab } from './AdminRulesTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminImporterTab } from './AdminImporterTab';
import { AdminSettingsTab } from './AdminSettingsTab';

interface AdminModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ currentTab, setCurrentTab }) => {
  const { state } = useApp();

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
      id: 'admin_registration',
      label: 'Registro de Funcionários',
      icon: UserPlus,
      badge:
        state.users?.filter((user) => user.role === 'PENDING' || !user.roles?.length).length ||
        null,
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

      </div>

      {/* Tab Content Router */}
      <div className="min-h-[400px]">
        {activeTab === 'admin_home' && <AdminOverviewTab setCurrentTab={setCurrentTab} />}

        {activeTab === 'admin_users' && <AdminUsersTab />}

        {activeTab === 'admin_registration' && <AdminRegistrationTab />}

        {activeTab === 'admin_rules' && <AdminRulesTab />}

        {activeTab === 'admin_audit' && <AdminAuditTab />}

        {activeTab === 'admin_importer' && (
          <AdminImporterTab setCurrentTab={setCurrentTab} />
        )}

        {activeTab === 'admin_settings' && <AdminSettingsTab />}
      </div>
    </div>
  );
};
