import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  Search,
  Eye,
  AlertTriangle,
  Receipt,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Building2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PendingPayment, PaymentReceipt } from '../../../types';
import { formatCurrency } from '../../../lib/storage';
import { Modal } from '../../common/Modal';
import { ProvisionalReceiptModal } from '../../common/ProvisionalReceiptModal';
import { ReceiptModal } from '../../common/ReceiptModal';

export const FinanceReceptionApprovalsTab: React.FC = () => {
  const { state, approvePendingPayment, rejectPendingPayment } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'APROVADO' | 'REPROVADO'>('PENDENTE');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedProvisionalPayment, setSelectedProvisionalPayment] = useState<PendingPayment | null>(null);
  const [selectedOfficialReceipt, setSelectedOfficialReceipt] = useState<PaymentReceipt | null>(null);

  // Approval Modal
  const [approvingPayment, setApprovingPayment] = useState<PendingPayment | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Modal
  const [rejectingPayment, setRejectingPayment] = useState<PendingPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Filtered pending payments
  const pendingPayments = state.pendingPayments || [];

  const filteredPayments = useMemo(() => {
    let list = pendingPayments;
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.protocolNumber.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.studentId.toLowerCase().includes(q) ||
          p.courseName.toLowerCase().includes(q) ||
          p.provisionalReceiptNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [pendingPayments, statusFilter, searchQuery]);

  // Statistics
  const pendingCount = useMemo(() => pendingPayments.filter((p) => p.status === 'PENDENTE').length, [pendingPayments]);
  const pendingAmount = useMemo(
    () => pendingPayments.filter((p) => p.status === 'PENDENTE').reduce((acc, p) => acc + p.amount, 0),
    [pendingPayments]
  );
  const pendingCashAmount = useMemo(
    () =>
      pendingPayments
        .filter((p) => p.status === 'PENDENTE' && p.paymentMethod === 'DINHEIRO')
        .reduce((acc, p) => acc + p.amount, 0),
    [pendingPayments]
  );
  const approvedCount = useMemo(() => pendingPayments.filter((p) => p.status === 'APROVADO').length, [pendingPayments]);
  const approvedAmount = useMemo(
    () => pendingPayments.filter((p) => p.status === 'APROVADO').reduce((acc, p) => acc + p.amount, 0),
    [pendingPayments]
  );
  const rejectedCount = useMemo(() => pendingPayments.filter((p) => p.status === 'REPROVADO').length, [pendingPayments]);

  const handleOpenApprove = (payment: PendingPayment) => {
    setApprovingPayment(payment);
    setApprovalNotes(`Dinheiro físico conferido na gaveta e conciliado por Rony / Tesouraria.`);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingPayment) return;
    setIsApproving(true);
    try {
      const result = approvePendingPayment(approvingPayment.id, approvalNotes);
      setIsApproving(false);
      setApprovingPayment(null);
      // Open the newly generated official receipt modal
      setSelectedOfficialReceipt(result.paymentReceipt);
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar pagamento.');
      setIsApproving(false);
    }
  };

  const handleOpenReject = (payment: PendingPayment) => {
    setRejectingPayment(payment);
    setRejectionReason('');
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment || !rejectionReason.trim()) {
      alert('Por favor, informe a justificativa da recusa.');
      return;
    }
    setIsRejecting(true);
    try {
      rejectPendingPayment(rejectingPayment.id, rejectionReason.trim());
      setIsRejecting(false);
      setRejectingPayment(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao rejeitar pagamento.');
      setIsRejecting(false);
    }
  };

  const handleViewOfficialReceipt = (payment: PendingPayment) => {
    if (payment.officialReceiptNumber) {
      const found = state.receipts.find((r) => r.receiptNumber === payment.officialReceiptNumber);
      if (found) {
        setSelectedOfficialReceipt(found);
      } else {
        alert(`Recibo oficial ${payment.officialReceiptNumber} não localizado.`);
      }
    }
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#075e38]" />
              Validação de Pagamentos da Recepção
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {pendingCount} pendente(s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conferência do dinheiro físico que o Rony recebe no caixa, homologação e emissão de recibos oficiais
          </p>
        </div>

        {/* Physical Money Reconciliation Badge */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2.5">
          <Banknote className="w-5 h-5 text-[#075e38] flex-shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
              Dinheiro Físico a Bater com o Caixa (Rony)
            </span>
            <span className="text-base font-mono font-black text-emerald-950">
              {formatCurrency(pendingCashAmount, 'EGP')}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-[10px] font-black uppercase tracking-wider">
            <span>Pré-Registros Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-950">
            {formatCurrency(pendingAmount, 'EGP')}
          </p>
          <p className="text-[11px] text-amber-800 font-semibold">{pendingCount} pagamento(s) na fila</p>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-[10px] font-black uppercase tracking-wider">
            <span>Homologados & Aprovados</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-950">
            {formatCurrency(approvedAmount, 'EGP')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">{approvedCount} recibo(s) emitidos</p>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-[10px] font-black uppercase tracking-wider">
            <span>Recusados / Devolvidos</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-950">{rejectedCount}</p>
          <p className="text-[11px] text-rose-700 font-semibold">Divergências de caixa</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <span>Responsável Tesouraria</span>
            <ShieldCheck className="w-4 h-4 text-[#075e38]" />
          </div>
          <p className="text-sm font-black text-slate-800 mt-1">Rony / Tesouraria</p>
          <p className="text-[11px] text-slate-500 font-medium">Controle Diário de Balcão</p>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Sparkles className="w-4 h-4 text-[#075e38] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">
            Fluxo de Caixa Integrado Recepção ⇄ Tesouraria:
          </p>
          <p className="text-[11px] leading-relaxed">
            A Recepção lança os pagamentos recebidos dos alunos no balcão e entrega um <strong>Comprovante Provisório</strong>.
            Para que o valor entre formalmente no caixa, dê baixa na cobrança do aluno e gere o <strong>Recibo Oficial Definitivo</strong>,
            a Tesouraria precisa conferir o dinheiro físico entregue e clicar em <strong>"Aprovar"</strong> abaixo.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStatusFilter('PENDENTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PENDENTE'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APROVADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'APROVADO'
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aprovados ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REPROVADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'REPROVADO'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recusados ({rejectedCount})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({pendingPayments.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por protocolo, aluno, curso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">Nenhum pré-registro encontrado nesta lista.</p>
          <p className="text-[11px] text-slate-400">
            {statusFilter === 'PENDENTE'
              ? 'Todos os pagamentos da recepção já foram conferidos e homologados.'
              : 'Nenhum registro com o filtro atual.'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Protocolo / Data</th>
                  <th className="py-3 px-4">Estudante</th>
                  <th className="py-3 px-4">Curso / Parcela</th>
                  <th className="py-3 px-4">Meio</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4">Operador Balcão</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações Tesouraria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const isPending = p.status === 'PENDENTE';
                  const isApproved = p.status === 'APROVADO';
                  const isRejected = p.status === 'REPROVADO';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-black text-[#075e38] block">
                          {p.protocolNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.registeredAt}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.studentName}</span>
                        <span className="font-mono text-[10px] text-emerald-800 font-semibold">
                          {p.studentId}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{p.courseName}</span>
                        <span className="text-[11px] text-slate-500">
                          Parcela {p.installmentNumber}/{p.totalInstallments}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.paymentMethod === 'TRANSFERENCIA' ? '🏦 Transferência Bancária' : '💵 Dinheiro Físico'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-black text-sm text-emerald-900">
                        {formatCurrency(p.amount, 'EGP')}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        <span className="font-medium text-slate-800 block">{p.registeredBy}</span>
                        {p.receptionNotes && (
                          <span className="text-[10px] text-slate-400 italic truncate block max-w-xs">
                            "{p.receptionNotes}"
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {isApproved
                            ? '✓ APROVADO'
                            : isRejected
                            ? '✕ RECUSADO'
                            : '⏳ PENDENTE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Provisional Receipt */}
                          <button
                            type="button"
                            onClick={() => setSelectedProvisionalPayment(p)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Ver Comprovante Provisório"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Provisório</span>
                          </button>

                          {/* If Approved, button to view Official Receipt */}
                          {isApproved && p.officialReceiptNumber && (
                            <button
                              type="button"
                              onClick={() => handleViewOfficialReceipt(p)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Ver Recibo Oficial"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Recibo Oficial</span>
                            </button>
                          )}

                          {/* Approval Actions for Pending */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenApprove(p)}
                                className="px-3 py-1 text-xs font-bold text-white bg-[#075e38] hover:bg-[#064e2e] rounded-lg transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                title="Conferir Dinheiro e Aprovar"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReject(p)}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer"
                                title="Recusar / Devolver"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Recusar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      <Modal
        isOpen={!!approvingPayment}
        onClose={() => setApprovingPayment(null)}
        size="md"
        title="Confirmar Entrada de Dinheiro & Aprovar Pagamento"
        subtitle="Conferência de dinheiro físico com a gaveta da Tesouraria (Rony)"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setApprovingPayment(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmApproval}
              disabled={isApproving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#075e38] hover:bg-emerald-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isApproving ? 'Processando...' : 'Confirmar & Emitir Recibo Oficial'}</span>
            </button>
          </div>
        }
      >
        {approvingPayment && (
          <form onSubmit={handleConfirmApproval} className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-800 block">
                    Protocolo: {approvingPayment.protocolNumber}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {approvingPayment.studentName} ({approvingPayment.studentId})
                  </h4>
                  <p className="text-xs text-slate-600">
                    {approvingPayment.courseName} • Parcela {approvingPayment.installmentNumber}/{approvingPayment.totalInstallments}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">
                    Valor a Conferir
                  </span>
                  <span className="text-2xl font-black font-mono text-[#075e38]">
                    {formatCurrency(approvingPayment.amount, 'EGP')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-[11px] flex items-start gap-2.5">
              <Banknote className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Atenção Rony / Caixa:</strong> Ao confirmar, o valor de{' '}
                <strong>{formatCurrency(approvingPayment.amount, 'EGP')}</strong> será somado ao saldo em dinheiro do
                Caixa, a parcela será marcada como <strong>PAGA</strong> e o <strong>Recibo Oficial</strong> será emitido.
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Observação de Conferência do Caixa (Opcional):
              </label>
              <input
                type="text"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ex: Dinheiro físico conferido na gaveta e conciliado."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        isOpen={!!rejectingPayment}
        onClose={() => setRejectingPayment(null)}
        size="md"
        title="Recusar Pré-Registro de Pagamento"
        subtitle="Informe a justificativa para que a Recepção possa corrigir ou devolver"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setRejectingPayment(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmRejection}
              disabled={isRejecting || !rejectionReason.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isRejecting ? 'Gravando...' : 'Confirmar Recusa'}</span>
            </button>
          </div>
        }
      >
        {rejectingPayment && (
          <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 space-y-1">
              <p className="font-bold text-xs">
                Recusando pré-registro {rejectingPayment.protocolNumber} - {rejectingPayment.studentName}
              </p>
              <p className="text-[11px]">
                Valor: <strong>{formatCurrency(rejectingPayment.amount, 'EGP')}</strong> ({rejectingPayment.courseName})
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Motivo da Recusa / Devolução (Obrigatório) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Valor físico entregue não confere com a nota; cédula suspeita; parcela informada incorreta..."
                className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Provisional Receipt Modal */}
      <ProvisionalReceiptModal
        payment={selectedProvisionalPayment}
        isOpen={!!selectedProvisionalPayment}
        onClose={() => setSelectedProvisionalPayment(null)}
      />

      {/* Official Receipt Modal */}
      <ReceiptModal
        receipt={selectedOfficialReceipt}
        isOpen={!!selectedOfficialReceipt}
        onClose={() => setSelectedOfficialReceipt(null)}
      />
    </div>
  );
};
