import React, { useState } from 'react';
import {
  DollarSign,
  ArrowDown,
  Wallet,
  FileText,
  Coins,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  XCircle,
  MoreVertical,
  PlusCircle,
  Receipt as ReceiptIcon,
  BarChart3,
  CheckCircle2,
  Printer,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../lib/storage';
import { Charge, PaymentReceipt } from '../../../types';

interface FinanceOverviewTabProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewChargeModal: () => void;
  onOpenQuickPaymentModal: (charge?: Charge) => void;
  onViewReceipt: (receipt: PaymentReceipt) => void;
}

export const FinanceOverviewTab: React.FC<FinanceOverviewTabProps> = ({
  onNavigateTab,
  onOpenNewChargeModal,
  onOpenQuickPaymentModal,
  onViewReceipt,
}) => {
  const { state } = useApp();
  const [cashFlowRange, setCashFlowRange] = useState('6_meses');

  // Compute metrics from actual system data only (no demo fallbacks).
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  const parseDate = (value?: string): Date | null => {
    if (!value) return null;
    const brazilian = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brazilian) {
      return new Date(Number(brazilian[3]), Number(brazilian[2]) - 1, Number(brazilian[1]));
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isSameMonth = (value: string | undefined, reference: Date) => {
    const date = parseDate(value);
    return date
      ? date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
      : false;
  };

  const totalCharges = state.charges;
  const billableCharges = totalCharges.filter((c) => c.status !== 'CANCELADO');
  const paidCharges = totalCharges.filter((c) => c.status === 'PAGO');
  const overdueCharges = totalCharges.filter((c) => c.status === 'EM ATRASO');
  const pendingCharges = totalCharges.filter((c) => c.status === 'PENDENTE');
  const regularCharges = totalCharges.filter((c) => c.status === 'REGULAR' || c.status === 'PAGO');
  const cancelledCharges = totalCharges.filter((c) => c.status === 'CANCELADO');

  const totalReceivables = billableCharges.reduce((acc, c) => acc + c.amount, 0);

  const paidThisMonth = paidCharges.filter((c) => isSameMonth(c.paidAt || c.dueDate, now));
  const totalRevenueMonth = paidThisMonth.reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);

  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthRevenue = paidCharges
    .filter((c) => isSameMonth(c.paidAt || c.dueDate, previousMonth))
    .reduce((acc, c) => acc + (c.paidAmount || c.amount), 0);
  const revenueVariation =
    previousMonthRevenue > 0
      ? ((totalRevenueMonth - previousMonthRevenue) / previousMonthRevenue) * 100
      : null;

  const totalOverdue = overdueCharges.reduce((acc, c) => acc + c.amount, 0);

  const receiptsToday = state.receipts.filter((r) => {
    const date = parseDate(r.date);
    return date ? date.getTime() >= startOfToday && date.getTime() <= endOfToday : false;
  });
  const totalReceivedToday = receiptsToday.reduce((acc, r) => acc + r.amount, 0);

  const sevenDaysAhead = endOfToday + 7 * 24 * 60 * 60 * 1000;
  const upcomingCharges = pendingCharges.filter((c) => {
    const date = parseDate(c.dueDate);
    return date ? date.getTime() >= startOfToday && date.getTime() <= sevenDaysAhead : false;
  });
  const totalUpcoming7Days = upcomingCharges.reduce((acc, c) => acc + c.amount, 0);

  // Expenses come from the real accounting ledger for the current month.
  const totalExpensesMonth = state.accountingTransactions
    .filter((tx) => tx.type === 'DESPESA' && isSameMonth(tx.date, now))
    .reduce((acc, tx) => acc + tx.amount, 0);
  const netBalanceMonth = totalRevenueMonth - totalExpensesMonth;

  // Percentage calculations
  const overduePercent =
    totalReceivables > 0 ? ((totalOverdue / totalReceivables) * 100).toFixed(1).replace('.', ',') : '0,0';
  const totalFlowMonth = totalRevenueMonth + totalExpensesMonth;
  const revenuePercentOfTotal =
    totalFlowMonth > 0 ? ((totalRevenueMonth / totalFlowMonth) * 100).toFixed(1).replace('.', ',') : '0,0';
  const expensePercentOfTotal =
    totalFlowMonth > 0 ? ((totalExpensesMonth / totalFlowMonth) * 100).toFixed(1).replace('.', ',') : '0,0';

  // 6 Months Chart Data derived from real receipts and accounting transactions.
  const cashFlowMonths = Array.from({ length: 6 }, (_, index) => {
    const reference = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const revenue = state.receipts
      .filter((r) => isSameMonth(r.date, reference))
      .reduce((acc, r) => acc + r.amount, 0);
    const expense = state.accountingTransactions
      .filter((tx) => tx.type === 'DESPESA' && isSameMonth(tx.date, reference))
      .reduce((acc, tx) => acc + tx.amount, 0);
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
      .format(reference)
      .replace('.', '')
      .replace(' de ', '/');
    return { label: label.charAt(0).toUpperCase() + label.slice(1), revenue, expense };
  });

  const chartTop = 15;
  const chartBottom = 145;
  const chartLeft = 50;
  const chartRight = 400;
  const chartMax = Math.max(1000, ...cashFlowMonths.flatMap((m) => [m.revenue, m.expense]));
  const chartX = (index: number) =>
    chartLeft + (index * (chartRight - chartLeft)) / Math.max(1, cashFlowMonths.length - 1);
  const chartY = (value: number) => chartBottom - (value / chartMax) * (chartBottom - chartTop);
  const revenuePoints = cashFlowMonths.map((m, i) => ({ x: chartX(i), y: chartY(m.revenue) }));
  const expensePoints = cashFlowMonths.map((m, i) => ({ x: chartX(i), y: chartY(m.expense) }));
  const toPolyline = (points: { x: number; y: number }[]) =>
    points.map((p) => `${p.x},${p.y}`).join(' ');
  const compactValue = (value: number) =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));

  const donutCircumference = 2 * Math.PI * 36;
  const donutRevenueShare = totalFlowMonth > 0 ? totalRevenueMonth / totalFlowMonth : 0;
  const donutRevenueLength = donutCircumference * donutRevenueShare;
  const donutExpenseLength = donutCircumference - donutRevenueLength;

  // Accounts Receivable Breakdown Items (real data only)
  const percentOfReceivables = (amount: number) =>
    totalReceivables > 0 ? `${((amount / totalReceivables) * 100).toFixed(1).replace('.', ',')}%` : '0,0%';

  const inDayAmount = regularCharges.reduce((acc, c) => acc + c.amount, 0);
  const inDayCount = regularCharges.length;
  const inDayPct = percentOfReceivables(inDayAmount);

  const upcomingAmount = totalUpcoming7Days;
  const upcomingCount = upcomingCharges.length;
  const upcomingPct = percentOfReceivables(upcomingAmount);

  const overdueAmount = totalOverdue;
  const overdueCount = overdueCharges.length;
  const overduePct = percentOfReceivables(overdueAmount);

  const cancelledAmount = cancelledCharges.reduce((acc, c) => acc + c.amount, 0);
  const cancelledCount = cancelledCharges.length;
  const cancelledPct = percentOfReceivables(cancelledAmount);

  // Format payment methods cleanly (Dinheiro Físico ou Transferência Bancária)
  const formatPaymentMethod = (method?: string) => {
    switch (method) {
      case 'TRANSFERENCIA':
        return 'Transferência Bancária';
      case 'DINHEIRO':
      default:
        return 'Dinheiro Físico';
    }
  };

  // Recent transactions list
  const recentReceipts = state.receipts.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP 4 METRIC CARDS (Exact Row Layout)                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: RECEITAS DO MÊS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#075e38] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
              <span>EGP</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                RECEITAS DO MÊS
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-sans">
                {formatCurrency(totalRevenueMonth, 'EGP')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2">
            <span
              className={`text-xs font-bold ${
                revenueVariation === null
                  ? 'text-slate-400'
                  : revenueVariation >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-500'
              }`}
            >
              {revenueVariation === null
                ? 'Sem base de comparação no mês anterior'
                : `${revenueVariation >= 0 ? '+' : ''}${revenueVariation
                    .toFixed(1)
                    .replace('.', ',')}% vs mês anterior`}
            </span>
            {/* Green Sparkline Curve */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
              <path
                d="M 2 18 Q 20 22 40 10 T 78 4"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 2: INADIMPLÊNCIA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                INADIMPLÊNCIA
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-sans">
                {formatCurrency(totalOverdue, 'EGP')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2">
            <span className="text-xs font-medium text-rose-500">
              {overduePercent}% do total a receber
            </span>
            {/* Red Sparkline Curve */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
              <path
                d="M 2 6 Q 25 18 50 14 T 78 20"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 3: RECEBIDO HOJE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                RECEBIDO HOJE
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-sans">
                {formatCurrency(totalReceivedToday, 'EGP')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2">
            <span className="text-xs font-medium text-blue-600">
              {receiptsToday.length} recebimentos
            </span>
            {/* Blue Sparkline Curve */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
              <path
                d="M 2 16 Q 20 8 40 18 T 78 6"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* CARD 4: A VENCER (7 DIAS) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                A VENCER (7 DIAS)
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 font-sans">
                {formatCurrency(totalUpcoming7Days, 'EGP')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2">
            <span className="text-xs font-medium text-amber-600">
              {upcomingCount} cobranças
            </span>
            {/* Orange Sparkline Curve */}
            <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24">
              <path
                d="M 2 12 Q 22 4 45 16 T 78 8"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE ROW (3 COLUMNS: Donut, Line Chart, Accounts Summary)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLUMN 1 (4/12): RECEITAS X DESPESAS (MÊS ATUAL) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            RECEITAS X DESPESAS (MÊS ATUAL)
          </h2>

          {/* Donut Chart with Legend */}
          <div className="flex items-center justify-between gap-3 my-auto py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                />
                {/* Green Segment (Receitas) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#075e38"
                  strokeWidth="18"
                  strokeDasharray={`${donutRevenueLength} ${donutCircumference}`}
                  strokeLinecap="butt"
                />
                {/* Red Segment (Despesas) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#ef4444"
                  strokeWidth="18"
                  strokeDasharray={`${donutExpenseLength} ${donutCircumference}`}
                  strokeDashoffset={-donutRevenueLength}
                  strokeLinecap="butt"
                />
              </svg>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-3 flex-1 min-w-0">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#075e38]" />
                  <span className="text-xs font-bold text-slate-700">Receitas</span>
                </div>
                <p className="text-xs font-black text-slate-900 mt-0.5">
                  {formatCurrency(totalRevenueMonth, 'EGP')}
                  <span className="text-[11px] font-medium text-slate-400 ml-1.5">
                    {revenuePercentOfTotal}%
                  </span>
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="text-xs font-bold text-slate-700">Despesas</span>
                </div>
                <p className="text-xs font-black text-slate-900 mt-0.5">
                  {formatCurrency(totalExpensesMonth, 'EGP')}
                  <span className="text-[11px] font-medium text-slate-400 ml-1.5">
                    {expensePercentOfTotal}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Subcard: Saldo do mês */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10.5px] font-medium text-slate-500 block">Saldo do mês</span>
                <span className="text-base font-black text-emerald-950 font-sans leading-tight">
                  {formatCurrency(netBalanceMonth, 'EGP')}
                </span>
              </div>
            </div>

            <div className="text-emerald-700 pr-1">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* COLUMN 2 (5/12): FLUXO DE CAIXA (ÚLTIMOS 6 MESES) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          {/* Header with Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              FLUXO DE CAIXA (ÚLTIMOS 6 MESES)
            </h2>
            <select
              value={cashFlowRange}
              onChange={(e) => setCashFlowRange(e.target.value)}
              className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs"
            >
              <option value="6_meses">6 meses</option>
              <option value="12_meses">12 meses</option>
              <option value="ano_atual">Ano 2026</option>
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#075e38] rotate-45" />
              <span>Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444] rotate-45" />
              <span>Despesas</span>
            </div>
          </div>

          {/* SVG Curved Spline Line Chart */}
          <div className="relative h-44 w-full pt-2">
            <svg className="w-full h-full" viewBox="0 0 420 160">
              {/* Y Axis Grid lines */}
              {[1, 0.75, 0.5, 0.25, 0].map((step) => {
                const y = chartBottom - step * (chartBottom - chartTop);
                return (
                  <g key={`grid-${step}`}>
                    <line
                      x1={chartLeft - 10}
                      y1={y}
                      x2="410"
                      y2={y}
                      stroke={step === 0 ? '#cbd5e1' : '#f1f5f9'}
                      strokeWidth="1"
                    />
                    <text x={chartLeft - 18} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                      {compactValue(chartMax * step)}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {cashFlowMonths.map((month, index) => (
                <text
                  key={`month-${index}`}
                  x={chartX(index)}
                  y="158"
                  fill="#94a3b8"
                  fontSize="9.5"
                  textAnchor="middle"
                >
                  {month.label}
                </text>
              ))}

              {/* Red Line (Despesas) */}
              <polyline
                points={toPolyline(expensePoints)}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Green Line (Receitas) */}
              <polyline
                points={toPolyline(revenuePoints)}
                fill="none"
                stroke="#075e38"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots on Red Line */}
              {expensePoints.map((pt, i) => (
                <circle
                  key={`red-pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {/* Dots on Green Line */}
              {revenuePoints.map((pt, i) => (
                <circle
                  key={`green-pt-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#075e38"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>

          {/* Bottom text link */}
          <button
            onClick={() => onNavigateTab('fin_reports')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver relatório completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* COLUMN 3 (3/12): CONTAS A RECEBER (RESUMO) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            CONTAS A RECEBER (RESUMO)
          </h2>

          <div className="space-y-3.5 my-auto">
            {/* Em dia */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Em dia</p>
                  <p className="text-[10.5px] text-slate-400">{inDayCount} cobranças</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {formatCurrency(inDayAmount, 'EGP')}
                </p>
                <p className="text-[10.5px] font-semibold text-emerald-600">{inDayPct}</p>
              </div>
            </div>

            {/* A vencer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">A vencer</p>
                  <p className="text-[10.5px] text-slate-400">{upcomingCount} cobranças</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {formatCurrency(upcomingAmount, 'EGP')}
                </p>
                <p className="text-[10.5px] font-semibold text-amber-600">{upcomingPct}</p>
              </div>
            </div>

            {/* Vencidas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Vencidas</p>
                  <p className="text-[10.5px] text-slate-400">{overdueCount} cobranças</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {formatCurrency(overdueAmount, 'EGP')}
                </p>
                <p className="text-[10.5px] font-semibold text-rose-600">{overduePct}</p>
              </div>
            </div>

            {/* Canceladas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Canceladas</p>
                  <p className="text-[10.5px] text-slate-400">{cancelledCount} cobranças</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {formatCurrency(cancelledAmount, 'EGP')}
                </p>
                <p className="text-[10.5px] font-semibold text-blue-600">{cancelledPct}</p>
              </div>
            </div>
          </div>

          {/* Bottom text link */}
          <button
            onClick={() => onNavigateTab('fin_charges')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver todas as cobranças</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM ROW (2 COLUMNS: Recent Receipts Table + Quick Actions)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (8/12): ÚLTIMOS RECEBIMENTOS */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            ÚLTIMOS RECEBIMENTOS
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-bold">DATA</th>
                  <th className="pb-3 font-bold">ALUNO / RESPONSÁVEL</th>
                  <th className="pb-3 font-bold">DESCRIÇÃO</th>
                  <th className="pb-3 font-bold">FORMA DE PAGAMENTO</th>
                  <th className="pb-3 font-bold">VALOR</th>
                  <th className="pb-3 font-bold">STATUS</th>
                  <th className="pb-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentReceipts.length > 0 ? (
                  recentReceipts.map((rec) => {
                    const student = state.students.find((s) => s.studentId === rec.studentId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pr-2">
                          <span className="font-semibold text-slate-800 block">
                            {rec.date.split(' ')[0]}
                          </span>
                          {rec.date.includes(' ') && (
                            <span className="text-[10px] text-slate-400">
                              {rec.date.split(' ').slice(1).join(' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="font-bold text-slate-900 block">{rec.studentName}</span>
                          <span className="text-[10px] text-slate-400">
                            {student?.guardianName ? `Resp: ${student.guardianName}` : rec.studentId}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="text-slate-700 font-medium block">
                            {rec.installmentDescription || '—'}
                          </span>
                          <span className="text-[10.5px] text-slate-400">{rec.courseName}</span>
                        </td>
                        <td className="py-3.5 pr-2 font-medium text-slate-600">
                          {formatPaymentMethod(rec.paymentMethod)}
                        </td>
                        <td className="py-3.5 pr-2 font-bold text-slate-900 font-mono">
                          {formatCurrency(rec.amount, 'EGP')}
                        </td>
                        <td className="py-3.5 pr-2">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10.5px] border border-emerald-200/60 inline-flex items-center">
                            Pago
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => onViewReceipt(rec)}
                            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Ver Recibo Oficial"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Nenhum recebimento registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom text link */}
          <button
            onClick={() => onNavigateTab('fin_receipts')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1 pt-1 cursor-pointer"
          >
            <span>Ver todos os recebimentos</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT COLUMN (4/12): AÇÕES RÁPIDAS */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col space-y-3">
          <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
            AÇÕES RÁPIDAS
          </h2>

          <div className="space-y-2">
            {/* 1. Nova cobrança */}
            <button
              onClick={onOpenNewChargeModal}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50/40 hover:bg-emerald-100/60 border border-emerald-100/80 text-left transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                Nova cobrança
              </span>
            </button>

            {/* 2. Registrar recebimento */}
            <button
              onClick={() => onOpenQuickPaymentModal()}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50/40 hover:bg-emerald-100/60 border border-emerald-100/80 text-left transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                Registrar recebimento
              </span>
            </button>

            {/* 3. Emitir recibo */}
            <button
              onClick={() => onNavigateTab('fin_receipts')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50/40 hover:bg-emerald-100/60 border border-emerald-100/80 text-left transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <ReceiptIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                Emitir recibo
              </span>
            </button>

            {/* 4. Gerar relatório */}
            <button
              onClick={() => onNavigateTab('fin_reports')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50/40 hover:bg-emerald-100/60 border border-emerald-100/80 text-left transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                Gerar relatório
              </span>
            </button>

            {/* 5. Gerenciar inadimplência */}
            <button
              onClick={() => onNavigateTab('fin_inadimplencia')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-50/40 hover:bg-rose-100/60 border border-rose-100/80 text-left transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-rose-950">
                Gerenciar inadimplência
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
