import React from 'react';
import { Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { PaymentReceipt } from '../../types';
import { Logo } from './Logo';
import { formatCurrency } from '../../lib/storage';

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Recibo Oficial de Pagamento</h3>
            <p className="text-xs text-slate-500 font-mono">{receipt.receiptNumber}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Autenticidade digital verificada pelo Think Green
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Recibo
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 rounded-xl hover:bg-purple-800 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      }
    >
      <div id="printable-receipt" className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Header with official logo */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <Logo size="md" />
          <div className="text-right">
            <span className="inline-block bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200">
              DOCUMENTO OFICIAL
            </span>
            <p className="text-xs font-mono text-slate-600 mt-1 font-semibold">{receipt.receiptNumber}</p>
            <p className="text-[11px] text-slate-400">{receipt.date}</p>
          </div>
        </div>

        {/* Institution Info */}
        <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-700">Think Green Community Center</p>
            <p>Cairo, Egito (جمهورية مصر العربية) • Setor Financeiro e Tesouraria</p>
          </div>
          <div className="text-right font-mono">
            <p className="text-[11px] text-emerald-600 font-semibold">STATUS: PAGO & CONFIRMADO</p>
          </div>
        </div>

        {/* Student & Payment Details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Aluno / Beneficiário:</span>
            <p className="text-sm font-bold text-slate-900">{receipt.studentName}</p>
            <p className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded inline-block">
              ID Student: {receipt.studentId}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-slate-400 font-medium">Curso / Atividade:</span>
            <p className="text-sm font-bold text-slate-900">{receipt.courseName}</p>
            <p className="text-slate-600">{receipt.installmentDescription}</p>
          </div>
        </div>

        {/* Amount Box */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Valor Total Pago
            </span>
            <h2 className="text-3xl font-extrabold text-emerald-950 font-mono">
              {formatCurrency(receipt.amount, 'EGP')}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Forma de Pagamento
            </span>
            <span className="inline-block bg-white text-emerald-800 font-bold text-xs px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs mt-1">
              Dinheiro em Espécie (Físico / Balcão)
            </span>
          </div>
        </div>

        {/* Metadata & Signatures */}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
          <div>
            <p className="font-medium text-slate-700">Responsável pela Emissão:</p>
            <p>{receipt.issuedBy}</p>
            {receipt.notes && <p className="italic text-slate-400 mt-1">"{receipt.notes}"</p>}
          </div>

          <div className="text-right flex flex-col items-end justify-center">
            <div className="w-36 border-b border-slate-300 pb-1 text-center font-serif text-[10px] text-slate-400">
              Assinatura / Carimbo
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Think Green Center • Tesouraria</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
