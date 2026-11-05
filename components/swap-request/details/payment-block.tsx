'use client';

import type { ReferencePath } from '@/context/reference-data-context';
import { Check, CreditCard } from 'lucide-react';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { Button } from '@/components/ui/button';
import type { SwapRequestDetailsRow } from './types';

interface PaymentBlockProps {
  item: SwapRequestItem;
  row: SwapRequestDetailsRow;
  amSideA: boolean;
  ourPaid: boolean;
  getName: (
    path: ReferencePath,
    id: string | null | undefined,
  ) => string | null;
  onPay: () => void;
  onCancelRequest: () => void;
  canDelete: boolean;
}

export function PaymentBlock({
  item,
  row,
  amSideA,
  ourPaid,
  getName,
  onPay,
  onCancelRequest,
  canDelete,
}: PaymentBlockProps) {
  const employeeLabel =
    (amSideA
      ? (item.resumeB?.jobCore?.name ??
        getName('job-core', item.resumeB?.jobCoreId))
      : (item.resumeA?.jobCore?.name ??
        getName('job-core', item.resumeA?.jobCoreId))) ?? 'Employee';
  const matchStr = row.matchPercent != null ? `${row.matchPercent}%` : '—';

  return (
    <div className="rounded-lg border border-[var(--color-info-accent,var(--color-blue-200))] bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800 px-4 py-3 text-white">
        <span className="min-w-0 text-sm font-semibold sm:text-base">
          $149 to finalize
        </span>
        <span className="text-xl font-bold tabular-nums">$149</span>
      </div>
      <div className="p-4 space-y-4">
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-3 text-emerald-700" strokeWidth={2.5} />
            </span>
            <span>100% refund if partner company declines</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-3 text-emerald-700" strokeWidth={2.5} />
            </span>
            <span>No hidden fees</span>
          </li>
        </ul>
        <div className="rounded-md bg-[var(--color-info-soft,var(--color-blue-50))] px-4 py-3 text-xs sm:text-sm text-muted-foreground">
          <span>No payment card? Go to </span>
          <a
            href="/team"
            className="mx-1 font-semibold text-[var(--color-info-accent,var(--color-blue-700))] underline"
          >
            Members
          </a>
          <span>and ask your team admin to complete this step.</span>
        </div>
        {ourPaid ? (
          <div className="rounded-lg bg-muted/80 border border-border px-4 text-center flex items-center gap-2 py-2">
            <Check
              className="size-5 text-[var(--color-success-accent,var(--color-green-600))]"
              strokeWidth={2.5}
            />
            Your payment confirmed — waiting for partner
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full bg-[var(--color-success-accent,var(--color-green-600))] hover:bg-[var(--color-success-accent,var(--color-green-700))] text-white font-semibold"
            onClick={onPay}
          >
            <CreditCard className="size-5 me-2 shrink-0" />
            <span className="text-left sm:text-center">
              <span className="sm:hidden">Pay $149</span>
              <span className="hidden sm:inline">
                Pay $149 · Unlock Profiles & Finalize Swap
              </span>
            </span>
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          After payment, full employee data unlocks and you can begin the
          official transfer process directly with the partner company&apos;s HR.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground pt-1">
          {canDelete && (
            <>
              <button
                type="button"
                onClick={onCancelRequest}
                className="underline hover:text-foreground"
              >
                Cancel this request
              </button>
              <span className="text-muted-foreground/70">·</span>
            </>
          )}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>
          <span className="text-muted-foreground/70">·</span>
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
