export interface OrganizationMemberUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface OrganizationMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  invitedAt: string;
  joinedAt: string | null;
  invitedById: string | null;
  createdAt: string;
  updatedAt: string;
  user: OrganizationMemberUser;
}
