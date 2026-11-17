import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'neutral';
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Stored values stay in Portuguese for Firestore compatibility; only the label is translated. */
const STATUS_LABELS: Record<string, string> = {
  PAGO: 'Paid',
  PAGO_PARCIAL: 'Partially Paid',
  ATIVO: 'Active',
  ATIVA: 'Active',
  INATIVO: 'Inactive',
  INATIVA: 'Inactive',
  BLOQUEADO: 'Blocked',
  BLOQUEADA: 'Blocked',
  LIBERADO: 'Released',
  LIBERADA: 'Released',
  CONCLUÍDA: 'Completed',
  CONCLUIDA: 'Completed',
  CONCILIADO: 'Reconciled',
  AVALIADO: 'Graded',
  VISTO: 'Approved',
  FEITO: 'Done',
  REGULAR: 'Regular',
  ENTREGUE: 'Delivered',
  PENDENTE: 'Pending',
  PENDENTE_CORRECAO: 'Pending Correction',
  PENDENTE_ENTREGA: 'Pending Delivery',
  AGUARDANDO_VISTO: 'Awaiting Approval',
  EM_ATRASO: 'Overdue',
  'EM ATRASO': 'Overdue',
  ATRASADO: 'Overdue',
  CANCELADO: 'Cancelled',
  CANCELADA: 'Cancelled',
  NAO_FEITO: 'Not Done',
  APROVADO: 'Approved',
  REPROVADO: 'Rejected',
  ABERTO: 'Open',
  FECHADO: 'Closed',
  DINHEIRO: 'Cash',
  PIX: 'Pix',
  CARTAO: 'Card',
  CARTÃO: 'Card',
  BOLETO: 'Bank Slip',
  TRANSFERENCIA: 'Transfer',
  TRANSFERÊNCIA: 'Transfer',
  MASCULINO: 'Male',
  FEMININO: 'Female',
  ATIVIDADE: 'Activity',
  FREQUENCIA: 'Attendance',
  FREQUÊNCIA: 'Attendance',
  PROVA: 'Exam',
  EXERCÍCIO: 'Exercise',
  REDAÇÃO: 'Essay',
  DIÁRIO: 'Journal',
  PRÁTICA: 'Practice',
  AVISO: 'Notice',
  MINISTRADA: 'Delivered',
  'Sem professor vinculado': 'No teacher assigned',
};

export const displayStatus = (value?: string): string =>
  value ? STATUS_LABELS[value] || STATUS_LABELS[value.toUpperCase()] || value : '';

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  className = '',
  size = 'md',
}) => {
  const content = children || displayStatus(status);

  // Auto-detect variant from standard status strings if not explicitly provided
  let computedVariant = variant;
  if (!computedVariant && status) {
    const s = status.toUpperCase();
    if (s === 'PAGO' || s === 'ATIVO' || s === 'ATIVA' || s === 'LIBERADA' || s === 'CONCILIADO' || s === 'AVALIADO' || s === 'VISTO' || s === 'FEITO') {
      computedVariant = 'success';
    } else if (s === 'REGULAR' || s === 'ACTIVE' || s === 'ENTREGUE') {
      computedVariant = 'info';
    } else if (s === 'PENDENTE' || s === 'UPCOMING' || s === 'PENDENTE_CORRECAO' || s === 'AGUARDANDO_VISTO') {
      computedVariant = 'warning';
    } else if (s === 'EM ATRASO' || s === 'BLOQUEADA' || s === 'CANCELADA' || s === 'INATIVO' || s === 'NAO_FEITO' || s === 'PENDENTE_ENTREGA') {
      computedVariant = 'danger';
    } else {
      computedVariant = 'neutral';
    }
  }

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200/80',
    default: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-tight whitespace-nowrap select-none ${
        variantStyles[computedVariant || 'neutral']
      } ${sizeStyles[size]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          computedVariant === 'success'
            ? 'bg-emerald-500'
            : computedVariant === 'warning'
            ? 'bg-amber-500'
            : computedVariant === 'danger'
            ? 'bg-rose-500'
            : computedVariant === 'purple'
            ? 'bg-purple-500'
            : computedVariant === 'info'
            ? 'bg-sky-500'
            : 'bg-slate-400'
        }`}
      />
      {content}
    </span>
  );
};
