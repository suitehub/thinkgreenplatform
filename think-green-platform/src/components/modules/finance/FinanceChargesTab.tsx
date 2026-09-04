import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Receipt,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../lib/storage';
import { Charge, PaymentReceipt } from '../../../types';

interface FinanceChargesTabProps {
  onOpenQuickPaymentModal: (charge: Charge) => void;
  onViewReceipt: (receipt: PaymentReceipt) => void;
  onOpenNewChargeModal: () => void;
}

export const FinanceChargesTab: React.FC<FinanceChargesTabProps> = ({
  onOpenQuickPaymentModal,
  onViewReceipt,
  onOpenNewChargeModal,
}) => {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredCharges = state.charges.filter((c) => {
    const matchesSearch =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#075e38]" />
            Mensalidades & Cobranças ({filteredCharges.length})
          </h2>
          <p className="text-xs text-slate-400">
            Controle individual de parcelas, baixa e emissão de recibo com desbloqueio no portal do aluno
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewChargeModal}
            className="px-3.5 py-2 bg-[#075e38] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Nova Cobrança
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno, ID STU ou curso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 w-full sm:w-auto"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM ATRASO">Em Atraso (Vencidos)</option>
            <option value="PAGO">Quitados (Pagos)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
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
              <tr key={chg.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3.5 font-mono font-bold text-[#075e38]">{chg.studentId}</td>
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
                        if (rec) onViewReceipt(rec);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Ver Recibo
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenQuickPaymentModal(chg)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#075e38] hover:bg-emerald-800 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Registrar Pagamento
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
