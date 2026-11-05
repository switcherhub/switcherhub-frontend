export type RiskLevel = 'high' | 'medium' | 'low';

export type StatusVariant =
  | 'warning'
  | 'success'
  | 'info'
  | 'destructive'
  | 'secondary';

export interface SwapRequestDetailsRow {
  id: string;
  numericId: number;
  position: string;
  workEnvironment: string;
  department: string;
  date: string;
  matchPercent: number | null;
  riskLevel: RiskLevel | null;
  step: number;
  jobType: string;
  yourStatus: string;
  yourStatusVariant: StatusVariant;
  otherCompany: string;
  otherCompanyVariant?: StatusVariant;
  isNew: boolean;
}

export interface StepInfo {
  step: number;
  label: string;
  state: string;
  canCancel: string;
}
