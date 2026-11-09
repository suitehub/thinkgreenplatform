import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../lib/storage';

const parseLocalDate = (value?: string): Date | null => {
  if (!value) return null;
  const brazilian = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brazilian) {
    return new Date(Number(brazilian[3]), Number(brazilian[2]) - 1, Number(brazilian[1]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonth = (value: string | undefined, reference: Date) => {
  const date = parseLocalDate(value);
  return date
    ? date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
    : false;
};

const toMonthInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const FinanceReportsTab: React.FC = () => {
  const { state } = useApp();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInputValue(now));

  const [year, month] = selectedMonth.split('-').map(Number);
  const reference = new Date(year, (month || 1) - 1, 1);
  const previousReference = new Date(year, (month || 1) - 2, 1);

  const totalCharges = state.charges;
  const paidCharges = totalCharges.filter((c) => c.status === 'PAGO');
  const paidInMonth = paidCharges.filter((c) => isSameMonth(c.paidAt || c.dueDate, reference));
  const paidPreviousMonth = paidCharges.filter((c) =>
    isSameMonth(c.paidAt || c.dueDate, previousReference)
  );

  const totalRevenue = paidInMonth.reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);
  const previousRevenue = paidPreviousMonth.reduce(
    (acc, c) => acc + (c.paidAmount || c.amount),
    0
  );

  const totalExpenses = state.accountingTransactions
    .filter((tx) => tx.type === 'DESPESA' && isSameMonth(tx.date, reference))
    .reduce((acc, tx) => acc + tx.amount, 0);

  const netIncome = totalRevenue - totalExpenses;

  const revenueVariation =
    previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : null;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : null;
  const netMargin =
    totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : null;

  const formatPercent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#075e38]" />
            Demonstrativo de Resultados & Relatórios Financeiros (DRE)
          </h2>
          <p className="text-xs text-slate-400">
            Balanço consolidado de receitas operacionais, despesas e fluxo de caixa da instituição
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 shadow-2xs"
          />
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase">Receita Bruta Realizada</span>
          <p className="text-2xl font-black font-mono text-emerald-950">
            {formatCurrency(totalRevenue, 'EGP')}
          </p>
          <span
            className={`text-[11px] font-semibold flex items-center gap-1 ${
              revenueVariation === null
                ? 'text-slate-500'
                : revenueVariation >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-600'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {revenueVariation === null
              ? 'Sem base de comparação no mês anterior'
              : `${revenueVariation >= 0 ? '+' : ''}${formatPercent(revenueVariation)} vs mês anterior`}
          </span>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-1">
          <span className="text-xs font-bold text-rose-800 uppercase">Despesas Operacionais</span>
          <p className="text-2xl font-black font-mono text-rose-950">
            {formatCurrency(totalExpenses, 'EGP')}
          </p>
          <span className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            {expenseRatio === null
              ? 'Sem receita realizada no período'
              : `${formatPercent(expenseRatio)} da receita`}
          </span>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase">Superávit Líquido</span>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {formatCurrency(netIncome, 'EGP')}
          </p>
          <span className="text-[11px] text-slate-300 font-semibold">
            {netMargin === null
              ? 'Sem receita realizada no período'
              : `Margem Líquida: ${formatPercent(netMargin)}`}
          </span>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
          Detalhamento por Curso / Programa
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Programa / Curso</th>
                <th className="px-4 py-3">Matrículas Ativas</th>
                <th className="px-4 py-3">Receita Prevista</th>
                <th className="px-4 py-3">Receita Realizada</th>
                <th className="px-4 py-3">Adimplência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Nenhum curso cadastrado.
                  </td>
                </tr>
              ) : (
                state.courses.map((course) => {
                  const courseEnrollments = state.enrollments.filter(
                    (e) => e.courseId === course.id && e.status === 'ATIVO'
                  );
                  const coursePaidInMonth = paidInMonth.filter(
                    (c) => c.courseName === course.name
                  );
                  const expected = courseEnrollments.reduce(
                    (acc, e) => acc + (e.paymentPlan?.totalAmount || 0),
                    0
                  );
                  const realized = coursePaidInMonth.reduce(
                    (acc, c) => acc + (c.paidAmount || c.amount),
                    0
                  );
                  const rate = expected > 0 ? (realized / expected) * 100 : null;

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{course.name}</td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {courseEnrollments.length}{' '}
                        {courseEnrollments.length === 1 ? 'aluno' : 'alunos'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {formatCurrency(expected, 'EGP')}
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono text-emerald-800">
                        {formatCurrency(realized, 'EGP')}
                      </td>
                      <td className="px-4 py-3.5">
                        {rate === null || !Number.isFinite(rate) ? (
                          <span className="text-slate-400 font-semibold">—</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[11px] border border-emerald-200">
                            {rate.toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
