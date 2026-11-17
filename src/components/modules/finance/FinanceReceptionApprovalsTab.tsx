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
    setApprovalNotes(`Physical cash counted in the drawer and reconciled by Rony / Treasury.`);
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
      alert('Error approving payment.');
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
      alert('Please provide a reason for the rejection.');
      return;
    }
    setIsRejecting(true);
    try {
      rejectPendingPayment(rejectingPayment.id, rejectionReason.trim());
      setIsRejecting(false);
      setRejectingPayment(null);
    } catch (err) {
      console.error(err);
      alert('Error rejecting payment.');
      setIsRejecting(false);
    }
  };

  const handleViewOfficialReceipt = (payment: PendingPayment) => {
    if (payment.officialReceiptNumber) {
      const found = state.receipts.find((r) => r.receiptNumber === payment.officialReceiptNumber);
      if (found) {
        setSelectedOfficialReceipt(found);
      } else {
        alert(`Official receipt ${payment.officialReceiptNumber} not found.`);
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
              Reception Payment Validation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {pendingCount} pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation of the physical cash Rony receives at the counter, approval and issuance of official receipts
          </p>
        </div>

        {/* Physical Money Reconciliation Badge */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs flex items-center gap-2.5">
          <Banknote className="w-5 h-5 text-[#075e38] flex-shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
              Physical Cash to Reconcile with Register (Rony)
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
            <span>Pending Pre-Registrations</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-950">
            {formatCurrency(pendingAmount, 'EGP')}
          </p>
          <p className="text-[11px] text-amber-800 font-semibold">{pendingCount} payment(s) in queue</p>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-[10px] font-black uppercase tracking-wider">
            <span>Approved & Validated</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-950">
            {formatCurrency(approvedAmount, 'EGP')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">{approvedCount} receipt(s) issued</p>
        </div>

        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-[10px] font-black uppercase tracking-wider">
            <span>Rejected / Returned</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-950">{rejectedCount}</p>
          <p className="text-[11px] text-rose-700 font-semibold">Cash discrepancies</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <span>Treasury Officer</span>
            <ShieldCheck className="w-4 h-4 text-[#075e38]" />
          </div>
          <p className="text-sm font-black text-slate-800 mt-1">Rony / Treasury</p>
          <p className="text-[11px] text-slate-500 font-medium">Daily Front Desk Control</p>
        </div>
      </div>

      {/* Instructions Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <Sparkles className="w-4 h-4 text-[#075e38] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">
            Integrated Cash Flow Reception ⇄ Treasury:
          </p>
          <p className="text-[11px] leading-relaxed">
            Reception records the payments received from students at the counter and hands over a <strong>Provisional Receipt</strong>.
            For the amount to formally enter the cash register, settle the student's charge and generate the <strong>Final Official Receipt</strong>,
            Treasury must verify the physical cash delivered and click <strong>"Approve"</strong> below.
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
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('APROVADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'APROVADO'
                ? 'bg-[#075e38] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('REPROVADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'REPROVADO'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({pendingPayments.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by protocol, student, course..."
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
          <p className="text-xs font-bold text-slate-700">No pre-registrations found in this list.</p>
          <p className="text-[11px] text-slate-400">
            {statusFilter === 'PENDENTE'
              ? 'All reception payments have already been checked and approved.'
              : 'No records match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Protocol / Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course / Installment</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Front Desk Operator</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Treasury Actions</th>
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
                          Installment {p.installmentNumber}/{p.totalInstallments}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.paymentMethod === 'TRANSFERENCIA' ? '🏦 Bank Transfer' : '💵 Cash'}
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
                            ? '✓ APPROVED'
                            : isRejected
                            ? '✕ REJECTED'
                            : '⏳ PENDING'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Provisional Receipt */}
                          <button
                            type="button"
                            onClick={() => setSelectedProvisionalPayment(p)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="View Provisional Receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Provisional</span>
                          </button>

                          {/* If Approved, button to view Official Receipt */}
                          {isApproved && p.officialReceiptNumber && (
                            <button
                              type="button"
                              onClick={() => handleViewOfficialReceipt(p)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="View Official Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Official Receipt</span>
                            </button>
                          )}

                          {/* Approval Actions for Pending */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenApprove(p)}
                                className="px-3 py-1 text-xs font-bold text-white bg-[#075e38] hover:bg-[#064e2e] rounded-lg transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                title="Verify Cash and Approve"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReject(p)}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer"
                                title="Reject / Return"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
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
        title="Confirm Cash Deposit & Approve Payment"
        subtitle="Physical cash reconciliation against the Treasury drawer (Rony)"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setApprovingPayment(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmApproval}
              disabled={isApproving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#075e38] hover:bg-emerald-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isApproving ? 'Processing...' : 'Confirm & Issue Official Receipt'}</span>
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
                    Protocol: {approvingPayment.protocolNumber}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {approvingPayment.studentName} ({approvingPayment.studentId})
                  </h4>
                  <p className="text-xs text-slate-600">
                    {approvingPayment.courseName} • Installment {approvingPayment.installmentNumber}/{approvingPayment.totalInstallments}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">
                    Amount to Verify
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
                <strong>Attention Rony / Cash Register:</strong> Upon confirmation, the amount of{' '}
                <strong>{formatCurrency(approvingPayment.amount, 'EGP')}</strong> will be added to the register's cash balance,
                the installment will be marked as <strong>PAID</strong> and the <strong>Official Receipt</strong> will be issued.
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cash Reconciliation Note (Optional):
              </label>
              <input
                type="text"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="E.g., Physical cash counted in the drawer and reconciled."
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
        title="Reject Payment Pre-Registration"
        subtitle="Provide the reason so Reception can correct or return it"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setRejectingPayment(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRejection}
              disabled={isRejecting || !rejectionReason.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isRejecting ? 'Saving...' : 'Confirm Rejection'}</span>
            </button>
          </div>
        }
      >
        {rejectingPayment && (
          <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 space-y-1">
              <p className="font-bold text-xs">
                Rejecting pre-registration {rejectingPayment.protocolNumber} - {rejectingPayment.studentName}
              </p>
              <p className="text-[11px]">
                Amount: <strong>{formatCurrency(rejectingPayment.amount, 'EGP')}</strong> ({rejectingPayment.courseName})
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Rejection / Return Reason (Required) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Physical amount delivered does not match the note; suspect bill; incorrect installment reported..."
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
