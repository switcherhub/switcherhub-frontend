'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import type { LoginResponse } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { CircleAlert, CheckCircle } from 'lucide-react';

const confirmSchema = z.object({
  code: z.string().min(1, 'Enter verification code'),
});

type ConfirmFormValues = z.infer<typeof confirmSchema>;

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';
  const { loginFromTokens, isAuthenticated } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sendCodeSuccess, setSendCodeSuccess] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [sendCodeCooldown, setSendCodeCooldown] = useState(0);

  useEffect(() => {
    if (sendCodeCooldown <= 0) return;
    const t = setInterval(() => {
      setSendCodeCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [sendCodeCooldown]);

  const form = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  });

  if (isAuthenticated) {
    router.replace('/');
    return null;
  }

  if (!emailFromQuery) {
    return (
      <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
        <Card className="h-fit w-full max-w-[480px]">
          <CardHeader className="flex-col justify-center gap-2 border-b-0 text-center">
            <CardTitle className="w-full text-center text-2xl font-semibold">
              Confirm your email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10">
            <Alert variant="destructive" appearance="light" size="sm">
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>Email is required. Please use the link from your registration email or register again.</AlertTitle>
            </Alert>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/register">Back to Sign up</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function onSubmit(data: ConfirmFormValues) {
    setSubmitError(null);
    try {
      const response = await apiFetch<LoginResponse>('/user-auth/confirm-email', {
        method: 'POST',
        body: JSON.stringify({
          email: emailFromQuery,
          code: data.code,
        }),
        skipAuth: true,
      });
      loginFromTokens(response);
      router.replace('/');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Verification failed');
    }
  }

  const SEND_CODE_COOLDOWN_SEC = 60;

  async function handleSendNewCode() {
    setSendCodeSuccess(false);
    setSendCodeLoading(true);
    try {
      await apiFetch('/user-auth/send-new-code', {
        method: 'POST',
        body: JSON.stringify({ email: emailFromQuery }),
        skipAuth: true,
      });
      setSendCodeSuccess(true);
      setSendCodeCooldown(SEND_CODE_COOLDOWN_SEC);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setSendCodeLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
      <Card className="h-fit w-full max-w-[480px] **:data-[slot=card-content]:grow-0">
        <CardHeader className="flex-col justify-center gap-2 border-b-0 text-center py-4">
          <CardTitle className="w-full text-center text-2xl font-semibold">
            Confirm your email
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            We sent a verification code to <strong>{emailFromQuery}</strong>
          </p>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        variant="lg"
                        placeholder="Enter code"
                        autoComplete="one-time-code"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {submitError && (
                <Alert variant="destructive" appearance="light" size="sm">
                  <AlertIcon>
                    <CircleAlert />
                  </AlertIcon>
                  <AlertTitle>{submitError}</AlertTitle>
                </Alert>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Please wait...' : 'Confirm'}
              </Button>
            </form>
          </Form>

          <div className="relative flex items-center gap-3">
            <span className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <span className="flex-1 border-t border-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={sendCodeLoading || sendCodeCooldown > 0}
            onClick={handleSendNewCode}
          >
            {sendCodeLoading
              ? 'Sending...'
              : sendCodeCooldown > 0
                ? `Send new code (${sendCodeCooldown}s)`
                : 'Send new code'}
          </Button>
          {sendCodeSuccess && (
            <Alert appearance="light" size="sm" className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
              <AlertIcon>
                <CheckCircle className="size-4" />
              </AlertIcon>
              <AlertTitle>New code sent. Check your email.</AlertTitle>
            </Alert>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
