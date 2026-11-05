'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { updateUser } from '@/lib/api';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';

function hasRequiredFields(
  profile: { firstName: string | null; lastName: string | null; phone: string | null } | null,
): boolean {
  if (!profile) return false;
  return Boolean(
    profile.firstName?.trim() &&
      profile.lastName?.trim() &&
      profile.phone?.trim(),
  );
}

export function RequiredProfileFieldsModal() {
  const { isAuthenticated, currentUser, isCurrentUserLoading, fetchCurrentUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const shouldBlock = useMemo(() => {
    if (!isAuthenticated || isCurrentUserLoading || !currentUser) return false;
    return !hasRequiredFields(currentUser);
  }, [isAuthenticated, isCurrentUserLoading, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.firstName ?? '');
    setLastName(currentUser.lastName ?? '');
    setPhone(currentUser.phone ?? '');
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstNameValue = firstName.trim();
    const lastNameValue = lastName.trim();
    const phoneValue = phone.trim();

    if (!firstNameValue || !lastNameValue || !phoneValue) {
      toast.error('Please fill in first name, last name and phone.');
      return;
    }

    setSaving(true);
    try {
      await updateUser({
        firstName: firstNameValue,
        lastName: lastNameValue,
        phone: phoneValue,
      });
      await fetchCurrentUser();
      toast.success('Profile completed successfully.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={shouldBlock}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-1.5rem)] max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="mx-auto w-full max-w-md pt-8 text-left sm:text-left">
          <DialogTitle>Complete your profile</DialogTitle>
          <p className="text-sm text-muted-foreground">
            To continue using the system, please fill in all required fields.
          </p>
        </DialogHeader>

        <DialogBody className="mx-auto flex w-full max-w-md items-center">
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="required-first-name">First name</Label>
              <Input
                id="required-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="required-last-name">Last name</Label>
              <Input
                id="required-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="required-phone">Phone</Label>
              <PhoneInput
                id="required-phone"
                value={phone}
                onChange={setPhone}
                disabled={saving}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save and continue'}
            </Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
