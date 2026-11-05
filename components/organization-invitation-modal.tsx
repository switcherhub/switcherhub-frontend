'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertContent, AlertDescription, AlertIcon } from '@/components/ui/alert';
import { Users, AlertTriangle } from 'lucide-react';
import {
  getActiveInvitations,
  acceptOrganizationInvitation,
  declineOrganizationInvitation,
  type ActiveInvitation,
} from '@/lib/api';
import { useOrganization } from '@/context/organization-context';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

export function OrganizationInvitationModal() {
  const router = useRouter();
  const { refetchOrganizations } = useOrganization();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [invitation, setInvitation] = useState<ActiveInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check invitations when user is authenticated
    if (!isAuthenticated || authLoading || hasChecked || isOpen) return;

    const checkActiveInvitations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const invitations = await getActiveInvitations();
        if (invitations.length > 0) {
          // Show the first active invitation
          setInvitation(invitations[0]);
          setIsOpen(true);
        }
        setHasChecked(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately when authenticated
    checkActiveInvitations();
  }, [isAuthenticated, authLoading, hasChecked, isOpen]);

  const handleAccept = async () => {
    if (!invitation || !invitation.code) return;

    setIsProcessing(true);
    setError(null);
    try {
      await acceptOrganizationInvitation(invitation.code);
      toast.success('Invitation accepted successfully');
      setIsOpen(false);
      setInvitation(null);
      setHasChecked(false); // Allow checking for more invitations
      await refetchOrganizations();
      router.push('/swap-request');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !invitation.code) return;

    setIsProcessing(true);
    setError(null);
    try {
      await declineOrganizationInvitation(invitation.code);
      toast.success('Invitation declined');
      setIsOpen(false);
      setInvitation(null);
      setHasChecked(false); // Allow checking for more invitations
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsOpen(false);
      setInvitation(null);
      // Reset hasChecked to allow checking for more invitations after a delay
      setTimeout(() => {
        setHasChecked(false);
      }, 1000);
    }
  };

  if (isLoading || !invitation) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            You&apos;ve been invited to a team
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {error && (
            <Alert variant="destructive" appearance="light" size="md">
              <AlertIcon>
                <AlertTriangle className="size-4" />
              </AlertIcon>
              <AlertContent>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </Alert>
          )}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You have been invited to join <strong>{invitation.organizationName}</strong> as{' '}
              <strong className="capitalize">{invitation.role}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">
              Invited by: {invitation.invitedBy.email}
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isProcessing}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Accept Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
