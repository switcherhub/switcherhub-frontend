'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import {
  AlertTriangle,
  CreditCard,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createOrganization,
  deleteWorkspaceInvitation,
  deleteWorkspaceMember,
  getOrganizationMembers,
  getOrganizationPendingInvitations,
  getPaymentMethods,
  inviteOrganizationMember,
  leaveOrganization,
  transferOwnership,
  updateOrganization,
  updateOrganizationMemberRole,
} from '@/lib/api';
import type { OrganizationMember } from '@/lib/types/organization-member';
import type { PaymentMethod } from '@/lib/types/payment-method';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
} from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddPaymentMethodDialog } from '@/components/add-payment-method-form';
import { Content } from '@/components/layouts/layout-15/components/content';
import { ContentHeader } from '@/components/layouts/layout-15/components/content-header';
import { PaymentMethodsList } from '@/components/payment-methods-list';

export default function TeamPage() {
  const {
    activeOrganization,
    isLoading,
    refetchOrganizations,
    setActiveOrganization,
  } = useOrganization();
  const { currentUser } = useAuth();
  const hasOrganization = !!activeOrganization;
  const isOwner = currentUser?.id === activeOrganization?.ownerId;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [pendingInvitations, setPendingInvitations] = useState<
    Awaited<ReturnType<typeof getOrganizationPendingInvitations>>
  >([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  const [orgNameEdit, setOrgNameEdit] = useState('');
  const [updatingOrgName, setUpdatingOrgName] = useState(false);

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [confirmOrgName, setConfirmOrgName] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'hr' | 'viewer'>(
    'viewer',
  );
  const [inviting, setInviting] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [addPaymentMethodDialogOpen, setAddPaymentMethodDialogOpen] =
    useState(false);

  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] =
    useState<OrganizationMember | null>(null);
  const [newRoleForChange, setNewRoleForChange] = useState<
    'admin' | 'hr' | 'viewer'
  >('viewer');
  const [updatingRole, setUpdatingRole] = useState(false);

  const [cancellingInvitationId, setCancellingInvitationId] = useState<
    string | null
  >(null);

  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [cancelInviteDialogOpen, setCancelInviteDialogOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<
    Awaited<ReturnType<typeof getOrganizationPendingInvitations>>[number] | null
  >(null);

  const loadMembers = useCallback(async () => {
    if (!activeOrganization?.id) return;
    setMembersLoading(true);
    setMembersError(null);
    try {
      const list = await getOrganizationMembers(activeOrganization.id);
      setMembers(list);
    } catch (e) {
      setMembersError(
        e instanceof Error ? e.message : 'Failed to load members',
      );
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [activeOrganization?.id]);

  const loadPendingInvitations = useCallback(async () => {
    if (!activeOrganization?.id) return;
    setInvitationsLoading(true);
    try {
      const list = await getOrganizationPendingInvitations(
        activeOrganization.id,
      );
      setPendingInvitations(list);
    } catch {
      setPendingInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (activeOrganization?.id) {
      loadMembers();
      loadPendingInvitations();
    } else {
      setMembers([]);
      setPendingInvitations([]);
    }
  }, [activeOrganization?.id, loadMembers, loadPendingInvitations]);

  const currentMember = useMemo(
    () => members.find((m) => m.userId === currentUser?.id),
    [members, currentUser?.id],
  );
  const isAdmin = currentMember?.role === 'admin';
  const canManageBilling = useMemo(
    () => isOwner || isAdmin,
    [isOwner, isAdmin],
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const validTabs = useMemo(
    () =>
      canManageBilling
        ? ['settings', 'members', 'billing']
        : ['settings', 'members'],
    [canManageBilling],
  );
  const tabFromUrl = searchParams.get('tab') ?? 'settings';
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'settings';
  const setActiveTab = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (
      searchParams.get('invite') === '1' &&
      activeTab === 'members' &&
      activeOrganization?.id
    ) {
      setInviteDialogOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('invite');
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, {
        scroll: false,
      });
    }
  }, [activeTab, activeOrganization?.id, pathname, router, searchParams]);

  const loadPaymentMethods = useCallback(async () => {
    if (!activeOrganization?.id || !canManageBilling) return;
    setPaymentMethodsLoading(true);
    try {
      const list = await getPaymentMethods(activeOrganization.id);
      setPaymentMethods(list);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to load payment methods',
      );
      setPaymentMethods([]);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [activeOrganization?.id, canManageBilling]);

  useEffect(() => {
    if (activeOrganization?.id && canManageBilling) {
      loadPaymentMethods();
    } else {
      setPaymentMethods([]);
    }
  }, [activeOrganization?.id, canManageBilling, loadPaymentMethods]);

  useEffect(() => {
    if (activeOrganization?.name) {
      setOrgNameEdit(activeOrganization.name);
    }
  }, [activeOrganization?.name]);

  const handleCreateOrg = useCallback(async () => {
    const name = orgName.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      const createdOrg = await createOrganization(name);
      toast.success('Organization created');
      setCreateDialogOpen(false);
      setOrgName('');
      setActiveOrganization(createdOrg);
      await refetchOrganizations();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to create organization',
      );
    } finally {
      setSubmitting(false);
    }
  }, [orgName, refetchOrganizations, setActiveOrganization]);

  const handleUpdateOrgName = useCallback(async () => {
    if (!activeOrganization?.id) return;
    const name = orgNameEdit.trim();
    if (!name || name === activeOrganization.name) {
      return;
    }

    setUpdatingOrgName(true);
    try {
      const updatedOrg = await updateOrganization(activeOrganization.id, name);
      toast.success('Organization name updated');
      setActiveOrganization(updatedOrg);
      await refetchOrganizations();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to update organization name',
      );
    } finally {
      setUpdatingOrgName(false);
    }
  }, [
    activeOrganization,
    orgNameEdit,
    refetchOrganizations,
    setActiveOrganization,
  ]);

  const handleTransferOwnership = useCallback(async () => {
    if (!activeOrganization?.id || !selectedMemberId) return;
    if (confirmOrgName.trim() !== activeOrganization.name) {
      toast.error('Organization name does not match');
      return;
    }

    setTransferring(true);
    try {
      await transferOwnership(activeOrganization.id, selectedMemberId);
      toast.success('Ownership transferred successfully');
      setTransferDialogOpen(false);
      setSelectedMemberId('');
      setConfirmOrgName('');
      await refetchOrganizations();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to transfer ownership',
      );
    } finally {
      setTransferring(false);
    }
  }, [
    activeOrganization,
    selectedMemberId,
    confirmOrgName,
    refetchOrganizations,
  ]);

  const canAssignRoles = isOwner || isAdmin;

  const handleChangeRole = useCallback(async () => {
    if (!activeOrganization?.id || !memberToChangeRole) return;

    setUpdatingRole(true);
    try {
      await updateOrganizationMemberRole(
        activeOrganization.id,
        memberToChangeRole.id,
        newRoleForChange,
      );
      toast.success('Role updated successfully');
      setChangeRoleDialogOpen(false);
      setMemberToChangeRole(null);
      await loadMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  }, [
    activeOrganization?.id,
    memberToChangeRole,
    newRoleForChange,
    loadMembers,
  ]);

  const openChangeRoleDialog = useCallback(
    (member: OrganizationMember, newRole: 'admin' | 'hr' | 'viewer') => {
      setMemberToChangeRole(member);
      setNewRoleForChange(newRole);
      setChangeRoleDialogOpen(true);
    },
    [],
  );

  const handleCancelInvitationClick = useCallback(
    (
      inv: Awaited<
        ReturnType<typeof getOrganizationPendingInvitations>
      >[number],
    ) => {
      setInvitationToCancel(inv);
      setCancelInviteDialogOpen(true);
    },
    [],
  );

  const handleConfirmCancelInvitation = useCallback(async () => {
    if (!invitationToCancel) return;
    const workspaceId =
      invitationToCancel.workspace?.id ?? activeOrganization?.id;
    if (!workspaceId) return;
    setCancellingInvitationId(invitationToCancel.id);
    try {
      await deleteWorkspaceInvitation(workspaceId, invitationToCancel.id);
      toast.success('Invitation cancelled');
      setCancelInviteDialogOpen(false);
      setInvitationToCancel(null);
      await loadPendingInvitations();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to cancel invitation',
      );
    } finally {
      setCancellingInvitationId(null);
    }
  }, [invitationToCancel, activeOrganization?.id, loadPendingInvitations]);

  const handleRemoveMemberClick = useCallback((member: OrganizationMember) => {
    setMemberToRemove(member);
    setRemoveMemberDialogOpen(true);
  }, []);

  const handleConfirmRemoveMember = useCallback(async () => {
    if (!memberToRemove || !activeOrganization?.id) return;
    const workspaceId = memberToRemove.workspaceId ?? activeOrganization.id;
    setRemovingMember(true);
    try {
      await deleteWorkspaceMember(workspaceId, memberToRemove.id);
      toast.success('Member removed');
      setRemoveMemberDialogOpen(false);
      setMemberToRemove(null);
      await loadMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  }, [memberToRemove, activeOrganization?.id, loadMembers]);

  const handleInviteMember = useCallback(async () => {
    if (!activeOrganization?.id || !inviteEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setInviting(true);
    try {
      await inviteOrganizationMember(
        activeOrganization.id,
        inviteEmail.trim(),
        inviteRole,
      );
      toast.success('Invitation sent successfully');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('viewer');
      await loadMembers();
      await loadPendingInvitations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }, [activeOrganization, inviteEmail, inviteRole, loadMembers]);

  const handleLeaveOrganization = useCallback(async () => {
    if (!activeOrganization?.id) return;

    setLeaving(true);
    try {
      await leaveOrganization(activeOrganization.id);
      toast.success('Left organization successfully');
      setLeaveDialogOpen(false);
      await refetchOrganizations();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to leave organization',
      );
    } finally {
      setLeaving(false);
    }
  }, [activeOrganization, refetchOrganizations]);

  return (
    <>
      <ContentHeader className="space-x-2">
        <h1 className="inline-flex items-center gap-2.5 text-sm font-semibold">
          <Users className="size-4 text-primary" />
          Team
        </h1>
      </ContentHeader>

      <div className="container-fluid">
        <Content className="block space-y-6 py-5">
          {!isLoading && !hasOrganization && (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-6 text-center">
              <p className="text-muted-foreground text-sm max-w-md">
                Connect your company to start managing swap requests.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4 me-2" />
                Add your company
              </Button>
            </div>
          )}

          {hasOrganization && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">
                    {activeOrganization?.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">Organization</p>
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="-mx-1 min-w-0 overflow-x-auto overflow-y-hidden pb-px sm:mx-0 sm:overflow-visible">
                  <TabsList
                    variant="line"
                    size="md"
                    className="inline-flex w-max min-w-full justify-start sm:w-auto"
                  >
                    <TabsTrigger value="settings">
                      <Settings className="size-4" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="members">
                      <UserPlus className="size-4" />
                      Members
                    </TabsTrigger>
                    {canManageBilling && (
                      <TabsTrigger value="billing">
                        <CreditCard className="size-4" />
                        Billing
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
                <TabsContent value="settings" className="mt-4">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="org-name-edit">Organization name</Label>
                      <Input
                        id="org-name-edit"
                        placeholder="Organization name"
                        value={orgNameEdit}
                        onChange={(e) => setOrgNameEdit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateOrgName();
                          }
                        }}
                        disabled={updatingOrgName}
                        className="max-w-md"
                      />
                      <Button
                        onClick={handleUpdateOrgName}
                        disabled={
                          updatingOrgName ||
                          !orgNameEdit.trim() ||
                          orgNameEdit.trim() === activeOrganization?.name
                        }
                      >
                        {updatingOrgName ? 'Saving…' : 'Save'}
                      </Button>
                    </div>

                    <div className="space-y-4 border-t border-border pt-6">
                      <div>
                        <h3 className="text-sm font-semibold text-destructive mb-1">
                          Danger Zone
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Irreversible and destructive actions
                        </p>
                      </div>
                      <div className="space-y-3">
                        {isOwner ? (
                          <div>
                            <Label>Transfer Ownership</Label>
                            <p className="text-xs text-muted-foreground mb-3">
                              Transfer ownership of this organization to another
                              member
                            </p>
                            <Button
                              variant="destructive"
                              onClick={() => setTransferDialogOpen(true)}
                            >
                              Transfer Ownership
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Label>Leave Workspace</Label>
                            <p className="text-xs text-muted-foreground mb-3">
                              Leave this organization. You will lose access to
                              all organization resources.
                            </p>
                            <Button
                              variant="destructive"
                              onClick={() => setLeaveDialogOpen(true)}
                            >
                              Leave Workspace
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="members" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="size-4 me-2" />
                        Invite
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      {membersError && (
                        <div className="border-b border-border px-4 py-3 text-sm text-destructive">
                          {membersError}
                        </div>
                      )}
                      {membersLoading ? (
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-10 w-full" />
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead className="w-[100px]">
                                Status
                              </TableHead>
                              <TableHead className="w-[80px]" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {members.length === 0 &&
                            pendingInvitations.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No members
                                </TableCell>
                              </TableRow>
                            ) : (
                              <>
                                {members.map((member) => {
                                  const u = member.user;
                                  const displayName =
                                    u.firstName || u.lastName
                                      ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                                      : u.email;
                                  const initials =
                                    u.firstName && u.lastName
                                      ? `${u.firstName[0]}${u.lastName[0]}`
                                      : (u.email?.[0]?.toUpperCase() ?? '?');
                                  return (
                                    <TableRow key={member.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="size-8">
                                            {u.avatarUrl && (
                                              <AvatarImage
                                                src={u.avatarUrl}
                                                alt={displayName}
                                              />
                                            )}
                                            <AvatarFallback className="text-xs">
                                              {initials}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium truncate">
                                            {displayName || '—'}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {u.email}
                                      </TableCell>
                                      <TableCell>
                                        {canAssignRoles &&
                                        member.userId !==
                                          activeOrganization?.ownerId ? (
                                          <Select
                                            value={member.role}
                                            onValueChange={(value) =>
                                              openChangeRoleDialog(
                                                member,
                                                value as
                                                  | 'admin'
                                                  | 'hr'
                                                  | 'viewer',
                                              )
                                            }
                                          >
                                            <SelectTrigger className="w-[140px] h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="admin">
                                                Admin
                                              </SelectItem>
                                              <SelectItem value="hr">
                                                HR
                                              </SelectItem>
                                              <SelectItem value="viewer">
                                                Viewer
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <span className="capitalize">
                                            {member.role}
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell />
                                      <TableCell>
                                        {canAssignRoles &&
                                          member.userId !==
                                            activeOrganization?.ownerId &&
                                          member.userId !== currentUser?.id && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="size-8 text-muted-foreground hover:text-destructive"
                                              onClick={() =>
                                                handleRemoveMemberClick(member)
                                              }
                                              title="Remove member"
                                            >
                                              <Trash2 className="size-4" />
                                            </Button>
                                          )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {pendingInvitations.map((inv) => (
                                  <TableRow key={inv.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="size-8">
                                          <AvatarFallback className="text-xs text-muted-foreground">
                                            {inv.email[0]?.toUpperCase() ?? '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium truncate text-muted-foreground">
                                          —
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {inv.email}
                                    </TableCell>
                                    <TableCell>
                                      <span className="capitalize">
                                        {inv.role}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">Invited</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {canAssignRoles && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="size-8 text-muted-foreground hover:text-destructive"
                                          onClick={() =>
                                            handleCancelInvitationClick(inv)
                                          }
                                          disabled={
                                            cancellingInvitationId === inv.id
                                          }
                                          title="Cancel invitation"
                                        >
                                          <Trash2 className="size-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                </TabsContent>
                {canManageBilling && (
                  <TabsContent value="billing" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold">
                            Payment Methods
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Manage payment methods for this workspace
                          </p>
                        </div>
                        <Button
                          className="w-full shrink-0 sm:w-auto"
                          onClick={() => setAddPaymentMethodDialogOpen(true)}
                        >
                          <Plus className="size-4 me-2" />
                          Add Payment Method
                        </Button>
                      </div>
                      {paymentMethodsLoading ? (
                        <div className="rounded-lg border p-4 space-y-3">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : (
                        <PaymentMethodsList
                          workspaceId={activeOrganization.id}
                          paymentMethods={paymentMethods}
                          onUpdate={loadPaymentMethods}
                        />
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </Content>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add your company</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label
                htmlFor="org-name"
                className="text-sm font-medium block mb-2"
              >
                Company name
              </label>
              <Input
                id="org-name"
                placeholder="My Company"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
              />
            </div>
            <Alert variant="warning" appearance="light" size="md">
              <AlertIcon>
                <AlertTriangle className="size-4" />
              </AlertIcon>
              <AlertContent>
                <AlertDescription>
                  All your Swaps will be moved to the new company
                </AlertDescription>
              </AlertContent>
            </Alert>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={submitting || !orgName.trim()}
            >
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Alert variant="warning" appearance="light" size="md">
              <AlertIcon>
                <AlertTriangle className="size-4" />
              </AlertIcon>
              <AlertContent>
                <AlertDescription>
                  Warning: This action will transfer ownership of the
                  organization to the selected user, and you will lose access as
                  an administrator. This action is irreversible.
                </AlertDescription>
              </AlertContent>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="member-select">Select new owner</Label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
                disabled={transferring}
              >
                <SelectTrigger id="member-select">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter(
                      (member) => member.userId !== activeOrganization?.ownerId,
                    )
                    .map((member) => {
                      const u = member.user;
                      const displayName =
                        u.firstName || u.lastName
                          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                          : u.email;
                      return (
                        <SelectItem key={member.id} value={member.id}>
                          {displayName} ({u.email})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-org-name">
                Type organization name to confirm
              </Label>
              <Input
                id="confirm-org-name"
                placeholder={activeOrganization?.name}
                value={confirmOrgName}
                onChange={(e) => setConfirmOrgName(e.target.value)}
                disabled={transferring}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferDialogOpen(false);
                setSelectedMemberId('');
                setConfirmOrgName('');
              }}
              disabled={transferring}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTransferOwnership}
              disabled={
                transferring ||
                !selectedMemberId ||
                confirmOrgName.trim() !== activeOrganization?.name
              }
            >
              {transferring ? 'Transferring…' : 'Transfer Ownership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Workspace</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Alert variant="warning" appearance="light" size="md">
              <AlertIcon>
                <AlertTriangle className="size-4" />
              </AlertIcon>
              <AlertContent>
                <AlertDescription>
                  Are you sure you want to leave this organization? You will
                  lose access to all organization resources. This action is
                  irreversible.
                </AlertDescription>
              </AlertContent>
            </Alert>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveOrganization}
              disabled={leaving}
            >
              {leaving ? 'Leaving…' : 'Leave Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removeMemberDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveMemberDialogOpen(false);
            setMemberToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove && (
                <>
                  Remove{' '}
                  <strong>
                    {memberToRemove.user.firstName ||
                    memberToRemove.user.lastName
                      ? `${memberToRemove.user.firstName ?? ''} ${memberToRemove.user.lastName ?? ''}`.trim()
                      : memberToRemove.user.email}
                  </strong>{' '}
                  ({memberToRemove.user.email}) from the workspace? They will
                  lose access immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingMember}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRemoveMember();
              }}
              disabled={removingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingMember ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cancelInviteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCancelInviteDialogOpen(false);
            setInvitationToCancel(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
            <AlertDialogDescription>
              {invitationToCancel && (
                <>
                  Cancel the invitation sent to{' '}
                  <strong>{invitationToCancel.email}</strong>? They will no
                  longer be able to join using this link.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!cancellingInvitationId}>
              No, keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmCancelInvitation();
              }}
              disabled={!!cancellingInvitationId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingInvitationId
                ? 'Cancelling…'
                : 'Yes, cancel invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={changeRoleDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setChangeRoleDialogOpen(false);
            setMemberToChangeRole(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change member role</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {memberToChangeRole && (
                  <p>
                    Change role for{' '}
                    <strong>
                      {memberToChangeRole.user.firstName ||
                      memberToChangeRole.user.lastName
                        ? `${memberToChangeRole.user.firstName ?? ''} ${memberToChangeRole.user.lastName ?? ''}`.trim()
                        : memberToChangeRole.user.email}
                    </strong>{' '}
                    to &quot;
                    {newRoleForChange === 'admin'
                      ? 'Admin'
                      : newRoleForChange === 'hr'
                        ? 'HR'
                        : 'Viewer'}
                    &quot;?
                  </p>
                )}
                {(newRoleForChange === 'admin' ||
                  newRoleForChange === 'hr') && (
                  <Alert variant="warning" appearance="light" size="sm">
                    <AlertIcon>
                      <AlertTriangle className="size-4" />
                    </AlertIcon>
                    <AlertContent>
                      <AlertDescription>
                        Note: &quot;Admin&quot; and &quot;HR&quot; roles have
                        access to payment via added payment methods.
                      </AlertDescription>
                    </AlertContent>
                  </Alert>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingRole}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleChangeRole();
              }}
              disabled={updatingRole}
            >
              {updatingRole ? 'Saving…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInviteMember();
                  }
                }}
                disabled={inviting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: 'admin' | 'hr' | 'viewer') =>
                  setInviteRole(value)
                }
                disabled={inviting}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === 'admin' &&
                  'Full access except ownership transfer'}
                {inviteRole === 'hr' && 'Limited access for HR operations'}
                {inviteRole === 'viewer' && 'Read-only access'}
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteDialogOpen(false);
                setInviteEmail('');
                setInviteRole('viewer');
              }}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={inviting || !inviteEmail.trim()}
            >
              {inviting ? 'Sending…' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canManageBilling && activeOrganization && (
        <AddPaymentMethodDialog
          open={addPaymentMethodDialogOpen}
          onOpenChange={setAddPaymentMethodDialogOpen}
          workspaceId={activeOrganization.id}
          onSuccess={loadPaymentMethods}
        />
      )}
    </>
  );
}
