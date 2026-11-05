'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getCurrentUser } from '@/lib/api';
import type { AuthUser } from '@/lib/auth';
import {
  clearAuth,
  getAuthUser,
  setAuthUser as setStoredAuthUser,
} from '@/lib/auth';
import type { UserMe } from '@/lib/types/users';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  currentUser: UserMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCurrentUserLoading: boolean;
  isEmployer: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginFromTokens: (response: LoginResponse) => void;
  logout: () => void;
  refreshUser: () => void;
  fetchCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUserLoading, setIsCurrentUserLoading] = useState(false);

  const refreshUser = useCallback(() => {
    const stored = getAuthUser();
    setUser(stored);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (!getAuthUser()) return;
    setIsCurrentUserLoading(true);
    try {
      const profile = await getCurrentUser();
      setCurrentUser(profile);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsCurrentUserLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider mount effect');
    refreshUser();
    setIsLoading(false);
  }, [refreshUser]);

  useEffect(() => {
    console.log('user changed:', user);
    if (user) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
    }
  }, [user, fetchCurrentUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // HR login endpoint (email/password)
    const data = await apiFetch<LoginResponse>('/user-auth/hr/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    const authUser: AuthUser = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id: data.id,
      email: data.email,
    };
    setStoredAuthUser(authUser);
    setUser(authUser);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const data = await apiFetch<LoginResponse>('/user-auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: idToken }),
      skipAuth: true,
    });
    const authUser: AuthUser = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id: data.id,
      email: data.email,
    };
    setStoredAuthUser(authUser);
    setUser(authUser);
  }, []);

  const loginFromTokens = useCallback((data: LoginResponse) => {
    const authUser: AuthUser = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id: data.id,
      email: data.email,
    };
    setStoredAuthUser(authUser);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setCurrentUser(null);
    router.push('/login');
  }, [router]);

  const isEmployer = currentUser?.activeRole === 'employer';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      currentUser,
      isAuthenticated: !!user,
      isLoading,
      isCurrentUserLoading,
      isEmployer,
      login,
      loginWithGoogle,
      loginFromTokens,
      logout,
      refreshUser,
      fetchCurrentUser,
    }),
    [
      user,
      currentUser,
      isLoading,
      isCurrentUserLoading,
      isEmployer,
      login,
      loginWithGoogle,
      loginFromTokens,
      logout,
      refreshUser,
      fetchCurrentUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
