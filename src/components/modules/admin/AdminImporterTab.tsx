import React, { useState } from 'react';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  Download,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  parseOfficialSpreadsheet,
  OFFICIAL_SPREADSHEET_SAMPLE,
  ACADEMIC_MONTHS_MAP,
  ParsedSpreadsheetStudent,
} from '../../../lib/spreadsheetParser';

interface AdminImporterTabProps {
  setCurrentTab: (tab: string) => void;
}

export const AdminImporterTab: React.FC<AdminImporterTabProps> = ({ setCurrentTab }) => {
  const { state, importStudentsBatch } = useApp();

  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedSpreadsheetStudent[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(state.courses[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(state.classes[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    totalAmount: number;
    message: string;
  } | null>(null);

  const handleLoadSample = () => {
    setRawText(OFFICIAL_SPREADSHEET_SAMPLE);
    const parsed = parseOfficialSpreadsheet(OFFICIAL_SPREADSHEET_SAMPLE, selectedCourseId, selectedClassId);
    setParsedPreview(parsed);
    setImportResult(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    const parsed = parseOfficialSpreadsheet(text, selectedCourseId, selectedClassId);
    setParsedPreview(parsed);
  };

  const handleExecuteImport = () => {
    if (parsedPreview.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const totalPaid = parsedPreview.reduce((acc, curr) => acc + curr.computedTotalPaid, 0);
        const count = importStudentsBatch(parsedPreview);
        setIsProcessing(false);
        setImportResult({
          success: true,
          count,
          totalAmount: totalPaid,
          message: `${count} alunos importados com sucesso com STU IDs preservados/gerados, carnês de 11 mensalidades e ${totalPaid.toLocaleString()} EGP integrados à Tesouraria!`,
        });
        setRawText('');
        setParsedPreview([]);
      } catch (err: any) {
        setIsProcessing(false);
        setImportResult({
          success: false,
          count: 0,
          totalAmount: 0,
          message: `Erro durante a importação: ${err?.message || 'Verifique o formato das colunas'}`,
        });
      }
    }, 600);
  };

  const handleDownloadTemplate = () => {
    const headerLine = 'STUDENT ID\tNAME\tLEVEL\tTELEPHONE\tSTART DATE\tAGE\t\tAgu\tSet\tOct\tNov\tD/J\tFeb\tMar\tApr\tMay\tJun\tJuly\tTotal\n';
    const sampleLine = 'STU00001\tAmira Hassan\tLevel 1\t+20 10 9876 5432\t01/08/2026\t16\t\t500\t500\t500\t500\t500\t500\t500\t500\t0\t0\t0\t4000\n';
    const content = headerLine + sampleLine;
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_planilha_think_green.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalImportPaid = parsedPreview.reduce((acc, curr) => acc + curr.computedTotalPaid, 0);
  const totalImportPending = parsedPreview.reduce((acc, curr) => acc + curr.totalPendingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
              Super Admin • Motor de Migração Oficial
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              11 Meses Acadêmicos
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-700" />
            Migração de Planilhas (Google Sheets / Excel / CSV)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ordem oficial: <span className="font-mono text-slate-700 font-semibold">STUDENT ID, NAME, LEVEL, TELEPHONE, START DATE, AGE, [Agu..July], Total</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Modelo TSV
          </button>
          <button
            onClick={handleLoadSample}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Carregar Dados de Teste
          </button>
        </div>
      </div>

      {/* Official Schema Sequence Badge */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Ordem Oficial das Colunas
          </span>
          <span className="text-[10px] text-slate-400 font-mono">18 Colunas Identificadas</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-400/30 shrink-0 font-bold">1. STUDENT ID</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-400/30 shrink-0 font-bold">2. NAME</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 shrink-0">3. LEVEL</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 shrink-0">4. TELEPHONE</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 shrink-0">5. START DATE</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 shrink-0">6. AGE</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded border border-slate-700 shrink-0">7. [Vazio]</span>
          {ACADEMIC_MONTHS_MAP.map((m, idx) => (
            <span key={m.key} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30 shrink-0">
              {idx + 8}. {m.label}
            </span>
          ))}
          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-400/30 shrink-0 font-bold">19. Total</span>
        </div>
      </div>

      {/* Success / Error Banner */}
      {importResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-in fade-in text-xs ${
            importResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {importResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{importResult.message}</span>
          </div>

          {importResult.success && (
            <button
              onClick={() => setCurrentTab('sec_students')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
            >
              Ver Alunos na Secretaria
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Configuration & Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Step 1: Parameters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            1. Destino da Matrícula Automática
          </h3>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Curso Padrão (Fallback):</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.monthlyFee} EGP/mês)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Turma Padrão:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {state.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.schedule})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 text-purple-600" />
              Carnê Automático de 11 Meses
            </p>
            <p className="text-[11px] text-purple-800">
              Cada aluno terá seus 11 meses (Agosto a Julho) devidamente registrados com vencimentos e conciliações financeiras.
            </p>
          </div>
        </div>

        {/* Textarea Input */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">2. Cole os Dados da Planilha</h3>
              <p className="text-[11px] text-slate-500">
                Copie as linhas do Google Sheets / Excel e cole aqui.
              </p>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {parsedPreview.length} linha(s) detectada(s)
            </span>
          </div>

          <textarea
            rows={8}
            placeholder={`Cole aqui as linhas copiadas do Google Sheets ou Excel...\nExemplo:\nSTU00001\tAmira Hassan\tLevel 1\t+20 10 9876 5432\t01/08/2026\t16\t\t500\t500\t500\t500\t500\t500\t500\t500\t0\t0\t0\t4000`}
            value={rawText}
            onChange={handleTextChange}
            className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none flex-1 bg-slate-50/50"
          />

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                setRawText('');
                setParsedPreview([]);
              }}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Limpar Caixa
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={parsedPreview.length === 0 || isProcessing}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs cursor-pointer transition-all"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Importando...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Importar {parsedPreview.length} Aluno(s) com 11 Meses
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {parsedPreview.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              Pré-visualização dos Dados ({parsedPreview.length} alunos)
            </h4>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-700 font-bold">
                Arrecadado: {totalImportPaid.toLocaleString()} EGP
              </span>
              <span className="text-amber-700 font-semibold">
                Pendente: {totalImportPending.toLocaleString()} EGP
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">STUDENT ID</th>
                  <th className="px-3 py-2.5">NAME</th>
                  <th className="px-3 py-2.5">LEVEL</th>
                  <th className="px-3 py-2.5">TELEPHONE</th>
                  <th className="px-3 py-2.5">START DATE</th>
                  <th className="px-3 py-2.5">AGE</th>
                  {ACADEMIC_MONTHS_MAP.map((m) => (
                    <th key={m.key} className="px-2.5 py-2.5 text-center font-mono">
                      {m.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-bold text-slate-800">Total Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedPreview.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-purple-700">
                      {item.studentId || <span className="text-slate-400 font-normal italic">Auto-gerar</span>}
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900">{item.name}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {item.level}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600 text-[11px]">{item.phone}</td>
                    <td className="px-3 py-2 font-mono text-slate-600 text-[11px]">{item.startDate}</td>
                    <td className="px-3 py-2 text-slate-600 text-center">{item.age ? `${item.age} anos` : '—'}</td>

                    {item.months.map((m) => (
                      <td key={m.key} className="px-2 py-2 text-center">
                        {m.isPaid ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono"
                            title={`${m.fullName}: ${m.amount} EGP PAGO`}
                          >
                            {m.amount}
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-400 font-mono"
                            title={`${m.fullName}: Pendente`}
                          >
                            —
                          </span>
                        )}
                      </td>
                    ))}

                    <td className="px-3 py-2 text-right font-bold font-mono text-emerald-800">
                      {item.computedTotalPaid} EGP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
