'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { setStoredInvitationCode } from '@/app/organization/invitation/accept/page';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input, InputAddon, InputGroup } from '@/components/ui/input';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Enter your first name'),
  lastName: z.string().min(1, 'Enter your last name'),
  phone: z.string().min(1, 'Enter your phone number'),
  email: z.string().min(1, 'Enter email').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Store invitation code if present in URL
    const invitationCode = searchParams.get('invitation');
    if (invitationCode) {
      setStoredInvitationCode(invitationCode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  async function onSubmit(data: RegisterFormValues) {
    setSubmitError(null);
    try {
      await apiFetch('/user-auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          password: data.password,
          activeRole: 'employer',
        }),
        skipAuth: true,
      });
      router.replace(`/confirm-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-background p-6">
      <Card className="h-fit w-full max-w-[480px] **:data-[slot=card-content]:grow-0">
        <CardHeader className="justify-center border-b-0 text-center">
          <CardTitle className="w-full text-center text-2xl font-semibold">
            Sign up to SwitcherHub
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8 sm:px-8 sm:pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        variant="lg"
                        placeholder="John"
                        autoComplete="given-name"
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        variant="lg"
                        placeholder="Doe"
                        autoComplete="family-name"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        variant="lg"
                        placeholder="+1 555 000 0000"
                        autoComplete="tel"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <InputGroup className="**:data-[slot=input]:pe-10">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          variant="lg"
                          placeholder="••••••••"
                          autoComplete="new-password"
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
                {form.formState.isSubmitting
                  ? 'Please wait...'
                  : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={
                searchParams.get('invitation')
                  ? `/login?invitation=${encodeURIComponent(searchParams.get('invitation')!)}`
                  : '/login'
              }
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
