'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input, InputAddon, InputGroup } from '@/components/ui/input';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { setStoredInvitationCode } from '@/app/organization/invitation/accept/page';

const loginSchema = z.object({
  email: z.string().min(1, 'Enter email').email('Invalid email format'),
  password: z.string().min(1, 'Enter password'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Store invitation code if present in URL
    const invitationCode = searchParams.get('invitation');
    if (invitationCode) {
      setStoredInvitationCode(invitationCode);
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
    mode: 'onSubmit',
  });

  if (isAuthenticated) {
    router.replace(redirectTo);
    return null;
  }

  async function onSubmit(data: LoginFormValues) {
    setSubmitError(null);
    try {
      await login({ email: data.email, password: data.password });
      router.replace(redirectTo);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function onGoogleSuccess(idToken: string) {
    setSubmitError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(idToken);
      router.replace(redirectTo);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Google sign-in failed',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
      <Card className="h-fit w-full max-w-[480px] **:data-[slot=card-content]:grow-0">
        <CardHeader className="justify-center border-b-0 text-center">
          <CardTitle className="w-full text-center text-2xl font-semibold">
            Sign in to SwitcherHub
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10">
          <div className="w-full min-h-[44px] flex-1 justify-center">
            <GoogleSignInButton
              onSuccess={onGoogleSuccess}
              onError={(err) => setSubmitError(err.message)}
              disabled={googleLoading}
              className="min-h-[44px]"
            />
          </div>

          <div className="relative flex items-center gap-3">
            <span className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <span className="flex-1 border-t border-border" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
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
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <FormControl>
                      <InputGroup className="**:data-[slot=input]:pe-10">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          variant="lg"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={form.formState.isSubmitting}
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
                            aria-label={
                              showPassword ? 'Hide password' : 'Show password'
                            }
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
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="mt-0! cursor-pointer font-normal text-muted-foreground">
                      Remember me
                    </FormLabel>
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
                {form.formState.isSubmitting ? 'Please wait...' : 'Continue'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={
                searchParams.get('invitation')
                  ? `/register?invitation=${encodeURIComponent(searchParams.get('invitation')!)}`
                  : '/register'
              }
              className="font-medium text-primary hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
