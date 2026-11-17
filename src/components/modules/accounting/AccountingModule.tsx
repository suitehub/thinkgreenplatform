import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
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
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Smartphone,
  Save,
  Building,
  Copy,
  LogOut,
  Users,
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
import { AssignedModulesMenu } from '../../common/AssignedModulesMenu';
import { formatCurrency } from '../../../lib/storage';
import { getAppBasePath, getFullAppUrl, updateAppRoute } from '../../../utils/urlUtils';

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
  const { currentUser, logout } = useApp();

  // URL sync: Syncs the URL with '/contabil' while preserving the GitHub Pages repository (e.g. /thinkgreenplatform/contabil)
  useEffect(() => {
    updateAppRoute('contabil', { module: 'accounting' });
  }, []);

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

  // Initial Capital / Cash Balance config (zeroed for the database)
  const [initialCapital, setInitialCapital] = useState<number>(0);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapitalInput, setTempCapitalInput] = useState<number>(0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // =========================================================================
  // 1. REVENUES (FILTERS & STATE)
  // =========================================================================
  const [revMacroFilter, setRevMacroFilter] = useState<'ALL' | AccountingMacroArea>('ALL');
  const [revSubFilter, setRevSubFilter] = useState<'ALL' | RevenueSubArea>('ALL');
  const [revYearFilter, setRevYearFilter] = useState<'ALL' | string>('ALL');
  const [revMonthFilter, setRevMonthFilter] = useState<'ALL' | string>('ALL');
  const [revDayFilter, setRevDayFilter] = useState<string>('');
  const [revSearch, setRevSearch] = useState('');

  // New / Edit Revenue Modal
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

  // Totals by Macro Area
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
  // 2. EXPENSES (OFFICIAL EXCEL SHEET - FILTERS & STATE)
  // =========================================================================
  const [expBudgetFilter, setExpBudgetFilter] = useState<'ALL' | ExpenseBudget>('ALL');
  const [expCategoryFilter, setExpCategoryFilter] = useState<'ALL' | string>('ALL');
  const [expSearch, setExpSearch] = useState('');
  const [expMonthFilter, setExpMonthFilter] = useState<'ALL' | string>('ALL');
  const [expOriginFilter, setExpOriginFilter] = useState<'ALL' | 'REIMBURSEMENT' | 'DIRECT'>('ALL');

  // New Manual Expense Modal
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
        matchOrigin = Boolean(e.sourceReportId || (e.product.toLowerCase().includes('reembolso') || e.product.toLowerCase().includes('reimbursement')));
      } else if (expOriginFilter === 'DIRECT') {
        matchOrigin = !e.sourceReportId && !(e.product.toLowerCase().includes('reembolso') || e.product.toLowerCase().includes('reimbursement'));
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
      .filter((e) => Boolean(e.sourceReportId || (e.product.toLowerCase().includes('reembolso') || e.product.toLowerCase().includes('reimbursement'))))
      .reduce((acc, e) => acc + e.price, 0);
  }, [expenses]);

  const countReimbursementsExpenses = useMemo(() => {
    return expenses.filter((e) => Boolean(e.sourceReportId || (e.product.toLowerCase().includes('reembolso') || e.product.toLowerCase().includes('reimbursement')))).length;
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
  // 3. PENDING REIMBURSEMENTS (EXPENSE REPORTS)
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
        product: `${item.description} (Reimbursement: ${report.fullName})`,
        price: Number(item.amount),
        budget,
        category: item.category,
        paidTo: report.fullName,
        sourceReportId: report.id,
        receiptPhotoUrl: report.receiptPhotoUrl,
        notes: `Approved from Report ${report.reportCode} (${report.event})`,
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
            reviewedBy: `${currentUser.name} (Accounting)`,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewNotes: `Reimbursement approved. Generated ${generatedReceiptNumbers.length} entry(ies) in the official expense sheet (Receipts #${generatedReceiptNumbers.join(', #')}).`,
            assignedExpenseReceipts: generatedReceiptNumbers,
          }
        : r
    );
    setExpenseReports(updatedReports);
    saveStoredExpenseReports(updatedReports);

    setRecentlyAddedReceipts(generatedReceiptNumbers);
    setSelectedReportForReview(null);

    // Switch to the Expenses tab to immediately show the added rows
    setActiveSubTab('gastos');
    setCurrentTab('acc_expenses');

    showToast(
      `Reimbursement ${report.reportCode} APPROVED! ${generatedReceiptNumbers.length} expense(s) successfully inserted into the Official Expense Sheet (Receipts #${generatedReceiptNumbers.join(', #')}).`
    );
  };

  const handleRejectReimbursement = () => {
    if (!selectedReportForReview) return;
    if (!rejectReason.trim()) {
      alert('Please enter the rejection reason.');
      return;
    }

    const updatedReports = expenseReports.map((r) =>
      r.id === selectedReportForReview.id
        ? {
            ...r,
            status: 'REJEITADO' as const,
            reviewedBy: `${currentUser.name} (Accounting)`,
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
    showToast(`Report ${selectedReportForReview.reportCode} rejected.`);
  };

  // =========================================================================
  // ACTIONS: REVENUES
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
        ? 'Quarterly installment (2,000 EGP)'
        : sub === 'PRE_ESCOLA'
        ? 'Semester 1 (9,000 EGP)'
        : 'Monthly Tuition'
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
      alert('Please enter the revenue title / description.');
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
    showToast(editingRevId ? 'Revenue updated successfully!' : 'New revenue recorded successfully!');
  };

  const handleSaveQuickEditAmount = () => {
    if (!quickEditRev) return;
    const updated = revenues.map((r) =>
      r.id === quickEditRev.id ? { ...r, amount: Number(quickEditAmount), updatedAt: new Date().toISOString() } : r
    );
    setRevenues(updated);
    saveStoredAccountingRevenues(updated);
    setQuickEditRev(null);
    showToast(`Revenue amount updated to ${formatCurrency(quickEditAmount, 'EGP')}!`);
  };

  const handleDeleteRevenue = (id: string) => {
    if (confirm('Are you sure you want to remove this revenue?')) {
      const updated = revenues.filter((r) => r.id !== id);
      setRevenues(updated);
      saveStoredAccountingRevenues(updated);
      showToast('Revenue removed.');
    }
  };

  // =========================================================================
  // ACTIONS: EXPENSES (OFFICIAL)
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
      alert('Please enter the product / expense description.');
      return;
    }
    if (formExpPrice <= 0) {
      alert('Please enter a valid price amount (> 0).');
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
    showToast(editingExpId ? 'Expense updated successfully!' : `New expense recorded (Receipt #${nextReceiptNo})!`);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to remove this expense row from the official sheet?')) {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveStoredAccountingExpenses(updated);
      showToast('Expense removed from the official sheet.');
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

      {/* ========================================================================= */}
      {/* ACCOUNTING PANEL SESSION BAR                                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-4 sm:p-5 shadow-md space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Current Session
            </span>
            <span className="text-xs font-bold text-slate-800">
              Current Profile: <strong className="text-emerald-800">{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>

          {/* Rota / URL Think Green indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <AssignedModulesMenu />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono font-bold shadow-2xs">
              <span className="text-emerald-600 font-black">URL Think Green:</span>
              <span className="underline font-black">{`${getAppBasePath()}/contabil`}</span>
            </div>

            <button
              onClick={() => {
                const fullUrl = getFullAppUrl('contabil');
                navigator.clipboard.writeText(fullUrl);
                showToast(`URL copiada: ${fullUrl}`);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              title="Copy the direct URL for Controlling & Accounting"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy URL</span>
            </button>

            <button
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-rose-200 shadow-2xs active:scale-95"
              title="Sign out to the login screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP INSTITUTIONAL ACCOUNTING BANNER */}
      <div className="bg-gradient-to-r from-[#064e2e] via-[#075e38] to-[#14532d] text-white p-6 sm:p-7 rounded-3xl shadow-md border border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-10 flex items-center pr-6">
          <FileSpreadsheet className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100">
              Official Controlling & Accounting
            </span>
            <span className="text-xs text-emerald-200 font-semibold">
              Rony's System • Think Green Community Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Accounting, Revenue & Expense Management
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Unified control of inflows across the 3 Macro Areas (Garbage, Preschool and Community Center), official expense sheet (Think Green Expense Report) and approval of staff reimbursements.
          </p>
        </div>

        {/* Quick Shortcut to Employee Portal */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => setIsEmployeePortalOpen(true)}
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#075e38] font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title="Open the reimbursement form for staff and volunteers"
          >
            <Smartphone className="w-4 h-4 text-[#075e38]" />
            <span>Employee Portal (Reimbursements)</span>
          </button>
        </div>
      </div>

      {/* 4 MAIN ACCOUNTING TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {/* Tab 1: Overview & Income Statement */}
        <button
          onClick={() => setActiveSubTab('visao_geral')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'visao_geral'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Overview & Balance</span>
        </button>

        {/* Tab 2: Revenues */}
        <button
          onClick={() => setActiveSubTab('recebimentos')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'recebimentos'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Revenues (Inflows)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'recebimentos' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#075e38]'
            }`}
          >
            3 Macro Areas
          </span>
        </button>

        {/* Tab 3: Expenses (Official Sheet) */}
        <button
          onClick={() => setActiveSubTab('gastos')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'gastos'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Expenses (Expense Report)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
              activeSubTab === 'gastos' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}
          >
            {expenses.length} Rows
          </span>
        </button>

        {/* Tab 4: Pending Reimbursements */}
        <button
          onClick={() => setActiveSubTab('pendencias_reembolso')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pendencias_reembolso'
              ? 'bg-[#075e38] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Reimbursements</span>
          {pendingReports.length > 0 && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {pendingReports.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: GENERAL OVERVIEW & BALANCE                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* 4 Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Inflows */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                  Total Revenues
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(grandTotalRevenues, 'EGP')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {revenues.length} revenues recorded
              </p>
            </div>

            {/* Total Expenses */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
                  Total Expenses
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {formatCurrency(grandTotalExpenses, 'EGP')}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {expenses.length} expenses in the official sheet
              </p>
            </div>

            {/* Rony's Cash / Net Balance (image 2) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
                  Net Balance / Cash
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-950 font-mono">
                {formatCurrency(netCashBalance, 'EGP')}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Base Fund: {formatCurrency(initialCapital, 'EGP')}</span>
                <button
                  onClick={() => {
                    setTempCapitalInput(initialCapital);
                    setIsEditingCapital(true);
                  }}
                  className="text-purple-700 hover:underline font-bold"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Pending Reimbursements */}
            <div
              onClick={() => setActiveSubTab('pendencias_reembolso')}
              className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-2 cursor-pointer hover:border-amber-400 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                  Pending Reimbursements
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono">
                {pendingReports.length}
              </div>
              <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                <span>Click to review in the queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>

          {/* RONY'S 3 MAJOR MACRO AREAS */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Rony's 3 Major Revenue Macro Areas (Default)
                </h3>
                <p className="text-xs text-slate-500">
                  Official breakdown: 1. Garbage (Recycle), 2. Preschool and 3. Community Center (everything else)
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                Total: {formatCurrency(grandTotalRevenues, 'EGP')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Macro 1: Garbage */}
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
                    1. Garbage Macro Area (Recycle)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Recycling
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950 font-mono">
                  {formatCurrency(totalRevLixo, 'EGP')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sale of cardboard bales, baled plastic, metal scraps and ground flakes.
                </p>
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>View details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Macro 2: Preschool */}
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
                    2. Preschool Macro Area
                  </span>
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">
                    Girassol
                  </span>
                </div>
                <div className="text-2xl font-black text-orange-950 font-mono">
                  {formatCurrency(totalRevPreEscola, 'EGP')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enrollments and semesters for the Sunflower Class (max 2 installments or 9,000 EGP per semester).
                </p>
                <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs font-bold text-orange-800">
                  <span>View details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Macro 3: Community Center */}
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
                    3. Community Center
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    Courses & Others
                  </span>
                </div>
                <div className="text-2xl font-black text-purple-950 font-mono">
                  {formatCurrency(totalRevCentro, 'EGP')}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  English Course (2,000 EGP), Soccer, Gymnastics/Fitness, Cafeteria, Field/Ping Pong Rental and Summer Camp.
                </p>
                <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between text-xs font-bold text-purple-800">
                  <span>View details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: REVENUES AREA (MACRO AREAS & DETAILED SUB-AREAS)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'recebimentos' && (
        <div className="space-y-6">
          {/* Macroareas Selector Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Filter by Main Macro Area:
              </span>
              <button
                onClick={() => handleOpenNewRevModal()}
                className="px-4 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record New Revenue</span>
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
                <span className="block text-sm font-black">All Macro Areas</span>
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
                <span className="block text-sm font-black">1. Garbage (Recycle)</span>
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
                <span className="block text-sm font-black">2. Preschool</span>
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
                <span className="block text-sm font-black">3. Community Center</span>
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
                Specific Sub-areas:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { id: 'ALL', label: 'All Sub-areas' },
                  { id: 'CURSO_INGLES', label: 'English Language Course (2,000 EGP)' },
                  { id: 'PRE_ESCOLA', label: 'Preschool (9,000 EGP per Semester)' },
                  { id: 'ACADEMIA_GINASTICA', label: "Gym & Women's Gymnastics" },
                  { id: 'AULAS_FUTEBOL', label: 'Under-15 Soccer Lessons' },
                  { id: 'CANTINA', label: 'Community Cafeteria' },
                  { id: 'VENDA_LIXO', label: 'Recyclables Sales (Recycle)' },
                  { id: 'ALUGUEL_CAMPO_PINGPONG', label: 'Field & Ping Pong Rental' },
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
                  Year
                </label>
                <select
                  value={revYearFilter}
                  onChange={(e) => setRevYearFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Month
                </label>
                <select
                  value={revMonthFilter}
                  onChange={(e) => setRevMonthFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">All Months</option>
                  <option value="01">January (01)</option>
                  <option value="02">February (02)</option>
                  <option value="03">March (03)</option>
                  <option value="04">April (04)</option>
                  <option value="05">May (05)</option>
                  <option value="06">June (06)</option>
                  <option value="07">July (07)</option>
                  <option value="08">August (08)</option>
                  <option value="09">September (09)</option>
                  <option value="10">October (10)</option>
                  <option value="11">November (11)</option>
                  <option value="12">December (12)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Specific Day
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
                  Text Search
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={revSearch}
                    onChange={(e) => setRevSearch(e.target.value)}
                    placeholder="Search student, receipt, title..."
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
                  Revenue Entries ({filteredRevenues.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Amounts received with macro area, installments and editing options
                </p>
              </div>

              <div className="bg-emerald-100 text-[#075e38] px-4 py-2 rounded-2xl font-black text-sm font-mono border border-emerald-300 shadow-2xs">
                Filtered Total: {formatCurrency(totalFilteredRevenues, 'EGP')}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                    <th className="py-3 px-3.5">Receipt / Date</th>
                    <th className="py-3 px-3.5">Macro Area</th>
                    <th className="py-3 px-3.5">Sub-area / Description</th>
                    <th className="py-3 px-3.5">Payer / Installments</th>
                    <th className="py-3 px-3.5">Method</th>
                    <th className="py-3 px-3.5 text-right">Amount (EGP)</th>
                    <th className="py-3 px-3.5 text-center">Actions</th>
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
                            ? '♻️ Garbage'
                            : rev.macroArea === 'PRE_ESCOLA'
                            ? '🌻 Preschool'
                            : '🏢 Community'}
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
                          {rev.payerName || 'Not specified'}
                        </span>
                        <span className="text-[10px] text-purple-700 font-medium">
                          {rev.installmentsInfo || '-'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {rev.paymentMethod === 'TRANSFERENCIA' ? 'Bank Transfer' : 'Physical Cash'}
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
                            title="Quick edit amount"
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
                            title="Edit full details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRevenue(rev.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove revenue"
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
      {/* SUB-TAB 3: EXPENSES AREA (OFFICIAL EXPENSE REPORT SHEET)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'gastos' && (
        <div className="space-y-6">
          {/* Header Summary & Cash Controls (image 2) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Base Inflows */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cash Fund (Inflow)</span>
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
                        showToast('Cash fund updated.');
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

              {/* Expense Subtotal */}
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Expense Subtotal</span>
                <span className="text-base font-black text-rose-800 font-mono">
                  -{formatCurrency(grandTotalExpenses, 'EGP')}
                </span>
              </div>

              {/* Integrated Staff Reimbursements */}
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Integrated Reimbursements</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-indigo-950 font-mono">
                    {formatCurrency(totalReimbursementsExpenses, 'EGP')}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-extrabold">
                    ({countReimbursementsExpenses} items)
                  </span>
                </div>
              </div>

              {/* Remaining Balance */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Total Cash Balance</span>
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
              <span>+ Record New Expense in Sheet</span>
            </button>
          </div>

          {/* Banner for Recently Added Receipts from Approved Reimbursement */}
          {recentlyAddedReceipts.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-3xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-emerald-900 block font-black">
                    Reimbursement successfully integrated into the Official Expense Sheet!
                  </strong>
                  <span className="text-emerald-800">
                    New expense rows were added with Receipts{' '}
                    <strong className="underline">#{recentlyAddedReceipts.join(', #')}</strong> highlighted in green in the sheet below.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRecentlyAddedReceipts([])}
                className="px-3 py-1.5 bg-emerald-200/70 hover:bg-emerald-200 text-emerald-900 rounded-xl font-bold text-xs transition-colors flex-shrink-0 cursor-pointer"
              >
                Dismiss Highlight
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
                      placeholder="Search product, staff member, receipt #..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <select
                    value={expBudgetFilter}
                    onChange={(e) => setExpBudgetFilter(e.target.value as any)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ALL">All Budgets</option>
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
                    <option value="ALL">All Months</option>
                    <option value="10">October (10)</option>
                    <option value="11">November (11)</option>
                    <option value="12">December (12)</option>
                    <option value="01">January (01)</option>
                    <option value="02">February (02)</option>
                    <option value="03">March (03)</option>
                  </select>
                </div>

                {/* Quick Filter Chips: Expense Origin */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Origin:</span>
                  <button
                    onClick={() => setExpOriginFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expOriginFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Expenses ({expenses.length})
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
                    <span>Approved Reimbursements ({countReimbursementsExpenses})</span>
                  </button>
                  <button
                    onClick={() => setExpOriginFilter('DIRECT')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      expOriginFilter === 'DIRECT'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Direct Expenses ({countDirectExpenses})
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
                        <th className="py-2.5 px-2 text-center w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans">
                      {filteredExpenses.map((exp) => {
                        const isRecentlyAdded = recentlyAddedReceipts.includes(exp.receiptNumber);
                        const isReimbursement = Boolean(
                          exp.sourceReportId || (exp.product.toLowerCase().includes('reembolso') || exp.product.toLowerCase().includes('reimbursement'))
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
                                    New
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
                                      title="View photo of attached receipt"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {isReimbursement && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                      <CheckCircle2 className="w-3 h-3 text-purple-700" />
                                      Approved Reimbursement
                                    </span>
                                    {exp.sourceReportId && (
                                      <button
                                        onClick={() => {
                                          const rep = expenseReports.find((r) => r.id === exp.sourceReportId);
                                          if (rep) setSelectedReportDetail(rep);
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                                        title="View original reimbursement request form"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>View Original Report</span>
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
                                  title="Edit row"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                                  title="Remove row"
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
                  Budget Menu (Budgets)
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
                      Clear budget filter
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
      {/* SUB-TAB 4: PENDING REIMBURSEMENTS (REPORTS SUBMITTED BY STAFF)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'pendencias_reembolso' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Pending Reimbursement Queue ({pendingReports.length})
              </h3>
              <p className="text-xs text-slate-500">
                Reports filled out by staff and volunteers via the Expense Report form. Once approved, items are automatically added to the official expense sheet.
              </p>
            </div>

            <button
              onClick={() => setIsEmployeePortalOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#075e38] font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Simulate New Staff Report</span>
            </button>
          </div>

          {/* Pending List */}
          <div className="space-y-4">
            {pendingReports.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-base">
                  No reimbursements pending approval!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All expense reports submitted by staff have already been reviewed and processed in accounting.
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
                        <span className="text-xs text-slate-500">Date: {report.date}</span>
                      </div>
                      <h4 className="font-bold text-xs text-purple-900">
                        Final Purpose / Event: {report.event}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">
                        Total Requested
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
                          <th className="p-2.5">Budget Category</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5 text-right">Amount (EGP)</th>
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
                          <span>View Attached Proof of Payment (Photo)</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No receipt photo attached</span>
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
                        Reject
                      </button>

                      <button
                        onClick={() => handleApproveReimbursement(report)}
                        className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve and Post to Expenses</span>
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
              History of Already Processed Reimbursements
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
                          [Receipts in Sheet: #{r.assignedExpenseReceipts.join(', #')}]
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
                        {r.status === 'APROVADO'
                          ? 'Approved'
                          : r.status === 'REJEITADO'
                          ? 'Rejected'
                          : r.status === 'PENDENTE'
                          ? 'Pending'
                          : r.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW / EDIT REVENUE                                             */}
      {/* ========================================================================= */}
      {isRevModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingRevId ? 'Edit Revenue' : 'New Revenue Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configurable amounts across the 3 macro areas and official sub-areas
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
                  <label className="block font-bold text-slate-700 mb-1">Main Macro Area *</label>
                  <select
                    value={formRevMacro}
                    onChange={(e) => setFormRevMacro(e.target.value as AccountingMacroArea)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="CENTRO_COMUNITARIO">🏢 3. Community Center</option>
                    <option value="PRE_ESCOLA">🌻 2. Preschool</option>
                    <option value="LIXO">♻️ 1. Garbage (Recycle)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub-area *</label>
                  <select
                    value={formRevSub}
                    onChange={(e) => {
                      const val = e.target.value as RevenueSubArea;
                      setFormRevSub(val);
                      if (val === 'CURSO_INGLES') {
                        setFormRevAmount(2000);
                        setFormRevInstallment('Quarterly installment (2,000 EGP)');
                      } else if (val === 'PRE_ESCOLA') {
                        setFormRevAmount(9000);
                        setFormRevInstallment('Semester 1 (9,000 EGP)');
                      } else if (val === 'ACADEMIA_GINASTICA') {
                        setFormRevAmount(1500);
                        setFormRevInstallment('Monthly Tuition');
                      } else if (val === 'AULAS_FUTEBOL') {
                        setFormRevAmount(1200);
                        setFormRevInstallment('Monthly Tuition');
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="CURSO_INGLES">English Language Course (2,000 EGP)</option>
                    <option value="PRE_ESCOLA">Preschool (9,000 EGP per Semester)</option>
                    <option value="ACADEMIA_GINASTICA">Gym & Women's Gymnastics</option>
                    <option value="AULAS_FUTEBOL">Under-15 Soccer Lessons</option>
                    <option value="CANTINA">Community Cafeteria</option>
                    <option value="VENDA_LIXO">Recyclables Sales (Recycle)</option>
                    <option value="ALUGUEL_CAMPO_PINGPONG">Field & Ping Pong Rental</option>
                    <option value="SUMMER_CAMPING">Summer Camping</option>
                    <option value="OUTROS">Other Revenues</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title / Description *</label>
                <input
                  type="text"
                  required
                  value={formRevTitle}
                  onChange={(e) => setFormRevTitle(e.target.value)}
                  placeholder="Ex: English Language Course - Installment 2/3 (Teen)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount Received (EGP) * <span className="text-emerald-700">(editable)</span>
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
                  <label className="block font-bold text-slate-700 mb-1">Revenue Date *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Payer / Student Name</label>
                  <input
                    type="text"
                    value={formRevPayer}
                    onChange={(e) => setFormRevPayer(e.target.value)}
                    placeholder="Ex: Supplier name"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Installment Info</label>
                  <input
                    type="text"
                    value={formRevInstallment}
                    onChange={(e) => setFormRevInstallment(e.target.value)}
                    placeholder="Ex: Installment 2 of 3 (Teen)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formRevMethod}
                  onChange={(e) => setFormRevMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="DINHEIRO">Physical Cash (Counter / Rony)</option>
                  <option value="TRANSFERENCIA">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRevModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-black shadow-xs"
                >
                  Save Revenue
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
            <h4 className="font-extrabold text-sm text-slate-900">Edit Revenue Amount</h4>
            <p className="text-xs text-slate-600 font-medium">{quickEditRev.title}</p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                New Amount in EGP:
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEditAmount}
                className="px-5 py-2 bg-[#075e38] text-white rounded-xl text-xs font-black shadow-xs"
              >
                Save Amount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NEW / EDIT MANUAL EXPENSE                                        */}
      {/* ========================================================================= */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingExpId ? 'Edit Expense' : 'New Expense Sheet Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  Official template: Think Green Expense Report (sequential Receipt #)
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
                  Product / Service Description (Product) *
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
                  <label className="block font-bold text-slate-700 mb-1">Price (Price EGP) *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Date (DD/MM/YYYY) *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={formExpNotes}
                  onChange={(e) => setFormExpNotes(e.target.value)}
                  placeholder="Additional information..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl font-black shadow-xs"
                >
                  Save to Official Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REJECT REIMBURSEMENT                                              */}
      {/* ========================================================================= */}
      {isRejectModalOpen && selectedReportForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h4 className="font-extrabold text-sm text-slate-900">
              Reject Reimbursement — {selectedReportForReview.reportCode}
            </h4>
            <p className="text-xs text-slate-600">
              Please provide a justification so the staff member{' '}
              <strong>{selectedReportForReview.fullName}</strong> can review and correct it:
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Illegible receipt or expense not previously authorized..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleRejectReimbursement}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECEIPT PHOTO VIEWER (ENLARGED PROOF OF PAYMENT)                */}
      {/* ========================================================================= */}
      {selectedReceiptPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">Proof of Payment Preview</span>
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
                alt="Fiscal Receipt"
                className="max-h-[68vh] object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReceiptPhotoModal(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ORIGINAL REIMBURSEMENT REPORT DETAILS                           */}
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
                    Posted to Official Expenses
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-1.5">
                  {selectedReportDetail.event}
                </h3>
                <p className="text-xs text-slate-500">
                  Staff Member: <strong>{selectedReportDetail.fullName}</strong> • Submitted on:{' '}
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

            {/* Approval Audit */}
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">
                Accounting Approval Audit
              </span>
              <p className="text-slate-800">
                Approved by: <strong>{selectedReportDetail.reviewedBy || 'Accounting (Rony)'}</strong>{' '}
                {selectedReportDetail.reviewedAt && `on ${selectedReportDetail.reviewedAt}`}
              </p>
              {selectedReportDetail.assignedExpenseReceipts && (
                <p className="text-purple-900 font-bold">
                  Official Receipts in Sheet: #{selectedReportDetail.assignedExpenseReceipts.join(', #')}
                </p>
              )}
            </div>

            {/* Reimbursed Items List */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-700 uppercase">Reimbursed Items:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-right">Amount</th>
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
                        TOTAL REIMBURSED:
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm">
                        {formatCurrency(selectedReportDetail.totalAmount, 'EGP')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Receipt Photo */}
            {selectedReportDetail.receiptPhotoUrl && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase">Attached Proof of Payment:</span>
                  <button
                    onClick={() => setSelectedReceiptPhotoModal(selectedReportDetail.receiptPhotoUrl || null)}
                    className="text-xs text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Enlarge Image</span>
                  </button>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                  <img
                    src={selectedReportDetail.receiptPhotoUrl}
                    alt="Proof of Payment"
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
