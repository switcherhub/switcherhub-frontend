import { clearAuth, getToken } from '@/lib/auth';
import type {
  GetNotificationsParams,
  NotificationListResponse,
} from '@/lib/types/notification';
import type { Organization } from '@/lib/types/organization';
import type { OrganizationMember } from '@/lib/types/organization-member';
import type { PaymentIntentResponse } from '@/lib/types/payment-intent';
import type {
  PaymentMethod,
  SetupIntentResponse,
} from '@/lib/types/payment-method';
import type {
  DashboardStatistics,
  DashboardStatisticsByManagers,
  SwapRequestItem,
  SwapRequestResponse,
  SwapRequestTabCounts,
} from '@/lib/types/swap-request';
import type { UserMe, UserUpdatePayload } from '@/lib/types/users';

const LOGIN_PATH = '/login';

function getLoginUrl(redirectPath?: string): string {
  if (typeof window === 'undefined') return LOGIN_PATH;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
  const path = basePath ? `${basePath}${LOGIN_PATH}` : LOGIN_PATH;
  const query = redirectPath
    ? `?redirect=${encodeURIComponent(redirectPath)}`
    : '';
  return `${window.location.origin}${path}${query}`;
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? '';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export interface ApiRequestInit extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit & { Authorization?: string };
  skipAuth?: boolean;
}

async function handleResponse<T>(
  response: Response,
  skipAuthRedirect?: boolean,
): Promise<T> {
  if (response.status === 401) {
    clearAuth();
    if (!skipAuthRedirect && typeof window !== 'undefined') {
      const publicPages = [
        '/login',
        '/register',
        '/forgot-password',
        '/confirm-email',
      ];
      const currentPath = window.location.pathname;

      if (!publicPages.some((page) => currentPath.includes(page))) {
        const redirectPath = window.location.pathname + window.location.search;
        window.location.href = getLoginUrl(redirectPath);
      }
    }
    throw new Error('Invalid email or password');
  }

  if (!response.ok) {
    const text = await response.text();
    let message = 'Request error';
    try {
      const json = text ? JSON.parse(text) : null;
      if (json?.message) message = json.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const url = path.startsWith('http')
    ? path
    : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const { skipAuth, ...rest } = init;
  const headers = new Headers(rest.headers);

  if (!skipAuth && typeof window !== 'undefined') {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (
    rest.body &&
    typeof rest.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...rest,
    headers,
  });

  return handleResponse<T>(response, skipAuth);
}

export function getApiUrl(): string {
  return getBaseUrl();
}

export interface ReferenceItem {
  id: string;
  name: string;
}

/** Backend returns ParameterBaseInterface with `title`; we normalize to `name`. */
export async function getReferenceData(path: string): Promise<ReferenceItem[]> {
  const segment = path.replace(/^\/+|\/+$/g, '');
  const raw = await apiFetch<
    Array<{ id: string; title?: string; name?: string }>
  >(`/${segment}/all`, { method: 'GET' });
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: String(item.id),
    name: item.title ?? item.name ?? String(item.id),
  }));
}

export async function getCurrentUser(): Promise<UserMe> {
  return apiFetch<UserMe>('/users/me', { method: 'GET' });
}

export async function updateUser(payload: UserUpdatePayload): Promise<UserMe> {
  return apiFetch<UserMe>('/users', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function sendRecoveryCode(email: string): Promise<void> {
  return apiFetch<void>('/user-auth/send-recovery-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function changePassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/user-auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function getOrganizations(): Promise<Organization[]> {
  return apiFetch<Organization[]>('/organization', { method: 'GET' });
}

export async function createOrganization(name: string): Promise<Organization> {
  return apiFetch<Organization>('/organization', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  return apiFetch<OrganizationMember[]>(
    `/organization/${organizationId}/members`,
    { method: 'GET' },
  );
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  memberId: string,
  role: 'admin' | 'hr' | 'viewer',
): Promise<OrganizationMember> {
  return apiFetch<OrganizationMember>(
    `/organization/${organizationId}/members/${memberId}/role`,
    {
      method: 'PUT',
      body: JSON.stringify({ role }),
    },
  );
}

/** DELETE /workspace/:workspaceId/members/:memberId — remove a member from the workspace */
export async function deleteWorkspaceMember(
  workspaceId: string,
  memberId: string,
): Promise<void> {
  return apiFetch<void>(`/workspace/${workspaceId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export async function updateOrganization(
  organizationId: string,
  name: string,
): Promise<Organization> {
  return apiFetch<Organization>(`/organization/${organizationId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function transferOwnership(
  organizationId: string,
  newOwnerMemberId: string,
): Promise<void> {
  return apiFetch<void>(`/organization/${organizationId}/transfer-ownership`, {
    method: 'POST',
    body: JSON.stringify({ newOwnerMemberId }),
  });
}

export async function leaveOrganization(organizationId: string): Promise<void> {
  return apiFetch<void>(`/organization/${organizationId}/leave`, {
    method: 'POST',
  });
}

export async function inviteOrganizationMember(
  organizationId: string,
  email: string,
  role: 'admin' | 'hr' | 'viewer',
): Promise<void> {
  return apiFetch<void>(`/organization/${organizationId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export interface OrganizationInvitationInfo {
  id: string;
  organizationId: string;
  organizationName: string;
  role: 'admin' | 'hr' | 'viewer';
  invitedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function getOrganizationInvitationInfo(
  code: string,
): Promise<OrganizationInvitationInfo> {
  return apiFetch<OrganizationInvitationInfo>(
    `/organization/invitation/${code}`,
    { method: 'GET' },
  );
}

export async function acceptOrganizationInvitation(
  code: string,
): Promise<void> {
  return apiFetch<void>('/organization/invitation/accept', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function declineOrganizationInvitation(
  code: string,
): Promise<void> {
  return apiFetch<void>('/organization/invitation/decline', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export interface ActiveInvitation {
  id: string;
  code: string;
  organizationId: string;
  organizationName: string;
  role: 'admin' | 'hr' | 'viewer';
  invitedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function getActiveInvitations(): Promise<ActiveInvitation[]> {
  return apiFetch<ActiveInvitation[]>('/workspace/invitations/active', {
    method: 'GET',
  });
}

/** Pending invitation (workspace_invitation) — invitee not joined yet. Guard: MANAGE_TEAM_USERS */
export interface PendingInvitation {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'viewer';
  status: string;
  code: string;
  expiresAt: string;
  createdAt: string;
  workspace?: { id: string; name?: string };
  invitedBy?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

/** GET /organization/:organizationId/invitations/pending — list of pending invitations for this organization */
export async function getOrganizationPendingInvitations(
  organizationId: string,
): Promise<PendingInvitation[]> {
  return apiFetch<PendingInvitation[]>(
    `/organization/${organizationId}/invitations/pending`,
    { method: 'GET' },
  );
}

/** GET /workspace/:workspaceId/invitations/pending — same for workspace (workspace must be in organization mode) */
export async function getWorkspacePendingInvitations(
  workspaceId: string,
): Promise<PendingInvitation[]> {
  return apiFetch<PendingInvitation[]>(
    `/workspace/${workspaceId}/invitations/pending`,
    { method: 'GET' },
  );
}

/** DELETE /workspace/:workspaceId/invitations/:invitationId — cancel/revoke a pending invitation */
export async function deleteWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  return apiFetch<void>(
    `/workspace/${workspaceId}/invitations/${invitationId}`,
    { method: 'DELETE' },
  );
}

// Payment Methods API
export async function createSetupIntent(
  workspaceId: string,
): Promise<SetupIntentResponse> {
  return apiFetch<SetupIntentResponse>(
    `/workspace/${workspaceId}/payment-methods/setup-intent`,
    {
      method: 'POST',
    },
  );
}

export async function attachPaymentMethod(
  workspaceId: string,
  setupIntentId: string,
): Promise<PaymentMethod> {
  return apiFetch<PaymentMethod>(`/workspace/${workspaceId}/payment-methods`, {
    method: 'POST',
    body: JSON.stringify({ setupIntentId }),
  });
}

export async function getPaymentMethods(
  workspaceId: string,
): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>(
    `/workspace/${workspaceId}/payment-methods`,
    {
      method: 'GET',
    },
  );
}

export async function setDefaultPaymentMethod(
  workspaceId: string,
  paymentMethodId: string,
): Promise<PaymentMethod> {
  return apiFetch<PaymentMethod>(
    `/workspace/${workspaceId}/payment-methods/${paymentMethodId}/set-default`,
    {
      method: 'PUT',
    },
  );
}

export async function deletePaymentMethod(
  workspaceId: string,
  paymentMethodId: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/workspace/${workspaceId}/payment-methods/${paymentMethodId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function confirmManagerParticipation(
  swapRequestId: string,
): Promise<unknown> {
  return apiFetch(
    `/swap-request/${swapRequestId}/confirm-manager-participation`,
    {
      method: 'PUT',
    },
  );
}

export async function createPaymentIntent(
  swapRequestId: string,
  paymentMethodId?: string,
): Promise<PaymentIntentResponse> {
  return apiFetch<PaymentIntentResponse>(
    `/swap-request/${swapRequestId}/payment-intent`,
    {
      method: 'POST',
      ...(paymentMethodId
        ? { body: JSON.stringify({ paymentMethodId }) }
        : {}),
    },
  );
}

export async function getSwapRequest(
  swapRequestId: string,
): Promise<SwapRequestItem> {
  return apiFetch<SwapRequestItem>(`/swap-request/${swapRequestId}`);
}

export async function deleteSwapRequest(
  swapRequestId: string,
): Promise<unknown> {
  return apiFetch(`/swap-request/${swapRequestId}`, {
    method: 'DELETE',
  });
}

export async function getDashboardStatistics(
  organizationId: string,
): Promise<DashboardStatistics> {
  return apiFetch<DashboardStatistics>(
    `/swap-request/dashboard/statistics?organizationId=${encodeURIComponent(organizationId)}`,
    { method: 'GET' },
  );
}

export async function getDashboardStatisticsByManagers(
  organizationId: string,
): Promise<DashboardStatisticsByManagers> {
  return apiFetch<DashboardStatisticsByManagers>(
    `/swap-request/dashboard/statistics/by-managers?organizationId=${encodeURIComponent(organizationId)}`,
    { method: 'GET' },
  );
}

export async function getSwapRequestTabCounts(): Promise<SwapRequestTabCounts> {
  const response = await apiFetch<SwapRequestResponse>(
    '/swap-request/manager?page=1&per_page=1',
    { method: 'GET' },
  );
  return (
    response.tabCounts ?? {
      new: 0,
      active: 0,
      success: 0,
      failed: 0,
    }
  );
}

// Notifications API
export async function getNotifications(
  params: GetNotificationsParams = {},
): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.per_page != null)
    searchParams.set('per_page', String(params.per_page));
  if (params.search) searchParams.set('search', params.search);
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.orderType) searchParams.set('orderType', params.orderType);
  const query = searchParams.toString();
  const path = query ? `/notification?${query}` : '/notification';
  return apiFetch<NotificationListResponse>(path, { method: 'GET' });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>('/notification/read-all', { method: 'PUT' });
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Notification id is required');
  }
  return apiFetch<void>(`/notification/${id}/read`, { method: 'PUT' });
}
