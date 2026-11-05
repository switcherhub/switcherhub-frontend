export interface UserMeChatRequests {
  unreadMessages: { inbox: number; sent: number; archived: number };
  total: { inbox: number; sent: number; archived: number };
}

export interface UserMeLimits {
  resumeCount: number;
  vacanciesCount: number;
  companiesCount: number;
  showContctactsDaily: number;
  chatCountDaily: number;
  appliesCountDaily: number;
  upgradeCount: number;
}

/** Payload for PUT /users (update profile) */
export interface UserUpdatePayload {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface UserMe {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  activeRole: 'employer' | 'candidate' | string;
  blockExpireAt: string | null;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
  codeAuthorization: string | null;
  codeEmail: string | null;
  newEmail: string | null;
  googleId: string | null;
  appleId: string | null;
  facebookId: string | null;
  isRegistered: boolean;
  resumeCount: number | null;
  vacanciesCount: number | null;
  companiesCount: number | null;
  showContctactsDaily: number | null;
  chatCountDaily: number | null;
  appliesCountDaily: number | null;
  upgradeCount: number | null;
  subscriptionId: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  appliesNotifications: boolean;
  frequencyNotifications: string | null;
  subscription: unknown | null;
  blockBy: unknown | null;
  isVerified: boolean;
  isPasswordSet: boolean;
  isBlocked: boolean;
  isPermanentlyBlocked: boolean;
  notificationsCount: number;
  unreadMessagesCount: number;
  chatRequests: UserMeChatRequests;
  limits: UserMeLimits;
}
