import {
  AccountingRevenue,
  AccountingExpenseItem,
  StaffExpenseReport,
  ExpenseCategory,
  ExpenseBudget,
} from '../../../types';
import { fetchCollectionStrict, subscribeCollection } from '../../../lib/firebase';
import { isLocalWritePending, syncCollectionDiff } from '../../../lib/cloud';

export const OFFICIAL_BUDGET_MENUS: ExpenseBudget[] = [
  'Preschool',
  'Community',
  'General',
  'Outreach',
  'Recycle',
];

export const OFFICIAL_BUDGET_CATEGORIES: ExpenseCategory[] = [
  "Translator's transportation",
  'ESF - AM Training',
  'Internet',
  'Mobile phone',
  'Arabic classes',
  'Computer',
  'Toner',
  'Ink for printer',
  'Electricity area TG / Volunteers houses',
  'Cleaning Supplies',
  'Maintenance Area TG / Volunteers houses',
  'Expenses and additional costs (General)',
  'Flowers and Trees',
  'Tools and equipment',
  'Gasoline (Motorcycle)',
  'Diesel (Loader)',
  'Maintenance (Loader and Motorcycle)',
  'Painting Supplies',
  'Expenses and additional costs (Recycle)',
  'Preschool Materials (books and educatio',
  'School supplements / cleaning',
  'Staff training',
  'Expenses and additional costs (Preschoo',
  'Books and materials - English',
  'Supplies for Soccer class / GYM',
  'Worker',
  'Expenses and additional costs (Communi',
  'Events, Outreach, and church planting act',
  'Volunteers Outreach',
];

// Firestore collections (single source of truth)
const ACCOUNTING_REVENUES_COLLECTION = 'accounting_revenues';
const ACCOUNTING_EXPENSES_COLLECTION = 'accounting_expenses';
const EXPENSE_REPORTS_COLLECTION = 'expense_reports';

// In-memory caches hydrated from Firestore before the app renders.
let accountingRevenuesCache: AccountingRevenue[] = [];
let accountingExpensesCache: AccountingExpenseItem[] = [];
let expenseReportsCache: StaffExpenseReport[] = [];

const accountingListeners = new Set<() => void>();

export function subscribeAccountingStore(listener: () => void): () => void {
  accountingListeners.add(listener);
  return () => {
    accountingListeners.delete(listener);
  };
}

function notifyAccountingStore(): void {
  queueMicrotask(() => {
    accountingListeners.forEach((listener) => listener());
  });
}

function sameSnapshot(previous: unknown, next: unknown): boolean {
  return JSON.stringify(previous) === JSON.stringify(next);
}

export interface AccountingCollections {
  revenues: AccountingRevenue[];
  expenses: AccountingExpenseItem[];
  reports: StaffExpenseReport[];
}

export async function loadAccountingCollections(): Promise<AccountingCollections> {
  const [revenues, expenses, reports] = await Promise.all([
    fetchCollectionStrict<AccountingRevenue>(ACCOUNTING_REVENUES_COLLECTION).catch(() => []),
    fetchCollectionStrict<AccountingExpenseItem>(ACCOUNTING_EXPENSES_COLLECTION).catch(() => []),
    fetchCollectionStrict<StaffExpenseReport>(EXPENSE_REPORTS_COLLECTION).catch(() => []),
  ]);
  return { revenues, expenses, reports };
}

export function hydrateAccountingData(data: Partial<AccountingCollections>): void {
  accountingRevenuesCache = data.revenues ?? [];
  accountingExpensesCache = data.expenses ?? [];
  expenseReportsCache = data.reports ?? [];
}

export function getStoredAccountingRevenues(): AccountingRevenue[] {
  return accountingRevenuesCache.slice();
}

export function saveStoredAccountingRevenues(revenues: AccountingRevenue[]): void {
  const previous = accountingRevenuesCache;
  const next = revenues.slice();
  accountingRevenuesCache = next;
  notifyAccountingStore();
  syncCollectionDiff(ACCOUNTING_REVENUES_COLLECTION, previous, next).catch((e) =>
    console.warn('[accounting] Falha ao salvar receitas no Firestore.', e)
  );
}

export function getStoredAccountingExpenses(): AccountingExpenseItem[] {
  return accountingExpensesCache.slice();
}

export function saveStoredAccountingExpenses(expenses: AccountingExpenseItem[]): void {
  const previous = accountingExpensesCache;
  const next = expenses.slice();
  accountingExpensesCache = next;
  notifyAccountingStore();
  syncCollectionDiff(ACCOUNTING_EXPENSES_COLLECTION, previous, next).catch((e) =>
    console.warn('[accounting] Falha ao salvar despesas no Firestore.', e)
  );
}

export function getStoredExpenseReports(): StaffExpenseReport[] {
  return expenseReportsCache.slice();
}

export function saveStoredExpenseReports(reports: StaffExpenseReport[]): void {
  const previous = expenseReportsCache;
  const next = reports.slice();
  expenseReportsCache = next;
  notifyAccountingStore();
  syncCollectionDiff(EXPENSE_REPORTS_COLLECTION, previous, next).catch((e) =>
    console.warn('[accounting] Falha ao salvar reembolsos no Firestore.', e)
  );
}

let accountingWatchStarted = false;

/** Keeps the accounting caches aligned with Firestore after the first load. */
export function startAccountingWatch(): void {
  if (accountingWatchStarted) return;
  accountingWatchStarted = true;

  subscribeCollection<AccountingRevenue>(ACCOUNTING_REVENUES_COLLECTION, (items) => {
    if (isLocalWritePending() || sameSnapshot(accountingRevenuesCache, items)) return;
    accountingRevenuesCache = items;
    notifyAccountingStore();
  });
  subscribeCollection<AccountingExpenseItem>(ACCOUNTING_EXPENSES_COLLECTION, (items) => {
    if (isLocalWritePending() || sameSnapshot(accountingExpensesCache, items)) return;
    accountingExpensesCache = items;
    notifyAccountingStore();
  });
  subscribeCollection<StaffExpenseReport>(EXPENSE_REPORTS_COLLECTION, (items) => {
    if (isLocalWritePending() || sameSnapshot(expenseReportsCache, items)) return;
    expenseReportsCache = items;
    notifyAccountingStore();
  });
}

/**
 * Formata qualquer data para DD/MM/YYYY padrão da Planilha de Gastos Excel
 */
export function formatDateToDDMMYYYY(dateStr?: string): string {
  if (!dateStr) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  }
  if (dateStr.includes('/')) return dateStr;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return dateStr;
}

/**
 * Garante que todos os relatórios com status 'APROVADO' estejam lançados
 * na planilha oficial de despesas (expenses).
 */
export function syncApprovedReportsIntoExpenses(
  currentExpenses: AccountingExpenseItem[],
  reports: StaffExpenseReport[]
): { updatedExpenses: AccountingExpenseItem[]; updatedReports: StaffExpenseReport[]; hasChanges: boolean } {
  let hasChanges = false;
  const runningExpenses = [...currentExpenses];
  let nextReceiptNo =
    runningExpenses.length > 0
      ? Math.max(...runningExpenses.map((e) => (typeof e.receiptNumber === 'number' ? e.receiptNumber : 0))) + 1
      : 1;

  const updatedReports = reports.map((report) => {
    if (report.status !== 'APROVADO') return report;

    // Verificar se já existe algum lançamento desta solicitação na planilha de gastos
    const alreadyLinked = runningExpenses.some(
      (e) =>
        e.sourceReportId === report.id ||
        (report.assignedExpenseReceipts && report.assignedExpenseReceipts.includes(e.receiptNumber))
    );

    if (!alreadyLinked && report.items && report.items.length > 0) {
      const assignedReceipts: number[] = [];
      report.items.forEach((item) => {
        const receiptNo = nextReceiptNo++;
        assignedReceipts.push(receiptNo);

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

        runningExpenses.push({
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

      hasChanges = true;
      return {
        ...report,
        assignedExpenseReceipts: assignedReceipts,
      };
    }

    return report;
  });

  return { updatedExpenses: runningExpenses, updatedReports, hasChanges };
}

