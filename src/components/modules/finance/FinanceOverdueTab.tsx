import React, { useState } from 'react';
import { ShieldAlert, Search, Lock, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../lib/storage';
import { Charge } from '../../../types';

interface FinanceOverdueTabProps {
  onOpenQuickPaymentModal: (charge: Charge) => void;
}

export const FinanceOverdueTab: React.FC<FinanceOverdueTabProps> = ({
  onOpenQuickPaymentModal,
}) => {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const overdueCharges = state.charges.filter((c) => {
    const isOverdue = c.status === 'EM ATRASO';
    const matches =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    return isOverdue && matches;
  });

  const totalOverdueAmount = overdueCharges.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Inadimplência & Regras de Acesso Acadêmico
          </h2>
          <p className="text-xs text-slate-400">
            Parcelas vencidas com bloqueio automático de avaliações e emissão de certificados
          </p>
        </div>

        <div className="text-right bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
          <span className="text-[10px] text-rose-600 font-bold uppercase block">Total Vencido</span>
          <p className="text-xl font-black font-mono text-rose-700 leading-tight">
            {formatCurrency(totalOverdueAmount, 'EGP')}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar inadimplente por nome ou ID STU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {overdueCharges.map((chg) => (
          <div
            key={chg.id}
            className="p-4 rounded-2xl border border-rose-200/80 bg-rose-50/30 hover:bg-rose-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs group"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-900 text-sm">{chg.studentName}</span>
                <span className="font-mono text-[#075e38] font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
                  {chg.studentId}
                </span>
                <span className="text-[10.5px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                  Vencido em {chg.dueDate}
                </span>
              </div>
              <p className="text-slate-700 mt-1 font-medium">
                Curso: {chg.courseName} • Parcela {chg.installmentNumber} de {chg.totalInstallments}
              </p>
              <p className="text-rose-700 font-semibold text-[11px] mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Acesso à avaliação final bloqueado pelo sistema
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-rose-200/60">
              <span className="text-base font-black font-mono text-rose-700">
                {formatCurrency(chg.amount, 'EGP')}
              </span>
              <button
                onClick={() => onOpenQuickPaymentModal(chg)}
                className="px-4 py-2 bg-[#075e38] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" /> Receber & Desbloquear
              </button>
            </div>
          </div>
        ))}

        {overdueCharges.length === 0 && (
          <div className="p-8 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Nenhuma parcela em atraso!</h3>
            <p className="text-xs text-slate-500">
              Todos os alunos estão em dia com seus pagamentos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
