import React, { useState } from 'react';
import { Banknote, Check, ShieldCheck, MapPin } from 'lucide-react';
import { Modal } from './Modal';
import { Charge, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/storage';

interface QuickPaymentModalProps {
  charge: Charge | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (receipt: any) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  charge,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerPayment } = useApp();
  const [method] = useState<PaymentMethod>('DINHEIRO');
  const [amount, setAmount] = useState<number>(charge?.amount || 500);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync amount when charge changes
  React.useEffect(() => {
    if (charge) {
      setAmount(charge.amount);
      setNotes(`Recebido em espécie no balcão da secretaria - Parcela ${charge.installmentNumber}/${charge.totalInstallments} de ${charge.courseName}`);
    }
  }, [charge]);

  if (!charge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const receipt = registerPayment(charge.id, amount, method, notes);
      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess(receipt);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Registrar Recebimento Físico no Caixa"
      subtitle="Recebimento em dinheiro em espécie no balcão da Secretaria / Tesouraria"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Confirmar Recebimento Físico & Emitir Recibo
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Physical Notice Banner */}
        <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/80 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 leading-relaxed">
            <strong>Norma Institucional:</strong> Os recebimentos são realizados <strong>exclusivamente em meio físico (dinheiro em espécie)</strong> na recepção/tesouraria do Think Green Community Center. Pagamentos online não são aceitos.
          </div>
        </div>

        {/* Student & Charge Summary Box */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-400 font-medium">Aluno:</span>
              <p className="text-sm font-bold text-slate-900">{charge.studentName}</p>
              <p className="font-mono text-purple-700 font-bold">{charge.studentId}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-medium">Curso / Parcela:</span>
              <p className="text-xs font-bold text-slate-800">{charge.courseName}</p>
              <p className="text-slate-500">
                Parcela {charge.installmentNumber} de {charge.totalInstallments}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Vencimento:</span>
            <span className="font-semibold text-slate-800">{charge.dueDate}</span>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Valor em Dinheiro Recebido no Caixa (EGP - Libras Egípcias)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
              EGP
            </span>
          </div>
        </div>

        {/* Single Physical Payment Method */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">Forma de Recebimento</label>
          <div className="p-3 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-emerald-950">Dinheiro em Espécie (Físico / Balcão)</p>
                <p className="text-[11px] text-emerald-700">Recebido presencialmente no caixa da secretaria/tesouraria</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-full">
              Físico
            </span>
          </div>
        </div>

        {/* Observations / Notes */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">
            Observações do Lançamento
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Recebido em dinheiro no balcão da secretaria"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Real-time automation notice */}
        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            <strong>Impacto em Tempo Real:</strong> A confirmação adiciona a entrada física ao Caixa Diário (PDV), gera o recibo impresso oficial, atualiza o livro contábil e libera automaticamente aulas e avaliações do aluno.
          </p>
        </div>
      </form>
    </Modal>
  );
};
