import {
  ArrowLeftRight,
  LayoutDashboard,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title?: string;
  icon?: LucideIcon;
  path?: string;
  badge?: string;
  pinnable?: boolean;
  pinned?: boolean;
  soon?: boolean;
  new?: {
    tooltip: string;
    path: string;
  };
  more?: true;
  dropdown?: true;
}

export type NavConfig = NavItem[];

export const MAIN_NAV: NavConfig = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    id: 'dashboard',
  },
  {
    title: 'Swaps',
    icon: ArrowLeftRight,
    path: '/swap-request',
    id: 'swaps',
  },
  {
    title: 'Team',
    icon: Users,
    path: '/team',
    id: 'team',
  },
  {
    title: 'Profile',
    icon: User,
    path: '/settings',
    id: 'profile',
  },
];
