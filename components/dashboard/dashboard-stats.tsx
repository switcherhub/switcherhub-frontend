'use client';

import type {
  DashboardStatistics,
  SwapRequestTabCounts,
} from '@/lib/types/swap-request';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStatCard } from './dashboard-stat-card';

interface DashboardStatsProps {
  stats: DashboardStatistics | null;
  tabCounts: SwapRequestTabCounts | null;
  loading: boolean;
  error: string | null;
}

export function DashboardStats({
  stats,
  tabCounts,
  loading,
  error,
}: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!stats) {
    return null;
  }

  const newCount = tabCounts?.new ?? stats.pending;
  const active = tabCounts?.active ?? stats.active;
  const success = tabCounts?.success ?? stats.completed;
  const failed = tabCounts?.failed ?? 0;
  const all = newCount + active + success + failed;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardStatCard value={all} label="All" />
      <DashboardStatCard value={active} label="Active" />
      <DashboardStatCard value={success} label="Success" />
      <DashboardStatCard value={failed} label="Failed" />
    </div>
  );
}
