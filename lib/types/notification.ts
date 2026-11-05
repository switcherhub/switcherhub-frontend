/** Notification types (match backend) */
export enum NotificationType {
  EXPIRED_LISTING = 'EXPIRED_LISTING',
  PREMIUM_SUGGESTION = 'PREMIUM_SUGGESTION',
  PREMIUM_EXPIRED = 'PREMIUM_EXPIRED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_REQUEST = 'NEW_REQUEST',
  WELCOME_MESSAGE = 'WELCOME_MESSAGE',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  SWAP_HR_JOINED = 'SWAP_HR_JOINED',
  SWAP_HR_PAID = 'SWAP_HR_PAID',
  SWAP_DEAL_COMPLETED = 'SWAP_DEAL_COMPLETED',
}

export interface NotificationItemData {
  swapRequestId?: string;
  numericId?: number;
}

export interface NotificationItem {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
  data?: NotificationItemData;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface GetNotificationsParams {
  page?: number;
  per_page?: number;
  search?: string;
  orderBy?: string;
  orderType?: 'ASC' | 'DESC';
}
