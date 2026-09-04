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
  Lock,
  Unlock,
  Upload,
  RefreshCw,
  Plus,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { UserRole, SystemSettings } from '../../../types';

interface AdminModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ currentTab, setCurrentTab }) => {
  const {
    state,
    updateSettings,
    createStudentWithEnrollment,
    importStudentsBatch,
    resetToDefaultData,
  } = useApp();

  const [rulesSaved, setRulesSaved] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Settings accessor with safe fallbacks
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

  // Sheet Importer state
  const [rawSheetData, setRawSheetData] = useState(`Nome\tTelefone\tCurso\tCidade
Mariam Tarek\t+20 10 7766 5544\tCurso Livre de Inglês\tCairo
Karim Hassan\t+20 10 3344 5566\tAcademia de Futebol Think Green\tCairo
Nourhan Mostafa\t+20 10 9988 7766\tCurso Livre de Inglês\tCairo`);
  const [importedSuccessCount, setImportedSuccessCount] = useState<number | null>(null);

  const handleToggleRule = (key: keyof typeof settings.rulesConfig) => {
    const currentRules = settings.rulesConfig || {
      rule1_classroomRequiresFirstPayment: true,
      rule2_exam1RequiresSecondPayment: true,
      rule3_finalExamRequiresFullPayment: true,
    };
    const updatedRules = { ...currentRules, [key]: !currentRules[key] };
    updateSettings({
      rulesConfig: updatedRules,
    });
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2500);
  };

  const handleToggleMasterGate = (key: 'enableAutomaticExamGates' | 'enableAutomaticClassroomGates') => {
    updateSettings({
      [key]: !settings[key],
    });
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2500);
  };

  const handleProcessImport = () => {
    const lines = rawSheetData.trim().split('\n');
    let imported = 0;

    lines.slice(1).forEach((line) => {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const [name, phone, courseName] = parts;
        const matchingCourse =
          state.courses.find((c) => c.name.toLowerCase().includes(courseName.toLowerCase())) ||
          state.courses[0];
        const matchingClass =
          state.classes.find((c) => c.courseId === matchingCourse?.id) || state.classes[0];

        if (matchingCourse && matchingClass) {
          createStudentWithEnrollment(
            {
              name: name.trim(),
              phone: phone.trim(),
              city: 'Cairo',
            },
            matchingCourse.id,
            matchingClass.id,
            4
          );
          imported++;
        }
      }
    });

    setImportedSuccessCount(imported);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Super Administração & Gestão Geral
            </span>
            <span className="text-xs text-slate-400">Think Green Control Plane</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Painel Geral de Controle & Regras de Negócio
          </h1>
          <p className="text-xs text-slate-500">
            Configure travas de liberação acadêmica, audite logs de transações e migre planilhas.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="px-3.5 py-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar Dados de Demonstração
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuários"
          value={state.users.length}
          subtitle="Alunos, Docentes e Gestores"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Regras Automáticas"
          value="3 Gates Ativos"
          subtitle="Travas financeiras/acadêmicas"
          icon={ShieldAlert}
          color="emerald"
          onClick={() => setCurrentTab('admin_rules')}
        />
        <StatCard
          title="Logs de Auditoria"
          value={state.auditLogs.length}
          subtitle="Ações rastreadas no sistema"
          icon={FileText}
          color="amber"
          onClick={() => setCurrentTab('admin_audit')}
        />
        <StatCard
          title="Migração de Dados"
          value="Google Sheets / CSV"
          subtitle="Importador operacional"
          icon={Database}
          color="sky"
          onClick={() => setCurrentTab('admin_importer')}
        />
      </div>

      {/* TAB: REGRAS DE NEGÓCIO & GATES */}
      {(currentTab === 'admin_home' || currentTab === 'admin_rules' || !currentTab) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-700" />
                Regras de Negócio & Travas Automáticas (Gates)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina o comportamento do sistema quando um aluno possuir parcelas pendentes ou em atraso.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Motor de Travas:</span>
              <button
                onClick={() => handleToggleMasterGate('enableAutomaticExamGates')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  settings.enableAutomaticExamGates
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
              >
                {settings.enableAutomaticExamGates ? 'Ativo Globalmente' : 'Desativado'}
              </button>
            </div>
          </div>

          {rulesSaved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Regras atualizadas em tempo real em todos os portais, AVA e pontos de acesso!
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Rule 1 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-700" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Regra 1: Acesso à Sala de Aula / Campo Exige 1ª Parcela (Matrícula)
                  </h4>
                </div>
                <p className="text-slate-500 mt-1">
                  Impede a entrada no ambiente pedagógico e sinaliza no diário do professor caso a primeira mensalidade de inscrição não esteja paga.
                </p>
              </div>

              <button
                onClick={() => handleToggleRule('rule1_classroomRequiresFirstPayment')}
                className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                  settings.rulesConfig?.rule1_classroomRequiresFirstPayment
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {settings.rulesConfig?.rule1_classroomRequiresFirstPayment ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>

            {/* Rule 2 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Regra 2: Bloqueio de 1ª Avaliação / Prova Intermediária (Exige 2ª Parcela)
                  </h4>
                </div>
                <p className="text-slate-500 mt-1">
                  Exibe mensagem clara no Portal do Aluno com instruções para regularização e desbloqueio instantâneo após confirmação na tesouraria.
                </p>
              </div>

              <button
                onClick={() => handleToggleRule('rule2_exam1RequiresSecondPayment')}
                className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                  settings.rulesConfig?.rule2_exam1RequiresSecondPayment
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {settings.rulesConfig?.rule2_exam1RequiresSecondPayment ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>

            {/* Rule 3 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Regra 3: Bloqueio de Prova Final e Emissão de Certificados (Exige Quitação Integral)
                  </h4>
                </div>
                <p className="text-slate-500 mt-1">
                  Exige que todas as parcelas do curso estejam 100% quitadas para acesso ao exame de encerramento do módulo.
                </p>
              </div>

              <button
                onClick={() => handleToggleRule('rule3_finalExamRequiresFullPayment')}
                className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                  settings.rulesConfig?.rule3_finalExamRequiresFullPayment
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {settings.rulesConfig?.rule3_finalExamRequiresFullPayment ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDITORIA & LOGS */}
      {currentTab === 'admin_audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Trilha de Auditoria & Logs do Sistema
              </h2>
              <p className="text-xs text-slate-500">
                Registro imutável de todas as operações críticas realizadas no Think Green.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Ação Realizada</th>
                  <th className="px-4 py-3">Módulo / Entidade</th>
                  <th className="px-4 py-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.userName}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {log.module} • {log.entityType}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px] truncate max-w-md">
                      {log.details || JSON.stringify(log.newValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: IMPORTADOR DE PLANILHAS */}
      {currentTab === 'admin_importer' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              Importador & Migração de Planilhas (Google Sheets / Excel)
            </h2>
            <p className="text-xs text-slate-500">
              Cole as linhas da sua planilha para criar alunos, gerar IDs Student (STU00000) e lançar matrículas automaticamente.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block font-bold text-slate-700">
              Cole aqui os dados tabulares (Colunas: Nome, Telefone, Curso, Cidade):
            </label>
            <textarea
              rows={6}
              value={rawSheetData}
              onChange={(e) => setRawSheetData(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />

            {importedSuccessCount !== null && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Sucesso! {importedSuccessCount} novos alunos e matrículas integrados no sistema!
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleProcessImport}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-4 h-4" /> Processar & Migrar Linhas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restaurar Dados */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Restaurar Dados de Demonstração"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Tem certeza de que deseja restaurar todos os dados para o padrão inicial do Think Green Community Center? Todas as alterações salvas localmente serão redefinidas.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                resetToDefaultData();
                setIsResetModalOpen(false);
              }}
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

