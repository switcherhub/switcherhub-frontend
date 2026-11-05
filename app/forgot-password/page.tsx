'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, InputGroup, InputAddon } from '@/components/ui/input';
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
import { CircleAlert, Eye, EyeOff, CheckCircle } from 'lucide-react';

const SEND_CODE_COOLDOWN_SEC = 60;

const step1Schema = z.object({
  email: z.string().min(1, 'Enter email').email('Invalid email format'),
});

const step2Schema = z
  .object({
    recoveryCode: z.string().min(1, 'Enter code'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sendCodeSuccess, setSendCodeSuccess] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [sendCodeCooldown, setSendCodeCooldown] = useState(0);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (sendCodeCooldown <= 0) return;
    const t = setInterval(() => {
      setSendCodeCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [sendCodeCooldown]);

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { recoveryCode: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  async function onSendCode(data: Step1Values) {
    setSubmitError(null);
    setSendCodeLoading(true);
    try {
      await apiFetch('/user-auth/send-recovery-code', {
        method: 'POST',
        body: JSON.stringify({ email: data.email }),
        skipAuth: true,
      });
      setEmail(data.email);
      setSendCodeSuccess(true);
      setSendCodeCooldown(SEND_CODE_COOLDOWN_SEC);
      form2.reset({ recoveryCode: '', newPassword: '', confirmPassword: '' });
      setStep(2);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function onChangePassword(data: Step2Values) {
    setSubmitError(null);
    try {
      await apiFetch('/user-auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          newPassword: data.newPassword,
          code: data.recoveryCode,
        }),
        skipAuth: true,
      });
      setChangeSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Password reset failed');
    }
  }

  if (changeSuccess) {
    return (
      <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
        <Card className="h-fit w-full max-w-[480px]">
          <CardHeader className="flex-col justify-center gap-2 border-b-0 text-center">
            <CardTitle className="w-full text-center text-2xl font-semibold">
              Password changed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10">
            <Alert appearance="light" size="sm" className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
              <AlertIcon>
                <CheckCircle className="size-4" />
              </AlertIcon>
              <AlertTitle>Your password has been updated. You can sign in with your new password.</AlertTitle>
            </Alert>
            <Button asChild size="lg" className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
        <Card className="h-fit w-full max-w-[480px] **:data-[slot=card-content]:grow-0">
          <CardHeader className="flex-col justify-center gap-2 border-b-0 text-center py-4">
            <CardTitle className="w-full text-center text-2xl font-semibold">
              Forgot password
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a recovery code.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10">
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(onSendCode)} className="space-y-5">
                <FormField
                  control={form1.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          variant="lg"
                          placeholder="email@example.com"
                          autoComplete="email"
                          disabled={sendCodeLoading}
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
                  disabled={sendCodeLoading || sendCodeCooldown > 0}
                >
                  {sendCodeLoading
                    ? 'Sending...'
                    : sendCodeCooldown > 0
                      ? `Send recovery code (${sendCodeCooldown}s)`
                      : 'Send recovery code'}
                </Button>
              </form>
            </Form>
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

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
      <Card className="h-fit w-full max-w-[480px] **:data-[slot=card-content]:grow-0">
        <CardHeader className="flex-col justify-center gap-2 border-b-0 text-center py-4">
          <CardTitle className="w-full text-center text-2xl font-semibold">
            Set new password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Code sent to <strong>{email}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10 ">
          <Form {...form2} key={`step2-${email}`}>
            <form onSubmit={form2.handleSubmit(onChangePassword)} className="space-y-5">
              <FormField
                control={form2.control}
                name="recoveryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        variant="lg"
                        placeholder="Enter code"
                        disabled={form2.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form2.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <InputGroup className="**:data-[slot=input]:pe-10">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          variant="lg"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={form2.formState.isSubmitting}
                          {...field}
                        />
                        <InputAddon
                          variant="lg"
                          mode="icon"
                          className="cursor-pointer border-s-0 bg-transparent hover:bg-muted/50"
                        >
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((p) => !p)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4 text-muted-foreground" />
                            ) : (
                              <Eye className="size-4 text-muted-foreground" />
                            )}
                          </button>
                        </InputAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form2.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        variant="lg"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={form2.formState.isSubmitting}
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
                disabled={form2.formState.isSubmitting}
              >
                {form2.formState.isSubmitting ? 'Please wait...' : 'Change password'}
              </Button>
            </form>
          </Form>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setStep(1)}
          >
            Use another email
          </Button>
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
