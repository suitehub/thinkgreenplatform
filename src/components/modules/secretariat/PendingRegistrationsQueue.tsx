import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  User,
  Phone,
  Layers,
  Search,
  AlertTriangle,
  BadgePercent,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PendingRegistration } from '../../../types';
import { formatCurrency } from '../../../lib/storage';
import { Modal } from '../../common/Modal';

interface PendingRegistrationsQueueProps {
  onApproved?: (generatedStuId: string, studentName: string) => void;
  onBackToWizard?: () => void;
}

export const PendingRegistrationsQueue: React.FC<PendingRegistrationsQueueProps> = ({
  onApproved,
  onBackToWizard,
}) => {
  const {
    state,
    approvePendingRegistration,
    rejectPendingRegistration,
    updatePendingRegistration,
    deletePendingRegistration,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDENTE' | 'APROVADO' | 'REPROVADO'>('PENDENTE');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingItem, setEditingItem] = useState<PendingRegistration | null>(null);
  const [rejectingItem, setRejectingItem] = useState<PendingRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalResult, setApprovalResult] = useState<{
    studentId: string;
    name: string;
    protocol: string;
    courseName: string;
  } | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    rg: string;
    courseId: string;
    classId: string;
    installmentsCount: number;
    discountType: 'NONE' | 'PERCENT' | 'FIXED';
    discountValue: number;
    discountReason: string;
  }>({
    name: '',
    phone: '',
    rg: '',
    courseId: '',
    classId: '',
    installmentsCount: 4,
    discountType: 'NONE',
    discountValue: 0,
    discountReason: '',
  });

  // Filtered pending registrations
  const filteredList = useMemo(() => {
    let items = state.pendingRegistrations || [];

    if (statusFilter !== 'ALL') {
      items = items.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.protocolNumber.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.courseName.toLowerCase().includes(q)
      );
    }

    return items;
  }, [state.pendingRegistrations, statusFilter, searchQuery]);

  // Counts
  const pendingCount = useMemo(() => {
    return (state.pendingRegistrations || []).filter((p) => p.status === 'PENDENTE').length;
  }, [state.pendingRegistrations]);

  const approvedCount = useMemo(() => {
    return (state.pendingRegistrations || []).filter((p) => p.status === 'APROVADO').length;
  }, [state.pendingRegistrations]);

  const rejectedCount = useMemo(() => {
    return (state.pendingRegistrations || []).filter((p) => p.status === 'REPROVADO').length;
  }, [state.pendingRegistrations]);

  // Open edit modal
  const handleOpenEdit = (item: PendingRegistration) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      phone: item.phone,
      rg: item.rg || '',
      courseId: item.courseId,
      classId: item.classId,
      installmentsCount: item.installmentsCount,
      discountType: item.discountType,
      discountValue: item.discountValue || 0,
      discountReason: item.discountReason || '',
    });
  };

  // Save edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const course = state.courses.find((c) => c.id === editForm.courseId);
    const classRoom = state.classes.find((cl) => cl.id === editForm.classId);

    const baseMonthlyFee = course ? course.monthlyFee : editingItem.monthlyFee;
    const baseTotal = baseMonthlyFee * editForm.installmentsCount;
    let discountAmount = 0;
    if (editForm.discountType === 'PERCENT') {
      discountAmount = Math.round((baseTotal * editForm.discountValue) / 100);
    } else if (editForm.discountType === 'FIXED') {
      discountAmount = editForm.discountValue;
    }
    const finalTotal = Math.max(0, baseTotal - discountAmount);

    updatePendingRegistration(editingItem.id, {
      name: editForm.name,
      phone: editForm.phone,
      rg: editForm.rg,
      courseId: editForm.courseId,
      courseName: course ? course.name : editingItem.courseName,
      classId: editForm.classId,
      className: classRoom ? classRoom.name : editingItem.className,
      installmentsCount: editForm.installmentsCount,
      discountType: editForm.discountType,
      discountValue: editForm.discountValue,
      discountReason: editForm.discountReason,
      finalTotal,
    });

    setEditingItem(null);
  };

  // Approve action
  const handleApprove = (item: PendingRegistration) => {
    try {
      const { student } = approvePendingRegistration(item.id);
      setApprovalResult({
        studentId: student.studentId,
        name: student.name,
        protocol: item.protocolNumber,
        courseName: item.courseName,
      });

      if (onApproved) {
        onApproved(student.studentId, student.name);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar cadastro.');
    }
  };

  // Reject action
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    rejectPendingRegistration(
      rejectingItem.id,
      rejectionReason.trim() || 'Desconto ou dados cadastrais não autorizados pela Secretaria.'
    );

    setRejectingItem(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                Fila de Cadastros Pendentes da Recepção
              </h2>
              <p className="text-xs text-slate-500">
                Homologação, conferência de descontos e geração oficial do ID Estudante (STU)
              </p>
            </div>
          </div>
        </div>

        {onBackToWizard && (
          <button
            onClick={onBackToWizard}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ← Voltar ao Cadastro Direto
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('PENDENTE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDENTE'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendentes</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'PENDENTE' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('APROVADO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'APROVADO'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Aprovados</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'APROVADO' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('REPROVADO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'REPROVADO'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reprovados</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'REPROVADO' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {rejectedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({(state.pendingRegistrations || []).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, protocolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#075e38] outline-hidden"
          />
        </div>
      </div>

      {/* Cards List */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Nenhum cadastro nesta visualização.</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Os alunos pré-cadastrados no balcão da Recepção serão listados automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const hasDiscount = item.discountType && item.discountType !== 'NONE' && (item.discountValue || 0) > 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  item.status === 'PENDENTE'
                    ? 'border-amber-300/90 shadow-sm ring-1 ring-amber-100'
                    : item.status === 'APROVADO'
                    ? 'border-emerald-200'
                    : 'border-rose-200'
                }`}
              >
                {/* Header Bar */}
                <div className="p-4 sm:px-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                      {item.protocolNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      Cadastrado por: <strong className="text-slate-800">{item.createdByName}</strong> em {item.createdAt}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'PENDENTE' && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Aguarda Aprovação
                      </span>
                    )}
                    {item.status === 'APROVADO' && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovado (ID: {item.generatedStudentId})
                      </span>
                    )}
                    {item.status === 'REPROVADO' && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Reprovado
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Student Info */}
                    <div className="lg:col-span-4 space-y-2 text-xs">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Dados do Estudante
                      </p>
                      <p className="text-sm font-black text-slate-900">{item.name}</p>
                      <div className="space-y-1 text-slate-600">
                        <p>
                          RG / Doc:{' '}
                          <strong className="font-mono text-slate-800">{item.rg || 'Não informado'}</strong>
                        </p>
                        <p>
                          Telefone:{' '}
                          <strong className="text-slate-800">{item.phone}</strong>
                        </p>
                        {item.birthDate && (
                          <p>
                            Nascimento: <strong className="text-slate-800">{item.birthDate}</strong> ({item.gender})
                          </p>
                        )}
                        {item.guardianName && (
                          <p>
                            Responsável:{' '}
                            <strong className="text-slate-800">
                              {item.guardianName} ({item.guardianPhone || 'S/ telefone'})
                            </strong>
                          </p>
                        )}
                        {item.city && (
                          <p>
                            Cidade / Endereço:{' '}
                            <span className="text-slate-700">{item.city} {item.address ? `• ${item.address}` : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Academic Enrollment Info */}
                    <div className="lg:col-span-4 space-y-2 text-xs">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Curso & Turma Pretendida
                      </p>
                      <p className="text-sm font-bold text-slate-900">{item.courseName}</p>
                      <p className="text-xs text-slate-600">
                        Turma: <strong className="text-slate-800">{item.className}</strong>
                      </p>
                      <p className="text-xs text-slate-600">
                        Mensalidade Base: <strong className="font-mono">{formatCurrency(item.monthlyFee, 'EGP')}</strong>
                      </p>
                      <p className="text-xs text-slate-600">
                        Plano: <strong className="text-slate-800">{item.installmentsCount} parcelas</strong>
                      </p>
                    </div>

                    {/* Financial & Discount Review Block */}
                    <div className="lg:col-span-4 space-y-2 text-xs">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Condição Financeira & Desconto
                      </p>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total do Plano:</span>
                          <span className="font-mono font-black text-sm text-[#075e38]">
                            {formatCurrency(item.finalTotal, 'EGP')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Parcelas:</span>
                          <span className="font-mono font-bold text-slate-700">
                            {item.installmentsCount}x de {formatCurrency(item.finalTotal / item.installmentsCount, 'EGP')}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Discount Observation Box */}
                      {hasDiscount ? (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs animate-in fade-in">
                          <div className="flex items-center gap-1.5 font-black text-amber-950">
                            <BadgePercent className="w-4 h-4 text-amber-700" />
                            <span>
                              Desconto Proposto: {item.discountValue}
                              {item.discountType === 'PERCENT' ? '%' : ' EGP'}
                            </span>
                          </div>
                          <div className="p-2 bg-white/80 rounded-lg border border-amber-200 text-amber-950 font-medium text-[11px] leading-relaxed">
                            <strong className="block text-[10px] uppercase text-amber-800 font-bold mb-0.5">
                              Justificativa informada pela Recepção:
                            </strong>
                            "{item.discountReason || 'Nenhuma justificativa detalhada'}"
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-100/70 rounded-lg text-[11px] text-slate-500">
                          Sem solicitação de desconto (Valor integral da tabela).
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Notes if already reviewed */}
                  {item.reviewedBy && (
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                      <span>
                        Avaliado por: <strong>{item.reviewedBy}</strong> em {item.reviewedAt}
                      </span>
                      {item.reviewNotes && (
                        <span className="text-rose-700 font-medium italic">
                          Observação: {item.reviewNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions for PENDENTE status */}
                  {item.status === 'PENDENTE' && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reprovar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-3.5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar Dados / Desconto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(item)}
                        className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Aprovar & Gerar ID Oficial</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SUCCESSFUL APPROVAL MODAL */}
      {approvalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-emerald-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#075e38] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider">
                Matrícula Homologada com Sucesso!
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {approvalResult.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Protocolo de Recepção: {approvalResult.protocol}
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
              <span className="text-slate-500 block text-[11px]">ID Estudante Gerado Oficialmente:</span>
              <span className="font-mono font-black text-2xl text-[#075e38] tracking-wider block mt-1">
                {approvalResult.studentId}
              </span>
              <span className="text-[11px] text-slate-600 block mt-1">
                Curso: {approvalResult.courseName}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              O aluno agora é um estudante ativo oficial. A conta de acesso ao portal e o carnê de parcelas foram ativados no sistema.
            </p>

            <button
              onClick={() => setApprovalResult(null)}
              className="w-full py-3 bg-[#075e38] hover:bg-[#064e2e] text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Concluir & Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PENDING REGISTRATION */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Editar Pré-Cadastro ({editingItem.protocolNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  Ajuste dados cadastrais ou condições de desconto antes de aprovar
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#075e38] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#075e38] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RG / Identidade</label>
                  <input
                    type="text"
                    value={editForm.rg}
                    onChange={(e) => setEditForm({ ...editForm, rg: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#075e38] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Curso</label>
                  <select
                    value={editForm.courseId}
                    onChange={(e) => {
                      const newCId = e.target.value;
                      const matchingClass = state.classes.find((cl) => cl.courseId === newCId);
                      setEditForm({
                        ...editForm,
                        courseId: newCId,
                        classId: matchingClass ? matchingClass.id : editForm.classId,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {state.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turma</label>
                  <select
                    value={editForm.classId}
                    onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    {state.classes
                      .filter((cl) => cl.courseId === editForm.courseId)
                      .map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parcelas</label>
                  <select
                    value={editForm.installmentsCount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, installmentsCount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value={1}>1x À vista</option>
                    <option value={2}>2x Semestral</option>
                    <option value={4}>4x Mensais</option>
                    <option value={6}>6x Mensais</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Desconto</label>
                  <select
                    value={editForm.discountType}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        discountType: e.target.value as 'NONE' | 'PERCENT' | 'FIXED',
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="NONE">Sem Desconto</option>
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="FIXED">Valor Fixo (EGP)</option>
                  </select>
                </div>
              </div>

              {editForm.discountType !== 'NONE' && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Valor do Desconto ({editForm.discountType === 'PERCENT' ? '%' : 'EGP'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.discountValue || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, discountValue: Number(e.target.value) })
                      }
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Justificativa / Motivo do Desconto *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={editForm.discountReason}
                      onChange={(e) => setEditForm({ ...editForm, discountReason: e.target.value })}
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#075e38] hover:bg-[#064e2e] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT PENDING REGISTRATION */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-rose-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Reprovar Pré-Cadastro
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {rejectingItem.name} ({rejectingItem.protocolNumber})
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo da Reprovação (será registrado na auditoria) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Desconto de 30% não autorizado pela coordenação; falta comprovante de residência..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Confirmar Reprovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
