'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TicketPlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function JoinSwapRequestCard() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const handleJoinByCode = useCallback(async () => {
    const code = inviteCode.trim();
    if (!code) return;
    setJoinSubmitting(true);
    try {
      await apiFetch('/swap-request/hr/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      toast.success('You have joined the swap. Redirecting…');
      setInviteCode('');
      router.push('/swap-request');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setJoinSubmitting(false);
    }
  }, [inviteCode, router]);

  return (
    <Card className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-none p-5 overflow-hidden">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15 text-green-600 dark:text-green-500 mb-4">
        <Plus className="size-5" />
      </div>
      <CardTitle className="text-xl font-bold text-foreground mb-2">
        Join Swap Request
      </CardTitle>
      <p className="text-sm font-semibold text-foreground mb-2">
        Employee shared a swap code? Enter it to review.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        If your employee shared a swap invite code with you, enter it here to
        view the full details and approve.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <TicketPlus className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Enter Invite Code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
            className="pl-9 h-11 rounded-lg border-border bg-background"
          />
        </div>
        <Button
          onClick={handleJoinByCode}
          disabled={!inviteCode.trim() || joinSubmitting}
          className="rounded-lg font-semibold shrink-0 h-11 px-5 bg-foreground text-background hover:bg-foreground/90"
        >
          {joinSubmitting ? 'Joining…' : 'Join'}
        </Button>
      </div>
    </Card>
  );
}
