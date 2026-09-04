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
} from 'lucide-react';
import { useApp } from '../../../../context/AppContext';

export const SecretariatImportTab: React.FC = () => {
  const { importStudentsBatch } = useApp();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{ count: number; timestamp: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample spreadsheet text for 1-click test
  const sampleCSV = `Nome,Telefone,Email,Cidade,StatusPagamento
Youssef Mansour,+20 10 9876 5432,youssef.m@thinkgreen.org,Cairo,PAGO
Mariam Adel,+20 12 1122 3344,mariam.a@thinkgreen.org,Giza,PENDENTE
Omar Sherif,+20 11 4455 6677,omar.s@thinkgreen.org,Alexandria,PAGO
Nour Ezzat,+20 10 7788 9900,nour.e@thinkgreen.org,Cairo,PENDENTE`;

  const handleLoadSample = () => {
    setRawText(sampleCSV);
    parseCSV(sampleCSV);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      const rowObj: any = {};
      parts.forEach((val, idx) => {
        const header = headers[idx] || `col_${idx}`;
        if (header.includes('nome')) rowObj.name = val;
        else if (header.includes('tel') || header.includes('fone')) rowObj.phone = val;
        else if (header.includes('email') || header.includes('e-mail')) rowObj.email = val;
        else if (header.includes('cidade')) rowObj.city = val;
        else if (header.includes('pag') || header.includes('status'))
          rowObj.paid = val.toUpperCase() === 'PAGO' || val.toUpperCase() === 'PAID';
        else rowObj[header] = val;
      });
      return rowObj;
    });

    setParsedRows(rows.filter((r) => r.name));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
    parseCSV(e.target.value);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      const importedCount = importStudentsBatch(parsedRows);
      setIsProcessing(false);
      setImportResult({
        count: importedCount,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      setRawText('');
      setParsedRows([]);
    }, 600);
  };

  const handleDownloadTemplate = () => {
    const templateContent = 'Nome,Telefone,Email,Cidade,StatusPagamento\nNome do Aluno,+20 10 0000 0000,aluno@email.com,Cairo,PAGO\n';
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_alunos_thinkgreen.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Secretaria • Migração & Carga em Lote
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Importador de Planilhas (CSV / Excel / Google Sheets)
          </h2>
          <p className="text-xs text-slate-500">
            Importação em lote de alunos com geração automática e sequencial de IDs permanentes (STU00000).
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Baixar Modelo CSV
        </button>
      </div>

      {/* Instructions & Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-700" /> STU ID Automático
          </span>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Cada aluno importado recebe imediatamente seu ID de Aluno único no padrão oficial do Centro.
          </p>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" /> Matrícula & Financeiro
          </span>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            O sistema gera a matrícula ativa e o plano financeiro correspondente para cobrança no balcão.
          </p>
        </div>

        <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-sky-700" /> Acesso ao Portal & AVA
          </span>
          <p className="text-[11px] text-sky-800 leading-relaxed">
            Cria as credenciais de login para que o aluno acerte dados e visualize notas e diário de classe.
          </p>
        </div>
      </div>

      {/* Import Result Box */}
      {importResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                Importação Concluída com Sucesso!
              </h4>
              <p className="text-xs text-emerald-800">
                {importResult.count} alunos foram cadastrados, receberam ID Student e já estão integrados à Secretaria e ao Financeiro.
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

      {/* Main Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-purple-700" />
              Cole os dados da sua Planilha (CSV ou colunas separadas por vírgula)
            </h3>
            <p className="text-xs text-slate-500">
              Formatos aceitos: Nome, Telefone, Email, Cidade, StatusPagamento
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 cursor-pointer"
          >
            Preencher com Dados de Teste
          </button>
        </div>

        <div>
          <textarea
            rows={7}
            value={rawText}
            onChange={handleTextChange}
            placeholder={`Nome,Telefone,Email,Cidade,StatusPagamento\nAhmed Mohamed,+20 10 1234 5678,ahmed@thinkgreen.org,Cairo,PAGO\nFatima Ali,+20 12 8765 4321,fatima@thinkgreen.org,Giza,PENDENTE`}
            className="w-full p-4 border border-slate-300 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>

        {/* Live Preview Table of Parsed Rows */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Prévia da Importação ({parsedRows.length} alunos identificados):
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Nome do Aluno</th>
                    <th className="px-3 py-2">Telefone</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Cidade</th>
                    <th className="px-3 py-2">1ª Mensalidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{row.name}</td>
                      <td className="px-3 py-2 text-slate-600 font-mono">{row.phone || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{row.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{row.city || 'Cairo'}</td>
                      <td className="px-3 py-2">
                        {row.paid ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            PAGA
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            PENDENTE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Importar {parsedRows.length} Alunos Agora
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
