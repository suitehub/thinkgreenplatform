import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'neutral';
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  className = '',
  size = 'md',
}) => {
  const content = children || status;

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
