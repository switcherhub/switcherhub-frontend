'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useReferenceData } from '@/context/reference-data-context';
import { format } from 'date-fns';
import { ArrowLeftRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type {
  SwapRequestItem,
  SwapRequestResponse,
  SwapRequestTabCounts,
} from '@/lib/types/swap-request';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Content } from '@/components/layouts/layout-15/components/content';
import { ContentHeader } from '@/components/layouts/layout-15/components/content-header';
import {
  itemToRow,
  StatusBadge,
  type RiskLevel,
} from '@/components/swap-request/swap-request-details-modal';
import type { SwapRequestDetailsRow } from '@/components/swap-request/details';

type SwapInviteResume = {
  id: string;
  workEnvironment: {
    id: string;
    title: string;
    order: number;
    isHidden: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  jobCore: {
    id: string;
    title: string;
    order: number;
    isHidden: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  jobType: {
    id: string;
    title: string;
    order: number;
    isHidden: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  hoursPerMonth: number;
};

type SwapInvitePreview = {
  swapId: string;
  numericId: number;
  createdAt: string;
  score: number;
  mySide: 'A' | 'B';
  resumeA: SwapInviteResume;
  resumeB: SwapInviteResume;
};

type ManagerTabValue = 'new' | 'active' | 'success' | 'failed';

function formatRowDate(isoDate: string) {
  try {
    return format(new Date(isoDate), 'MMM d, yyyy');
  } catch {
    return isoDate;
  }
}

function MatchCell({
  percent,
  riskLevel,
  step,
}: {
  percent: number | null;
  riskLevel: RiskLevel | null;
  step: number;
}) {
  const hasPercent = percent != null;

  return (
    <div className="flex flex-col gap-1">
      {hasPercent ? (
        <span className="text-xl font-bold text-primary">{percent}%</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
      <Badge variant="secondary" size="sm" className="w-fit">
        Step {step} of 5
      </Badge>
    </div>
  );
}

export default function SwapRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { getName, isLoading: refDataLoading } = useReferenceData();

  const tabParam = searchParams.get('tab');
  const currentTab: ManagerTabValue | '' =
    tabParam === 'active' || tabParam === 'success' || tabParam === 'failed'
      ? tabParam
      : '';
  const searchQuery = searchParams.get('search') ?? '';
  const pageFromUrl = Math.max(
    1,
    parseInt(searchParams.get('page') ?? '1', 10),
  );

  const [data, setData] = useState<SwapRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(10);
  const [tabCounts, setTabCounts] = useState<SwapRequestTabCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const joinFromUrlDoneRef = useRef(false);
  const openRedirectDoneRef = useRef<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  /** Set after auto-join from invite link; used for “View” navigation. */
  const [inviteJoinedSwapId, setInviteJoinedSwapId] = useState<string | null>(
    null,
  );
  const inviteHandledRef = useRef(false);

  const setParams = useCallback(
    (updates: {
      tab?: ManagerTabValue | '';
      search?: string;
      page?: number;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.tab !== undefined) {
        if (updates.tab) next.set('tab', updates.tab);
        else next.delete('tab');
        next.delete('page');
      }
      if (updates.search !== undefined) {
        if (updates.search) next.set('search', updates.search);
        else next.delete('search');
        next.delete('page');
      }
      if (updates.page !== undefined) {
        if (updates.page <= 1) next.delete('page');
        else next.set('page', String(updates.page));
      }
      router.push(`/swap-request?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: String(pageFromUrl),
        per_page: String(perPage),
      });
      if (currentTab) query.set('tab', currentTab);
      if (searchQuery.trim()) query.set('search', searchQuery.trim());
      const res = await apiFetch<SwapRequestResponse>(
        `/swap-request/manager?${query}`,
      );
      setData(res.data ?? []);
      setTotal(res.total ?? 0);
      if (res.tabCounts != null) setTabCounts(res.tabCounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentTab, searchQuery, pageFromUrl, perPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlCode = searchParams.get('joinCode')?.trim() || null;
    const storedCode =
      window.localStorage.getItem('pendingSwapJoinCode')?.trim() || null;

    let codeToHandle = urlCode || storedCode;

    if (!codeToHandle) {
      joinFromUrlDoneRef.current = false;
      return;
    }

    if (inviteHandledRef.current) return;

    if (urlCode) {
      const url = new URL(window.location.href);
      url.searchParams.delete('joinCode');
      window.history.replaceState(null, '', url.pathname + (url.search || ''));
    }

    if (!currentUser) {
      window.localStorage.setItem('pendingSwapJoinCode', codeToHandle);
      return;
    }

    inviteHandledRef.current = true;
    window.localStorage.removeItem('pendingSwapJoinCode');
    setJoinSubmitting(true);

    apiFetch<SwapInvitePreview>(
      `/swap-request/hr/preview/${encodeURIComponent(codeToHandle)}`,
    )
      .then(async (preview) => {
        try {
          await apiFetch('/swap-request/hr/join', {
            method: 'POST',
            body: JSON.stringify({ code: codeToHandle }),
          });
          setInviteJoinedSwapId(preview.swapId);
          setInviteDialogOpen(true);
          load();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Failed to join swap');
          setInviteJoinedSwapId(null);
        }
      })
      .catch((e) => {
        toast.error(
          e instanceof Error ? e.message : 'Failed to load swap invitation',
        );
        setInviteJoinedSwapId(null);
      })
      .finally(() => {
        setJoinSubmitting(false);
      });
  }, [searchParams, currentUser, load]);

  const handleJoinByCode = useCallback(async () => {
    const code = joinCode.trim();
    if (!code) return;
    setJoinSubmitting(true);
    try {
      await apiFetch('/swap-request/hr/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      toast.success('You have joined the swap. It will appear in the table.');
      setJoinDialogOpen(false);
      setJoinCode('');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setJoinSubmitting(false);
    }
  }, [joinCode, load]);

  const dismissInviteSuccessDialog = useCallback(() => {
    setInviteDialogOpen(false);
    setInviteJoinedSwapId(null);
    inviteHandledRef.current = false;
  }, []);

  const handleViewJoinedSwap = useCallback(() => {
    const id = inviteJoinedSwapId?.trim();
    if (!id) return;
    dismissInviteSuccessDialog();
    router.push(`/swap-request/${id}`);
  }, [inviteJoinedSwapId, router, dismissInviteSuccessDialog]);

  const onInviteDialogOpenChange = useCallback((open: boolean) => {
    setInviteDialogOpen(open);
    if (!open) {
      setInviteJoinedSwapId(null);
      inviteHandledRef.current = false;
    }
  }, []);

  const tableRows = useMemo(
    () => data.map((item) => itemToRow(item, currentUser?.email, getName)),
    [data, currentUser?.email, getName],
  );
  const itemsById = useMemo(
    () => new Map(data.map((item) => [item.id, item])),
    [data],
  );

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) {
      openRedirectDoneRef.current = null;
      return;
    }
    if (loading) return;
    if (openRedirectDoneRef.current === openId) return;
    if (itemsById.has(openId)) {
      openRedirectDoneRef.current = openId;
      router.replace(`/swap-request/${openId}`);
    }
  }, [searchParams, loading, itemsById, router]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (pageFromUrl - 1) * perPage + 1;
  const to = Math.min(pageFromUrl * perPage, total);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const handleOpenSwap = useCallback(
    (row: SwapRequestDetailsRow) => {
      if (row.isNew) {
        void apiFetch(`/swap-request/${row.id}/mark-read`, {
          method: 'PUT',
        }).catch(() => {
          // Non-blocking: ignore errors, navigation still proceeds.
        });
      }
      router.push(`/swap-request/${row.id}`);
    },
    [router],
  );

  return (
    <>
      <ContentHeader className="space-x-2">
        <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
          <ArrowLeftRight className="size-4 text-primary" />
          Swap request
        </h1>
      </ContentHeader>

      <Dialog open={inviteDialogOpen} onOpenChange={onInviteDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View swap request</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              You have joined this swap. Open the request to see full details.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={dismissInviteSuccessDialog}>
              Close
            </Button>
            <Button
              onClick={handleViewJoinedSwap}
              disabled={!inviteJoinedSwapId?.trim()}
            >
              View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter code</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input
              placeholder="Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
              className="font-mono"
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleJoinByCode}
              disabled={joinSubmitting || !joinCode.trim()}
            >
              {joinSubmitting ? 'Joining…' : 'Join'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container-fluid">
        <Content className="block space-y-6 py-5">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Tabs
            value={currentTab || 'all'}
            onValueChange={(value) => {
              if (value === 'all') setParams({ tab: '' });
              else setParams({ tab: value as ManagerTabValue });
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="-mx-1 w-full min-w-0 overflow-x-auto overflow-y-hidden pb-px sm:mx-0 sm:w-auto sm:overflow-visible">
                <TabsList
                  variant="line"
                  size="md"
                  className="inline-flex w-max min-w-full justify-start sm:w-auto"
                >
                  <TabsTrigger value="all" className="gap-1.5">
                    All
                    {tabCounts && (
                      <Badge variant="secondary" size="sm" className="ms-0.5">
                        {tabCounts.new +
                          tabCounts.active +
                          tabCounts.success +
                          tabCounts.failed}
                      </Badge>
                    )}
                  </TabsTrigger>

                  <TabsTrigger value="active" className="gap-1.5">
                    Active
                    {tabCounts && (
                      <Badge variant="secondary" size="sm" className="ms-0.5">
                        {tabCounts.active}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="success" className="gap-1.5">
                    Success
                    {tabCounts && (
                      <Badge variant="secondary" size="sm" className="ms-0.5">
                        {tabCounts.success}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="gap-1.5">
                    Failed
                    {tabCounts && (
                      <Badge variant="secondary" size="sm" className="ms-0.5">
                        {tabCounts.failed}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setParams({ search: searchInput.trim() });
                  }}
                  className="contents"
                >
                  <Input
                    placeholder="Search by email, ID…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8"
                  />
                </form>
              </div>
            </div>
          </Tabs>

          <div className="rounded-lg border overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Environment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Your Status</TableHead>
                      <TableHead>Other Company</TableHead>
                      <TableHead className="w-14">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          No swap requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className={row.isNew ? 'bg-primary/5' : undefined}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {row.position}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {row.workEnvironment}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                ID: {row.numericId}
                              </span>
                              {row.isNew && (
                                <Badge
                                  variant="primary"
                                  size="sm"
                                  className="mt-1 w-fit"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatRowDate(row.date)}
                          </TableCell>
                          <TableCell>
                            <MatchCell
                              percent={row.matchPercent}
                              riskLevel={row.riskLevel}
                              step={row.step}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.jobType}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              label={row.yourStatus}
                              variant={row.yourStatusVariant}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              label={row.otherCompany || '—'}
                              variant={row.otherCompanyVariant ?? 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-[#00A63E] text-white border-[#00A63E] hover:bg-[#00A63E]/90 hover:text-white"
                              onClick={() => handleOpenSwap(row)}
                              aria-label="View request details"
                            >
                              <span className="sm:hidden">Details</span>
                              <span className="hidden sm:inline">
                                View request details
                              </span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {pageCount > 1 && (
                  <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:py-2">
                    <span className="text-muted-foreground">
                      {from}–{to} of {total}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageFromUrl <= 1}
                        onClick={() =>
                          setParams({ page: Math.max(1, pageFromUrl - 1) })
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageFromUrl >= pageCount}
                        onClick={() =>
                          setParams({
                            page: Math.min(pageCount, pageFromUrl + 1),
                          })
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Content>
      </div>
    </>
  );
}
