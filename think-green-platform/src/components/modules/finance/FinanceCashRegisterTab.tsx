import React, { useState } from 'react';
import {
  Wallet,
  Lock,
  Unlock,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../common/Modal';
import { formatCurrency } from '../../../lib/storage';

export const FinanceCashRegisterTab: React.FC = () => {
  const { state, openCashRegister, closeCashRegister } = useApp();

  const activeRegister =
    state.cashRegisters.find((r) => r.status === 'ABERTO') || state.cashRegisters[0];

  const [isOpenRegisterModal, setIsOpenRegisterModal] = useState(false);
  const [isCloseRegisterModal, setIsCloseRegisterModal] = useState(false);
  const [openAmount, setOpenAmount] = useState(1000);
  const [closeActualAmount, setCloseActualAmount] = useState(activeRegister?.currentBalance || 14850);

  const totalCollectedToday = state.receipts.reduce((acc, r) => acc + r.amount, 0);

  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    openCashRegister(openAmount);
    setIsOpenRegisterModal(false);
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRegister) {
      closeCashRegister(activeRegister.id, closeActualAmount);
    }
    setIsCloseRegisterModal(false);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#075e38]" />
            Controle de Caixa & Balcão (PDV)
          </h2>
          <p className="text-xs text-slate-400">
            Abertura, fechamento diário, conferência física em gaveta e sangrias financeiras
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Status Caixa
            </span>
            <span
              className={`text-xs font-bold ${
                activeRegister?.status === 'ABERTO' ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              {activeRegister?.status || 'FECHADO'}
            </span>
          </div>

          {activeRegister?.status === 'ABERTO' ? (
            <button
              onClick={() => {
                setCloseActualAmount(activeRegister.currentBalance);
                setIsCloseRegisterModal(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Fechar Caixa & Sangria
            </button>
          ) : (
            <button
              onClick={() => setIsOpenRegisterModal(true)}
              className="px-4 py-2.5 bg-[#075e38] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Unlock className="w-4 h-4" /> Abrir Novo Caixa
            </button>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Saldo de Abertura</span>
          <p className="text-xl font-black font-mono text-slate-900">
            {formatCurrency(activeRegister?.openingBalance || 0, 'EGP')}
          </p>
          <p className="text-[11px] text-slate-500">Operador: {activeRegister?.openedBy || 'Tesouraria'}</p>
        </div>

        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
          <span className="text-xs text-emerald-800 font-bold uppercase">Entradas Físicas (Balcão)</span>
          <p className="text-xl font-black font-mono text-emerald-950">
            +{formatCurrency(totalCollectedToday, 'EGP')}
          </p>
          <p className="text-[11px] text-emerald-700">100% recebimentos no balcão</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Recibos Emitidos Hoje</span>
          <p className="text-xl font-black font-mono text-slate-900">
            {state.receipts.length} recibos
          </p>
          <p className="text-[11px] text-slate-500">Autenticados com valor fiscal</p>
        </div>
      </div>

      {/* Cash Movement Log Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
          Histórico de Sessões de Caixa
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Sessão ID</th>
                <th className="px-4 py-3">Data Abertura</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Abertura</th>
                <th className="px-4 py-3">Saldo Atual / Fechamento</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.cashRegisters.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-bold text-[#075e38]">{reg.id}</td>
                  <td className="px-4 py-3 text-slate-600">{reg.openedAt}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{reg.openedBy}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(reg.openingBalance, 'EGP')}</td>
                  <td className="px-4 py-3 font-bold font-mono text-slate-900">
                    {formatCurrency(reg.currentBalance, 'EGP')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        reg.status === 'ABERTO'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Open Register */}
      <Modal
        isOpen={isOpenRegisterModal}
        onClose={() => setIsOpenRegisterModal(false)}
        title="Abrir Novo Caixa Diário (PDV)"
      >
        <form onSubmit={handleOpenRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Fundo de Troco / Saldo Inicial em Gaveta (EGP)
            </label>
            <input
              type="number"
              min="0"
              required
              value={openAmount ?? 0}
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
              className="px-4 py-2 bg-[#075e38] text-white rounded-xl font-bold hover:bg-emerald-800"
            >
              Confirmar Abertura
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Close Register */}
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
              value={closeActualAmount ?? 0}
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
    </div>
  );
};
