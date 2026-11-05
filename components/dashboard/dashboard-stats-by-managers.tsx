'use client';

import type { DashboardStatisticsByManagers } from '@/lib/types/swap-request';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface DashboardStatsByManagersProps {
  data: DashboardStatisticsByManagers | null;
  loading: boolean;
  error: string | null;
}

function managerDisplayName(item: DashboardStatisticsByManagers['items'][number]) {
  const { manager } = item;
  if (manager.isDeleted) {
    return null;
  }
  const name =
    manager.firstName || manager.lastName
      ? `${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim()
      : manager.email || '—';
  return name;
}

export function DashboardStatsByManagers({
  data,
  loading,
  error,
}: DashboardStatsByManagersProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Statistics by managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Statistics by managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.items?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Statistics by managers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No manager statistics available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4" />
          Statistics by managers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Avg. processing time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => {
                const name = managerDisplayName(item);
                const isDeleted = item.manager.isDeleted;
                return (
                  <TableRow key={item.manager.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {isDeleted ? (
                          <span className="text-muted-foreground italic">
                            Deleted user
                          </span>
                        ) : (
                          <>
                            <span className="font-medium">
                              {name || item.manager.email || '—'}
                            </span>
                            {item.manager.email && (
                              <span className="text-xs text-muted-foreground">
                                {item.manager.email}
                              </span>
                            )}
                          </>
                        )}
                        {isDeleted && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            Deleted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.pending}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.active}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.completed}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.averageProcessingTimeFormatted || '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
