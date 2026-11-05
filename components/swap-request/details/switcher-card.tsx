'use client';

import type { ReferencePath } from '@/context/reference-data-context';
import { Check, MapPin, Zap } from 'lucide-react';
import type { SwapRequestResume } from '@/lib/types/swap-request';
import { formatJobTypeWithHours } from './utils';

interface SwitcherCardProps {
  side: 'A' | 'B';
  badgeLabel: string;
  resume: SwapRequestResume | null | undefined;
  getName: (
    path: ReferencePath,
    id: string | null | undefined,
  ) => string | null;
  currentCommuteMin: number | null;
  newCommuteMin: number | null;
  saveHoursPerMonth: string | null;
}

export function SwitcherCard({
  side,
  badgeLabel,
  resume,
  getName,
  currentCommuteMin,
  newCommuteMin,
  saveHoursPerMonth,
}: SwitcherCardProps) {
  const label = side === 'A' ? 'Switcher A' : 'Switcher B';
  const name = resume?.firstName ? `${resume.firstName} (${label})` : label;
  const jobTypeName =
    resume?.jobType?.name ?? getName('job-types', resume?.jobTypeId) ?? null;
  const jobTypeDisplay = formatJobTypeWithHours(
    jobTypeName,
    resume?.hoursPerMonth,
  );
  const subtitle =
    [
      resume?.jobCore?.name ?? getName('job-core', resume?.jobCoreId),
      jobTypeDisplay,
    ]
      .filter(Boolean)
      .join(' · ') || '—';

  const accentClass =
    side === 'A'
      ? 'bg-[var(--color-info-accent,var(--color-blue-600))]'
      : 'bg-[var(--color-success-accent,var(--color-green-600))]';

  const badgeAccentClass =
    side === 'A'
      ? 'border-[var(--color-info-accent,var(--color-blue-200))] text-[var(--color-info-accent,var(--color-blue-400))]'
      : 'border-[var(--color-success-accent,var(--color-green-200))] text-[var(--color-success-accent,var(--color-green-400))]';

  return (
    <div className="flex-1 min-w-0 rounded-lg border border-border p-4 bg-[#F4F4F4]">
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 size-10 rounded-full ${accentClass} text-white flex items-center justify-center text-lg font-bold`}
        >
          {side}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{name}</p>
          <div className="mt-1 mb-1">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[.72rem] font-semibold ${badgeAccentClass}`}
            >
              {badgeLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-3 space-y-1.5">
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 shrink-0 text-[var(--color-destructive,var(--color-red-500))]" />
              <span>
                <span className="font-semibold text-[var(--color-destructive,var(--color-red-600))]">
                  {currentCommuteMin != null ? `${currentCommuteMin} min` : '—'}
                </span>
                <span className="text-muted-foreground"> — Current office</span>
              </span>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Check className="size-4 shrink-0 text-[var(--color-success-accent,var(--color-green-500))]" />
              <span>
                <span className="font-semibold text-[var(--color-success-accent,var(--color-green-600))]">
                  {newCommuteMin != null ? `${newCommuteMin} min` : '—'}
                </span>
                <span className="text-muted-foreground"> — New office</span>
              </span>
            </p>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-info-accent,var(--color-blue-600))]">
            <Zap className="size-4 shrink-0 text-[var(--color-warning-accent,var(--color-yellow-500))]" />
            {saveHoursPerMonth ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
