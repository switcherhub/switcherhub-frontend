'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function HeaderUsers() {
  const { currentUser, logout } = useAuth();

  const initials =
    currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : (currentUser?.email?.[0]?.toUpperCase() ?? 'U');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-1.5 -me-1.5"
        >
          <Avatar className="size-7">
            {currentUser?.avatarUrl && (
              <AvatarImage
                src={currentUser.avatarUrl}
                alt="user"
                className="border-2 border-zinc-950 hover:z-10"
              />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium truncate">
              {currentUser?.firstName || currentUser?.lastName
                ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim()
                : (currentUser?.email ?? 'My Account')}
            </span>
            {currentUser?.email &&
              (currentUser?.firstName || currentUser?.lastName) && (
                <span className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </span>
              )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="size-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
