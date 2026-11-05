'use client';

import { BarChart3, Check } from 'lucide-react';
import type { ReferencePath } from '@/context/reference-data-context';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { formatJobTypeWithHours } from './utils';

interface ComparisonTableProps {
  item: SwapRequestItem;
  getName: (path: ReferencePath, id: string | null | undefined) => string | null;
  /** true = current user is HR A (our participant left); false = HR B (our participant left) */
  amSideA: boolean;
}

export function ComparisonTable({ item, getName, amSideA }: ComparisonTableProps) {
  const scores = item.comparison?.scores;
  const saveMinA =
    scores?.commuteA != null && item.comparison?.durationAToB != null
      ? Math.round(scores.commuteA * 60 - item.comparison.durationAToB / 60)
      : null;
  const saveMinB =
    scores?.commuteB != null && item.comparison?.durationBToA != null
      ? Math.round(scores.commuteB * 60 - item.comparison.durationBToA / 60)
      : null;

  const rows = [
    {
      param: 'Pay',
      valueA: item.resumeA?.salaryHourly
        ? `$${item.resumeA.salaryHourly}/hr`
        : '—',
      valueB: item.resumeB?.salaryHourly
        ? `$${item.resumeB.salaryHourly}/hr`
        : '—',
    },
    {
      param: 'Commute',
      valueA: scores?.commuteA ? `${Math.round(scores.commuteA * 60)} min` : '—',
      valueB: saveMinA != null ? `${saveMinA} min` : '—',
    },
    {
      param: 'Environment',
      valueA:
        getName('work-environment', item.resumeA?.workEnvironmentId) ??
        item.resumeA?.workEnvironment?.name ??
        item.resumeA?.workEnvironment?.title ??
        '—',
      valueB:
        getName('work-environment', item.resumeB?.workEnvironmentId) ??
        item.resumeB?.workEnvironment?.name ??
        item.resumeB?.workEnvironment?.title ??
        '—',
    },
    {
      param: 'Shift Type',
      valueA: getName('shift-type', item.resumeA?.shiftTypeId) ?? '—',
      valueB: getName('shift-type', item.resumeB?.shiftTypeId) ?? '—',
    },
    {
      param: 'Job Type',
      valueA:
        formatJobTypeWithHours(
          item.resumeA?.jobType?.name ??
            getName('job-types', item.resumeA?.jobTypeId) ??
            null,
          item.resumeA?.hoursPerMonth,
        ) ?? '—',
      valueB:
        formatJobTypeWithHours(
          item.resumeB?.jobType?.name ??
            getName('job-types', item.resumeB?.jobTypeId) ??
            null,
          item.resumeB?.hoursPerMonth,
        ) ?? '—',
    },
    {
      param: 'Team Size',
      valueA: getName('same-role-count', item.resumeA?.sameRoleCountId) ?? '—',
      valueB: getName('same-role-count', item.resumeB?.sameRoleCountId) ?? '—',
    },
    {
      param: 'Training',
      valueA:
        getName('time-to-start-working', item.resumeA?.timeToStartWorkingId) ??
        '—',
      valueB:
        getName('time-to-start-working', item.resumeB?.timeToStartWorkingId) ??
        '—',
    },
    {
      param: 'License',
      valueA:
        getName('license-required', item.resumeA?.licenseRequiredId) ?? '—',
      valueB:
        getName('license-required', item.resumeB?.licenseRequiredId) ?? '—',
    },
    {
      param: 'Tenure',
      valueA: getName('location-tenure', item.resumeA?.locationTenureId) ?? '—',
      valueB: getName('location-tenure', item.resumeB?.locationTenureId) ?? '—',
    },
  ];

  if (!scores) return null;

  const headerText = amSideA
    ? 'Switcher A (your employee) → Switcher B'
    : 'Switcher B (your employee) → Switcher A';

  const commuteLeft = amSideA
    ? scores.commuteA != null
      ? `${Math.round(scores.commuteA * 60)} min`
      : '—'
    : scores.commuteB != null
      ? `${Math.round(scores.commuteB * 60)} min`
      : '—';
  const commuteRight = amSideA
    ? saveMinA != null
      ? `${saveMinA} min`
      : '—'
    : saveMinB != null
      ? `${saveMinB} min`
      : '—';

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 bg-slate-800 px-4 py-3 text-sm font-semibold text-white rounded-t-lg sm:text-base">
          <BarChart3 className="size-5 shrink-0" />
          <span className="min-w-0">{headerText}</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r, i) => {
            const isCommute = r.param === 'Commute';
            const left = isCommute ? commuteLeft : amSideA ? r.valueA : r.valueB;
            const right = isCommute ? commuteRight : amSideA ? r.valueB : r.valueA;
            return (
              <div
                key={i}
                className="flex flex-col gap-2 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="shrink-0 text-sm text-muted-foreground sm:w-[120px]">
                  {r.param}
                </span>
                <span className="min-w-0 flex-1 text-sm text-foreground">
                  {left} → {right}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:self-center sm:text-sm">
                  <Check className="size-3.5" strokeWidth={2.5} />
                  Both accepted
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
