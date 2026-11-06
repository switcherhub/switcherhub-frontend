'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getHrProgress,
  submitHrDecision,
  type HrDecisionValue,
  type HrProgressResponse,
} from '@/lib/api';

/**
 * Minimal employer HR cabinet action (spec §7): Approve / Decline / Request
 * clarification — an explicit decision, separate from payment. Contacts are shared
 * only after BOTH employers approve.
 */
export function HrDecisionPanel({ swapId }: { swapId: string }) {
  const [progress, setProgress] = useState<HrProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<HrDecisionValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProgress(await getHrProgress(swapId));
    } catch {
      setError('Could not load the decision status.');
    } finally {
      setLoading(false);
    }
  }, [swapId]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (decision: HrDecisionValue) => {
    setSubmitting(decision);
    setError(null);
    try {
      setProgress(await submitHrDecision(swapId, decision));
    } catch {
      setError('Could not submit your decision. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Loading decision status…
      </div>
    );
  }

  const bothApproved = progress?.stage === 'both_approved';
  const yourDecided = progress?.yourHr && progress.yourHr !== 'pending';

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-base font-semibold">Your decision</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Approve to let this swap proceed. Nothing is charged to approve. Personal
        contacts are shared only after both employers approve.
      </p>

      {bothApproved ? (
        <div className="mt-3 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
          Both employers approved. You can coordinate the transfer.
        </div>
      ) : (
        <div className="mt-3 text-sm">
          <StatusRow label="Your decision" value={progress?.yourHr ?? 'pending'} />
          <StatusRow
            label="Partner employer"
            value={progress?.partnerHr ?? 'pending'}
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!yourDecided && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => decide('approved')}
            disabled={submitting !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting === 'approved' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="outline"
            onClick={() => decide('needs_clarification')}
            disabled={submitting !== null}
          >
            Request clarification
          </Button>
          <Button
            variant="destructive"
            onClick={() => decide('declined')}
            disabled={submitting !== null}
          >
            Decline
          </Button>
        </div>
      )}

      {yourDecided && !bothApproved && (
        <p className="mt-3 text-sm text-muted-foreground">
          Your decision is recorded. Waiting for the partner employer. No response
          is not a decline.
        </p>
      )}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  const pretty = value.replace(/_/g, ' ');
  const color =
    value === 'approved'
      ? 'text-green-600'
      : value === 'declined'
        ? 'text-red-600'
        : value === 'needs_clarification'
          ? 'text-amber-600'
          : 'text-muted-foreground';
  return (
    <div className="flex items-center justify-between py-1">
      <span>{label}</span>
      <span className={`font-medium capitalize ${color}`}>{pretty}</span>
    </div>
  );
}
