'use client';

import { useMemo, useState } from 'react';
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Check, CheckCircle2, Info, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  attachPaymentMethod,
  createSetupIntent,
  setDefaultPaymentMethod,
} from '@/lib/api';
import type { PaymentMethod } from '@/lib/types/payment-method';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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

interface AddPaymentMethodFormProps {
  workspaceId: string;
  onSuccess: (paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}

function PaymentMethodForm({
  workspaceId,
  onSuccess,
  onCancel,
}: AddPaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe is not initialized. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create setup intent
      console.log(
        '[Billing] Creating setup intent for workspace:',
        workspaceId,
      );
      let setupIntentResponse: { clientSecret: string; setupIntentId: string };
      try {
        setupIntentResponse = await createSetupIntent(workspaceId);
        console.log('[Billing] Setup intent response:', {
          hasClientSecret: !!setupIntentResponse?.clientSecret,
          setupIntentId: setupIntentResponse?.setupIntentId,
          raw: setupIntentResponse,
        });
      } catch (apiError) {
        console.error('[Billing] createSetupIntent API error:', {
          error: apiError,
          message:
            apiError instanceof Error ? apiError.message : String(apiError),
          stack: apiError instanceof Error ? apiError.stack : undefined,
        });
        throw apiError;
      }

      const { clientSecret, setupIntentId } = setupIntentResponse;

      if (!clientSecret) {
        console.error(
          '[Billing] No clientSecret in response:',
          setupIntentResponse,
        );
        throw new Error('Failed to create setup intent');
      }

      // 2. Confirm card via Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log(
        '[Billing] Calling stripe.confirmCardSetup with clientSecret (length):',
        clientSecret?.length,
      );
      let setupIntent: any = null;
      let stripeError: any = null;
      try {
        const result = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });
        setupIntent = result.setupIntent;
        stripeError = result.error;
      } catch (confirmErr) {
        console.error('[Billing] stripe.confirmCardSetup threw (e.g. 402):', {
          err: confirmErr,
          message:
            confirmErr instanceof Error
              ? confirmErr.message
              : String(confirmErr),
          stack: confirmErr instanceof Error ? confirmErr.stack : undefined,
          statusCode: (confirmErr as { statusCode?: number })?.statusCode,
        });
        throw confirmErr;
      }

      if (stripeError) {
        console.error('[Billing] Stripe confirmCardSetup error (full):', {
          message: stripeError.message,
          code: stripeError.code,
          type: stripeError.type,
          decline_code: stripeError.decline_code,
          raw: stripeError,
        });
        throw new Error(stripeError.message || 'Failed to confirm card setup');
      }

      console.log('[Billing] Setup intent result:', {
        status: setupIntent?.status,
        payment_method: setupIntent?.payment_method,
        id: setupIntent?.id,
      });

      if (setupIntent && setupIntent.status === 'succeeded') {
        // 3. Attach payment method to workspace
        console.log(
          '[Billing] Attaching payment method, setupIntentId:',
          setupIntentId,
        );
        try {
          let paymentMethod = await attachPaymentMethod(
            workspaceId,
            setupIntentId,
          );
          console.log('[Billing] Attach success:', paymentMethod);
          toast.success('Payment method added successfully');

          // If user opted-in, mark as default after attachment.
          // Backend exposes a dedicated endpoint that needs the created payment method id.
          if (setAsDefault && !paymentMethod.isDefault) {
            try {
              paymentMethod = await setDefaultPaymentMethod(
                workspaceId,
                paymentMethod.id,
              );
            } catch (defaultErr) {
              console.error('[Billing] setDefaultPaymentMethod error:', {
                error: defaultErr,
                message:
                  defaultErr instanceof Error
                    ? defaultErr.message
                    : String(defaultErr),
              });
              toast.error('Could not set as default payment method');
            }
          }
          onSuccess(paymentMethod);
        } catch (attachError) {
          console.error('[Billing] attachPaymentMethod API error:', {
            error: attachError,
            message:
              attachError instanceof Error
                ? attachError.message
                : String(attachError),
            stack: attachError instanceof Error ? attachError.stack : undefined,
          });
          throw attachError;
        }
      } else {
        console.error('[Billing] Setup intent not succeeded:', setupIntent);
        throw new Error(
          `Setup intent not succeeded. Status: ${setupIntent?.status || 'unknown'}`,
        );
      }
    } catch (error) {
      console.error('[Billing] Caught error (full):', {
        error,
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        json:
          typeof (error as any)?.json === 'function'
            ? (error as any).json
            : undefined,
      });
      const message =
        error instanceof Error ? error.message : 'Failed to add payment method';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Team Billing &middot; Save Card
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold">$0</div>
            <div className="text-sm text-muted-foreground">
              charged now &middot; used when you approve swaps
            </div>
          </div>
        </div>

        <div className="text-xl font-semibold leading-snug">
          Save your payment method
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What this card is used for
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 text-primary" />
            One-click approval when finalizing swap requests &mdash; no
            re-entering details each time
          </li>
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 text-primary" />
            Charged only after the partner company confirms and pays their $149
          </li>
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 text-primary" />
            100% refund if partner declines &mdash; no charge until both sides
            confirm
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          No hidden fees
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Secured by Stripe
        </div>
      </div>

      <Alert
        variant="secondary"
        appearance="light"
        size="md"
        className="rounded-xl"
      >
        <AlertIcon>
          <Info className="size-4 text-muted-foreground" />
        </AlertIcon>
        <AlertContent>
          <AlertDescription>
            Your card will not be charged now. Each swap payment requires a
            separate confirmation from you. If the partner HR declines &mdash;
            no charge, ever.
          </AlertDescription>
        </AlertContent>
      </Alert>

      <Separator className="my-1" />

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Card details
          </div>
          <div className="text-xs text-muted-foreground">
            Saved securely &middot; charged only after partner HR confirms
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'var(--foreground)',
                    '::placeholder': {
                      color: 'var(--muted-foreground)',
                    },
                  },
                  invalid: {
                    color: 'var(--destructive)',
                  },
                },
              }}
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="set-as-default-payment-method"
              checked={setAsDefault}
              onCheckedChange={(checked) => setSetAsDefault(checked === true)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="set-as-default-payment-method"
                className="text-sm font-medium leading-none"
              >
                Set as default payment method
              </Label>
              <p className="text-xs text-muted-foreground">
                Used automatically when approving future swap requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-(--color-success,var(--color-green-500)) text-(--color-success-foreground,var(--color-white)) shadow-none hover:opacity-90"
        >
          {loading ? 'Saving...' : 'Save Payment Method'}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          After saving, partner HR is notified. Once they pay &mdash; profiles
          unlock and you can begin the transfer.
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-4" />
          256-bit SSL &middot; Secured by Stripe
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          By saving, you agree to our Terms of Service and Privacy Policy.
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess: (paymentMethod: PaymentMethod) => void;
}

export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: AddPaymentMethodDialogProps) {
  const handleSuccess = (paymentMethod: PaymentMethod) => {
    onSuccess(paymentMethod);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const stripePublishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) {
      return null;
    }
    return getStripePromise();
  }, [stripePublishableKey]);

  if (!stripePublishableKey || !stripePromise) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration Error</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Stripe publishable key is not configured. Please set
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable and
              restart the development server.
            </p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <Elements stripe={stripePromise}>
            <PaymentMethodForm
              workspaceId={workspaceId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
}
