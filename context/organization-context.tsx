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
import { getOrganizations } from '@/lib/api';
import type { Organization } from '@/lib/types/organization';
import { useAuth } from './auth-context';

const ACTIVE_ORG_STORAGE_KEY = 'active-organization-id';

function getStoredActiveOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredActiveOrgId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

interface OrganizationContextValue {
  organizations: Organization[];
  activeOrganization: Organization | null;
  isLoading: boolean;
  setActiveOrganization: (org: Organization | null) => void;
  refetchOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganizationState] =
    useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetchOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const list = await getOrganizations();
      setOrganizations(list);

      const storedId = getStoredActiveOrgId();
      let active: Organization | null = null;
      if (storedId && list.some((o) => o.id === storedId)) {
        active = list.find((o) => o.id === storedId) ?? null;
      } else if (list.length > 0) {
        active = list[0];
        setStoredActiveOrgId(active.id);
      } else {
        setStoredActiveOrgId(null);
      }
      setActiveOrganizationState(active);
    } catch {
      setOrganizations([]);
      setActiveOrganizationState(null);
      setStoredActiveOrgId(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const setActiveOrganization = useCallback((org: Organization | null) => {
    setActiveOrganizationState(org);
    setStoredActiveOrgId(org?.id ?? null);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetchOrganizations();
    } else {
      setOrganizations([]);
      setActiveOrganizationState(null);
      setStoredActiveOrgId(null);
    }
  }, [isAuthenticated, refetchOrganizations]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganization,
      isLoading,
      setActiveOrganization,
      refetchOrganizations,
    }),
    [
      organizations,
      activeOrganization,
      isLoading,
      setActiveOrganization,
      refetchOrganizations,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return ctx;
}
