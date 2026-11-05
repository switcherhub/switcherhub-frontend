'use client';

import { ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const POLL_MAX_MS = 120_000;
export const POST_PAYMENT_POLL_INTERVAL_MS = 5_000;
export { POLL_MAX_MS as POST_PAYMENT_POLL_MAX_MS };

export function PaymentConfirmLoadingDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[420px] rounded-2xl sm:rounded-2xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Loader2 className="size-10 animate-spin text-primary" />
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold">
              Confirming your payment
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              This usually takes a few seconds. Please keep this window open.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BothCompaniesConfirmedDialog({
  open,
  onOpenChange,
  onOpenPartnerContact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPartnerContact?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] rounded-2xl p-0 overflow-hidden sm:rounded-2xl"
        showCloseButton={false}
      >
        <div className="p-6 pb-0">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Check className="size-7" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="font-serif text-xl font-bold leading-tight text-foreground">
                Both companies confirmed
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Contacts are unlocked. Your next step —{' '}
                <strong className="font-semibold text-foreground">
                  reach out to the partner HR
                </strong>{' '}
                and agree on the transfer details.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <ol className="space-y-0 divide-y divide-border">
            <li className="flex gap-3 py-4 first:pt-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="size-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Both employees&apos; contacts are visible
                </p>
                <p className="text-sm text-muted-foreground">See the card below.</p>
              </div>
            </li>
            <li className="flex gap-3 py-4">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="size-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Partner HR contact is available
                </p>
                <p className="text-sm text-muted-foreground">See the card below.</p>
              </div>
            </li>
            <li className="flex gap-3 py-4">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <ArrowRight className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-blue-600">Contact the partner HR</p>
                <p className="text-sm text-muted-foreground">
                  Agree on the start date, paperwork, and onboarding directly between
                  yourselves.
                </p>
              </div>
            </li>
            <li className="flex gap-3 py-4 last:pb-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                4
              </div>
              <div>
                <p className="font-semibold text-foreground">Transfer complete</p>
                <p className="text-sm text-muted-foreground">
                  Both employees move to their new locations. No hiring, no gaps.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="border-t border-border bg-muted/30 p-4">
          <Button
            className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-600/90"
            onClick={() => {
              onOpenPartnerContact?.();
              onOpenChange(false);
            }}
          >
            Open partner HR contact
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WaitingPartnerHrDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] rounded-2xl p-0 overflow-hidden sm:rounded-2xl"
        showCloseButton={false}
      >
        <div className="p-6 pb-4">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">
              ⏳
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="font-serif text-xl font-bold leading-tight text-foreground">
                Waiting for the partner HR
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your funds are <strong className="text-foreground">reserved, not charged</strong>.
                Payment only happens when the other side confirms too.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-6 mb-4 flex gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Lock className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <p className="text-sm text-muted-foreground">
            If the partner doesn&apos;t confirm — the reservation is released
            automatically. No charge.
          </p>
        </div>

        <div className="border-t border-border px-6 py-4">
          <ol className="space-y-0 divide-y divide-border">
            <li className="flex gap-3 py-4 first:pt-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="size-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-semibold text-emerald-700">
                  You confirmed — funds reserved
                </p>
              </div>
            </li>
            <li className="flex gap-3 py-4">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                2
              </div>
              <div>
                <p className="font-semibold text-foreground">Partner HR confirms and pays</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve already notified them. You&apos;ll get an email as soon as they
                  confirm.
                </p>
              </div>
            </li>
            <li className="flex gap-3 py-4">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                3
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Both employees&apos; contacts are unlocked
                </p>
                <p className="text-sm text-muted-foreground">
                  Including the direct contact of the partner company&apos;s HR.
                </p>
              </div>
            </li>
            <li className="flex gap-3 py-4 last:pb-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                4
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  You arrange the details directly
                </p>
                <p className="text-sm text-muted-foreground">
                  Start date, paperwork, onboarding — all coordinated with the partner HR
                  directly.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="border-t border-border bg-muted/30 p-4">
          <Button
            className="h-11 w-full rounded-xl bg-orange-500 text-base font-semibold text-white hover:bg-orange-500/90"
            onClick={() => onOpenChange(false)}
          >
            Got it — I&apos;ll wait for the notification
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
