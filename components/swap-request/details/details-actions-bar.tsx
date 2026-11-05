'use client';

import { ArrowLeft, CreditCard, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetailsActionsBarProps {
  onBack?: () => void;
  onConfirmParticipation?: () => void;
  onPay?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  confirmingParticipation?: boolean;
  refreshing?: boolean;
  showConfirmParticipationButton?: boolean;
  showPaymentButton?: boolean;
  canDelete?: boolean;
}

export function DetailsActionsBar({
  onBack,
  onConfirmParticipation,
  onPay,
  onDelete,
  onRefresh,
  confirmingParticipation = false,
  refreshing = false,
  showConfirmParticipationButton = false,
  showPaymentButton = false,
  canDelete = false,
}: DetailsActionsBarProps) {
  if (!onBack) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-2 py-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="min-w-0 shrink gap-2"
      >
        <ArrowLeft className="size-4 shrink-0" />
        <span>
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to list</span>
        </span>
      </Button>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* {showConfirmParticipationButton && (
          <Button
            size="icon"
            onClick={onConfirmParticipation}
            disabled={confirmingParticipation}
            aria-label="Confirm participation"
            className="size-9"
          >
            <Check className="size-4" />
          </Button>
        )} */}
        {showPaymentButton && (
          <Button
            size="icon"
            onClick={onPay}
            aria-label="Make payment"
            className="size-9"
          >
            <CreditCard className="size-4" />
          </Button>
        )}
        {/* {canDelete && (
          <Button
            size="icon"
            variant="destructive"
            onClick={onDelete}
            aria-label="Cancel swap request"
            className="size-9"
          >
            <Trash2 className="size-4" />
          </Button>
        )} */}
        <Button
          size="icon"
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh"
          className="size-9"
        >
          <RefreshCwIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
