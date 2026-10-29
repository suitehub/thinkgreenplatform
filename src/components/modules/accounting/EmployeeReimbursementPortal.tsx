import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Camera,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Tag,
  Paperclip,
  Check,
  Eye,
  X,
  Sparkles,
  Smartphone,
  Download,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StaffExpenseReport, ExpenseReportLineItem, ExpenseCategory, AccountingExpenseItem, ExpenseBudget } from '../../../types';
import {
  OFFICIAL_BUDGET_CATEGORIES,
  getStoredExpenseReports,
  saveStoredExpenseReports,
  getStoredAccountingExpenses,
  saveStoredAccountingExpenses,
  formatDateToDDMMYYYY,
} from './accountingData';
import { formatCurrency } from '../../../lib/storage';

interface EmployeeReimbursementPortalProps {
  onBack?: () => void;
  standalone?: boolean;
}

export const EmployeeReimbursementPortal: React.FC<EmployeeReimbursementPortalProps> = ({
  onBack,
  standalone = false,
}) => {
  const { currentUser } = useApp();

  const [reports, setReports] = useState<StaffExpenseReport[]>(() => getStoredExpenseReports());

  // Form State matching Expense_Report_Template_6710de3e.pdf
  const [fullName, setFullName] = useState(currentUser.name || '');
  const [event, setEvent] = useState('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [signatureName, setSignatureName] = useState(currentUser.name || '');

  // Line Items
  const [items, setItems] = useState<ExpenseReportLineItem[]>([
    {
      id: `item_${Date.now()}_1`,
      category: 'Expenses and additional costs (General)',
      description: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
    },
  ]);

  // Receipt Photo Upload
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Selected report for detail modal
  const [selectedReportForView, setSelectedReportForView] = useState<StaffExpenseReport | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // User's own reports
  const userReports = reports.filter(
    (r) => r.userId === currentUser.id || r.fullName.toLowerCase().includes(currentUser.name.toLowerCase())
  );

  // Calculate live total
  const totalAmount = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length + 1}`,
        category: 'Expenses and additional costs (General)',
        description: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast('O relatório precisa conter pelo menos um item de despesa.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ExpenseReportLineItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPhotoUrl(reader.result as string);
        showToast('Foto do comprovante anexada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('Informe seu nome completo.');
      return;
    }
    if (!event.trim()) {
      alert('Informe o evento ou projeto a que se referem os gastos.');
      return;
    }
    if (items.some((it) => !it.description.trim() || it.amount <= 0)) {
      alert('Preencha a descrição e um valor válido (> 0) para todos os itens da lista.');
      return;
    }

    const newReport: StaffExpenseReport = {
      id: `rep_${Date.now()}`,
      reportCode: `EXP-2026-${String(reports.length + 1).padStart(3, '0')}`,
      userId: currentUser.id,
      fullName,
      userEmail: currentUser.email,
      event,
      date: reportDate,
      items,
      totalAmount,
      receiptPhotoUrl: receiptPhotoUrl || undefined,
      signatureName: signatureName || fullName,
      status: 'PENDENTE',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const updated = [newReport, ...reports];
    setReports(updated);
    saveStoredExpenseReports(updated);

    // Reset Form
    setEvent('');
    setReceiptPhotoUrl(null);
    setItems([
      {
        id: `item_${Date.now()}_1`,
        category: 'Expenses and additional costs (General)',
        description: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
      },
    ]);

    showToast(`Relatório ${newReport.reportCode} enviado para a Contabilidade como Pendente de Análise!`);
  };

  const handleApproveFromPortal = (report: StaffExpenseReport) => {
    const currentExpenses = getStoredAccountingExpenses();
    const nextReceiptStart =
      currentExpenses.length > 0
        ? Math.max(...currentExpenses.map((e) => (typeof e.receiptNumber === 'number' ? e.receiptNumber : 0))) + 1
        : 1;
    const generatedReceiptNumbers: number[] = [];
    const newExpenseEntries: AccountingExpenseItem[] = [];

    report.items.forEach((item, index) => {
      const receiptNo = nextReceiptStart + index;
      generatedReceiptNumbers.push(receiptNo);

      let budget: ExpenseBudget = 'General';
      const catLower = (item.category || '').toLowerCase();
      if (catLower.includes('preschool')) budget = 'Preschool';
      else if (catLower.includes('recycle') || catLower.includes('loader')) budget = 'Recycle';
      else if (
        catLower.includes('english') ||
        catLower.includes('community') ||
        catLower.includes('soccer')
      )
        budget = 'Community';
      else if (catLower.includes('outreach')) budget = 'Outreach';

      newExpenseEntries.push({
        id: `exp_rep_${report.id}_${item.id}`,
        receiptNumber: receiptNo,
        date: formatDateToDDMMYYYY(item.date || report.date),
        product: `${item.description} (Reembolso: ${report.fullName})`,
        price: Number(item.amount),
        budget,
        category: item.category,
        paidTo: report.fullName,
        sourceReportId: report.id,
        receiptPhotoUrl: report.receiptPhotoUrl,
        notes: `Aprovado a partir do Relatório ${report.reportCode} (${report.event})`,
        createdAt: new Date().toISOString(),
      });
    });

    const updatedExpenses = [...currentExpenses, ...newExpenseEntries];
    saveStoredAccountingExpenses(updatedExpenses);

    const updatedReports = reports.map((r) =>
      r.id === report.id
        ? {
            ...r,
            status: 'APROVADO' as const,
            reviewedBy: `${currentUser.name} (Contabilidade)`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewNotes: `Reembolso aprovado e lançado na planilha oficial de gastos (Recibos #${generatedReceiptNumbers.join(', #')}).`,
            assignedExpenseReceipts: generatedReceiptNumbers,
          }
        : r
    );
    setReports(updatedReports);
    saveStoredExpenseReports(updatedReports);
    setSelectedReportForView(null);
    showToast(
      `Reembolso ${report.reportCode} APROVADO! ${generatedReceiptNumbers.length} despesa(s) inserida(s) direto na planilha oficial de gastos (#${generatedReceiptNumbers.join(', #')}).`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#075e38] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner (PWA / Mobile Style Header) */}
      <div className="bg-gradient-to-r from-[#075e38] via-[#065432] to-[#043d24] text-white p-6 sm:p-7 rounded-3xl shadow-md border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white mb-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Sistema</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100">
              Formulário Oficial de Gastos
            </span>
            <span className="text-xs text-emerald-200 font-semibold flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              Portal do Funcionário & Voluntário
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Solicitação de Reembolso (Expense Report)
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
            Preencha seus gastos com produtos, materiais ou transporte. Ao enviar, sua solicitação vai direto para a fila de análise da <strong>Contabilidade (Rony)</strong>.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20 text-center min-w-[130px] flex-shrink-0">
          <span className="text-[10px] font-bold text-emerald-200 uppercase block">Meus Relatórios</span>
          <span className="text-xl font-black text-white">{userReports.length}</span>
          <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">
            {userReports.filter((r) => r.status === 'PENDENTE').length} pendentes
          </span>
        </div>
      </div>

      {/* Main Expense Report Form (Modeled after Expense_Report_Template_6710de3e.pdf) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Form Title Bar */}
        <div className="bg-[#bbf7d0]/40 p-5 sm:p-6 border-b border-emerald-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#075e38] text-white flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Novo Relatório de Despesas (Expense Report)
              </h2>
              <p className="text-xs text-slate-600">
                Referência direta do modelo padrão Think Green Community Center
              </p>
            </div>
          </div>

          <span className="text-[11px] font-extrabold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
            Moeda Oficial: EGP (Libras Egípcias)
          </span>
        </div>

        <form onSubmit={handleSubmitReport} className="p-6 sm:p-8 space-y-6">
          {/* Header Fields: Full Name, Event, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase">
                Nome Completo (Full Name) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#075e38]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase">
                Evento / Finalidade (Event) *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="Ex: Acolhimento de Voluntários, Materiais Pré-Escola..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#075e38]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase">
                Data do Relatório (Date) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#075e38]"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table (Matching PDF: Category, Description, Date, Amount) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wide">
                Itens de Gastos Detalhados (Planilha de Itens)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075e38] rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Outro Item / Linha</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#bbf7d0]/60 text-emerald-950 font-black uppercase text-[11px] border-b border-emerald-200">
                    <th className="py-2.5 px-3 w-56">Categoria (Category)</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Descrição do Produto/Serviço</th>
                    <th className="py-2.5 px-3 w-36">Data (Date)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Valor (Amount EGP)</th>
                    <th className="py-2.5 px-2 w-12 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(item.id, 'category', e.target.value as ExpenseCategory)
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#075e38]"
                        >
                          {OFFICIAL_BUDGET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2.5">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Ex: Transporte Van, Livros de Inglês, Lanche..."
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#075e38]"
                        />
                      </td>

                      <td className="p-2.5">
                        <input
                          type="date"
                          required
                          value={item.date}
                          onChange={(e) => handleItemChange(item.id, 'date', e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#075e38]"
                        />
                      </td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={item.amount || ''}
                          onChange={(e) =>
                            handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 text-right focus:outline-hidden focus:border-[#075e38]"
                        />
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover linha"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs">
                      TOTAL (EGP):
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#075e38]">
                      {formatCurrency(totalAmount, 'EGP')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Receipt Photo Upload & Signature Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Foto do Comprovante (Câmera ou Upload de Arquivo) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-black text-slate-800 uppercase flex items-center justify-between">
                <span>Foto do Comprovante (Nota / Recibo)</span>
                <span className="text-[10px] font-medium text-slate-400 lowercase italic">
                  (recomendado se tiver)
                </span>
              </label>

              {receiptPhotoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-900">
                    <img
                      src={receiptPhotoUrl}
                      alt="Comprovante"
                      className="w-full h-44 object-cover object-center"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptPhotoUrl(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors"
                      title="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Comprovante anexado pronto para envio.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500">
                    Tire uma foto direta do comprovante ou selecione um arquivo de imagem da sua galeria:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Tirar Foto */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-[#075e38] flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-emerald-700" />
                      <span>Tirar Foto</span>
                    </button>

                    {/* Upload de Arquivo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span>Upload de Imagem</span>
                    </button>
                  </div>

                  {/* Hidden inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>

            {/* Signature & Payment Received Confirmation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase mb-1">
                  Confirmação / Assinatura (Signature) *
                </label>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                  Ao assinar, você confirma que as despesas acima foram realizadas em benefício dos projetos e atividades do Think Green Community Center.
                </p>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Digite seu nome como assinatura..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#075e38]"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total a Reembolsar</span>
                  <span className="text-base font-black text-[#075e38] font-mono">
                    {formatCurrency(totalAmount, 'EGP')}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span>{items.length} item(ns) na lista</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Ficará registrado como <strong>Pendente</strong> para aprovação pelo Rony na Contabilidade.
            </span>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>ENVIAR FORMULÁRIO DE GASTO PARA O CONTÁBIL</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. MEUS RELATÓRIOS ENVIADOS (HISTÓRICO DO COLABORADOR) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#075e38]" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Histórico de Reembolsos de {fullName || currentUser.name}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {userReports.length} solicitação(ões)
          </span>
        </div>

        {userReports.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Nenhuma solicitação de reembolso enviada por você até o momento.
          </div>
        ) : (
          <div className="space-y-3">
            {userReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {rep.reportCode}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-medium">Data: {rep.date}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 font-bold">{rep.event}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {rep.items.length} item(ns) listado(s) • Total:{' '}
                    <strong className="text-slate-900 font-mono">
                      {formatCurrency(rep.totalAmount, 'EGP')}
                    </strong>
                  </p>
                  {rep.reviewNotes && (
                    <p className="text-[11px] text-purple-900 italic bg-purple-50 p-1.5 rounded-lg border border-purple-100 mt-1">
                      Parecer Contabilidade: "{rep.reviewNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${
                      rep.status === 'APROVADO'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : rep.status === 'REJEITADO'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {rep.status === 'APROVADO' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    {rep.status === 'PENDENTE' && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                    {rep.status === 'REJEITADO' && <AlertCircle className="w-3.5 h-3.5 text-rose-700" />}
                    <span>
                      {rep.status === 'APROVADO'
                        ? 'Aprovado & Pago'
                        : rep.status === 'REJEITADO'
                        ? 'Recusado'
                        : 'Pendente de Análise'}
                    </span>
                  </span>

                  <button
                    onClick={() => setSelectedReportForView(rep)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal View Details of an Expense Report */}
      {selectedReportForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedReportForView.reportCode}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  {selectedReportForView.event}
                </h3>
                <p className="text-xs text-slate-500">
                  Colaborador: <strong>{selectedReportForView.fullName}</strong> • Data:{' '}
                  {selectedReportForView.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase">Itens da Solicitação:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReportForView.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium text-slate-700">{it.category}</td>
                        <td className="p-2.5 text-slate-900 font-bold">{it.description}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{it.date}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(it.amount, 'EGP')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/70 font-black text-emerald-950 border-t border-emerald-200">
                      <td colSpan={3} className="p-2.5 text-right uppercase">
                        TOTAL REQUERIDO:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm">
                        {formatCurrency(selectedReportForView.totalAmount, 'EGP')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Receipt image */}
            {selectedReportForView.receiptPhotoUrl && (
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-700 uppercase">Comprovante Anexado:</span>
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100">
                  <img
                    src={selectedReportForView.receiptPhotoUrl}
                    alt="Comprovante"
                    className="w-full h-56 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Status do Reembolso</span>
                {selectedReportForView.status === 'APROVADO' ? (
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block">
                      APROVADO • Lançado na Planilha Oficial de Gastos
                    </span>
                    {selectedReportForView.assignedExpenseReceipts && (
                      <span className="text-[11px] text-purple-700 font-bold block">
                        Recibos Gerados na Planilha: #{selectedReportForView.assignedExpenseReceipts.join(', #')}
                      </span>
                    )}
                  </div>
                ) : selectedReportForView.status === 'REJEITADO' ? (
                  <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                    REJEITADO
                  </span>
                ) : (
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    PENDENTE (Aguardando Análise Contábil)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedReportForView.status === 'PENDENTE' &&
                  (currentUser.role === 'ACCOUNTING' ||
                    currentUser.role === 'SUPER_ADMIN' ||
                    currentUser.role === 'FINANCE') && (
                    <button
                      onClick={() => handleApproveFromPortal(selectedReportForView)}
                      className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar e Lançar nos Gastos</span>
                    </button>
                  )}

                <button
                  onClick={() => setSelectedReportForView(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
