import type { ReferencePath } from '@/context/reference-data-context';
import { format } from 'date-fns';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { SwapStatusEnum } from '@/lib/types/swap-request';
import type { RiskLevel, StatusVariant, SwapRequestDetailsRow } from './types';

/** Stable numeric id for display (derived from uuid if API has no numericId) */
export function toNumericId(id: string): number {
  const hex = id.replace(/-/g, '').slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isNaN(n) ? 0 : n;
}

/** Normalize status for comparison: handle spaces, dashes, and camelCase (e.g. PaymentPending → PAYMENT_PENDING) */
export function normalizeStatus(status: SwapStatusEnum | string): string {
  return String(status ?? '')
    .replace(/[- ]/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

function getSideStatus(
  item: SwapRequestItem,
  isSideA: boolean,
): { label: string; variant: StatusVariant } {
  const status = normalizeStatus(item.status);
  const paidA = !!item.paymentAHold;
  const paidB = !!item.paymentBHold;

  if (status === normalizeStatus(SwapStatusEnum.COMPLETED)) {
    return { label: 'Completed', variant: 'success' };
  }
  if (status === normalizeStatus(SwapStatusEnum.CANCELLED)) {
    return { label: 'Cancelled', variant: 'destructive' };
  }
  if (status === normalizeStatus(SwapStatusEnum.REFUNDED)) {
    return { label: 'Refunded', variant: 'secondary' };
  }

  const paid = isSideA ? paidA : paidB;
  return paid
    ? { label: 'Paid', variant: 'success' }
    : { label: 'Payment pending', variant: 'warning' };
}

function formatPair(a: string | null, b: string | null, sep: string): string {
  if (a && b) return a === b ? a : `${a} ${sep} ${b}`;
  if (a || b) return [a, b].filter(Boolean).join(` ${sep} `);
  return '—';
}

/** If name contains "Part time" and hoursPerMonth is set, append " (X hrs)". */
export function formatJobTypeWithHours(
  name: string | null,
  hoursPerMonth: number | null | undefined,
): string | null {
  if (!name) return null;
  const isPartTime = /part/i.test(name.toLowerCase());
  const hours =
    hoursPerMonth != null && Number.isFinite(hoursPerMonth)
      ? hoursPerMonth
      : null;
  if (isPartTime && hours !== null) {
    return `${name} (${hours} hrs)`;
  }
  return name;
}

/** Build row for details/list from API item (shared with list page and details page). */
export function itemToRow(
  item: SwapRequestItem,
  currentUserEmail: string | undefined,
  getName: (
    path: ReferencePath,
    id: string | null | undefined,
  ) => string | null,
): SwapRequestDetailsRow {
  const email = currentUserEmail?.toLowerCase();
  const isSideA =
    !!email &&
    (item.managerAEmail?.toLowerCase() === email ||
      item.managerA?.email?.toLowerCase() === email);
  const isSideB =
    !!email &&
    (item.managerBEmail?.toLowerCase() === email ||
      item.managerB?.email?.toLowerCase() === email);
  const amSideA = isSideA || (!isSideB && !!email);
  const your = getSideStatus(item, amSideA);
  const other = getSideStatus(item, !amSideA);

  // "New" for current HR side when their corresponding read flag is not set.
  const hrRead = amSideA ? item.hrARead : item.hrBRead;
  const isNew = hrRead === false || hrRead === undefined ? true : !hrRead;

  const jobCoreA =
    item.resumeA?.jobCore?.name ??
    getName('job-core', item.resumeA?.jobCoreId) ??
    null;
  const workEnvA =
    getName('work-environment', item.resumeA?.workEnvironmentId) ??
    item.resumeA?.workEnvironment?.name ??
    item.resumeA?.workEnvironment?.title ??
    null;
  const jobCoreB =
    item.resumeB?.jobCore?.name ??
    getName('job-core', item.resumeB?.jobCoreId) ??
    null;
  const workEnvB =
    getName('work-environment', item.resumeB?.workEnvironmentId) ??
    item.resumeB?.workEnvironment?.name ??
    item.resumeB?.workEnvironment?.title ??
    null;

  const jobTypeARaw =
    item.resumeA?.jobType?.name ??
    getName('job-types', item.resumeA?.jobTypeId) ??
    null;
  const jobTypeBRaw =
    item.resumeB?.jobType?.name ??
    getName('job-types', item.resumeB?.jobTypeId) ??
    null;
  const jobTypeA = formatJobTypeWithHours(
    jobTypeARaw,
    item.resumeA?.hoursPerMonth,
  );
  const jobTypeB = formatJobTypeWithHours(
    jobTypeBRaw,
    item.resumeB?.hoursPerMonth,
  );
  const jobType = formatPair(jobTypeA, jobTypeB, '↔');

  const position =
    jobCoreA && jobCoreB
      ? jobCoreA === jobCoreB
        ? jobCoreA
        : `${jobCoreA} ↔ ${jobCoreB}`
      : jobCoreA || jobCoreB
        ? [jobCoreA, jobCoreB].filter(Boolean).join(' ↔ ')
        : item.resumeA?.firstName && item.resumeB?.firstName
          ? item.resumeA.firstName === item.resumeB.firstName
            ? item.resumeA.firstName
            : `${item.resumeA.firstName} ↔ ${item.resumeB.firstName}`
          : 'Swap request';

  const locA = item.resumeA?.locationCity ?? item.resumeA?.location?.city;
  const locB = item.resumeB?.locationCity ?? item.resumeB?.location?.city;
  const workEnvironment =
    workEnvA && workEnvB
      ? workEnvA === workEnvB
        ? workEnvA
        : `${workEnvA} → ${workEnvB}`
      : workEnvA || workEnvB
        ? [workEnvA, workEnvB].filter(Boolean).join(' → ')
        : '—';

  const department =
    locA && locB
      ? locA === locB
        ? locA
        : `${locA} → ${locB}`
      : locA || locB || '—';

  const rawScore = item.score ?? item.totalScore;
  const matchPercent =
    rawScore != null
      ? rawScore <= 1
        ? Math.round(rawScore * 100)
        : Math.round(rawScore)
      : null;

  const riskLevel: RiskLevel | null =
    matchPercent != null
      ? matchPercent >= 90
        ? 'low'
        : matchPercent >= 80
          ? 'medium'
          : 'high'
      : null;

  return {
    id: item.id,
    numericId: item.numericId,
    position,
    workEnvironment,
    department,
    date: item.createdAt,
    matchPercent,
    riskLevel,
    step: item.step,
    jobType,
    yourStatus: your.label,
    yourStatusVariant: your.variant,
    otherCompany: other.label,
    otherCompanyVariant: other.variant,
    isNew,
  };
}

export function formatRowDate(isoDate: string): string {
  try {
    return format(new Date(isoDate), 'MMM d, yyyy');
  } catch {
    return isoDate;
  }
}

/** Returns whether the current user is "side A" (manager A / our side) based on item and email */
export function isCurrentUserSideA(
  item: SwapRequestItem,
  currentUserEmail: string | undefined,
): boolean {
  const email = currentUserEmail?.toLowerCase();
  if (!email) return false;
  const sideA =
    item.managerAEmail?.toLowerCase() === email ||
    item.managerA?.email?.toLowerCase() === email;
  const sideB =
    item.managerBEmail?.toLowerCase() === email ||
    item.managerB?.email?.toLowerCase() === email;
  return sideA || (!sideB && !!email);
}

/** Returns the step we're currently on (waiting for or in progress), not the last completed one */
export function getCurrentStepNumber(item: SwapRequestItem): number {
  const status = normalizeStatus(item.status);
  const bothSwitchersConfirmed =
    item.participantAConfirmed && item.participantBConfirmed;
  const bothManagersJoined = item.managerAJoined && item.managerBJoined;
  const bothPaid = !!(item.paymentAHold && item.paymentBHold);

  if (status === SwapStatusEnum.COMPLETED) return 5;
  if (bothPaid) return 4;
  if (
    status === SwapStatusEnum.HR_BOTH_CONFIRMED ||
    status === SwapStatusEnum.PAYMENT_PENDING ||
    status === SwapStatusEnum.FIRST_PAYMENT_COMPLETED ||
    status === SwapStatusEnum.PAYMENT_A_HOLD ||
    status === SwapStatusEnum.PAYMENT_B_HOLD ||
    status === SwapStatusEnum.PAYMENT_BOTH_HOLD
  )
    return 4;
  if (
    status === SwapStatusEnum.HR_A_CONFIRMED ||
    status === SwapStatusEnum.HR_B_CONFIRMED ||
    (status === SwapStatusEnum.HR_BOTH_JOINED && bothManagersJoined)
  ) {
    return 3;
  }
  if (
    bothSwitchersConfirmed ||
    status === SwapStatusEnum.HR_A_JOINED ||
    status === SwapStatusEnum.HR_B_JOINED
  ) {
    return 2;
  }
  return 1;
}

export function getRiskLevel(score: number | undefined): RiskLevel {
  if (score == null) return 'low';
  const percent = score * 100;
  if (percent < 70) return 'high';
  if (percent < 80) return 'medium';
  return 'low';
}

export const STEP_LABELS: Record<number, string> = {
  1: 'Request created',
  2: 'Both switcher agreed',
  3: 'Partner HR',
  4: 'Your payment',
  5: 'Swap activated',
};

/** Step 4 label: "Your payment" when current user hasn't paid, "Partner payment" when current user paid but partner hasn't */
export function getStep4Label(
  item: SwapRequestItem,
  currentUserEmail: string | undefined,
): string {
  const amSideA = isCurrentUserSideA(item, currentUserEmail);
  const ourPaid = amSideA ? !!item.paymentAHold : !!item.paymentBHold;
  const partnerPaid = amSideA ? !!item.paymentBHold : !!item.paymentAHold;
  if (ourPaid && !partnerPaid) return 'Partner payment';
  return 'Your payment';
}

export const STEPS: Array<{ step: number; label: string }> = [
  { step: 1, label: 'Request created' },
  { step: 2, label: 'Both switcher agreed' },
  { step: 3, label: 'Partner HR' },
  { step: 4, label: 'Your payment' },
  { step: 5, label: 'Swap activated' },
];

/** Returns step labels for display; step 4 is dynamic based on who has paid */
export function getStepLabels(
  item: SwapRequestItem,
  currentUserEmail: string | undefined,
): string[] {
  return [
    STEP_LABELS[1],
    STEP_LABELS[2],
    STEP_LABELS[3],
    getStep4Label(item, currentUserEmail),
    STEP_LABELS[5],
  ];
}

/** Who cancelled the request for display: "Your company" or "Partner company" */
export function getCancelledByLabel(
  item: SwapRequestItem,
  amSideA: boolean,
): string {
  const id = item.cancelledById ?? '';
  const cancelledBySideA =
    (item.managerAId && id === item.managerAId) ||
    (item.managerA?.id && id === item.managerA.id);
  const cancelledBySideB =
    (item.managerBId && id === item.managerBId) ||
    (item.managerB?.id && id === item.managerB.id);
  if (cancelledBySideA) return amSideA ? 'Your company' : 'Partner company';
  if (cancelledBySideB) return amSideA ? 'Partner company' : 'Your company';
  return 'Partner company';
}
