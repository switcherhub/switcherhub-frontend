'use client';

import { User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Content } from '@/components/layouts/layout-15/components/content';
import { ContentHeader } from '@/components/layouts/layout-15/components/content-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { currentUser } = useAuth();

  return (
    <>
      <ContentHeader className="space-x-2">
        <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
          <User className="size-4 text-primary" />
          Profile
        </h1>
      </ContentHeader>

      <div className="container-fluid">
        <Content className="block space-y-8 py-6">
          {currentUser ? (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Avatar className="size-20">
                <AvatarImage src={currentUser.avatarUrl ?? undefined} alt={[currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email} />
                <AvatarFallback className="text-lg">
                  {[currentUser.firstName, currentUser.lastName]
                    .filter(Boolean)
                    .map((n) => (n as string)[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || currentUser.email[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-medium">
                  {[currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || '—'}
                </p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          )}
        </Content>
      </div>
    </>
  );
}
