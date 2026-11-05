'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { KeyRound, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { changePassword, sendRecoveryCode, updateUser } from '@/lib/api';
import type { UserUpdatePayload } from '@/lib/types/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Content } from '@/components/layouts/layout-15/components/content';
import { ContentHeader } from '@/components/layouts/layout-15/components/content-header';

export default function SettingsPage() {
  const { currentUser, fetchCurrentUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!changePasswordOpen) return;
    setCodeSent(false);
    setRecoveryCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResendCooldown(0);
  }, [changePasswordOpen]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName ?? '');
      setLastName(currentUser.lastName ?? '');
      setPhone(currentUser.phone ?? '');
    }
  }, [currentUser]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const payload: UserUpdatePayload = {
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          phone: phone.trim() || null,
        };
        await updateUser(payload);
        await fetchCurrentUser();
        toast.success('Settings saved successfully');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to save settings',
        );
      } finally {
        setSaving(false);
      }
    },
    [firstName, lastName, phone, fetchCurrentUser],
  );

  const initials =
    currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : (currentUser?.email?.[0]?.toUpperCase() ?? 'U');

  const handleOpenChangePassword = useCallback(() => {
    if (!currentUser?.email) return;
    setChangePasswordOpen(true);
  }, [currentUser?.email]);

  const handleSendCode = useCallback(async () => {
    if (!currentUser?.email) return;
    setSendingCode(true);
    try {
      await sendRecoveryCode(currentUser.email);
      toast.success('Verification code sent to your email');
      setCodeSent(true);
      setResendCooldown(60);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send code',
      );
    } finally {
      setSendingCode(false);
    }
  }, [currentUser?.email]);

  const handleResendCode = useCallback(async () => {
    if (!currentUser?.email || resendCooldown > 0) return;
    setSendingCode(true);
    try {
      await sendRecoveryCode(currentUser.email);
      toast.success('Verification code sent to your email');
      setResendCooldown(60);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send code',
      );
    } finally {
      setSendingCode(false);
    }
  }, [currentUser?.email, resendCooldown]);

  const handleChangePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser?.email) return;
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      setChangePasswordSubmitting(true);
      try {
        await changePassword(currentUser.email, recoveryCode.trim(), newPassword);
        toast.success('Password changed successfully');
        setChangePasswordOpen(false);
        setRecoveryCode('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to change password',
        );
      } finally {
        setChangePasswordSubmitting(false);
      }
    },
    [
      currentUser?.email,
      recoveryCode,
      newPassword,
      confirmPassword,
    ],
  );

  return (
    <>
      <ContentHeader className="space-x-2">
        <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
          <Settings className="size-4 text-primary" />
          Settings
        </h1>
      </ContentHeader>

      <div className="container-fluid">
        <Content className="block space-y-6 py-5">
          {!currentUser ? (
            <div className="max-w-md space-y-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-20">
                  {currentUser.avatarUrl && (
                    <AvatarImage
                      src={currentUser.avatarUrl}
                      alt="Profile"
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={setPhone}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenChangePassword}
                >
                  <KeyRound className="size-4 me-2" />
                  Change password
                </Button>
              </div>
            </form>
          )}
        </Content>
      </div>

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit}>
            <DialogBody className="space-y-4">
              {!codeSent ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    We will send a verification code to {currentUser?.email}.
                    Click the button below to receive it.
                  </p>
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                  >
                    {sendingCode ? 'Sending…' : 'Send code'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Enter the code sent to {currentUser?.email} and your new
                    password.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="change-password-code">
                      Verification code
                    </Label>
                    <Input
                      id="change-password-code"
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Enter code from email"
                      disabled={changePasswordSubmitting}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="change-password-new">New password</Label>
                    <Input
                      id="change-password-new"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={changePasswordSubmitting}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="change-password-confirm">
                      Confirm new password
                    </Label>
                    <Input
                      id="change-password-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      disabled={changePasswordSubmitting}
                      autoComplete="new-password"
                    />
                  </div>
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Resend code available in {resendCooldown}s
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={sendingCode}
                    >
                      {sendingCode ? 'Sending…' : 'Resend code'}
                    </Button>
                  )}
                </>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePasswordOpen(false)}
                disabled={changePasswordSubmitting}
              >
                Cancel
              </Button>
              {codeSent && (
                <Button type="submit" disabled={changePasswordSubmitting}>
                  {changePasswordSubmitting ? 'Changing…' : 'Change password'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
