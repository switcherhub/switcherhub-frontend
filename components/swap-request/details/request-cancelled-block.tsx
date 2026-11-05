'use client';

import { format } from 'date-fns';
import { X } from 'lucide-react';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { getCancelledByLabel } from './utils';

interface RequestCancelledBlockProps {
  item: SwapRequestItem;
  amSideA: boolean;
}

export function RequestCancelledBlock({ item, amSideA }: RequestCancelledBlockProps) {
  const cancelledBy = getCancelledByLabel(item, amSideA);
  const dateStr = item.cancelledAt
    ? format(new Date(item.cancelledAt), 'MMM d, yyyy')
    : '';

  return (
    <div className="rounded-lg border border-[#E5B0B0] bg-[#FFE8E8] p-6 flex flex-col items-center justify-center text-center">
      <X className="size-10 text-[#E03D51] mb-3" strokeWidth={2.5} aria-hidden />
      <p className="text-lg font-bold text-[#E03D51] mb-1">Request Cancelled</p>
      <p className="text-sm text-[#6B7280]">
        Cancelled by <strong>{cancelledBy}</strong>
        {dateStr ? ` · ${dateStr}` : ''}
      </p>
    </div>
  );
}
