'use client';

import { useCallback, useState } from 'react';
import { CreditCard, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from '@/lib/api';
import type { PaymentMethod } from '@/lib/types/payment-method';

interface PaymentMethodsListProps {
  workspaceId: string;
  paymentMethods: PaymentMethod[];
  onUpdate: () => void;
}

export function PaymentMethodsList({
  workspaceId,
  paymentMethods,
  onUpdate,
}: PaymentMethodsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleSetDefault = useCallback(
    async (paymentMethodId: string) => {
      if (settingDefaultId) return;
      setSettingDefaultId(paymentMethodId);
      try {
        await setDefaultPaymentMethod(workspaceId, paymentMethodId);
        toast.success('Default payment method updated');
        onUpdate();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to set default payment method',
        );
      } finally {
        setSettingDefaultId(null);
      }
    },
    [workspaceId, onUpdate, settingDefaultId],
  );

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingId) return;
    try {
      await deletePaymentMethod(workspaceId, deletingId);
      toast.success('Payment method deleted');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      onUpdate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete payment method',
      );
    }
  }, [workspaceId, deletingId, onUpdate]);

  const getCardBrandIcon = (brand: string) => {
    const normalizedBrand = brand.toLowerCase();
    return <CreditCard className="size-4" />;
  };

  const formatExpiry = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <CreditCard className="size-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No payment methods added yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentMethods.map((pm) => (
              <TableRow key={pm.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getCardBrandIcon(pm.cardDetails.brand)}
                    <div>
                      <div className="font-medium capitalize">
                        {pm.cardDetails.brand}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        •••• {pm.cardDetails.last4}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatExpiry(pm.cardDetails.expMonth, pm.cardDetails.expYear)}
                </TableCell>
                <TableCell>
                  {pm.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="size-3 fill-current" />
                      Default
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(pm.id)}
                      disabled={settingDefaultId === pm.id}
                      className="h-auto py-1 text-xs"
                    >
                      Set as default
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(pm.id)}
                    disabled={deletingId === pm.id}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this payment method? This action
              cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
