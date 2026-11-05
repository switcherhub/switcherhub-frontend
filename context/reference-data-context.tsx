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
import { getReferenceData, type ReferenceItem } from '@/lib/api';
import { useAuth } from './auth-context';

export const REFERENCE_PATHS = [
  'job-types',
  'work-environment',
  'job-core',
  'shift-type',
  'same-role-count',
  'time-to-start-working',
  'license-required',
  'location-tenure',
] as const;
export type ReferencePath = (typeof REFERENCE_PATHS)[number];

/** All reference data by path. Add new path to REFERENCE_PATHS and use getName(path, id). */
export type ReferenceDataByPath = Partial<
  Record<ReferencePath, ReferenceItem[]>
>;

interface ReferenceDataContextValue {
  /** All lists keyed by path, e.g. data['job-core'], data['work-environment'] */
  data: ReferenceDataByPath;
  isLoading: boolean;
  /** Get display name by path and id. Use e.g. getName('job-core', id). */
  getName: (
    path: ReferencePath,
    id: string | null | undefined,
  ) => string | null;
  /** Get list for path (for selects, filters). */
  getList: (path: ReferencePath) => ReferenceItem[];
  refetch: () => Promise<void>;
}

const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(
  null,
);

function buildIdToName(items: ReferenceItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    if (item?.id != null)
      map.set(String(item.id), item.name ?? String(item.id));
  }
  return map;
}

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ReferenceDataByPath>({});
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const settled = await Promise.allSettled(
        REFERENCE_PATHS.map((path) => getReferenceData(path)),
      );
      const next: ReferenceDataByPath = {};
      REFERENCE_PATHS.forEach((path, i) => {
        const result = settled[i];
        if (result.status === 'fulfilled') {
          next[path] = result.value ?? [];
        } else {
          console.warn(
            `[reference-data] Failed to load ${path}:`,
            result.reason,
          );
          next[path] = [];
        }
      });
      setData(next);
    } catch (err) {
      console.error('[reference-data] Load failed:', err);
      setData({});
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const getName = useCallback(
    (path: ReferencePath, id: string | null | undefined): string | null => {
      if (id == null || id === '') return null;
      const list = data[path];
      if (!list?.length) return null;
      const idStr = String(id);
      const name = buildIdToName(list).get(idStr);
      return name ?? null;
    },
    [data],
  );

  const getList = useCallback(
    (path: ReferencePath): ReferenceItem[] => data[path] ?? [],
    [data],
  );

  const value = useMemo<ReferenceDataContextValue>(
    () => ({ data, isLoading, getName, getList, refetch: load }),
    [data, isLoading, getName, getList, load],
  );

  return (
    <ReferenceDataContext.Provider value={value}>
      {children}
    </ReferenceDataContext.Provider>
  );
}

export function useReferenceData(): ReferenceDataContextValue {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx) {
    throw new Error(
      'useReferenceData must be used within ReferenceDataProvider',
    );
  }
  return ctx;
}
