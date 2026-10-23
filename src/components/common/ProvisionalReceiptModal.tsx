import React from 'react';
import { Printer, Clock, AlertCircle, ShieldAlert, CheckCircle, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { PendingPayment } from '../../types';
import { Logo } from './Logo';
import { formatCurrency } from '../../lib/storage';

interface ProvisionalReceiptModalProps {
  payment: PendingPayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProvisionalReceiptModal: React.FC<ProvisionalReceiptModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPending = payment.status === 'PENDENTE';
  const isApproved = payment.status === 'APROVADO';
  const isRejected = payment.status === 'REPROVADO';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800'
                : isRejected
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isApproved ? (
              <CheckCircle className="w-4 h-4" />
            ) : isRejected ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Comprovante Provisório de Pré-Registro
            </h3>
            <p className="text-xs font-mono text-slate-500">
              {payment.provisionalReceiptNumber} • Protocolo: {payment.protocolNumber}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Pré-Registro efetuado na Recepção do Centro
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprovante
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-[#075e38] rounded-xl hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      }
    >
      <div id="printable-provisional-receipt" className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
        {/* Header with Logo & Stamp */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <Logo size="md" />
          <div className="text-right">
            <span
              className={`inline-block text-xs font-black px-3 py-1 rounded-full border ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isRejected
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isApproved
                ? '✓ HOMOLOGADO PELA TESOURARIA'
                : isRejected
                ? '✕ REPROVADO PELA TESOURARIA'
                : '⏳ PRÉ-REGISTRO PENDENTE DE VALIDAÇÃO'}
            </span>
            <p className="text-xs font-mono text-slate-700 mt-1.5 font-bold">
              {payment.provisionalReceiptNumber}
            </p>
            <p className="text-[11px] text-slate-400">{payment.registeredAt}</p>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            isApproved
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : isRejected
              ? 'bg-rose-50/80 border-rose-200 text-rose-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">
              {isApproved
                ? 'Pagamento Confirmado pela Tesouraria'
                : isRejected
                ? 'Pré-Registro Recusado pela Tesouraria'
                : 'Aguardando Conferência Física do Caixa'}
            </p>
            <p className="text-[11px] leading-relaxed">
              {isApproved
                ? `Este pagamento foi conferido fisicamente e aprovado pelo caixa. Recibo Oficial: ${payment.officialReceiptNumber || 'Disponível no sistema'}.`
                : isRejected
                ? `Motivo informado pela Tesouraria: "${payment.reviewNotes || 'Valores não conferiram'}"`
                : 'Este comprovante provisório atesta a entrega de valores no balcão da Recepção. A homologação oficial e liberação plena ocorre após o fechamento físico com a Tesouraria (Rony).'}
            </p>
          </div>
        </div>

        {/* Student & Course Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Estudante / Pagador:
            </span>
            <p className="text-sm font-black text-slate-900">{payment.studentName}</p>
            <p className="font-mono text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block text-[11px]">
              ID: {payment.studentId}
            </p>
          </div>
          <div className="space-y-1 text-left sm:text-right">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">
              Curso & Parcela:
            </span>
            <p className="text-sm font-bold text-slate-900">{payment.courseName}</p>
            <p className="text-slate-600 font-medium">
              Parcela {payment.installmentNumber} de {payment.totalInstallments}
            </p>
          </div>
        </div>

        {/* Amount Box */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              Valor Pré-Registrado
            </span>
            <h2 className="text-3xl font-black text-emerald-950 font-mono mt-0.5">
              {formatCurrency(payment.amount, 'EGP')}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Meio Informado
            </span>
            <span className="inline-block bg-white text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs mt-1">
              {payment.paymentMethod === 'DINHEIRO'
                ? '💵 Dinheiro em Espécie (Físico no Balcão)'
                : payment.paymentMethod === 'INSTAPAY_EG'
                ? '⚡ Instapay (Egito / Digital)'
                : payment.paymentMethod}
            </span>
          </div>
        </div>

        {/* Notes & Audit Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-4 text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Recebido no Balcão por:
            </span>
            <p className="font-bold text-slate-800">{payment.registeredBy}</p>
            {payment.receptionNotes && (
              <p className="italic text-slate-500 mt-1 text-[11px]">
                Obs. Recepção: "{payment.receptionNotes}"
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Conferência da Tesouraria:
            </span>
            {payment.reviewedBy ? (
              <>
                <p className="font-bold text-slate-800">{payment.reviewedBy}</p>
                <p className="text-[11px] text-slate-500">{payment.reviewedAt}</p>
              </>
            ) : (
              <p className="text-amber-700 font-bold text-[11px]">
                Aguardando conferência física (Rony)
              </p>
            )}
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="border-t border-dashed border-slate-200 pt-4 grid grid-cols-2 gap-6 text-[11px] text-slate-500">
          <div className="text-center pt-6 border-t border-slate-300">
            <p className="font-medium">Assinatura do Aluno / Responsável</p>
          </div>
          <div className="text-center pt-6 border-t border-slate-300">
            <p className="font-medium">Carimbo do Balcão da Recepção</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
