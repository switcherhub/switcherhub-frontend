'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Bell, Check, CheckCheck, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api';
import type { NotificationItem } from '@/lib/types/notification';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PER_PAGE = 20;

function formatNotificationDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy, HH:mm', { locale: enUS });
  } catch {
    return iso;
  }
}

export function HeaderNotifications() {
  const router = useRouter();
  const { currentUser, fetchCurrentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readAllLoading, setReadAllLoading] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);

  const count = currentUser?.notificationsCount ?? 0;
  const showBadge = count > 0;

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await getNotifications({
        page: pageNum,
        per_page: PER_PAGE,
        orderBy: 'createdAt',
        orderType: 'DESC',
      });
      if (append) {
        setData((prev) => [...prev, ...res.data]);
      } else {
        setData(res.data);
      }
      setTotal(res.total);
      setPage(res.page);
      setPageCount(res.pageCount);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to load notifications',
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setReadAllLoading(true);
    try {
      await markAllNotificationsRead();
      await fetchCurrentUser();
      setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to mark notifications as read',
      );
    } finally {
      setReadAllLoading(false);
    }
  }, [fetchCurrentUser]);

  const handleMarkAsRead = useCallback(
    async (e: React.MouseEvent, item: NotificationItem) => {
      e.preventDefault();
      e.stopPropagation();
      const id = item.id ?? (item as { _id?: string })._id;
      if (!id || item.isRead) {
        if (!id) toast.error('Cannot mark as read: missing notification id');
        return;
      }
      setReadingId(id);
      try {
        await markNotificationRead(id);
        await fetchCurrentUser();
        setData((prev) =>
          prev.map((n) => {
            const nId = n.id ?? (n as { _id?: string })._id;
            return nId === id ? { ...n, isRead: true } : n;
          }),
        );
        toast.success('Notification marked as read');
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Failed to mark notification as read',
        );
      } finally {
        setReadingId(null);
      }
    },
    [fetchCurrentUser],
  );

  const handleNotificationClick = useCallback(
    (item: NotificationItem) => {
      const { data: itemData } = item;
      const swapRequestId = itemData?.swapRequestId;

      if (swapRequestId) {
        setOpen(false);
        router.push(`/swap-request?open=${encodeURIComponent(swapRequestId)}`);
      }
    },
    [router],
  );

  useEffect(() => {
    if (open) {
      loadPage(1, false);
    }
  }, [open, loadPage]);

  const handleLoadMore = useCallback(() => {
    if (page >= pageCount || loadingMore) return;
    loadPage(page + 1, true);
  }, [page, pageCount, loadingMore, loadPage]);

  const hasMore = page < pageCount && data.length < total;
  const isEmpty = !loading && data.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative flex items-center justify-center"
                onClick={() => setOpen(true)}
              >
                <Bell className="size-5 text-muted-foreground" />
                {showBadge && (
                  <Badge
                    variant="destructive"
                    size="xs"
                    shape="circle"
                    className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 text-[10px]"
                  >
                    {count > 99 ? '99+' : count}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Notifications{showBadge ? ` (${count})` : ''}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent
          variant="side"
          showCloseButton={false}
          className={cn(
            'left-auto flex min-h-0 flex-col border p-0',
            // Mobile: full-screen sheet with safe area
            'max-sm:inset-0 max-sm:left-0 max-sm:right-0 max-sm:top-0 max-sm:bottom-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none max-sm:rounded-none',
            'max-sm:pt-[env(safe-area-inset-top)] max-sm:pb-[env(safe-area-inset-bottom)]',
            // sm+: anchored side panel (unchanged feel on desktop)
            'sm:right-4 sm:top-4 sm:bottom-4 sm:left-auto sm:h-[calc(100dvh-2rem)] sm:max-h-none sm:w-full sm:max-w-md sm:rounded-lg',
          )}
        >
          <DialogHeader className="flex shrink-0 flex-row flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <DialogTitle className="mb-0 min-w-0 flex-1 text-sm font-semibold">
              Notifications
            </DialogTitle>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {total > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 max-sm:px-2 text-xs"
                  onClick={markAllRead}
                  disabled={readAllLoading}
                >
                  {readAllLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="size-3.5" />
                  )}
                  <span className="ms-1.5 max-sm:sr-only">Mark all as read</span>
                  <span className="ms-1.5 hidden max-sm:inline">Mark all</span>
                </Button>
              )}
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 sm:hidden"
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <DialogBody className="flex min-h-0 flex-1 flex-col p-0">
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                ) : isEmpty ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <>
                    {data.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex w-full gap-3 rounded-lg border px-4 py-3 text-sm transition-colors',
                          item.data?.swapRequestId
                            ? 'cursor-pointer hover:bg-accent/50'
                            : 'cursor-default',
                          item.isRead
                            ? 'border-border bg-card text-muted-foreground'
                            : 'border-primary/20 bg-primary/5 font-medium',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          disabled={!item.data?.swapRequestId}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left outline-none disabled:cursor-default"
                        >
                          {!item.isRead && (
                            <span
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive"
                              aria-hidden
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium leading-tight">
                              {item.title}
                            </span>
                            {item.data?.numericId != null ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                ID: {String(item.data.numericId)}
                              </p>
                            ) : null}
                            {item.message ? (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {item.message}
                              </p>
                            ) : null}
                            <time
                              className="mt-1.5 block text-xs text-muted-foreground"
                              dateTime={item.createdAt}
                            >
                              {formatNotificationDate(item.createdAt)}
                            </time>
                          </div>
                        </button>
                        {!item.isRead && (
                          <div className="relative z-10 flex shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  title="Mark as read"
                                  aria-label="Mark as read"
                                  disabled={readingId === (item.id ?? (item as { _id?: string })._id)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                                  onClick={(e) => handleMarkAsRead(e, item)}
                                >
                                  {readingId === (item.id ?? (item as { _id?: string })._id) ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Check className="size-4" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>Mark as read</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    ))}
                    {hasMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        <span className="ms-2">Load more</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
