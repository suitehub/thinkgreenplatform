import React, { useState } from 'react';
import { Receipt, Search, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { formatCurrency } from '../../../lib/storage';
import { PaymentReceipt } from '../../../types';

interface FinanceReceiptsTabProps {
  onViewReceipt: (receipt: PaymentReceipt) => void;
}

export const FinanceReceiptsTab: React.FC<FinanceReceiptsTabProps> = ({ onViewReceipt }) => {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReceipts = state.receipts.filter((r) => {
    return (
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#075e38]" />
            Arquivo de Recibos Emitidos ({filteredReceipts.length})
          </h2>
          <p className="text-xs text-slate-400">
            Documentos fiscais e comprovantes oficiais emitidos pela tesouraria
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nº do Recibo, Aluno ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Receipts List */}
      <div className="space-y-3">
        {filteredReceipts.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-[#075e38]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs group"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-[#075e38] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-xs">
                  {rec.receiptNumber}
                </span>
                <span className="font-bold text-slate-900 text-sm">{rec.studentName}</span>
                <span className="text-slate-400 font-mono">({rec.studentId})</span>
              </div>
              <p className="text-slate-600 mt-1 font-medium">
                {rec.courseName} • {rec.installmentDescription}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Emitido por {rec.issuedBy} em {rec.date} • Forma: {rec.paymentMethod}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
              <span className="text-base font-black font-mono text-emerald-800">
                {formatCurrency(rec.amount, 'EGP')}
              </span>
              <button
                onClick={() => onViewReceipt(rec)}
                className="px-4 py-2 text-xs font-bold text-[#075e38] bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" /> Visualizar & Imprimir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
