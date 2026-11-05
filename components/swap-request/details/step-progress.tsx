'use client';

import { Check } from 'lucide-react';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { SwapStatusEnum } from '@/lib/types/swap-request';
import { cn } from '@/lib/utils';
import { getStepLabels, STEPS } from './utils';

interface StepProgressProps {
  item: SwapRequestItem;
  currentUserEmail?: string;
}

function isCancelled(item: SwapRequestItem): boolean {
  const status = String(item.status ?? '').toUpperCase().replace(/[- ]/g, '_');
  return status === SwapStatusEnum.CANCELLED;
}

export function StepProgress({ item, currentUserEmail }: StepProgressProps) {
  const activeStepNumber = item.step ?? 1;
  const stepLabels = getStepLabels(item, currentUserEmail);
  const bothPaid = !!(item.paymentAHold && item.paymentBHold);
  const allStepsComplete = activeStepNumber >= 5 || bothPaid;
  const cancelled = isCancelled(item);

  /** Steps 1–3 are always green (completed) */
  const alwaysGreen = (stepIndex: number) => stepIndex <= 3;

  /** Step 4 is yellow if I or the other switcher hasn't paid. Green only when both paid. */
  const isStep4PaymentPending = !bothPaid;

  return (
    <div className="w-full">
      <div className="flex gap-0.5 mb-4">
        {STEPS.map((s, i) => {
          const stepIndex = i + 1;
          const isStep4Cancelled = stepIndex === 4 && cancelled;
          const isCompleted =
            alwaysGreen(stepIndex) ||
            stepIndex < activeStepNumber ||
            (stepIndex === activeStepNumber && allStepsComplete);
          const isCurrent =
            !alwaysGreen(stepIndex) &&
            (stepIndex === 4 ? isStep4PaymentPending : stepIndex === activeStepNumber) &&
            !allStepsComplete;
          return (
            <div
              key={`bar-${s.step}`}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                isStep4Cancelled &&
                  'bg-[var(--color-destructive,var(--color-red-500))]',
                !isStep4Cancelled &&
                  (isCompleted
                    ? 'bg-[var(--color-success-accent,var(--color-green-500))]'
                    : isCurrent
                      ? 'bg-[var(--color-warning-accent,var(--color-yellow-500))]'
                      : 'bg-muted'),
              )}
            />
          );
        })}
      </div>
      <div className="flex flex-col gap-2.5 sm:mx-0 sm:flex-row sm:flex-wrap sm:gap-2 sm:px-0">
        {STEPS.map((s, i) => {
          const stepIndex = i + 1;
          const isStep4Cancelled = stepIndex === 4 && cancelled;
          const isCompleted =
            alwaysGreen(stepIndex) ||
            stepIndex < activeStepNumber ||
            (stepIndex === activeStepNumber && allStepsComplete);
          const isCurrent =
            !alwaysGreen(stepIndex) &&
            (stepIndex === 4 ? isStep4PaymentPending : stepIndex === activeStepNumber) &&
            !allStepsComplete;
          return (
            <div
              key={`${s.step}-${i}`}
              className="flex w-full min-w-0 items-start gap-3 sm:w-auto sm:min-w-0 sm:flex-1 sm:items-center sm:gap-2"
            >
              <div
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full sm:mt-0',
                  isStep4Cancelled &&
                    'bg-[var(--color-destructive,var(--color-red-500))] text-white',
                  !isStep4Cancelled &&
                    isCompleted &&
                    'bg-[var(--color-success-accent,var(--color-green-500))] text-white',
                  !isStep4Cancelled &&
                    isCurrent &&
                    'border-2 border-[var(--color-warning-accent,var(--color-yellow-600))] text-[var(--color-warning-accent-foreground,var(--color-yellow-950))]',
                  !isStep4Cancelled &&
                    !isCompleted &&
                    !isCurrent &&
                    'border-2 border-muted-foreground/40 bg-transparent',
                )}
              >
                {isStep4Cancelled ? null : isCompleted ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : isCurrent ? (
                  <span className="text-xs font-bold"></span>
                ) : null}
              </div>
              <span
                className={cn(
                  'min-w-0 flex-1 text-xs font-medium leading-snug max-sm:whitespace-normal sm:truncate sm:leading-tight',
                  isCompleted && 'text-foreground',
                  isCurrent &&
                    !cancelled &&
                    'text-[var(--color-warning-accent,var(--color-yellow-600))] font-semibold dark:text-[var(--color-warning-accent,var(--color-yellow-500))]',
                  stepIndex === 4 &&
                    cancelled &&
                    'text-[var(--color-destructive,var(--color-red-600))] font-semibold',
                  !isCompleted && !isCurrent && !(stepIndex === 4 && cancelled) && 'text-muted-foreground',
                )}
              >
                {stepIndex === 4 && cancelled ? 'Canceled' : stepLabels[i] ?? s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
