export enum SwapStatusEnum {
  CREATED = 'CREATED',
  PARTICIPANTS_CONFIRMED = 'PARTICIPANTS_CONFIRMED',
  HR_INVITED = 'HR_INVITED',
  HR_A_JOINED = 'HR_A_JOINED',
  HR_B_JOINED = 'HR_B_JOINED',
  HR_BOTH_JOINED = 'HR_BOTH_JOINED',
  HR_A_CONFIRMED = 'HR_A_CONFIRMED',
  HR_B_CONFIRMED = 'HR_B_CONFIRMED',
  HR_BOTH_CONFIRMED = 'HR_BOTH_CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  FIRST_PAYMENT_COMPLETED = 'FIRST_PAYMENT_COMPLETED',
  PAYMENT_A_HOLD = 'PAYMENT_A_HOLD',
  PAYMENT_B_HOLD = 'PAYMENT_B_HOLD',
  PAYMENT_BOTH_HOLD = 'PAYMENT_BOTH_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface SwapRequestResumeLocation {
  lat?: number;
  lng?: number;
  area?: string | null;
  city?: string;
  state?: string;
  address?: string;
  zipCode?: string;
  country?: string;
}

export interface SwapRequestResumeRef {
  id?: string;
  name?: string;
  title?: string;
}

export interface SwapRequestResume {
  id: string;
  firstName: string;
  title?: string;
  salaryHourly?: number;
  locationCity?: string;
  location?: SwapRequestResumeLocation;
  jobCoreId?: string | null;
  workEnvironmentId?: string | null;
  jobTypeId?: string | null;
  shiftTypeId?: string | null;
  locationTenureId?: string | null;
  sameRoleCountId?: string | null;
  timeToStartWorkingId?: string | null;
  licenseRequiredId?: string | null;
  locationArea?: string | null;
  locationZipcode?: string | null;
  jobCore?: SwapRequestResumeRef | null;
  workEnvironment?: SwapRequestResumeRef | null;
  jobType?: SwapRequestResumeRef | null;
  /** Hours per month (e.g. for Part time); shown in Job Type column when present */
  hoursPerMonth?: number | null;
  commuteDurationSeconds?: number | null;
}

export interface SwapRequestCreatedBy {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface SwapRequestManager {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
}

export interface SwapRequestComparisonScores {
  team?: number;
  shift?: number;
  salary?: number;
  tenure?: number;
  jobCore?: number;
  jobType?: number;
  license?: number;
  commuteA?: number;
  commuteB?: number;
  training?: number;
  environment?: number;
}

export interface SwapRequestComparison {
  scores?: SwapRequestComparisonScores;
  /** Duration A→B in seconds (new commute for your employee) */
  durationAToB?: number;
  /** Duration B→A in seconds (new commute for partner's employee) */
  durationBToA?: number;
}

export interface SwapRequestItem {
  id: string;
  numericId: number;
  resumeAId: string;
  resumeBId: string;
  managerAId?: string | null;
  managerBId?: string | null;
  createdById?: string | null;
  workspaceAId?: string | null;
  workspaceBId?: string | null;
  participantAFullName?: string | null;
  participantAPhone?: string | null;
  participantAPersonalEmail?: string | null;
  participantAConfirmed?: boolean;
  participantBFullName?: string | null;
  participantBPhone?: string | null;
  participantBPersonalEmail?: string | null;
  participantBConfirmed?: boolean;
  managerAEmail?: string | null;
  managerACode?: string | null;
  managerAJoined?: boolean;
  managerAJoinedAt?: string | null;
  managerBEmail?: string | null;
  managerBCode?: string | null;
  managerBJoined?: boolean;
  managerBJoinedAt?: string | null;
  managerAConfirmed?: boolean;
  managerAConfirmedAt?: string | null;
  managerBConfirmed?: boolean;
  managerBConfirmedAt?: string | null;
  stripePaymentIntentIdA?: string | null;
  stripePaymentIntentIdB?: string | null;
  paymentAHold?: boolean;
  paymentBHold?: boolean;
  firstPaymentDate?: string | null;
  completedAt?: string | null;
  cancelledById?: string | null;
  cancelledByType?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: SwapStatusEnum;
  step: number;
  totalScore?: number | null;
  score?: number | null;
  comparison?: SwapRequestComparison;
  resumeA: SwapRequestResume;
  resumeB: SwapRequestResume;
  managerA?: SwapRequestManager | null;
  managerB?: SwapRequestManager | null;
  createdBy?: SwapRequestCreatedBy | null;
  cancelledBy?: unknown | null;
  hrARead?: boolean;
  hrBRead?: boolean;
}

/** Counts per manager tab for badges (GET /swap-request/manager) */
export interface SwapRequestTabCounts {
  new: number;
  active: number;
  success: number;
  failed: number;
}

export interface SwapRequestResponse {
  data: SwapRequestItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  /** Present for manager endpoint: counts per tab for badges */
  tabCounts?: SwapRequestTabCounts;
}

export interface DashboardStatistics {
  pending: number;
  active: number;
  completed: number;
  averageProcessingTimeHours: number;
  averageProcessingTimeFormatted: string;
}

export interface DashboardManagerInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isDeleted: boolean;
}

export interface DashboardStatisticsByManagerItem {
  manager: DashboardManagerInfo;
  pending: number;
  active: number;
  completed: number;
  averageProcessingTimeHours: number;
  averageProcessingTimeFormatted: string;
}

export interface DashboardStatisticsByManagers {
  items: DashboardStatisticsByManagerItem[];
}
