import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';

interface DashboardStatCardProps {
  value: string | number;
  label: string;
  status?: React.ReactNode;
}

const cardClassName =
  'min-h-32 rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none p-5 flex flex-col justify-center';

export function DashboardStatCard({ value, label, status }: DashboardStatCardProps) {
  return (
    <Card className={cardClassName}>
      <CardTitle className="text-3xl font-bold text-foreground tabular-nums tracking-tight mb-2">
        {value}
      </CardTitle>
      <CardDescription className="text-sm font-normal text-muted-foreground mb-1.5">
        {label}
      </CardDescription>
      {status}
    </Card>
  );
}

export function PendingStatStatus({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-normal text-green-600 dark:text-green-500">
      <ArrowUp className="size-3.5" />
      Needs review
    </span>
  );
}
