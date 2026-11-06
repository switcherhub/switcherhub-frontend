'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useReferenceData } from '@/context/reference-data-context';
import { getSwapRequest } from '@/lib/api';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { Skeleton } from '@/components/ui/skeleton';
import { Content } from '@/components/layouts/layout-15/components/content';
import {
  itemToRow,
  SwapRequestDetailsContent,
} from '@/components/swap-request/swap-request-details-modal';
import { HrDecisionPanel } from '@/components/swap-request/hr-decision-panel';

export default function SwapRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : null;
  const { getName } = useReferenceData();
  const { currentUser } = useAuth();

  const [item, setItem] = useState<SwapRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id) {
        setLoading(false);
        return;
      }
      const silent = options?.silent === true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await getSwapRequest(id);
        setItem(data);
        if (!silent) {
          setError(null);
        }
      } catch (e) {
        if (!silent) {
          setError(
            e instanceof Error ? e.message : 'Failed to load swap request',
          );
          setItem(null);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = useCallback(() => {
    router.push('/swap-request');
  }, [router]);

  const handleAfterDelete = useCallback(() => {
    router.push('/swap-request');
  }, [router]);

  if (!id) {
    return (
      <Content className="px-4 sm:px-6">
        <p className="text-sm text-muted-foreground">Invalid swap request.</p>
      </Content>
    );
  }

  if (loading) {
    return (
      <Content className="px-4 sm:px-6">
        <Skeleton className="h-64 w-full rounded-lg" />
      </Content>
    );
  }

  if (error || !item) {
    return (
      <Content className="px-4 sm:px-6">
        <p className="text-sm text-destructive">{error ?? 'Not found.'}</p>
      </Content>
    );
  }

  const row = itemToRow(item, currentUser?.email, getName);

  return (
    <Content className="flex flex-col min-h-0 overflow-hidden pt-0">
      <SwapRequestDetailsContent
        row={row}
        item={item}
        currentUserEmail={currentUser?.email}
        onConfirmSuccess={load}
        onBack={handleBack}
        onAfterDelete={handleAfterDelete}
      />
      <div className="px-4 pb-6 sm:px-6">
        <HrDecisionPanel swapId={id} />
      </div>
    </Content>
  );
}
