const AUTH_STORAGE_KEY = 'auth';

export interface AuthUser {
  access_token: string;
  refresh_token: string;
  id: string;
  email: string;
}

function getStorage(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setStorage(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  const user = getStorage();
  return user?.access_token ?? null;
}

export function getAuthUser(): AuthUser | null {
  return getStorage();
}

export function setAuthUser(user: AuthUser): void {
  setStorage(user);
}

export function clearAuth(): void {
  setStorage(null);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
