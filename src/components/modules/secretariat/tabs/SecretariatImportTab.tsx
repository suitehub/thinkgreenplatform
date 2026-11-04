import React, { useState } from 'react';
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  Info,
  Layers,
  Users,
  RefreshCw,
  Sparkles,
  Calendar,
  Phone,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';
import {
  parseOfficialSpreadsheet,
  OFFICIAL_SPREADSHEET_SAMPLE,
  ACADEMIC_MONTHS_MAP,
  ParsedSpreadsheetStudent,
} from '../../../../lib/spreadsheetParser';

export const SecretariatImportTab: React.FC = () => {
  const { state, importStudentsBatch } = useApp();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSpreadsheetStudent[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(state.courses[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(state.classes[0]?.id || '');
  const [importResult, setImportResult] = useState<{
    count: number;
    totalAmount: number;
    timestamp: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLoadSample = () => {
    setRawText(OFFICIAL_SPREADSHEET_SAMPLE);
    const parsed = parseOfficialSpreadsheet(OFFICIAL_SPREADSHEET_SAMPLE, selectedCourseId, selectedClassId);
    setParsedRows(parsed);
    setImportResult(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    const parsed = parseOfficialSpreadsheet(text, selectedCourseId, selectedClassId);
    setParsedRows(parsed);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const totalPaid = parsedRows.reduce((acc, curr) => acc + curr.computedTotalPaid, 0);
      const importedCount = importStudentsBatch(parsedRows);
      setIsProcessing(false);
      setImportResult({
        count: importedCount,
        totalAmount: totalPaid,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      setRawText('');
      setParsedRows([]);
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

  const totalImportPaid = parsedRows.reduce((acc, curr) => acc + curr.computedTotalPaid, 0);
  const totalImportPending = parsedRows.reduce((acc, curr) => acc + curr.totalPendingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Secretaria • Ordem Oficial de Planilha
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              11 Meses Acadêmicos (Agu → July)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Importador de Planilha do Centro Comunitário
          </h2>
          <p className="text-xs text-slate-500">
            Estrutura configurada para ler: <span className="font-mono font-semibold text-slate-700">STUDENT ID, NAME, LEVEL, TELEPHONE, START DATE, AGE, [Mensalidades Agu..July], Total</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Baixar modelo compatível com Excel e Google Sheets"
          >
            <Download className="w-4 h-4" /> Baixar Modelo TSV
          </button>
          <button
            onClick={handleLoadSample}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> Exemplo Pronto
          </button>
        </div>
      </div>

      {/* Official Column Sequence Visual Legend */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Ordem Exata das Colunas da Planilha
          </span>
          <span className="text-[10px] text-slate-400 font-mono">18 Colunas Mapeadas</span>
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-700" /> Preservação de STU ID
          </span>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Se a planilha já contiver códigos (ex: <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-950 font-bold">STU00001</code>), eles são mantidos. Se vazios, novos códigos são gerados sequencialmente.
          </p>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" /> 11 Mensalidades & Recibos
          </span>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Valores preenchidos em cada mês geram recibos automáticos para a Tesouraria e lançamentos de Receita no Contábil.
          </p>
        </div>

        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-sky-700" /> Acesso Automático ao Portal
          </span>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            Cria as contas de login de estudante para acesso imediato ao ambiente AVA e consulta de boletins.
          </p>
        </div>
      </div>

      {/* Import Result Banner */}
      {importResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                Importação Concluída com Sucesso!
              </h4>
              <p className="text-xs text-emerald-800">
                {importResult.count} alunos foram cadastrados, receberam os 11 meses de carnê e {importResult.totalAmount.toLocaleString()} EGP foram conciliados em recibos.
              </p>
            </div>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Configuration & Input Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Optional Defaults for Course and Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Curso Padrão (se não identificado pelo Nível):</label>
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
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-700" />
              Cole as linhas da sua Planilha (Google Sheets / Excel / CSV)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {parsedRows.length} linha(s) reconhecida(s)
            </span>
          </div>

          <textarea
            rows={7}
            value={rawText}
            onChange={handleTextChange}
            placeholder={`Cole aqui as linhas copiadas da sua planilha do Excel ou Google Sheets...\nExemplo:\nSTU00001\tAmira Hassan\tLevel 1\t+20 10 9876 5432\t01/08/2026\t16\t\t500\t500\t500\t500\t500\t500\t500\t500\t0\t0\t0\t4000`}
            className="w-full p-4 border border-slate-300 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        {/* Live Preview Table of Parsed Rows */}
        {parsedRows.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-xs">
                  Prévia da Importação ({parsedRows.length} alunos detectados):
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-700 font-bold">
                  Total Pago na Carga: {totalImportPaid.toLocaleString()} EGP
                </span>
                <span className="text-amber-700 font-semibold">
                  A Vencer/Pendente: {totalImportPending.toLocaleString()} EGP
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200 text-[10px]">
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
                    <th className="px-3 py-2.5 text-right font-bold text-slate-800">Total (EGP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-purple-700">
                        {row.studentId || <span className="text-slate-400 font-normal italic">Auto-gerar</span>}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">{row.name}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {row.level}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{row.phone}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{row.startDate}</td>
                      <td className="px-3 py-2 text-slate-600 text-center">{row.age ? `${row.age} anos` : '—'}</td>

                      {/* Month badges */}
                      {row.months.map((m) => (
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
                        {row.computedTotalPaid} EGP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setParsedRows([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Limpar Dados
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processando Carga...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Importar {parsedRows.length} Aluno(s) com 11 Meses de Carnê
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
