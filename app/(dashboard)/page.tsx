'use client';

import { useCallback, useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import {
  getDashboardStatistics,
  getDashboardStatisticsByManagers,
  getSwapRequestTabCounts,
} from '@/lib/api';
import type {
  DashboardStatistics,
  DashboardStatisticsByManagers,
  SwapRequestTabCounts,
} from '@/lib/types/swap-request';
import { useOrganization } from '@/context/organization-context';
import { Content } from '@/components/layouts/layout-15/components/content';
import { ContentHeader } from '@/components/layouts/layout-15/components/content-header';
import {
  DashboardWelcome,
  DashboardStats,
  DashboardStatsByManagers,
  SwapsToReviewCard,
  JoinSwapRequestCard,
  WhySwitcherHubSection,
} from '@/components/dashboard';

export default function DashboardPage() {
  const { activeOrganization } = useOrganization();

  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [tabCounts, setTabCounts] = useState<SwapRequestTabCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statsByManagers, setStatsByManagers] =
    useState<DashboardStatisticsByManagers | null>(null);
  const [byManagersLoading, setByManagersLoading] = useState(true);
  const [byManagersError, setByManagersError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeOrganization?.id) {
      setStats(null);
      setTabCounts(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [data, tabCountsData] = await Promise.all([
        getDashboardStatistics(activeOrganization.id),
        getSwapRequestTabCounts(),
      ]);
      setStats(data);
      setTabCounts(tabCountsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load statistics');
      setStats(null);
      setTabCounts(null);
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id]);

  const loadByManagers = useCallback(async () => {
    if (!activeOrganization?.id) {
      setStatsByManagers(null);
      setByManagersLoading(false);
      return;
    }
    setByManagersLoading(true);
    setByManagersError(null);
    try {
      const data = await getDashboardStatisticsByManagers(activeOrganization.id);
      setStatsByManagers(data);
    } catch (e) {
      setByManagersError(
        e instanceof Error ? e.message : 'Failed to load statistics by managers',
      );
      setStatsByManagers(null);
    } finally {
      setByManagersLoading(false);
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    load();
    loadByManagers();
  }, [load, loadByManagers]);

  return (
    <>
      <ContentHeader className="space-x-2">
        <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
          <Home className="size-4 text-primary" />
          Dashboard
        </h1>
      </ContentHeader>

      <div className="container-fluid">
        <Content className="block space-y-8 py-6">
          <DashboardWelcome />

          <DashboardStats
            stats={stats}
            tabCounts={tabCounts}
            loading={loading}
            error={error}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <SwapsToReviewCard stats={stats} />
            <JoinSwapRequestCard />
          </div>

          <DashboardStatsByManagers
            data={statsByManagers}
            loading={byManagersLoading}
            error={byManagersError}
          />

          <WhySwitcherHubSection />
        </Content>
      </div>
    </>
  );
}
