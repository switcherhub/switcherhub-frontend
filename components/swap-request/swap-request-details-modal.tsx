'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { useReferenceData } from '@/context/reference-data-context';
import { toast } from 'sonner';
import {
  confirmManagerParticipation,
  deleteSwapRequest,
  getOrganizationMembers,
  getSwapRequest,
} from '@/lib/api';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { SwapStatusEnum } from '@/lib/types/swap-request';
import {
  AfterApproveSection,
  ComparisonTable,
  DeleteConfirmDialog,
  DetailsActionsBar,
  DetailsHeader,
  getCurrentStepNumber,
  isCurrentUserSideA,
  itemToRow,
  MatchSection,
  PaymentBlock,
  RequestCancelledBlock,
  StatusBadge,
  SwapCompletedBlock,
  SwapCompletedContactBlocks,
  toNumericId,
  WhyItMattersSection,
} from './details';
import type { SwapRequestDetailsRow } from './details';
import { PaymentMethodSelectDialog } from './payment-method-select-dialog';
import {
  BothCompaniesConfirmedDialog,
  PaymentConfirmLoadingDialog,
  POST_PAYMENT_POLL_INTERVAL_MS,
  POST_PAYMENT_POLL_MAX_MS,
  WaitingPartnerHrDialog,
} from './post-payment-flow-dialogs';

type PostPaymentPhase =
  | 'idle'
  | 'polling'
  | 'result_completed'
  | 'result_waiting';

function normalizeSwapStatus(status: string | undefined) {
  return String(status ?? '')
    .toUpperCase()
    .replace(/[- ]/g, '_');
}

// Re-export for consumers (list page, details page)
export { itemToRow, StatusBadge, toNumericId };
export type {
  RiskLevel,
  StatusVariant,
  SwapRequestDetailsRow,
} from './details';

export function SwapRequestDetailsContent({
  row,
  item,
  currentUserEmail,
  onConfirmSuccess,
  onBack,
  onAfterDelete,
}: {
  row: SwapRequestDetailsRow;
  item: SwapRequestItem;
  currentUserEmail?: string;
  onConfirmSuccess?: (options?: { silent?: boolean }) => void | Promise<void>;
  onBack?: () => void;
  onAfterDelete?: () => void;
}) {
  const { getName } = useReferenceData();
  const { currentUser } = useAuth();
  const { activeOrganization } = useOrganization();
  const [confirmingParticipation, setConfirmingParticipation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [postPaymentPhase, setPostPaymentPhase] =
    useState<PostPaymentPhase>('idle');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const onConfirmSuccessRef = useRef(onConfirmSuccess);
  const [currentMemberRole, setCurrentMemberRole] = useState<string | null>(
    null,
  );

  const isOwner = currentUser?.id === activeOrganization?.ownerId;

  useEffect(() => {
    onConfirmSuccessRef.current = onConfirmSuccess;
  }, [onConfirmSuccess]);

  useEffect(() => {
    if (!activeOrganization?.id || !currentUser?.id) {
      setCurrentMemberRole(null);
      return;
    }
    let cancelled = false;
    getOrganizationMembers(activeOrganization.id)
      .then((members) => {
        if (cancelled) return;
        const member = members.find((m) => m.userId === currentUser.id);
        setCurrentMemberRole(member?.role ?? null);
      })
      .catch(() => setCurrentMemberRole(null));
    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id, currentUser?.id]);

  const isAdminOrOwner = isOwner || currentMemberRole === 'admin';
  const activeStepNumber = getCurrentStepNumber(item);
  const amSideA = isCurrentUserSideA(item, currentUserEmail);

  const email = currentUserEmail?.toLowerCase();
  const isManagerA =
    !!email &&
    (item.managerAEmail?.toLowerCase() === email ||
      item.managerA?.email?.toLowerCase() === email);
  const isManagerB =
    !!email &&
    (item.managerBEmail?.toLowerCase() === email ||
      item.managerB?.email?.toLowerCase() === email);
  const status = String(item.status ?? '')
    .toUpperCase()
    .replace(/[- ]/g, '_');
  const isCancelled = status === SwapStatusEnum.CANCELLED;
  const bothManagersJoined = item.managerAJoined && item.managerBJoined;

  const showConfirmParticipationButton =
    activeStepNumber === 3 &&
    bothManagersJoined &&
    currentUserEmail &&
    status !== SwapStatusEnum.HR_BOTH_CONFIRMED &&
    status !== SwapStatusEnum.PAYMENT_PENDING &&
    status !== SwapStatusEnum.FIRST_PAYMENT_COMPLETED &&
    status !== SwapStatusEnum.PAYMENT_A_HOLD &&
    status !== SwapStatusEnum.PAYMENT_B_HOLD &&
    status !== SwapStatusEnum.PAYMENT_BOTH_HOLD &&
    ((isManagerA && status !== SwapStatusEnum.HR_A_CONFIRMED) ||
      (isManagerB && status !== SwapStatusEnum.HR_B_CONFIRMED));

  const ourPaid = amSideA ? !!item.paymentAHold : !!item.paymentBHold;

  useEffect(() => {
    if (postPaymentPhase !== 'polling') return;

    let cancelled = false;
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const finishSuccess = async (data: SwapRequestItem) => {
      if (cancelled) return;
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const normalized = normalizeSwapStatus(data.status);
      setPostPaymentPhase(
        normalized === SwapStatusEnum.COMPLETED
          ? 'result_completed'
          : 'result_waiting',
      );
      // Silent refresh: avoid full-page skeleton that unmounts this tree and drops modal state.
      try {
        await onConfirmSuccessRef.current?.({ silent: true });
      } catch {
        /* ignore */
      }
    };

    const check = async () => {
      if (cancelled) return;
      try {
        const data = await getSwapRequest(item.id);
        const ourHold = amSideA ? !!data.paymentAHold : !!data.paymentBHold;
        if (ourHold) {
          await finishSuccess(data);
        }
      } catch {
        /* retry on next interval */
      }
    };

    void check();
    intervalId = window.setInterval(check, POST_PAYMENT_POLL_INTERVAL_MS);
    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      setPostPaymentPhase('idle');
      toast.error(
        'Could not confirm payment in time. Please refresh the page.',
      );
    }, POST_PAYMENT_POLL_MAX_MS);

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [postPaymentPhase, item.id, amSideA]);
  const step = item.step ?? 1;
  const showPaymentButton =
    !ourPaid &&
    !!currentUserEmail &&
    (isManagerA || isManagerB || isAdminOrOwner);

  const ourConfirmed = amSideA
    ? !!item.managerAConfirmed
    : !!item.managerBConfirmed;
  const canDelete =
    currentUserEmail && (isManagerA || isManagerB) && !ourConfirmed;

  async function handleConfirmParticipation() {
    setConfirmingParticipation(true);
    try {
      await confirmManagerParticipation(item.id);
      onConfirmSuccess?.();
      toast.success('Participation confirmed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to confirm');
    } finally {
      setConfirmingParticipation(false);
    }
  }

  async function handleRefresh() {
    if (!onConfirmSuccess) return;
    setRefreshing(true);
    try {
      await onConfirmSuccess();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSwapRequest(item.id);
      toast.success('Swap request deleted successfully.');
      onConfirmSuccess?.();
      setDeleteDialogOpen(false);
      onAfterDelete?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to delete swap request',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col px-4 pt-0 lg:px-5">
        <DetailsActionsBar
          onBack={onBack}
          onConfirmParticipation={handleConfirmParticipation}
          onPay={() => setPaymentDialogOpen(true)}
          onDelete={() => setDeleteDialogOpen(true)}
          onRefresh={handleRefresh}
          confirmingParticipation={confirmingParticipation}
          refreshing={refreshing}
          showConfirmParticipationButton={!!showConfirmParticipationButton}
          showPaymentButton={!!showPaymentButton}
          canDelete={!!canDelete}
        />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mt-8 flex flex-col lg:flex-row gap-8">
            <div className="min-w-0 space-y-6 lg:basis-[60%]">
              <DetailsHeader
                row={row}
                item={item}
                currentUserEmail={currentUserEmail}
              />

              {status !== SwapStatusEnum.COMPLETED && (
                <MatchSection
                  item={item}
                  row={row}
                  getName={getName}
                  amSideA={amSideA}
                />
              )}

              {!isCancelled && status !== SwapStatusEnum.COMPLETED && (
                <>
                  <AfterApproveSection />
                  <WhyItMattersSection />
                </>
              )}

              {status === SwapStatusEnum.COMPLETED && (
                <SwapCompletedContactBlocks
                  item={item}
                  amSideA={amSideA}
                  getName={getName}
                />
              )}
            </div>

            <div className="min-w-0 w-full space-y-6 lg:basis-[40%]">
              {isCancelled && (
                <RequestCancelledBlock item={item} amSideA={amSideA} />
              )}

              {status === SwapStatusEnum.COMPLETED && (
                <SwapCompletedBlock item={item} />
              )}

              <ComparisonTable
                item={item}
                getName={getName}
                amSideA={amSideA}
              />

              {!isCancelled &&
                (isManagerA || isManagerB || isAdminOrOwner) &&
                status !== SwapStatusEnum.CANCELLED &&
                status !== SwapStatusEnum.COMPLETED && (
                  <PaymentBlock
                    item={item}
                    row={row}
                    amSideA={amSideA}
                    ourPaid={ourPaid}
                    getName={getName}
                    onPay={() => setPaymentDialogOpen(true)}
                    onCancelRequest={() => setDeleteDialogOpen(true)}
                    canDelete={!!canDelete}
                  />
                )}
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodSelectDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        swapRequestId={item.id}
        onSuccess={() => setPostPaymentPhase('polling')}
      />

      <PaymentConfirmLoadingDialog open={postPaymentPhase === 'polling'} />

      <BothCompaniesConfirmedDialog
        open={postPaymentPhase === 'result_completed'}
        onOpenChange={(open) => {
          if (!open) {
            setPostPaymentPhase('idle');
            void onConfirmSuccessRef.current?.({ silent: true });
          }
        }}
        onOpenPartnerContact={() => {
          window.requestAnimationFrame(() => {
            document
              .getElementById('swap-partner-hr-contact')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
      />

      <WaitingPartnerHrDialog
        open={postPaymentPhase === 'result_waiting'}
        onOpenChange={(open) => {
          if (!open) {
            setPostPaymentPhase('idle');
            void onConfirmSuccessRef.current?.({ silent: true });
          }
        }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
