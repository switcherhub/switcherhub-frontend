'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Check, CreditCard, Lock, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { createPaymentIntent, getPaymentMethods } from '@/lib/api';
import type { PaymentMethod } from '@/lib/types/payment-method';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toNumericId } from './details/utils';

let stripePromise: Promise<any> | null = null;

const getStripePromise = () => {
  if (stripePromise) {
    return stripePromise;
  }
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return null;
  }
  stripePromise = loadStripe(publishableKey);
  return stripePromise;
};

interface PaymentMethodSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  swapRequestId: string;
  onSuccess?: () => void;
  /** Display amount e.g. "$149" */
  amountFormatted?: string;
  /** e.g. "Retail Associate · Your employee ⇄ Partner" */
  matchTitle?: string;
  /** e.g. "Step 4 of 5" */
  stepLabel?: string;
}

function CardPaymentForm({
  swapRequestId,
  onSuccess,
  onError,
  onCancel,
  amountFormatted = '$149',
  useNewCard,
  selectedPaymentMethodId,
  selectedStripePaymentMethodId,
}: {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  amountFormatted?: string;
  swapRequestId: string;
  useNewCard: boolean;
  selectedPaymentMethodId?: string;
  selectedStripePaymentMethodId?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);

  const mapStripeErrorMessage = (error: {
    code?: string;
    message?: string;
    type?: string;
  }) => {
    if (error.code === 'resource_missing') {
      return 'Payment configuration mismatch: payment intent was created in another Stripe account or mode (test/live). Please contact support.';
    }
    return error.message || 'Failed to confirm payment';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe) {
      onError('Stripe is not initialized. Please refresh the page.');
      return;
    }

    setProcessing(true);

    try {
      const paymentMethodIdToUse = useNewCard ? '' : selectedPaymentMethodId;
      const paymentIntentResponse = await createPaymentIntent(
        swapRequestId,
        paymentMethodIdToUse,
      );

      if (!paymentIntentResponse.requiresPaymentMethod) {
        onSuccess();
        return;
      }

      const name =
        currentUser?.firstName && currentUser?.lastName
          ? `${currentUser.firstName} ${currentUser.lastName}`
          : currentUser?.email || 'Customer';
      const email = currentUser?.email || undefined;

      if (useNewCard) {
        if (!elements) {
          onError('Stripe elements is not initialized.');
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          onError('Card element not found');
          return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          paymentIntentResponse.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name,
                email,
              },
            },
          },
        );

        if (error) {
          console.error('[Swap payment] Stripe confirm error (new card):', {
            code: error.code,
            type: error.type,
            message: error.message,
          });
          onError(mapStripeErrorMessage(error));
          return;
        }

        if (
          paymentIntent &&
          (paymentIntent.status === 'requires_capture' ||
            paymentIntent.status === 'succeeded')
        ) {
          onSuccess();
          return;
        }

        if (paymentIntent) {
          onError(`Unexpected payment status: ${paymentIntent.status}`);
        }
      } else {
        // For saved payment methods backend already binds payment_method
        // during PaymentIntent creation, so we only confirm by client secret.
        const stripePaymentMethodIdToUse =
          selectedStripePaymentMethodId ?? paymentMethodIdToUse;
        if (!stripePaymentMethodIdToUse) {
          onError('Saved payment method is not available. Please choose another card.');
          return;
        }
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          paymentIntentResponse.clientSecret,
        );

        if (error) {
          console.error('[Swap payment] Stripe confirm error (saved card):', {
            code: error.code,
            type: error.type,
            message: error.message,
          });
          onError(mapStripeErrorMessage(error));
          return;
        }

        if (
          paymentIntent &&
          (paymentIntent.status === 'requires_capture' ||
            paymentIntent.status === 'succeeded')
        ) {
          onSuccess();
          return;
        }

        if (paymentIntent) {
          onError(`Unexpected payment status: ${paymentIntent.status}`);
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <div className="text-[.72rem] font-bold uppercase tracking-[.09em] text-muted-foreground mb-2 flex flex-wrap items-center justify-between gap-1">
        <span>Card details</span>
        <span className="text-[.72rem] font-medium normal-case tracking-normal text-emerald-600">
          Saved securely · charged only after partner HR confirms
        </span>
      </div>
      {useNewCard && (
        <div className="mb-3 rounded-[11px] border-2 border-border bg-muted/50 p-3.5 transition-[border-color,box-shadow] focus-within:border-(--color-info-accent,#3282b8) focus-within:bg-background focus-within:shadow-[0_0_0_3px_rgba(50,130,184,.1)]">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: 'hsl(var(--foreground))',
                  '::placeholder': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                },
                invalid: {
                  color: 'hsl(var(--destructive))',
                },
              },
            }}
          />
        </div>
      )}
      <div className="mt-3 mb-4 rounded-md bg-(--color-info-soft,var(--color-blue-50)) px-4 py-3 text-[0.7rem] sm:text-[0.8rem] leading-relaxed text-muted-foreground">
        <span>No payment card? Go to </span>
        <a
          href="/team"
          className="mx-1 font-semibold text-(--color-info-accent,var(--color-blue-700)) underline"
        >
          Members
        </a>
        <span>and ask your team admin to complete this step.</span>
      </div>
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="mb-4 h-12 w-full gap-2 rounded-xl bg-linear-to-br from-[#1a7a3a] to-[#22a855] text-[1.05rem] font-bold text-white shadow-[0_4px_14px_rgba(34,168,85,.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(34,168,85,.45)] disabled:opacity-75"
      >
        <Lock className="size-4 shrink-0" />
        <span>
          Authorize {amountFormatted}
          <span className="mx-1 opacity-45 font-light">·</span>
          <span className="text-[.83rem] font-medium opacity-90">
            Charged only when partner HR pays
          </span>
        </span>
      </Button>

      <p className="mb-4 text-center text-[.79rem] leading-relaxed text-muted-foreground">
        After you authorize, partner HR is notified. Once they pay — profiles
        unlock and you can begin the transfer.
      </p>
      <div className="mb-3 flex items-center justify-center gap-1.5 text-[.78rem] text-muted-foreground">
        <Lock className="size-3.5" />
        <span>
          256-bit SSL · Secured by{' '}
          <strong className="text-foreground">Stripe</strong>
        </span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="block w-full text-center text-[.8rem] text-muted-foreground underline underline-offset-2 transition-colors hover:text-destructive"
      >
        Cancel
      </button>
    </form>
  );
}

export function PaymentMethodSelectDialog({
  open,
  onOpenChange,
  swapRequestId,
  onSuccess,
  amountFormatted: amountFormattedProp,
  matchTitle,
  stepLabel,
}: PaymentMethodSelectDialogProps) {
  const { activeOrganization } = useOrganization();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState<string>('');
  const [useNewCard, setUseNewCard] = useState(false);

  const stripePublishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) {
      return null;
    }
    return getStripePromise();
  }, [stripePublishableKey]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setUseNewCard(false);
      setSelectedPaymentMethodId('');
    }
  }, [open]);

  // Load payment methods when dialog opens
  useEffect(() => {
    if (open && activeOrganization) {
      setPaymentMethodsLoading(true);
      getPaymentMethods(activeOrganization.id)
        .then((methods) => {
          setPaymentMethods(methods);
          // Set default payment method if available
          const defaultMethod = methods.find((m) => m.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethodId(defaultMethod.id);
            setUseNewCard(false);
          } else if (methods.length > 0) {
            setSelectedPaymentMethodId(methods[0].id);
            setUseNewCard(false);
          } else {
            setSelectedPaymentMethodId('');
            setUseNewCard(true);
          }
        })
        .catch((e) => {
          toast.error(
            e instanceof Error ? e.message : 'Failed to load payment methods',
          );
        })
        .finally(() => {
          setPaymentMethodsLoading(false);
        });
    } else if (open && !activeOrganization) {
      // Reset state when dialog opens without organization
      setPaymentMethods([]);
      setSelectedPaymentMethodId('');
      setUseNewCard(true);
    }
  }, [open, activeOrganization]);

  const amountFormatted = amountFormattedProp ?? '$149';
  const matchTitleDisplay = matchTitle ?? 'Your employee ⇄ Partner';
  const stepLabelDisplay = stepLabel ?? 'Step 4 of 5';
  const displayId = `id${String(toNumericId(swapRequestId)).padStart(5, '0')}`;
  const selectedStripePaymentMethodId = paymentMethods.find(
    (m) => m.id === selectedPaymentMethodId,
  )?.stripePaymentMethodId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[96dvh] w-[calc(100%-1.75rem)] max-w-[500px] overflow-y-auto overflow-x-hidden rounded-[18px] border-border bg-background p-0 shadow-[0_20px_70px_rgba(15,18,35,.28)] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:w-full"
        showCloseButton={false}
      >
        {/* Header — Finalizing swap · id · Step */}
        <div className="border-b border-border bg-background px-4 pt-5 pb-4 sm:px-6">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <span className="min-w-0 text-[.65rem] font-semibold uppercase leading-snug tracking-widest text-muted-foreground sm:text-[.72rem]">
              Finalizing swap · {displayId} · {stepLabelDisplay}
            </span>
            <DialogClose className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-[1.65rem] font-bold leading-none text-foreground">
                {amountFormatted}
              </span>
              <span className="text-[.72rem] text-muted-foreground whitespace-nowrap">
                one-time fee
              </span>
            </div>
            <p className="font-serif text-[1.15rem] font-bold leading-tight text-foreground">
              {matchTitleDisplay}
            </p>
          </div>
        </div>

        {/* What you get after both companies pay */}
        <div className="border-b border-border bg-muted/30 px-6 py-3">
          <div className="mb-1.5 text-[.7rem] font-bold uppercase tracking-widest text-muted-foreground">
            What you get after both companies pay
          </div>
          <ul className="flex flex-col gap-0.5">
            <li className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                strokeWidth={2.5}
              />
              <span className="text-[.86rem] font-medium leading-snug text-foreground">
                Full profiles of both employees — names, contacts, role info
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                strokeWidth={2.5}
              />
              <span className="text-[.86rem] font-medium leading-snug text-foreground">
                Direct HR contact at the partner company to coordinate the
                transfer
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                strokeWidth={2.5}
              />
              <span className="text-[.86rem] font-medium leading-snug text-foreground">
                Swap officially activated — both sides can begin onboarding
              </span>
            </li>
          </ul>
        </div>

        {/* Guarantees */}
        <div className="flex flex-wrap gap-2 border-b border-border bg-background px-6 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-500/10 px-3 py-1 text-[.78rem] font-semibold text-emerald-700">
            <Check className="size-3.5" strokeWidth={2.5} />
            No hidden fees
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-500/10 px-3 py-1 text-[.78rem] font-semibold text-emerald-700">
            <Check className="size-3.5" strokeWidth={2.5} />
            Secured by Stripe
          </span>
        </div>

        {/* Trust block */}
        <div className="flex items-start gap-3 border-b border-[rgba(15,76,117,.1)] bg-[rgba(15,76,117,.04)] px-6 py-4">
          <Shield className="mt-0.5 size-5 shrink-0 text-foreground/70" />
          <div className="text-[.83rem] leading-relaxed text-muted-foreground">
            <strong className="mb-0.5 block text-[.86rem] font-bold text-foreground">
              You will only be charged after the partner HR also pays{' '}
              {amountFormatted}.
            </strong>
            If they decline or cancel — no charge. No charge until both sides
            confirm.
          </div>
        </div>

        {/* Selection / Card input + final authorize */}
        <div className="px-6 py-5 space-y-5">
          {activeOrganization && paymentMethods.length > 0 ? (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Select Payment Method
              </label>
              <Select
                value={useNewCard ? 'new' : selectedPaymentMethodId}
                onValueChange={(value) => {
                  if (value === 'new') {
                    setUseNewCard(true);
                    setSelectedPaymentMethodId('');
                  } else {
                    setUseNewCard(false);
                    setSelectedPaymentMethodId(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4" />
                      <span>Pay with new card</span>
                    </div>
                  </SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-4" />
                        <span>
                          {method.cardDetails.brand.toUpperCase()} ••••{' '}
                          {method.cardDetails.last4}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" size="sm">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : activeOrganization && paymentMethodsLoading ? (
            <div className="text-sm text-muted-foreground py-2">
              Loading payment methods…
            </div>
          ) : activeOrganization && paymentMethods.length === 0 ? (
            <div className="rounded-md border border-warning/50 bg-warning/10 p-3">
              <p className="text-sm text-warning-foreground">
                No payment methods found. You will need to enter card details.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are not part of an organization. Payment will be processed
                by entering card details.
              </p>
            </div>
          )}

          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <CardPaymentForm
                swapRequestId={swapRequestId}
                onSuccess={() => {
                  onSuccess?.();
                  onOpenChange(false);
                }}
                onError={(error) => {
                  toast.error(error);
                }}
                onCancel={() => onOpenChange(false)}
                amountFormatted={amountFormatted}
                useNewCard={useNewCard}
                selectedPaymentMethodId={selectedPaymentMethodId}
                selectedStripePaymentMethodId={selectedStripePaymentMethodId}
              />
            </Elements>
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              Stripe is not initialized. Please refresh the page.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
