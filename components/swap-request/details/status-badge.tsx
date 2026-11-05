'use client';

import { Check, Loader2, X } from 'lucide-react';
import type { StatusVariant } from './types';

export function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: StatusVariant;
}) {
  const icon =
    variant === 'success' ? (
      <Check className="size-3.5 text-(--color-success-accent,var(--color-green-500))" />
    ) : variant === 'destructive' ? (
      <X className="size-3.5 text-(--color-destructive-accent,var(--color-red-700))" />
    ) : variant === 'warning' ? (
      <Loader2 className="size-3.5 text-(--color-warning-accent,var(--color-yellow-500))" />
    ) : variant === 'info' ? (
      <Loader2 className="size-3.5 text-(--color-info-accent,var(--color-violet-500))" />
    ) : (
      <Check className="size-3.5 text-muted-foreground" />
    );

  if (label === '—') {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      {icon}
      <span>{label}</span>
    </span>
  );
}
