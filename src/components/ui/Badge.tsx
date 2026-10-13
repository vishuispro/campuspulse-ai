import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'critical'
  | 'high'
  | 'moderate'
  | 'low'
  | 'positive'
  | 'neutral'
  | 'accent';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  icon?: ReactNode;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  icon,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    moderate: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    positive: 'bg-green-50 text-green-700 border-green-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    accent: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-block shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
