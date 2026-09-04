import React, { useState } from 'react';
import {
  Settings,
  Building2,
  MapPin,
  DollarSign,
  Award,
  CheckCircle,
  RotateCcw,
  Download,
  Upload,
  Database,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../common/Modal';

interface AdminSettingsTabProps {
  onOpenResetModal: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ onOpenResetModal }) => {
  const { state, updateSettings } = useApp();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings form state
  const settings = state.settings || {
    centerName: 'Think Green Community Center',
    location: 'Cairo, Egypt (مصر)',
    currencySymbol: 'EGP',
    currencyCode: 'EGP',
    enableAutomaticExamGates: true,
    enableAutomaticClassroomGates: true,
    minimumPassingGrade: 60,
    attendanceRequirementPercent: 75,
    rulesConfig: {
      rule1_classroomRequiresFirstPayment: true,
      rule2_exam1RequiresSecondPayment: true,
      rule3_finalExamRequiresFullPayment: true,
    },
  };

  const [formData, setFormData] = useState({
    centerName: settings.centerName || 'Think Green Community Center',
    location: settings.location || 'Cairo, Egypt (مصر)',
    currencySymbol: settings.currencySymbol || 'EGP',
    currencyCode: settings.currencyCode || 'EGP',
    minimumPassingGrade: settings.minimumPassingGrade || 60,
    attendanceRequirementPercent: settings.attendanceRequirementPercent || 75,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      centerName: formData.centerName.trim(),
      location: formData.location.trim(),
      currencySymbol: formData.currencySymbol.trim(),
      currencyCode: formData.currencyCode.trim(),
      minimumPassingGrade: Number(formData.minimumPassingGrade),
      attendanceRequirementPercent: Number(formData.attendanceRequirementPercent),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportFullDatabaseBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `thinkgreen_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-700" />
            Configurações Globais & Manutenção do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie dados institucionais da unidade, moeda corrente e operações de backup e restauração.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Institutional Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-purple-600" />
            Identidade Institucional & Unidade
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Centro Comunitário *</label>
              <input
                type="text"
                required
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cidade / País da Unidade *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Símbolo da Moeda (Exibição)</label>
              <input
                type="text"
                required
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ex: EGP, E£ ou L.E. (Libra Egípcia)
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Código ISO da Moeda</label>
              <input
                type="text"
                required
                value={formData.currencyCode}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Padrão internacional: EGP
              </span>
            </div>
          </div>
        </div>

        {/* Academic Criteria Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-emerald-600" />
            Parâmetros de Aprovação & Frequência
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nota Mínima para Aprovação (0 a 100):</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.minimumPassingGrade}
                onChange={(e) => setFormData({ ...formData, minimumPassingGrade: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Frequência Mínima Exigida (%):</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.attendanceRequirementPercent}
                onChange={(e) => setFormData({ ...formData, attendanceRequirementPercent: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer transition-colors"
            >
              Salvar Todas as Configurações
            </button>
          </div>
        </div>
      </form>

      {/* Database Maintenance & Backup Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-sky-600" />
          Manutenção do Banco de Dados & Backup
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Backup Download */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-purple-600" />
                Exportar Backup Integral (JSON)
              </h4>
              <p className="text-slate-500 text-[11px] mt-1">
                Gera um snapshot completo contendo alunos, matrículas, notas, transações contábeis e logs de auditoria.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportFullDatabaseBackup}
              className="w-full py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Arquivo de Backup
            </button>
          </div>

          {/* Reset Demo State */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between gap-3">
            <div>
              <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Restaurar Dados Padrão de Demonstração
              </h4>
              <p className="text-rose-700/80 text-[11px] mt-1">
                Recarrega o banco de dados inicial do Think Green Community Center com dados oficiais de exemplo.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenResetModal}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Dados Padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
