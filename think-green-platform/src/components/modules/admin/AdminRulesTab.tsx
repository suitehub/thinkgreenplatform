import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  Sliders,
  HelpCircle,
  Play,
  GraduationCap,
  BookOpen,
  Award,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SystemSettings } from '../../../types';

export const AdminRulesTab: React.FC = () => {
  const { state, updateSettings, checkExamAccess, checkClassroomAccess } = useApp();

  const [savedFeedback, setSavedFeedback] = useState(false);

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

  // Academic criteria state
  const [minGrade, setMinGrade] = useState<number>(settings.minimumPassingGrade || 60);
  const [minAttendance, setMinAttendance] = useState<number>(settings.attendanceRequirementPercent || 75);

  // Simulator state
  const [simulatorStudentId, setSimulatorStudentId] = useState<string>(
    state.students[0]?.studentId || ''
  );
  const [simulatorAssessmentId, setSimulatorAssessmentId] = useState<string>(
    state.assessments[0]?.id || ''
  );
  const [simulatorClassId, setSimulatorClassId] = useState<string>(
    state.classes[0]?.id || ''
  );
  const [simulatorExamResult, setSimulatorExamResult] = useState<{
    allowed: boolean;
    reason?: string;
    requiredStage?: string;
    isFinancialBlock?: boolean;
  } | null>(null);
  const [simulatorClassResult, setSimulatorClassResult] = useState<{
    allowed: boolean;
    reason?: string;
    isFinancialBlock?: boolean;
    overdueCount?: number;
    unpaidInstallments?: number[];
  } | null>(null);

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
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleToggleMasterGate = (key: 'enableAutomaticExamGates' | 'enableAutomaticClassroomGates') => {
    updateSettings({
      [key]: !settings[key],
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleSaveAcademicCriteria = () => {
    updateSettings({
      minimumPassingGrade: Number(minGrade),
      attendanceRequirementPercent: Number(minAttendance),
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleRunSimulation = () => {
    if (!simulatorStudentId) return;

    // Check Exam Gate
    const selectedAssessment = state.assessments.find((a) => a.id === simulatorAssessmentId) || state.assessments[0];
    if (selectedAssessment) {
      const examRes = checkExamAccess(simulatorStudentId, selectedAssessment);
      setSimulatorExamResult(examRes);
    }

    // Check Classroom Gate
    const selectedClass = state.classes.find((c) => c.id === simulatorClassId) || state.classes[0];
    if (selectedClass) {
      const classRes = checkClassroomAccess(simulatorStudentId, selectedClass.id);
      setSimulatorClassResult(classRes);
    }
  };

  const selectedStudentObj = state.students.find((s) => s.studentId === simulatorStudentId);
  const studentEnrollments = state.enrollments.filter((e) => e.studentId === simulatorStudentId);
  const studentCharges = state.charges.filter((c) => c.studentId === simulatorStudentId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-700" />
            Motor de Regras de Negócio & Travas Automáticas (Gates)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure as travas de liberação acadêmica por adimplência financeira e teste em tempo real.
          </p>
        </div>

        {savedFeedback && (
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Regras atualizadas em todos os portais!
          </div>
        )}
      </div>

      {/* Master Gate Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Gate Financeiro de Provas</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Bloqueio Automático em Avaliações (AVA)</h4>
            <p className="text-xs text-slate-500 mt-1">
              Impede que alunos com mensalidades pendentes realizem Prova 1 ou Prova Final no portal do aluno.
            </p>
          </div>

          <button
            onClick={() => handleToggleMasterGate('enableAutomaticExamGates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              settings.enableAutomaticExamGates
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {settings.enableAutomaticExamGates ? 'LIGADO' : 'DESLIGADO'}
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gate de Frequência & Acesso</span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">Bloqueio de Entrada em Sala / Presença</h4>
            <p className="text-xs text-slate-500 mt-1">
              Sinaliza alerta no diário do professor e bloqueia materiais didáticos caso a 1ª parcela não esteja quitada.
            </p>
          </div>

          <button
            onClick={() => handleToggleMasterGate('enableAutomaticClassroomGates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              settings.enableAutomaticClassroomGates
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {settings.enableAutomaticClassroomGates ? 'LIGADO' : 'DESLIGADO'}
          </button>
        </div>
      </div>

      {/* The 3 Core Rules Configuration */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-purple-600" />
          Configuração Individual das 3 Regras Estratégicas
        </h3>

        <div className="space-y-3.5 text-xs">
          {/* Rule 1 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Regra 1: Acesso à Sala de Aula / Campo Exige 1ª Parcela (Matrícula)
                </h4>
              </div>
              <p className="text-slate-600">
                Alunos recém-cadastrados necessitam ter o pagamento da primeira parcela (ou taxa de inscrição) quitado na tesouraria para constar como liberados na lista de chamada do docente.
              </p>
            </div>

            <button
              onClick={() => handleToggleRule('rule1_classroomRequiresFirstPayment')}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer ${
                settings.rulesConfig?.rule1_classroomRequiresFirstPayment
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.rulesConfig?.rule1_classroomRequiresFirstPayment ? 'ATIVADA' : 'DESATIVADA'}
            </button>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Regra 2: Bloqueio de 1ª Avaliação / Prova Intermediária (Exige 2ª Parcela)
                </h4>
              </div>
              <p className="text-slate-600">
                Ao chegar no meio do curso (Prova 1), o aluno só consegue abrir o teste caso a 2ª mensalidade esteja confirmada no sistema financeiro. Exibe instruções para regularização imediata.
              </p>
            </div>

            <button
              onClick={() => handleToggleRule('rule2_exam1RequiresSecondPayment')}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer ${
                settings.rulesConfig?.rule2_exam1RequiresSecondPayment
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.rulesConfig?.rule2_exam1RequiresSecondPayment ? 'ATIVADA' : 'DESATIVADA'}
            </button>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Regra 3: Bloqueio de Prova Final e Emissão de Certificados (Exige Quitação Integral)
                </h4>
              </div>
              <p className="text-slate-600">
                Exige que 100% das parcelas da matrícula (ex: 4 parcelas) estejam integralmente quitadas antes de liberar a Prova Final do curso e a impressão do certificado oficial de conclusão.
              </p>
            </div>

            <button
              onClick={() => handleToggleRule('rule3_finalExamRequiresFullPayment')}
              className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 self-start sm:self-center cursor-pointer ${
                settings.rulesConfig?.rule3_finalExamRequiresFullPayment
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings.rulesConfig?.rule3_finalExamRequiresFullPayment ? 'ATIVADA' : 'DESATIVADA'}
            </button>
          </div>
        </div>
      </div>

      {/* Academic Thresholds Config */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-4 h-4 text-emerald-600" />
          Critérios Acadêmicos de Aprovação & Frequência
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Média Mínima para Aprovação (0 a 100 pontos):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={minGrade}
                onChange={(e) => setMinGrade(Number(e.target.value))}
                className="w-32 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-slate-500">pontos mínimos exigidos</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Frequência Mínima Exigida para Certificado (%):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={minAttendance}
                onChange={(e) => setMinAttendance(Number(e.target.value))}
                className="w-32 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-slate-500">% de presença nas aulas</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAcademicCriteria}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
          >
            Salvar Critérios Acadêmicos
          </button>
        </div>
      </div>

      {/* Live Interactive Rule Simulator / Gate Tester */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-700" />
              Simulador Interativo do Motor de Travas (Gate Tester)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione um aluno e simule instantaneamente o comportamento das travas financeiras e acadêmicas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Select Student */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">1. Selecione o Aluno:</label>
            <select
              value={simulatorStudentId}
              onChange={(e) => {
                setSimulatorStudentId(e.target.value);
                setSimulatorExamResult(null);
                setSimulatorClassResult(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.students.map((s) => (
                <option key={s.id} value={s.studentId}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Select Assessment */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">2. Selecione a Avaliação:</label>
            <select
              value={simulatorAssessmentId}
              onChange={(e) => {
                setSimulatorAssessmentId(e.target.value);
                setSimulatorExamResult(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Select Class */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">3. Selecione a Turma:</label>
            <select
              value={simulatorClassId}
              onChange={(e) => {
                setSimulatorClassId(e.target.value);
                setSimulatorClassResult(null);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunSimulation}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Executar Simulação de Gates
          </button>
        </div>

        {/* Simulation Output */}
        {(simulatorExamResult || simulatorClassResult) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in text-xs">
            {/* Exam Gate Verdict */}
            {simulatorExamResult && (
              <div
                className={`p-4 rounded-2xl border ${
                  simulatorExamResult.allowed
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {simulatorExamResult.allowed ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Avaliação: LIBERADA PARA REALIZAÇÃO
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-rose-600" />
                      Avaliação: BLOQUEADA POR REGRA DE NEGÓCIO
                    </>
                  )}
                </div>
                <p className="text-[11px] mt-1">
                  {simulatorExamResult.reason || 'Aluno cumpre todos os requisitos financeiros para esta avaliação.'}
                </p>
                {simulatorExamResult.requiredStage && (
                  <p className="text-[10px] font-mono mt-2 font-bold text-slate-600">
                    Estágio Exigido: {simulatorExamResult.requiredStage}
                  </p>
                )}
              </div>
            )}

            {/* Classroom Access Verdict */}
            {simulatorClassResult && (
              <div
                className={`p-4 rounded-2xl border ${
                  simulatorClassResult.allowed
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {simulatorClassResult.allowed ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Sala de Aula: ACESSO PERMITIDO
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Sala de Aula: PENDÊNCIA IDENTIFICADA
                    </>
                  )}
                </div>
                <p className="text-[11px] mt-1">
                  {simulatorClassResult.reason || 'Aluno regular com a primeira parcela da matrícula.'}
                </p>
                {simulatorClassResult.unpaidInstallments && simulatorClassResult.unpaidInstallments.length > 0 && (
                  <p className="text-[10px] font-mono mt-2 font-bold text-slate-600">
                    Parcelas em Aberto: {simulatorClassResult.unpaidInstallments.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
