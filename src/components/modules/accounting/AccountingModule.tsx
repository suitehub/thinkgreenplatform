import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  CreditCard,
  Layers,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Calendar,
  CheckCircle,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Edit3,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Smartphone,
  Save,
  Building,
  Recycle as RecycleIcon,
  BookOpen,
  Paperclip,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  AccountingRevenue,
  AccountingExpenseItem,
  StaffExpenseReport,
  AccountingMacroArea,
  RevenueSubArea,
  ExpenseBudget,
  ExpenseCategory,
  PaymentMethod,
} from '../../../types';
import {
  OFFICIAL_BUDGET_CATEGORIES,
  OFFICIAL_BUDGET_MENUS,
  getStoredAccountingRevenues,
  saveStoredAccountingRevenues,
  getStoredAccountingExpenses,
  saveStoredAccountingExpenses,
  getStoredExpenseReports,
  saveStoredExpenseReports,
  formatDateToDDMMYYYY,
  syncApprovedReportsIntoExpenses,
} from './accountingData';
import { EmployeeReimbursementPortal } from './EmployeeReimbursementPortal';
import { formatCurrency } from '../../../lib/storage';

interface AccountingModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  standalone?: boolean;
}

export type AccountingSubTab = 'visao_geral' | 'recebimentos' | 'gastos' | 'pendencias_reembolso';

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  currentTab,
  setCurrentTab,
  standalone = false,
}) => {
  const { currentUser } = useApp();

  // Internal Navigation Tab
  const [activeSubTab, setActiveSubTab] = useState<AccountingSubTab>('visao_geral');

  // Switch to Employee Reimbursement form view if requested
  const [isEmployeePortalOpen, setIsEmployeePortalOpen] = useState(false);

  // Core Data States
  const [revenues, setRevenues] = useState<AccountingRevenue[]>(() => getStoredAccountingRevenues());
  const [expenses, setExpenses] = useState<AccountingExpenseItem[]>(() => getStoredAccountingExpenses());
  const [expenseReports, setExpenseReports] = useState<StaffExpenseReport[]>(() =>
    getStoredExpenseReports()
  );

  // Recently added / approved receipts to highlight
  const [recentlyAddedReceipts, setRecentlyAddedReceipts] = useState<number[]>([]);
  const [selectedReportDetail, setSelectedReportDetail] = useState<StaffExpenseReport | null>(null);

  // Auto-sync approved reports into expenses on mount
  useEffect(() => {
    const syncResult = syncApprovedReportsIntoExpenses(expenses, expenseReports);
    if (syncResult.hasChanges) {
      setExpenses(syncResult.updatedExpenses);
      saveStoredAccountingExpenses(syncResult.updatedExpenses);
      setExpenseReports(syncResult.updatedReports);
      saveStoredExpenseReports(syncResult.updatedReports);
    }
  }, []);

  // Sync external currentTab with internal activeSubTab
  useEffect(() => {
    if (currentTab === 'acc_revenues') setActiveSubTab('recebimentos');
    else if (currentTab === 'acc_expenses') setActiveSubTab('gastos');
    else if (currentTab === 'acc_reimbursements') setActiveSubTab('pendencias_reembolso');
    else if (currentTab === 'acc_home') setActiveSubTab('visao_geral');
  }, [currentTab]);

  const handleSelectSubTab = (tab: AccountingSubTab) => {
    setActiveSubTab(tab);
    if (tab === 'visao_geral') setCurrentTab('acc_home');
    else if (tab === 'recebimentos') setCurrentTab('acc_revenues');
    else if (tab === 'gastos') setCurrentTab('acc_expenses');
    else if (tab === 'pendencias_reembolso') setCurrentTab('acc_reimbursements');
  };

  // Initial Capital / Cash Balance config (as seen in image_e4c15ee8.png)
  const [initialCapital, setInitialCapital] = useState<number>(300000.0);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapitalInput, setTempCapitalInput] = useState<number>(300000.0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // =========================================================================
  // 1. RECEBIMENTOS (FILTROS & ESTADO)
  // =========================================================================
  const [revMacroFilter, setRevMacroFilter] = useState<'ALL' | AccountingMacroArea>('ALL');
  const [revSubFilter, setRevSubFilter] = useState<'ALL' | RevenueSubArea>('ALL');
  const [revYearFilter, setRevYearFilter] = useState<'ALL' | string>('ALL');
  const [revMonthFilter, setRevMonthFilter] = useState<'ALL' | string>('ALL');
  const [revDayFilter, setRevDayFilter] = useState<string>('');
  const [revSearch, setRevSearch] = useState('');

  // Modal Novo / Editar Recebimento
  const [isRevModalOpen, setIsRevModalOpen] = useState(false);
  const [editingRevId, setEditingRevId] = useState<string | null>(null);
  const [formRevMacro, setFormRevMacro] = useState<AccountingMacroArea>('CENTRO_COMUNITARIO');
  const [formRevSub, setFormRevSub] = useState<RevenueSubArea>('CURSO_INGLES');
  const [formRevTitle, setFormRevTitle] = useState('');
  const [formRevAmount, setFormRevAmount] = useState<number>(2000);
  const [formRevDate, setFormRevDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formRevPayer, setFormRevPayer] = useState('');
  const [formRevInstallment, setFormRevInstallment] = useState('');
  const [formRevMethod, setFormRevMethod] = useState<PaymentMethod>('DINHEIRO');
  const [formRevNotes, setFormRevNotes] = useState('');

  // Quick edit value inline modal
  const [quickEditRev, setQuickEditRev] = useState<AccountingRevenue | null>(null);
  const [quickEditAmount, setQuickEditAmount] = useState<number>(0);

  // Filtered Revenues
  const filteredRevenues = useMemo(() => {
    return revenues.filter((r) => {
      const matchMacro = revMacroFilter === 'ALL' || r.macroArea === revMacroFilter;
      const matchSub = revSubFilter === 'ALL' || r.subArea === revSubFilter;
      const matchYear = revYearFilter === 'ALL' || String(r.year) === revYearFilter;
      const matchMonth = revMonthFilter === 'ALL' || r.month === revMonthFilter;
      const matchDay = !revDayFilter || r.date === revDayFilter;
      const matchSearch =
        !revSearch ||
        r.title.toLowerCase().includes(revSearch.toLowerCase()) ||
        (r.payerName && r.payerName.toLowerCase().includes(revSearch.toLowerCase())) ||
        (r.receiptNumber && r.receiptNumber.toLowerCase().includes(revSearch.toLowerCase())) ||
        (r.installmentsInfo && r.installmentsInfo.toLowerCase().includes(revSearch.toLowerCase()));

      return matchMacro && matchSub && matchYear && matchMonth && matchDay && matchSearch;
    });
  }, [revenues, revMacroFilter, revSubFilter, revYearFilter, revMonthFilter, revDayFilter, revSearch]);

  const totalFilteredRevenues = useMemo(() => {
    return filteredRevenues.reduce((acc, r) => acc + r.amount, 0);
  }, [filteredRevenues]);

  // Totais por Macroárea
  const totalRevLixo = useMemo(
    () => revenues.filter((r) => r.macroArea === 'LIXO').reduce((acc, r) => acc + r.amount, 0),
    [revenues]
  );
  const totalRevPreEscola = useMemo(
    () => revenues.filter((r) => r.macroArea === 'PRE_ESCOLA').reduce((acc, r) => acc + r.amount, 0),
    [revenues]
  );
  const totalRevCentro = useMemo(
    () =>
      revenues.filter((r) => r.macroArea === 'CENTRO_COMUNITARIO').reduce((acc, r) => acc + r.amount, 0),
    [revenues]
  );
  const grandTotalRevenues = totalRevLixo + totalRevPreEscola + totalRevCentro;

  // =========================================================================
  // 2. GASTOS (PLANILHA OFICIAL EXCEL - FILTROS & ESTADO)
  // =========================================================================
  const [expBudgetFilter, setExpBudgetFilter] = useState<'ALL' | ExpenseBudget>('ALL');
  const [expCategoryFilter, setExpCategoryFilter] = useState<'ALL' | string>('ALL');
  const [expSearch, setExpSearch] = useState('');
  const [expMonthFilter, setExpMonthFilter] = useState<'ALL' | string>('ALL');
  const [expOriginFilter, setExpOriginFilter] = useState<'ALL' | 'REIMBURSEMENT' | 'DIRECT'>('ALL');

  // Modal Novo Gasto Manual
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [formExpDate, setFormExpDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [formExpProduct, setFormExpProduct] = useState('');
  const [formExpPrice, setFormExpPrice] = useState<number>(0);
  const [formExpBudget, setFormExpBudget] = useState<ExpenseBudget>('General');
  const [formExpCategory, setFormExpCategory] = useState<ExpenseCategory>(
    'Expenses and additional costs (General)'
  );
  const [formExpNotes, setFormExpNotes] = useState('');

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchBudget = expBudgetFilter === 'ALL' || e.budget === expBudgetFilter;
      const matchCat = expCategoryFilter === 'ALL' || e.category === expCategoryFilter;
      const matchSearch =
        !expSearch ||
        e.product.toLowerCase().includes(expSearch.toLowerCase()) ||
        String(e.receiptNumber).includes(expSearch) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(expSearch.toLowerCase()));

      let matchMonth = true;
      if (expMonthFilter !== 'ALL') {
        const parts = e.date.split('/');
        if (parts.length === 3) {
          matchMonth = parts[1] === expMonthFilter;
        }
      }

      let matchOrigin = true;
      if (expOriginFilter === 'REIMBURSEMENT') {
        matchOrigin = Boolean(e.sourceReportId || e.product.toLowerCase().includes('reembolso'));
      } else if (expOriginFilter === 'DIRECT') {
        matchOrigin = !e.sourceReportId && !e.product.toLowerCase().includes('reembolso');
      }

      return matchBudget && matchCat && matchSearch && matchMonth && matchOrigin;
    });
  }, [expenses, expBudgetFilter, expCategoryFilter, expSearch, expMonthFilter, expOriginFilter]);

  const totalFilteredExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.price, 0);
  }, [filteredExpenses]);

  const grandTotalExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.price, 0);
  }, [expenses]);

  const totalReimbursementsExpenses = useMemo(() => {
    return expenses
      .filter((e) => Boolean(e.sourceReportId || e.product.toLowerCase().includes('reembolso')))
      .reduce((acc, e) => acc + e.price, 0);
  }, [expenses]);

  const countReimbursementsExpenses = useMemo(() => {
    return expenses.filter((e) => Boolean(e.sourceReportId || e.product.toLowerCase().includes('reembolso'))).length;
  }, [expenses]);

  const countDirectExpenses = expenses.length - countReimbursementsExpenses;

  // Aggregation of 28 Budget Categories (like image_813704e7.png right-hand box)
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    OFFICIAL_BUDGET_CATEGORIES.forEach((cat) => {
      totals[cat] = 0;
    });
    expenses.forEach((e) => {
      if (totals[e.category] !== undefined) {
        totals[e.category] += e.price;
      } else {
        totals[e.category] = (totals[e.category] || 0) + e.price;
      }
    });
    return totals;
  }, [expenses]);

  // Net Cash Balance (Image 2 logic)
  const netCashBalance = initialCapital - grandTotalExpenses;

  // =========================================================================
  // 3. PENDÊNCIAS DE REEMBOLSO (EXPENSE REPORTS)
  // =========================================================================
  const pendingReports = useMemo(
    () => expenseReports.filter((r) => r.status === 'PENDENTE'),
    [expenseReports]
  );

  const [selectedReportForReview, setSelectedReportForReview] = useState<StaffExpenseReport | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReceiptPhotoModal, setSelectedReceiptPhotoModal] = useState<string | null>(null);

  // APPROVE REIMBURSEMENT -> AUTOMATICALLY FLOWS INTO OFFICIAL EXPENSES SHEET!
  const handleApproveReimbursement = (report: StaffExpenseReport) => {
    const nextReceiptStart =
      expenses.length > 0
        ? Math.max(...expenses.map((e) => (typeof e.receiptNumber === 'number' ? e.receiptNumber : 0))) + 1
        : 1;
    const generatedReceiptNumbers: number[] = [];
    const newExpenseEntries: AccountingExpenseItem[] = [];

    // Map each line item into the official Think Green expense spreadsheet
    report.items.forEach((item, index) => {
      const receiptNo = nextReceiptStart + index;
      generatedReceiptNumbers.push(receiptNo);

      // Determine Budget Menu based on category or default
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

    // Update expenses list and storage
    const updatedExpenses = [...expenses, ...newExpenseEntries];
    setExpenses(updatedExpenses);
    saveStoredAccountingExpenses(updatedExpenses);

    // Update report status
    const updatedReports = expenseReports.map((r) =>
      r.id === report.id
        ? {
            ...r,
            status: 'APROVADO' as const,
            reviewedBy: `${currentUser.name} (Contabilidade)`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewNotes: `Reembolso aprovado. Gerados ${generatedReceiptNumbers.length} lançamento(s) na planilha oficial de gastos (Recibos #${generatedReceiptNumbers.join(', #')}).`,
            assignedExpenseReceipts: generatedReceiptNumbers,
          }
        : r
    );
    setExpenseReports(updatedReports);
    saveStoredExpenseReports(updatedReports);

    setRecentlyAddedReceipts(generatedReceiptNumbers);
    setSelectedReportForReview(null);

    // Switch to Gastos tab to immediately show the added rows
    setActiveSubTab('gastos');
    setCurrentTab('acc_expenses');

    showToast(
      `Reembolso ${report.reportCode} APROVADO! ${generatedReceiptNumbers.length} despesa(s) inserida(s) com sucesso na Planilha Oficial de Gastos (Recibos #${generatedReceiptNumbers.join(', #')}).`
    );
  };

  const handleRejectReimbursement = () => {
    if (!selectedReportForReview) return;
    if (!rejectReason.trim()) {
      alert('Informe o motivo da recusa.');
      return;
    }

    const updatedReports = expenseReports.map((r) =>
      r.id === selectedReportForReview.id
        ? {
            ...r,
            status: 'REJEITADO' as const,
            reviewedBy: `${currentUser.name} (Contabilidade)`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewNotes: rejectReason,
          }
        : r
    );
    setExpenseReports(updatedReports);
    saveStoredExpenseReports(updatedReports);

    setIsRejectModalOpen(false);
    setSelectedReportForReview(null);
    setRejectReason('');
    showToast(`Relatório ${selectedReportForReview.reportCode} recusado.`);
  };

  // =========================================================================
  // ACTIONS: RECEBIMENTOS
  // =========================================================================
  const handleOpenNewRevModal = (macro?: AccountingMacroArea, sub?: RevenueSubArea) => {
    setEditingRevId(null);
    setFormRevMacro(macro || 'CENTRO_COMUNITARIO');
    setFormRevSub(sub || 'CURSO_INGLES');
    setFormRevTitle('');
    setFormRevAmount(sub === 'CURSO_INGLES' ? 2000 : sub === 'PRE_ESCOLA' ? 9000 : 1500);
    setFormRevDate(new Date().toISOString().split('T')[0]);
    setFormRevPayer('');
    setFormRevInstallment(
      sub === 'CURSO_INGLES'
        ? 'Parcela trimestral (2.000 EGP)'
        : sub === 'PRE_ESCOLA'
        ? 'Semestre 1 (9.000 EGP)'
        : 'Mensalidade'
    );
    setFormRevMethod('DINHEIRO');
    setFormRevNotes('');
    setIsRevModalOpen(true);
  };

  const handleOpenEditRevModal = (rev: AccountingRevenue) => {
    setEditingRevId(rev.id);
    setFormRevMacro(rev.macroArea);
    setFormRevSub(rev.subArea);
    setFormRevTitle(rev.title);
    setFormRevAmount(rev.amount);
    setFormRevDate(rev.date);
    setFormRevPayer(rev.payerName || '');
    setFormRevInstallment(rev.installmentsInfo || '');
    setFormRevMethod(rev.paymentMethod);
    setFormRevNotes(rev.notes || '');
    setIsRevModalOpen(true);
  };

  const handleSaveRevForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRevTitle.trim()) {
      alert('Informe o título / descrição da receita.');
      return;
    }

    const parts = formRevDate.split('-');
    const year = Number(parts[0]) || 2026;
    const month = parts[1] || '01';

    const revToSave: AccountingRevenue = {
      id: editingRevId || `rev_${Date.now()}`,
      receiptNumber: editingRevId
        ? revenues.find((r) => r.id === editingRevId)?.receiptNumber
        : `REC-${year}-${String(revenues.length + 1).padStart(4, '0')}`,
      date: formRevDate,
      month,
      year,
      macroArea: formRevMacro,
      subArea: formRevSub,
      title: formRevTitle,
      amount: Number(formRevAmount),
      payerName: formRevPayer || undefined,
      installmentsInfo: formRevInstallment || undefined,
      paymentMethod: formRevMethod,
      registeredBy: currentUser.name,
      status: 'CONFIRMADO',
      notes: formRevNotes || undefined,
      createdAt: editingRevId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updated: AccountingRevenue[];
    if (editingRevId) {
      updated = revenues.map((r) => (r.id === editingRevId ? revToSave : r));
    } else {
      updated = [revToSave, ...revenues];
    }

    setRevenues(updated);
    saveStoredAccountingRevenues(updated);
    setIsRevModalOpen(false);
    showToast(editingRevId ? 'Receita atualizada com sucesso!' : 'Novo recebimento registrado com sucesso!');
  };

  const handleSaveQuickEditAmount = () => {
    if (!quickEditRev) return;
    const updated = revenues.map((r) =>
      r.id === quickEditRev.id ? { ...r, amount: Number(quickEditAmount), updatedAt: new Date().toISOString() } : r
    );
    setRevenues(updated);
    saveStoredAccountingRevenues(updated);
    setQuickEditRev(null);
    showToast(`Valor do recebimento atualizado para ${formatCurrency(quickEditAmount, 'EGP')}!`);
  };

  const handleDeleteRevenue = (id: string) => {
    if (confirm('Tem certeza que deseja remover este recebimento?')) {
      const updated = revenues.filter((r) => r.id !== id);
      setRevenues(updated);
      saveStoredAccountingRevenues(updated);
      showToast('Recebimento removido.');
    }
  };

  // =========================================================================
  // ACTIONS: GASTOS (OFICIAL)
  // =========================================================================
  const handleOpenNewExpModal = () => {
    setEditingExpId(null);
    const d = new Date();
    setFormExpDate(
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    );
    setFormExpProduct('');
    setFormExpPrice(0);
    setFormExpBudget('General');
    setFormExpCategory('Expenses and additional costs (General)');
    setFormExpNotes('');
    setIsExpModalOpen(true);
  };

  const handleOpenEditExpModal = (exp: AccountingExpenseItem) => {
    setEditingExpId(exp.id);
    setFormExpDate(exp.date);
    setFormExpProduct(exp.product);
    setFormExpPrice(exp.price);
    setFormExpBudget(exp.budget);
    setFormExpCategory(exp.category);
    setFormExpNotes(exp.notes || '');
    setIsExpModalOpen(true);
  };

  const handleSaveExpForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExpProduct.trim()) {
      alert('Informe a descrição do produto / despesa.');
      return;
    }
    if (formExpPrice <= 0) {
      alert('Informe um valor de preço válido (> 0).');
      return;
    }

    const nextReceiptNo =
      editingExpId
        ? expenses.find((e) => e.id === editingExpId)?.receiptNumber || 1
        : expenses.length > 0
        ? Math.max(...expenses.map((e) => e.receiptNumber)) + 1
        : 1;

    const expToSave: AccountingExpenseItem = {
      id: editingExpId || `exp_${Date.now()}`,
      receiptNumber: nextReceiptNo,
      date: formExpDate,
      product: formExpProduct,
      price: Number(formExpPrice),
      budget: formExpBudget,
      category: formExpCategory,
      notes: formExpNotes || undefined,
      createdAt: editingExpId ? undefined : new Date().toISOString(),
    };

    let updated: AccountingExpenseItem[];
    if (editingExpId) {
      updated = expenses.map((e) => (e.id === editingExpId ? expToSave : e));
    } else {
      updated = [...expenses, expToSave];
    }

    setExpenses(updated);
    saveStoredAccountingExpenses(updated);
    setIsExpModalOpen(false);
    showToast(editingExpId ? 'Despesa atualizada com sucesso!' : `Novo gasto registrado (Recibo #${nextReceiptNo})!`);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta linha de despesa da planilha oficial?')) {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveStoredAccountingExpenses(updated);
      showToast('Despesa removida da planilha oficial.');
    }
  };

  // If viewing the Employee Reimbursement Portal standalone
  if (isEmployeePortalOpen) {
    return (
      <EmployeeReimbursementPortal
        onBack={() => setIsEmployeePortalOpen(false)}
        standalone={standalone}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#075e38] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP INSTITUTIONAL CONTABILIDADE BANNER */}
      <div className="bg-gradient-to-r from-[#064e2e] via-[#075e38] to-[#14532d] text-white p-6 sm:p-7 rounded-3xl shadow-md border border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-10 flex items-center pr-6">
          <FileSpreadsheet className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100">
              Controladoria & Contabilidade Oficial
            </span>
            <span className="text-xs text-emerald-200 font-semibold">
              Sistema do Rony • Think Green Community Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão Contábil, Recebimentos & Gastos
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Controle unificado de entradas nas 3 Macroáreas (Lixo, Pré-Escola e Centro Comunitário), planilha oficial de despesas (Think Green Expense Report) e aprovação de reembolsos dos colaboradores.
          </p>
        </div>

        {/* Quick Shortcut to Employee Portal */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => setIsEmployeePortalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#075e38] font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title="Abrir o formulário de reembolso para funcionários e voluntários"
          >
            <Smartphone className="w-4 h-4 text-[#075e38]" />
            <span>Portal do Funcionário (Reembolsos)</span>
          </button>
        </div>
      </div>

      {/* 4 MAIN CONTABILIDADE TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {/* Tab 1: Visão Geral & DRE */}
        <button
          onClick={() => setActiveSubTab('visao_geral')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'visao_geral'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Visão Geral & Balanço</span>
        </button>

        {/* Tab 2: Recebimentos */}
        <button
          onClick={() => setActiveSubTab('recebimentos')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'recebimentos'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Recebimentos (Entradas)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'recebimentos' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#075e38]'
            }`}
          >
            3 Macroáreas
          </span>
        </button>

        {/* Tab 3: Gastos (Planilha Oficial) */}
        <button
          onClick={() => setActiveSubTab('gastos')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'gastos'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Gastos (Expense Report)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'gastos' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}
          >
            {expenses.length} Linhas
          </span>
        </button>

        {/* Tab 4: Pendências de Reembolso */}
        <button
          onClick={() => setActiveSubTab('pendencias_reembolso')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pendencias_reembolso'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pendências de Reembolso</span>
          {pendingReports.length > 0 && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {pendingReports.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: VISÃO GERAL & BALANÇO GERAL                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* 4 Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Inflows */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                  Total Recebimentos
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(grandTotalRevenues, 'EGP')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {revenues.length} recebimentos lançados
              </p>
            </div>

            {/* Total Expenses */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
                  Total de Gastos
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {formatCurrency(grandTotalExpenses, 'EGP')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {expenses.length} despesas na planilha oficial
              </p>
            </div>

            {/* Caixa / Saldo Líquido do Rony (image 2) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
                  Saldo Líquido / Caixa
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-950 font-mono">
                {formatCurrency(netCashBalance, 'EGP')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Fundo Base: {formatCurrency(initialCapital, 'EGP')}</span>
                <button
                  onClick={() => {
                    setTempCapitalInput(initialCapital);
                    setIsEditingCapital(true);
                  }}
                  className="text-purple-700 hover:underline font-bold"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Reembolsos Pendentes */}
            <div
              onClick={() => setActiveSubTab('pendencias_reembolso')}
              className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-2 cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                  Reembolsos Pendentes
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono">
                {pendingReports.length}
              </div>
              <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                <span>Clique para revisar na fila</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>

          {/* AS 3 GRANDES MACROÁREAS DO RONY */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  As 3 Grandes Macroáreas de Receita (Padrão do Rony)
                </h3>
                <p className="text-xs text-slate-500">
                  Divisão oficial: 1. Lixo (Recycle), 2. Pré-Escola e 3. Centro Comunitário (todo o restante)
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                Total: {formatCurrency(grandTotalRevenues, 'EGP')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Macro 1: Lixo */}
              <div
                onClick={() => {
                  setRevMacroFilter('LIXO');
                  setActiveSubTab('recebimentos');
                }}
                className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:border-emerald-500 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
                    <RecycleIcon className="w-4 h-4 text-emerald-700" />
                    1. Macroárea Lixo (Recycle)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Reciclagem
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950 font-mono">
                  {formatCurrency(totalRevLixo, 'EGP')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Venda de fardos de papelão, plástico prensado, sucata metálica e flakes moídos.
                </p>
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Ver detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Macro 2: Pré-Escola */}
              <div
                onClick={() => {
                  setRevMacroFilter('PRE_ESCOLA');
                  setActiveSubTab('recebimentos');
                }}
                className="p-5 rounded-2xl border-2 border-orange-200 bg-orange-50/40 hover:border-orange-500 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-orange-950 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-orange-700" />
                    2. Macroárea Pré-Escola
                  </span>
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">
                    Girassol
                  </span>
                </div>
                <div className="text-2xl font-black text-orange-950 font-mono">
                  {formatCurrency(totalRevPreEscola, 'EGP')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Matrículas e semestres da Turma Girassol (máx 2 vezes ou semestral de 9.000 EGP).
                </p>
                <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs font-bold text-orange-800">
                  <span>Ver detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Macro 3: Centro Comunitário */}
              <div
                onClick={() => {
                  setRevMacroFilter('CENTRO_COMUNITARIO');
                  setActiveSubTab('recebimentos');
                }}
                className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/40 hover:border-purple-500 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-700" />
                    3. Centro Comunitário
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    Cursos & Outros
                  </span>
                </div>
                <div className="text-2xl font-black text-purple-950 font-mono">
                  {formatCurrency(totalRevCentro, 'EGP')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Curso de Inglês (2.000 EGP), Futebol, Academia/Ginástica, Cantina, Aluguel de Campo/Ping Pong e Summer Camp.
                </p>
                <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between text-xs font-bold text-purple-800">
                  <span>Ver detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ÁREA DE RECEBIMENTOS (MACROÁREAS & SUBÁREAS DETALHADAS)         */}
      {/* ========================================================================= */}
      {activeSubTab === 'recebimentos' && (
        <div className="space-y-6">
          {/* Macroareas Selector Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Filtro por Macroárea Principal:
              </span>
              <button
                onClick={() => handleOpenNewRevModal()}
                className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Lançar Novo Recebimento</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
              <button
                onClick={() => setRevMacroFilter('ALL')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  revMacroFilter === 'ALL'
                    ? 'bg-[#075e38] text-white border-[#075e38] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block text-sm font-black">Todas as Macroáreas</span>
                <span className="text-[11px] opacity-80 font-mono">
                  {formatCurrency(grandTotalRevenues, 'EGP')}
                </span>
              </button>

              <button
                onClick={() => setRevMacroFilter('LIXO')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  revMacroFilter === 'LIXO'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="block text-sm font-black">1. Lixo (Recycle)</span>
                <span className="text-[11px] opacity-80 font-mono">
                  {formatCurrency(totalRevLixo, 'EGP')}
                </span>
              </button>

              <button
                onClick={() => setRevMacroFilter('PRE_ESCOLA')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  revMacroFilter === 'PRE_ESCOLA'
                    ? 'bg-orange-700 text-white border-orange-700 shadow-xs'
                    : 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
                }`}
              >
                <span className="block text-sm font-black">2. Pré-Escola</span>
                <span className="text-[11px] opacity-80 font-mono">
                  {formatCurrency(totalRevPreEscola, 'EGP')}
                </span>
              </button>

              <button
                onClick={() => setRevMacroFilter('CENTRO_COMUNITARIO')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  revMacroFilter === 'CENTRO_COMUNITARIO'
                    ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                    : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <span className="block text-sm font-black">3. Centro Comunitário</span>
                <span className="text-[11px] opacity-80 font-mono">
                  {formatCurrency(totalRevCentro, 'EGP')}
                </span>
              </button>
            </div>
          </div>

          {/* Sub-areas Quick Pills & Period Filters */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            {/* Sub-areas Pills */}
            <div>
              <span className="text-xs font-black text-slate-700 uppercase block mb-2">
                Subáreas Específicas:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { id: 'ALL', label: 'Todas as Subáreas' },
                  { id: 'CURSO_INGLES', label: 'Curso Livre de Inglês (2.000 EGP)' },
                  { id: 'PRE_ESCOLA', label: 'Pré-Escola (9.000 EGP Semestral)' },
                  { id: 'ACADEMIA_GINASTICA', label: 'Academia & Ginástica Feminina' },
                  { id: 'AULAS_FUTEBOL', label: 'Aulas de Futebol Sub-15' },
                  { id: 'CANTINA', label: 'Cantina Comunitária' },
                  { id: 'VENDA_LIXO', label: 'Venda de Lixo (Recycle)' },
                  { id: 'ALUGUEL_CAMPO_PINGPONG', label: 'Aluguel Campo & Ping Pong' },
                  { id: 'SUMMER_CAMPING', label: 'Summer Camping' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setRevSubFilter(s.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      revSubFilter === s.id
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filters: Year, Month, Day, Search */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Ano
                </label>
                <select
                  value={revYearFilter}
                  onChange={(e) => setRevYearFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Todos os Anos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Mês
                </label>
                <select
                  value={revMonthFilter}
                  onChange={(e) => setRevMonthFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Todos os Meses</option>
                  <option value="01">Janeiro (01)</option>
                  <option value="02">Fevereiro (02)</option>
                  <option value="03">Março (03)</option>
                  <option value="04">Abril (04)</option>
                  <option value="05">Maio (05)</option>
                  <option value="06">Junho (06)</option>
                  <option value="07">Julho (07)</option>
                  <option value="08">Agosto (08)</option>
                  <option value="09">Setembro (09)</option>
                  <option value="10">Outubro (10)</option>
                  <option value="11">Novembro (11)</option>
                  <option value="12">Dezembro (12)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Dia Específico
                </label>
                <input
                  type="date"
                  value={revDayFilter}
                  onChange={(e) => setRevDayFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Busca Textual
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={revSearch}
                    onChange={(e) => setRevSearch(e.target.value)}
                    placeholder="Buscar aluno, recibo, título..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table of Revenues */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Lançamentos de Recebimentos ({filteredRevenues.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Valores recebidos com identificação de macroárea, parcelas e opções de edição
                </p>
              </div>

              <div className="bg-emerald-100 text-[#075e38] px-4 py-2 rounded-2xl font-black text-sm font-mono border border-emerald-300 shadow-2xs">
                Total Filtrado: {formatCurrency(totalFilteredRevenues, 'EGP')}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                    <th className="py-3 px-3.5">Recibo / Data</th>
                    <th className="py-3 px-3.5">Macroárea</th>
                    <th className="py-3 px-3.5">Subárea / Descrição</th>
                    <th className="py-3 px-3.5">Pagante / Parcelas</th>
                    <th className="py-3 px-3.5">Método</th>
                    <th className="py-3 px-3.5 text-right">Valor (EGP)</th>
                    <th className="py-3 px-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRevenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-black text-slate-900 block">
                          {rev.receiptNumber || 'REC-S/N'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            rev.macroArea === 'LIXO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.macroArea === 'PRE_ESCOLA'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {rev.macroArea === 'LIXO'
                            ? '♻️ Lixo'
                            : rev.macroArea === 'PRE_ESCOLA'
                            ? '🌻 Pré-Escola'
                            : '🏢 Centro'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{rev.title}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {rev.description || rev.subArea}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {rev.payerName || 'Não especificado'}
                        </span>
                        <span className="text-[10px] text-purple-700 font-medium">
                          {rev.installmentsInfo || '-'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {rev.paymentMethod === 'TRANSFERENCIA' ? 'Transferência Bancária' : 'Dinheiro Físico'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-sm text-[#075e38]">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatCurrency(rev.amount, 'EGP')}</span>
                          <button
                            onClick={() => {
                              setQuickEditRev(rev);
                              setQuickEditAmount(rev.amount);
                            }}
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Editar valor rapidamente"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditRevModal(rev)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-[#075e38] transition-colors"
                            title="Editar dados completos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRevenue(rev.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remover recebimento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ÁREA DE GASTOS (PLANILHA OFICIAL EXPENSE REPORT)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'gastos' && (
        <div className="space-y-6">
          {/* Header Summary & Cash Controls (image 2) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Entradas Base */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Fundo de Caixa (Entrada)</span>
                {isEditingCapital ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      value={tempCapitalInput}
                      onChange={(e) => setTempCapitalInput(Number(e.target.value))}
                      className="w-28 p-1 text-xs font-mono font-bold border border-slate-300 rounded"
                    />
                    <button
                      onClick={() => {
                        setInitialCapital(tempCapitalInput);
                        setIsEditingCapital(false);
                        showToast('Fundo de caixa atualizado.');
                      }}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatCurrency(initialCapital, 'EGP')}
                  </span>
                )}
              </div>

              {/* Subtotal Gastos */}
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Subtotal Despesas</span>
                <span className="text-base font-black text-rose-800 font-mono">
                  -{formatCurrency(grandTotalExpenses, 'EGP')}
                </span>
              </div>

              {/* Reembolsos de Colaboradores Integrados */}
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Reembolsos Integrados</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-indigo-950 font-mono">
                    {formatCurrency(totalReimbursementsExpenses, 'EGP')}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-extrabold">
                    ({countReimbursementsExpenses} itens)
                  </span>
                </div>
              </div>

              {/* Saldo Restante */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Saldo Total em Caixa</span>
                <span className="text-base font-black text-purple-950 font-mono">
                  {formatCurrency(netCashBalance, 'EGP')}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenNewExpModal}
              className="px-4 py-2.5 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lançar Novo Gasto na Planilha</span>
            </button>
          </div>

          {/* Banner de Recibos Recém-Lançados a partir de Reembolso Aprovado */}
          {recentlyAddedReceipts.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-3xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-emerald-900 block font-black">
                    Reembolso integrado com sucesso na Planilha Oficial de Gastos!
                  </strong>
                  <span className="text-emerald-800">
                    Foram adicionadas novas linhas de despesas com os{' '}
                    <strong className="underline">Recibos #{recentlyAddedReceipts.join(', #')}</strong> destacados em verde na planilha abaixo.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRecentlyAddedReceipts([])}
                className="px-3 py-1.5 bg-emerald-200/70 hover:bg-emerald-200 text-emerald-900 rounded-xl font-bold text-xs transition-colors flex-shrink-0 cursor-pointer"
              >
                Dispensar Destaque
              </button>
            </div>
          )}

          {/* 2 Columns: Left is Data Table, Right is Budget Categories Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 8/12 COLS: Official Expense Report Sheet */}
            <div className="lg:col-span-8 space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={expSearch}
                      onChange={(e) => setExpSearch(e.target.value)}
                      placeholder="Buscar produto, colaborador, recibo #..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <select
                    value={expBudgetFilter}
                    onChange={(e) => setExpBudgetFilter(e.target.value as any)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ALL">Todos os Budgets</option>
                    {OFFICIAL_BUDGET_MENUS.map((b) => (
                      <option key={b} value={b}>
                        Budget: {b}
                      </option>
                    ))}
                  </select>

                  <select
                    value={expMonthFilter}
                    onChange={(e) => setExpMonthFilter(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ALL">Todos os Meses</option>
                    <option value="10">Outubro (10)</option>
                    <option value="11">Novembro (11)</option>
                    <option value="12">Dezembro (12)</option>
                    <option value="01">Janeiro (01)</option>
                    <option value="02">Fevereiro (02)</option>
                    <option value="03">Março (03)</option>
                  </select>
                </div>

                {/* Quick Filter Chips: Origem do Gasto */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Origem:</span>
                  <button
                    onClick={() => setExpOriginFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expOriginFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos os Gastos ({expenses.length})
                  </button>
                  <button
                    onClick={() => setExpOriginFilter('REIMBURSEMENT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      expOriginFilter === 'REIMBURSEMENT'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reembolsos Aprovados ({countReimbursementsExpenses})</span>
                  </button>
                  <button
                    onClick={() => setExpOriginFilter('DIRECT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expOriginFilter === 'DIRECT'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Despesas Diretas ({countDirectExpenses})
                  </button>
                </div>
              </div>

              {/* Exact Reproduction of image_813704e7.png Table */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Excel Table Title Bar */}
                <div className="bg-[#bbf7d0]/80 p-3.5 border-b border-emerald-300 text-center font-black text-sm text-emerald-950 uppercase tracking-wide">
                  Think Green — Expense Report
                </div>

                <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-2xs">
                      <tr className="border-b-2 border-slate-300 font-black text-[11px] text-slate-900 uppercase">
                        <th className="py-2.5 px-3 border-r border-slate-200 w-16 text-center">
                          Receipt
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-24">Date</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 min-w-[200px]">
                          Product
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-28 text-right">
                          Price (EGP)
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-200 w-24">Budget</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 min-w-[180px]">
                          Category
                        </th>
                        <th className="py-2.5 px-2 text-center w-16">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      {filteredExpenses.map((exp) => {
                        const isRecentlyAdded = recentlyAddedReceipts.includes(exp.receiptNumber);
                        const isReimbursement = Boolean(
                          exp.sourceReportId || exp.product.toLowerCase().includes('reembolso')
                        );

                        return (
                          <tr
                            key={exp.id}
                            className={`transition-colors ${
                              isRecentlyAdded
                                ? 'bg-emerald-50/90 font-semibold ring-1 ring-emerald-300'
                                : 'hover:bg-purple-50/20'
                            }`}
                          >
                            <td className="p-2.5 border-r border-slate-200 text-center font-mono font-black text-slate-900 bg-slate-50/50">
                              <div className="flex flex-col items-center justify-center">
                                <span>{exp.receiptNumber}</span>
                                {isRecentlyAdded && (
                                  <span className="text-[9px] font-black text-emerald-700 uppercase bg-emerald-100 px-1 rounded animate-pulse">
                                    Novo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">
                              {exp.date}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 text-slate-900">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold">{exp.product}</span>
                                  {exp.receiptPhotoUrl && (
                                    <button
                                      onClick={() => setSelectedReceiptPhotoModal(exp.receiptPhotoUrl || null)}
                                      className="text-purple-600 hover:text-purple-800 p-0.5 rounded hover:bg-purple-100 transition-colors"
                                      title="Ver foto do comprovante anexado"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {isReimbursement && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                      <CheckCircle2 className="w-3 h-3 text-purple-700" />
                                      Reembolso Aprovado
                                    </span>
                                    {exp.sourceReportId && (
                                      <button
                                        onClick={() => {
                                          const rep = expenseReports.find((r) => r.id === exp.sourceReportId);
                                          if (rep) setSelectedReportDetail(rep);
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                                        title="Ver formulário original de solicitação deste reembolso"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>Ver Relatório Original</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 border-r border-slate-200 text-right font-mono font-black text-slate-900">
                              {formatCurrency(exp.price, '')}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-700">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  exp.budget === 'Preschool'
                                    ? 'bg-orange-100 text-orange-800'
                                    : exp.budget === 'Community'
                                    ? 'bg-purple-100 text-purple-800'
                                    : exp.budget === 'Recycle'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {exp.budget}
                              </span>
                            </td>
                            <td className="p-2.5 border-r border-slate-200 text-slate-600 font-medium">
                              {exp.category}
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditExpModal(exp)}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                                  title="Editar linha"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                                  title="Remover linha"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-[#bbf7d0] font-black text-slate-900 border-t-2 border-emerald-400">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-4 text-right uppercase text-xs">
                          SUBTOTAL:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-sm">
                          {formatCurrency(totalFilteredExpenses, 'EGP')}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT 4/12 COLS: Budget Categories & Budget Menu (Image 1 side box) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Budget Menu Selector */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Budget Menu (Orçamentos)
                </span>
                <div className="space-y-1.5 text-xs font-bold">
                  {OFFICIAL_BUDGET_MENUS.map((menu) => (
                    <button
                      key={menu}
                      onClick={() => setExpBudgetFilter(menu)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        expBudgetFilter === menu
                          ? 'bg-[#075e38] text-white border-[#075e38] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{menu}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  ))}
                  {expBudgetFilter !== 'ALL' && (
                    <button
                      onClick={() => setExpBudgetFilter('ALL')}
                      className="text-xs text-purple-700 hover:underline font-bold text-center w-full pt-1"
                    >
                      Limpar filtro de Budget
                    </button>
                  )}
                </div>
              </div>

              {/* 28 Budget Categories Box (Exact Replica of image_813704e7.png) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="bg-[#bbf7d0]/60 p-3.5 border-b border-emerald-200 font-black text-xs text-emerald-950 uppercase flex items-center justify-between">
                  <span>Budget Categories</span>
                  <span>EGP</span>
                </div>

                <div className="divide-y divide-slate-100 text-[11px] max-h-[500px] overflow-y-auto">
                  {OFFICIAL_BUDGET_CATEGORIES.map((cat) => {
                    const amount = categoryTotals[cat] || 0;
                    return (
                      <div
                        key={cat}
                        onClick={() => setExpCategoryFilter(expCategoryFilter === cat ? 'ALL' : cat)}
                        className={`p-2.5 flex items-center justify-between hover:bg-purple-50/50 transition-colors cursor-pointer ${
                          expCategoryFilter === cat ? 'bg-purple-100 font-bold text-purple-950' : 'text-slate-800'
                        }`}
                      >
                        <span className="truncate pr-2">{cat}</span>
                        <span className="font-mono font-bold whitespace-nowrap">
                          {amount > 0 ? formatCurrency(amount, '') : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#075e38] text-white flex items-center justify-between font-black text-xs">
                  <span>SUBTOTAL</span>
                  <span className="font-mono text-sm">{formatCurrency(grandTotalExpenses, 'EGP')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PENDÊNCIAS DE REEMBOLSO (REPORTS ENVIADOS POR FUNCIONÁRIOS)     */}
      {/* ========================================================================= */}
      {activeSubTab === 'pendencias_reembolso' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Fila de Reembolsos Pendentes ({pendingReports.length})
              </h3>
              <p className="text-xs text-slate-500">
                Relatórios preenchidos por funcionários e voluntários via formulário Expense Report. Ao aprovar, os itens vão automaticamente para a planilha de gastos oficial.
              </p>
            </div>

            <button
              onClick={() => setIsEmployeePortalOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#075e38] font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simular Novo Relatório de Colaborador</span>
            </button>
          </div>

          {/* Pending List */}
          <div className="space-y-4">
            {pendingReports.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-base">
                  Nenhum reembolso pendente de aprovação!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todos os relatórios de gastos enviados pelos colaboradores já foram analisados e processados na contabilidade.
                </p>
              </div>
            ) : (
              pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-3xl border-2 border-amber-200 hover:border-amber-400 p-5 sm:p-6 shadow-xs space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          {report.reportCode}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900">
                          {report.fullName}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-slate-500">Data: {report.date}</span>
                      </div>
                      <h4 className="font-bold text-xs text-purple-900">
                        Finalidade / Evento: {report.event}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">
                        Total Solicitado
                      </span>
                      <span className="text-xl font-black text-[#075e38] font-mono">
                        {formatCurrency(report.totalAmount, 'EGP')}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 font-black text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Categoria Orçamentária</th>
                          <th className="p-2.5">Descrição</th>
                          <th className="p-2.5">Data</th>
                          <th className="p-2.5 text-right">Valor (EGP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {report.items.map((it) => (
                          <tr key={it.id}>
                            <td className="p-2.5 font-medium text-slate-700">{it.category}</td>
                            <td className="p-2.5 font-bold text-slate-900">{it.description}</td>
                            <td className="p-2.5 text-slate-500 font-mono">{it.date}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(it.amount, 'EGP')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions & Proof */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div>
                      {report.receiptPhotoUrl ? (
                        <button
                          onClick={() => setSelectedReceiptPhotoModal(report.receiptPhotoUrl || null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-bold text-xs hover:bg-purple-100 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Ver Comprovante Anexado (Foto)</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sem foto de comprovante anexada</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedReportForReview(report);
                          setIsRejectModalOpen(true);
                        }}
                        className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Recusar
                      </button>

                      <button
                        onClick={() => handleApproveReimbursement(report)}
                        className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovar e Lançar nos Gastos</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Processed Reports Section */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900">
              Histórico de Reembolsos Já Processados
            </h4>
            <div className="space-y-2">
              {expenseReports
                .filter((r) => r.status !== 'PENDENTE')
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 mr-2">{r.reportCode}</span>
                      <strong className="text-slate-800">{r.fullName}</strong> — {r.event} ({r.date})
                      {r.assignedExpenseReceipts && (
                        <span className="ml-2 text-purple-700 font-semibold text-[11px]">
                          [Recibos na Planilha: #{r.assignedExpenseReceipts.join(', #')}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black">{formatCurrency(r.totalAmount, 'EGP')}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'APROVADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NOVO / EDITAR RECEBIMENTO                                        */}
      {/* ========================================================================= */}
      {isRevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingRevId ? 'Editar Recebimento' : 'Novo Lançamento de Recebimento'}
                </h3>
                <p className="text-xs text-slate-500">
                  Valores configuráveis nas 3 macroáreas e subáreas oficiais
                </p>
              </div>
              <button
                onClick={() => setIsRevModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRevForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Macroárea Principal *</label>
                  <select
                    value={formRevMacro}
                    onChange={(e) => setFormRevMacro(e.target.value as AccountingMacroArea)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="CENTRO_COMUNITARIO">🏢 3. Centro Comunitário</option>
                    <option value="PRE_ESCOLA">🌻 2. Pré-Escola</option>
                    <option value="LIXO">♻️ 1. Lixo (Recycle)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subárea *</label>
                  <select
                    value={formRevSub}
                    onChange={(e) => {
                      const val = e.target.value as RevenueSubArea;
                      setFormRevSub(val);
                      if (val === 'CURSO_INGLES') {
                        setFormRevAmount(2000);
                        setFormRevInstallment('Parcela trimestral (2.000 EGP)');
                      } else if (val === 'PRE_ESCOLA') {
                        setFormRevAmount(9000);
                        setFormRevInstallment('Semestre 1 (9.000 EGP)');
                      } else if (val === 'ACADEMIA_GINASTICA') {
                        setFormRevAmount(1500);
                        setFormRevInstallment('Mensalidade');
                      } else if (val === 'AULAS_FUTEBOL') {
                        setFormRevAmount(1200);
                        setFormRevInstallment('Mensalidade');
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="CURSO_INGLES">Curso Livre de Inglês (2.000 EGP)</option>
                    <option value="PRE_ESCOLA">Pré-Escola (9.000 EGP Semestral)</option>
                    <option value="ACADEMIA_GINASTICA">Academia & Ginástica Feminina</option>
                    <option value="AULAS_FUTEBOL">Aulas de Futebol Sub-15</option>
                    <option value="CANTINA">Cantina Comunitária</option>
                    <option value="VENDA_LIXO">Venda de Lixo (Recycle)</option>
                    <option value="ALUGUEL_CAMPO_PINGPONG">Aluguel Campo & Ping Pong</option>
                    <option value="SUMMER_CAMPING">Summer Camping</option>
                    <option value="OUTROS">Outros Recebimentos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título / Descrição *</label>
                <input
                  type="text"
                  required
                  value={formRevTitle}
                  onChange={(e) => setFormRevTitle(e.target.value)}
                  placeholder="Ex: Curso Livre de Inglês - Parcela 2/3 (Adolescente)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor Recebido (EGP) * <span className="text-emerald-700">(editável)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formRevAmount}
                    onChange={(e) => setFormRevAmount(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data do Recebimento *</label>
                  <input
                    type="date"
                    required
                    value={formRevDate}
                    onChange={(e) => setFormRevDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Pagante / Aluno</label>
                  <input
                    type="text"
                    value={formRevPayer}
                    onChange={(e) => setFormRevPayer(e.target.value)}
                    placeholder="Ex: Youssef Mansour"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Info das Parcelas</label>
                  <input
                    type="text"
                    value={formRevInstallment}
                    onChange={(e) => setFormRevInstallment(e.target.value)}
                    placeholder="Ex: Parcela 2 de 3 (Adolescente)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={formRevMethod}
                  onChange={(e) => setFormRevMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="DINHEIRO">Dinheiro Físico (Balcão / Rony)</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRevModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-black shadow-xs"
                >
                  Salvar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK EDIT REVENUE AMOUNT                                        */}
      {/* ========================================================================= */}
      {quickEditRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900">Editar Valor do Recebimento</h4>
            <p className="text-xs text-slate-600 font-medium">{quickEditRev.title}</p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Novo Valor em EGP:
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quickEditAmount}
                onChange={(e) => setQuickEditAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-black text-base text-[#075e38]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickEditRev(null)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEditAmount}
                className="px-5 py-2 bg-[#075e38] text-white rounded-xl text-xs font-black shadow-xs"
              >
                Salvar Valor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NOVO / EDITAR GASTO MANUAL                                       */}
      {/* ========================================================================= */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingExpId ? 'Editar Despesa' : 'Novo Lançamento na Planilha de Gastos'}
                </h3>
                <p className="text-xs text-slate-500">
                  Modelo oficial: Think Green Expense Report (Receipt # sequencial)
                </p>
              </div>
              <button
                onClick={() => setIsExpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição do Produto / Serviço (Product) *
                </label>
                <input
                  type="text"
                  required
                  value={formExpProduct}
                  onChange={(e) => setFormExpProduct(e.target.value)}
                  placeholder="Ex: Diesel Loader, Books English Classes, Grass Worker..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço (Price EGP) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formExpPrice || ''}
                    onChange={(e) => setFormExpPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data (DD/MM/YYYY) *</label>
                  <input
                    type="text"
                    required
                    value={formExpDate}
                    onChange={(e) => setFormExpDate(e.target.value)}
                    placeholder="Ex: 08/01/2026"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Budget Menu *</label>
                  <select
                    value={formExpBudget}
                    onChange={(e) => setFormExpBudget(e.target.value as ExpenseBudget)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    {OFFICIAL_BUDGET_MENUS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formExpCategory}
                    onChange={(e) => setFormExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium bg-white"
                  >
                    {OFFICIAL_BUDGET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Adicionais</label>
                <textarea
                  rows={2}
                  value={formExpNotes}
                  onChange={(e) => setFormExpNotes(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-black shadow-xs"
                >
                  Salvar na Planilha Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECUSAR REEMBOLSO                                                */}
      {/* ========================================================================= */}
      {isRejectModalOpen && selectedReportForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900">
              Recusar Reembolso — {selectedReportForReview.reportCode}
            </h4>
            <p className="text-xs text-slate-600">
              Informe a justificativa para que o colaborador{' '}
              <strong>{selectedReportForReview.fullName}</strong> possa verificar e corrigir:
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Comprovante ilegível ou despesa não autorizada previamente..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleRejectReimbursement}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-xs"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECEIPT PHOTO VIEWER (AMPLIAÇÃO DE COMPROVANTE)                  */}
      {/* ========================================================================= */}
      {selectedReceiptPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">Visualização do Comprovante</span>
              <button
                onClick={() => setSelectedReceiptPhotoModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedReceiptPhotoModal}
                alt="Comprovante Fiscal"
                className="max-h-[68vh] object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReceiptPhotoModal(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DETALHES DO RELATÓRIO DE REEMBOLSO ORIGINÁRIO                    */}
      {/* ========================================================================= */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    {selectedReportDetail.reportCode}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Lançado nos Gastos Oficiais
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-1.5">
                  {selectedReportDetail.event}
                </h3>
                <p className="text-xs text-slate-500">
                  Colaborador: <strong>{selectedReportDetail.fullName}</strong> • Enviado em:{' '}
                  {selectedReportDetail.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auditoria de Aprovação */}
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">
                Auditoria de Aprovação Contábil
              </span>
              <p className="text-slate-800">
                Aprovado por: <strong>{selectedReportDetail.reviewedBy || 'Contabilidade (Rony)'}</strong>{' '}
                {selectedReportDetail.reviewedAt && `em ${selectedReportDetail.reviewedAt}`}
              </p>
              {selectedReportDetail.assignedExpenseReceipts && (
                <p className="text-purple-900 font-bold">
                  Recibos Oficiais na Planilha: #{selectedReportDetail.assignedExpenseReceipts.join(', #')}
                </p>
              )}
            </div>

            {/* Lista de Itens */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase">Itens Reembolsados:</span>
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
                    {selectedReportDetail.items.map((it) => (
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
                    <tr className="bg-emerald-50 font-black text-emerald-950 border-t border-emerald-200">
                      <td colSpan={3} className="p-2.5 text-right uppercase">
                        TOTAL REEMBOLSADO:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm">
                        {formatCurrency(selectedReportDetail.totalAmount, 'EGP')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Foto do Comprovante */}
            {selectedReportDetail.receiptPhotoUrl && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase">Comprovante Anexado:</span>
                  <button
                    onClick={() => setSelectedReceiptPhotoModal(selectedReportDetail.receiptPhotoUrl || null)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ampliar Imagem</span>
                  </button>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                  <img
                    src={selectedReportDetail.receiptPhotoUrl}
                    alt="Comprovante"
                    className="w-full h-52 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
