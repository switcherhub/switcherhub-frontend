'use client';

import type { ReferencePath } from '@/context/reference-data-context';
import { ArrowLeftRight } from 'lucide-react';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { SwitcherCard } from './switcher-card';
import type { SwapRequestDetailsRow } from './types';

interface MatchSectionProps {
  item: SwapRequestItem;
  row: SwapRequestDetailsRow;
  getName: (
    path: ReferencePath,
    id: string | null | undefined,
  ) => string | null;
  /** true = current user is HR A (our participant is A, show A on left); false = HR B (our participant is B, show B on left) */
  amSideA: boolean;
}

export function MatchSection({
  item,
  row,
  getName,
  amSideA,
}: MatchSectionProps) {
  const scores = item.comparison?.scores;
  const comparison = item.comparison;

  const saveMinA =
    scores?.commuteA != null && comparison?.durationAToB != null
      ? Math.round(scores.commuteA * 60 - comparison.durationAToB / 60)
      : null;
  const saveMinB =
    scores?.commuteB != null && comparison?.durationBToA != null
      ? Math.round(scores.commuteB * 60 - comparison.durationBToA / 60)
      : null;

  const saveHoursA =
    saveMinA != null && saveMinA > 0
      ? `Saves ~${((saveMinA * 20) / 60).toFixed(1)} hrs/month`
      : null;
  const saveHoursB =
    saveMinB != null && saveMinB > 0
      ? `Saves ~${((saveMinB * 20) / 60).toFixed(1)} hrs/month`
      : null;

  const leftSide = amSideA ? 'A' : 'B';
  const rightSide = amSideA ? 'B' : 'A';
  const leftResume = amSideA ? item.resumeA : item.resumeB;
  const rightResume = amSideA ? item.resumeB : item.resumeA;
  const leftCommuteMin = leftResume?.commuteDurationSeconds ?? null;
  const rightCommuteMin = rightResume?.commuteDurationSeconds ?? null;
  const leftNewCommuteMin =
    comparison?.durationAToB != null && amSideA
      ? Math.round(comparison.durationAToB / 60)
      : comparison?.durationBToA != null && !amSideA
        ? Math.round(comparison.durationBToA / 60)
        : null;
  const rightNewCommuteMin =
    comparison?.durationBToA != null && amSideA
      ? Math.round(comparison.durationBToA / 60)
      : comparison?.durationAToB != null && !amSideA
        ? Math.round(comparison.durationAToB / 60)
        : null;
  const leftSaveHours = amSideA ? saveHoursA : saveHoursB;
  const rightSaveHours = amSideA ? saveHoursB : saveHoursA;

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4">
        The Match
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        The employees from different companies mutually agree to exchange roles
        at locations closer to their homes. No one is hired or fired - the same
        positions remain filled.
      </p>
      <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 mb-6">
        <SwitcherCard
          side={leftSide}
          badgeLabel="Your employee"
          resume={leftResume}
          getName={getName}
          currentCommuteMin={
            leftCommuteMin ? Math.round(leftCommuteMin / 60) : null
          }
          newCommuteMin={leftNewCommuteMin}
          saveHoursPerMonth={leftSaveHours}
        />
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-2">
          <span className="text-2xl sm:text-3xl font-bold text-[var(--color-success-accent,var(--color-green-600))]">
            {row.matchPercent ?? '—'}%
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Match
          </span>
          <ArrowLeftRight className="size-5 text-muted-foreground" />
        </div>
        <SwitcherCard
          side={rightSide}
          badgeLabel="Incoming - parthner company"
          resume={rightResume}
          getName={getName}
          currentCommuteMin={
            rightCommuteMin ? Math.round(rightCommuteMin / 60) : null
          }
          newCommuteMin={rightNewCommuteMin}
          saveHoursPerMonth={rightSaveHours}
        />
      </div>
    </div>
  );
}
