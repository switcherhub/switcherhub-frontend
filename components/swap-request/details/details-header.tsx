'use client';

import type { SwapRequestItem } from '@/lib/types/swap-request';
import { StatusBadge } from './status-badge';
import { StepProgress } from './step-progress';
import type { SwapRequestDetailsRow } from './types';
import { formatRowDate } from './utils';

interface DetailsHeaderProps {
  row: SwapRequestDetailsRow;
  item: SwapRequestItem;
  currentUserEmail?: string;
}

export function DetailsHeader({
  row,
  item,
  currentUserEmail,
}: DetailsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="min-w-0">
        <h1 className="mb-2 text-xl font-bold sm:text-2xl">
          Swap Request Details
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm font-semibold">ID: {row.numericId}</span>
          <StatusBadge label={row.yourStatus} variant={row.yourStatusVariant} />
          <p className="text-sm text-muted-foreground">
            Created {formatRowDate(row.date)} • Step {row.step} of 5
          </p>
        </div>
      </div>
      <div className="min-w-0 w-full">
        <StepProgress item={item} currentUserEmail={currentUserEmail} />
      </div>
    </div>
  );
}
