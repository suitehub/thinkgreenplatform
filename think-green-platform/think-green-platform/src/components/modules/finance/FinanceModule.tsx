import React, { useState } from 'react';
import {
  CreditCard,
  Wallet,
  Receipt,
  ShieldAlert,
  PieChart,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Printer,
  Smartphone,
  Banknote,
  DollarSign,
  Plus,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { StatCard } from '../../common/StatCard';
import { Badge } from '../../common/Badge';
import { QuickPaymentModal } from '../../common/QuickPaymentModal';
import { ReceiptModal } from '../../common/ReceiptModal';
import { Modal } from '../../common/Modal';
import { formatCurrency } from '../../../lib/storage';
import { Charge, PaymentReceipt, CashRegister } from '../../../types';

interface FinanceModuleProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({ currentTab, setCurrentTab }) => {
  const {
    state,
    openCashRegister,
    closeCashRegister,
  } = useApp();

  const [activePaymentCharge, setActivePaymentCharge] = useState<Charge | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [searchChargeQuery, setSearchChargeQuery] = useState('');
  const [chargeStatusFilter, setChargeStatusFilter] = useState('ALL');

  // Cash Register State
  const activeRegister = state.cashRegisters.find((r) => r.status === 'ABERTO') || state.cashRegisters[0];
  const [isOpenRegisterModal, setIsOpenRegisterModal] = useState(false);
  const [isCloseRegisterModal, setIsCloseRegisterModal] = useState(false);
  const [openAmount, setOpenAmount] = useState(1000);
  const [closeActualAmount, setCloseActualAmount] = useState(activeRegister?.currentBalance || 14850);

  // Filtered charges
  const filteredCharges = state.charges.filter((c) => {
    const matchesSearch =
      c.studentName.toLowerCase().includes(searchChargeQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchChargeQuery.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchChargeQuery.toLowerCase());

    const matchesStatus = chargeStatusFilter === 'ALL' || c.status === chargeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Overdue students list
  const overdueCharges = state.charges.filter((c) => c.status === 'EM ATRASO');
  const totalOverdueAmount = overdueCharges.reduce((acc, c) => acc + c.amount, 0);

  // Total collected calculation
  const totalCollectedToday = state.receipts.reduce((acc, r) => acc + r.amount, 0);
  const totalCash = state.receipts.reduce((acc, r) => acc + r.amount, 0);

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    openCashRegister(openAmount);
    setIsOpenRegisterModal(false);
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    closeCashRegister(activeRegister.id, closeActualAmount);
    setIsCloseRegisterModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP FINANCE HERO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Setor Financeiro & Tesouraria
            </span>
            <span className="text-xs text-slate-400">Cairo, Egito • Moeda: EGP (Libras Egípcias)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Gestão Financeira, Cobrança & Caixa PDV
          </h1>
          <p className="text-xs text-slate-500">
            Controle de fluxo de caixa diário e recebimentos físicos em dinheiro (balcão da secretaria/tesouraria) com liberação acadêmica em tempo real.
          </p>
        </div>

        {/* Cash Register Indicator */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Caixa Atual ({activeRegister?.status || 'FECHADO'})
            </span>
            <p className="font-mono text-base font-extrabold text-slate-900">
              {formatCurrency(activeRegister?.currentBalance || 0, 'EGP')}
            </p>
          </div>

          {activeRegister?.status === 'ABERTO' ? (
            <button
              onClick={() => {
                setCloseActualAmount(activeRegister.currentBalance);
                setIsCloseRegisterModal(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Lock className="w-4 h-4" /> Fechar Caixa
            </button>
          ) : (
            <button
              onClick={() => setIsOpenRegisterModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Unlock className="w-4 h-4" /> Abrir Caixa
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total em Caixa Hoje"
          value={formatCurrency(totalCollectedToday, 'EGP')}
          subtitle={`Dinheiro em espécie`}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Recebimento Físico (Balcão)"
          value={formatCurrency(totalCash, 'EGP')}
          subtitle="100% presencial em espécie"
          icon={Banknote}
          color="emerald"
        />
        <StatCard
          title="Inadimplência Ativa"
          value={formatCurrency(totalOverdueAmount, 'EGP')}
          subtitle={`${overdueCharges.length} parcelas vencidas`}
          icon={ShieldAlert}
          color="rose"
          onClick={() => setCurrentTab('fin_inadimplencia')}
        />
        <StatCard
          title="Recibos Emitidos"
          value={state.receipts.length}
          subtitle="Autenticados digitalmente"
          icon={Receipt}
          color="sky"
          onClick={() => setCurrentTab('fin_receipts')}
        />
      </div>

      {/* 3. TAB: MENSALIDADES & COBRANÇA */}
      {(currentTab === 'fin_home' || currentTab === 'fin_charges' || !currentTab) && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-700" />
                Controle de Mensalidades & Cobrança ({filteredCharges.length})
              </h2>
              <p className="text-xs text-slate-500">
                Recebimento rápido com emissão de recibo e desbloqueio imediato no Portal do Aluno
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por aluno ou STU..."
                  value={searchChargeQuery}
                  onChange={(e) => setSearchChargeQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <select
                value={chargeStatusFilter}
                onChange={(e) => setChargeStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="ALL">Todos os Status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="EM ATRASO">Em Atraso</option>
                <option value="PAGO">Quitados</option>
              </select>
            </div>
          </div>

          {/* Charges Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID Student</th>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Parcela</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCharges.map((chg) => (
                  <tr key={chg.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-mono font-bold text-purple-700">{chg.studentId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{chg.studentName}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{chg.courseName}</td>
                    <td className="px-4 py-3.5 font-mono">
                      {chg.installmentNumber} / {chg.totalInstallments}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{chg.dueDate}</td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                      {formatCurrency(chg.amount, 'EGP')}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={chg.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {chg.status === 'PAGO' ? (
                        <button
                          onClick={() => {
                            const rec = state.receipts.find((r) => r.chargeId === chg.id);
                            if (rec) setSelectedReceipt(rec);
                          }}
                          className="px-3 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Recibo
                        </button>
                      ) : (
                        <button
                          onClick={() => setActivePaymentCharge(chg)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-2xs"
                        >
                          Registrar Pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: CONTROLE DE CAIXA PDV */}
      {currentTab === 'fin_cash_register' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Controle Diário de Caixa & Balcão (PDV)
              </h2>
              <p className="text-xs text-slate-500">
                Abertura, fechamento, sangrias e relatórios de conferência financeira.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400">Saldo Atual em Dinheiro:</span>
              <p className="text-2xl font-black font-mono text-emerald-700">
                {formatCurrency(activeRegister?.currentBalance || 0, 'EGP')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Saldo de Abertura</span>
              <p className="text-xl font-bold font-mono text-slate-900">
                {formatCurrency(activeRegister?.openingBalance || 0, 'EGP')}
              </p>
              <p className="text-[11px] text-slate-500">Aberto por: {activeRegister?.openedBy}</p>
            </div>

            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
              <span className="text-xs text-emerald-800 font-bold uppercase">Entradas Físicas em Dinheiro</span>
              <p className="text-xl font-bold font-mono text-emerald-950">
                +{formatCurrency(totalCash, 'EGP')}
              </p>
              <p className="text-[11px] text-emerald-700">100% recebimentos no balcão</p>
            </div>

            <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-1">
              <span className="text-xs text-purple-800 font-bold uppercase">Recibos Emitidos no Balcão</span>
              <p className="text-xl font-bold font-mono text-purple-950">
                {state.receipts.length} recibos
              </p>
              <p className="text-[11px] text-purple-700">Autenticados presencialmente</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: RECIBOS EMITIDOS */}
      {currentTab === 'fin_receipts' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-700" />
                Arquivo de Recibos Oficiais ({state.receipts.length})
              </h2>
              <p className="text-xs text-slate-500">
                Documentos emitidos com autenticação e valor legal do Think Green Community Center.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {state.receipts.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {rec.receiptNumber}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{rec.studentName}</span>
                    <span className="text-slate-400 font-mono">({rec.studentId})</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    {rec.courseName} • {rec.installmentDescription}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Emitido por {rec.issuedBy} em {rec.date} via {rec.paymentMethod}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-black font-mono text-emerald-700">
                    {formatCurrency(rec.amount, 'EGP')}
                  </span>
                  <button
                    onClick={() => setSelectedReceipt(rec)}
                    className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Visualizar & Imprimir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB: INADIMPLÊNCIA & GATES */}
      {currentTab === 'fin_inadimplencia' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Painel de Inadimplência & Regras de Acesso
              </h2>
              <p className="text-xs text-slate-500">
                Alunos com parcelas vencidas sofrem bloqueio automático de provas conforme a política institucional.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Vencido:</span>
              <p className="text-2xl font-black font-mono text-rose-600">
                {formatCurrency(totalOverdueAmount, 'EGP')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {overdueCharges.map((chg) => (
              <div
                key={chg.id}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{chg.studentName}</span>
                    <span className="font-mono text-purple-700 font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                      {chg.studentId}
                    </span>
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                      Vencido em {chg.dueDate}
                    </span>
                  </div>
                  <p className="text-slate-700 mt-1">
                    Curso: {chg.courseName} • Parcela {chg.installmentNumber}/{chg.totalInstallments}
                  </p>
                  <p className="text-rose-700 font-semibold text-[11px] mt-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Acesso à avaliação final bloqueado pelo sistema
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-black font-mono text-rose-700">
                    {formatCurrency(chg.amount, 'EGP')}
                  </span>
                  <button
                    onClick={() => setActivePaymentCharge(chg)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs"
                  >
                    Receber & Desbloquear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Abrir Caixa */}
      <Modal
        isOpen={isOpenRegisterModal}
        onClose={() => setIsOpenRegisterModal(false)}
        title="Abrir Novo Caixa Diário (PDV)"
      >
        <form onSubmit={handleOpenRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Fundo de Troco / Saldo Inicial (EGP)
            </label>
            <input
              type="number"
              min="0"
              required
              value={openAmount}
              onChange={(e) => setOpenAmount(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpenRegisterModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
            >
              Confirmar Abertura
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Fechar Caixa */}
      <Modal
        isOpen={isCloseRegisterModal}
        onClose={() => setIsCloseRegisterModal(false)}
        title="Fechamento & Sangria de Caixa"
      >
        <form onSubmit={handleCloseRegister} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="text-slate-500 font-medium">Saldo Calculado pelo Sistema:</p>
            <p className="text-lg font-black font-mono text-slate-900">
              {formatCurrency(activeRegister?.currentBalance || 0, 'EGP')}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Valor Físico em Dinheiro Conferido na Gaveta (EGP)
            </label>
            <input
              type="number"
              min="0"
              required
              value={closeActualAmount}
              onChange={(e) => setCloseActualAmount(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm font-bold"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCloseRegisterModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
            >
              Fechar Caixa & Emitir Sangria
            </button>
          </div>
        </form>
      </Modal>

      {/* Modals */}
      <QuickPaymentModal
        charge={activePaymentCharge}
        isOpen={!!activePaymentCharge}
        onClose={() => setActivePaymentCharge(null)}
        onSuccess={(rec) => setSelectedReceipt(rec)}
      />

      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
