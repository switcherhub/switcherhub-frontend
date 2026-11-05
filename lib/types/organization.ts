import type { UserMe } from './users';

export interface Organization {
  id: string;
  name: string;
  mode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: UserMe;
}
