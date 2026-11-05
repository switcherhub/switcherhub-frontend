'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const INVITATION_CODE_STORAGE_KEY = 'organization-invitation-code';

export function getStoredInvitationCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(INVITATION_CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredInvitationCode(code: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (code) {
      sessionStorage.setItem(INVITATION_CODE_STORAGE_KEY, code);
      // Dispatch custom event to notify modal about new code
      window.dispatchEvent(new CustomEvent('organization-invitation-code-set', { detail: { code } }));
    } else {
      sessionStorage.removeItem(INVITATION_CODE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export default function OrganizationInvitationAcceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const code = searchParams.get('code');

  useEffect(() => {
    if (isLoading) return;

    if (!code) {
      // No invitation code provided, redirect to home
      router.replace('/');
      return;
    }

    if (!isAuthenticated) {
      // Store the invitation code for later use after registration/login
      setStoredInvitationCode(code);
      // Redirect to register with invitation code preserved
      // User can then navigate to login if they already have an account
      router.replace(`/register?invitation=${encodeURIComponent(code)}`);
    } else {
      // User is authenticated, redirect to home
      // The modal will check for active invitations via API
      router.replace('/');
    }
  }, [code, isAuthenticated, isLoading, router]);

  return null;
}
