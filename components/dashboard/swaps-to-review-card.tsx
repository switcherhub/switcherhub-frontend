import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import type { DashboardStatistics } from '@/lib/types/swap-request';

interface SwapsToReviewCardProps {
  stats: DashboardStatistics | null;
}

export function SwapsToReviewCard({ stats }: SwapsToReviewCardProps) {
  const summary =
    stats && stats.pending > 0
      ? `${stats.pending} employee${stats.pending === 1 ? '' : 's'} requested swaps — review and approve`
      : 'Review employee swap requests when they appear';

  return (
    <Card className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-none p-5 overflow-hidden">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15 text-green-600 dark:text-green-500 mb-4">
        <ArrowLeftRight className="size-5" />
      </div>
      <CardTitle className="text-xl font-bold text-foreground mb-2">
        Swaps to Review
      </CardTitle>
      <p className="text-sm font-semibold text-foreground mb-2">{summary}</p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        Review employee swap requests, check match compatibility, and approve or
        decline based on your team&apos;s needs.
      </p>
      <Button
        asChild
        className="w-full rounded-lg font-semibold h-11 bg-foreground text-background hover:bg-foreground/90"
      >
        <Link href="/swap-request">Review Requests</Link>
      </Button>
    </Card>
  );
}
