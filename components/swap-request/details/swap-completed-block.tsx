'use client';

import { format } from 'date-fns';
import { Mail, Phone, Trophy } from 'lucide-react';
import type { ReferencePath } from '@/context/reference-data-context';
import type { SwapRequestItem } from '@/lib/types/swap-request';
import { formatJobTypeWithHours } from './utils';

interface SwapCompletedBlockProps {
  item: SwapRequestItem;
}

interface SwapCompletedContactBlocksProps {
  item: SwapRequestItem;
  /** true = current user is HR A (your employee is participant A) */
  amSideA: boolean;
  getName: (
    path: ReferencePath,
    id: string | null | undefined,
  ) => string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ContactCard({
  header,
  statusLabel,
  statusColorClass,
  name,
  subtitle,
  phone,
  email,
  avatarInitials,
  avatarBgClass,
}: {
  header: string;
  statusLabel: string;
  statusColorClass: string;
  name: string;
  subtitle: string;
  phone: string | null;
  email: string | null;
  avatarInitials: string;
  avatarBgClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {header}
        </span>
        <span className={`text-xs font-medium ${statusColorClass}`}>
          {statusLabel}
        </span>
      </div>
      <div className="p-4 flex items-start gap-3">
        <div
          className={`shrink-0 size-12 rounded-full ${avatarBgClass} text-white flex items-center justify-center text-lg font-bold`}
        >
          {avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-base">{name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          {phone && (
            <p className="flex items-center gap-2 mt-2 text-sm text-foreground">
              <Phone
                className="size-4 shrink-0 text-[var(--color-destructive,#ef4444)]"
                aria-hidden
              />
              <span>{phone}</span>
            </p>
          )}
          {email && (
            <p className="flex items-center gap-2 mt-1 text-sm">
              <Mail
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <a
                href={`mailto:${email}`}
                className="text-[var(--color-info-accent,#2563eb)] hover:underline truncate block min-w-0"
              >
                {email}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SwapCompletedBlock({ item }: SwapCompletedBlockProps) {
  const dateStr = item.completedAt
    ? format(new Date(item.completedAt), 'MMM d, yyyy')
    : '';

  return (
    <div className="rounded-xl border border-[#c2e1d7] bg-[#eef2f3] p-6 flex flex-col items-center justify-center text-center shadow-sm">
      <Trophy
        className="size-12 mb-4 text-amber-500"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-xl font-semibold text-[#2e7d32] mb-1">
        Swap Completed
      </p>
      <p className="text-sm text-[#607d8b]">
        Both companies paid
        {dateStr ? ` · ${dateStr}` : ''}
      </p>
    </div>
  );
}

/** Three contact blocks (your employee, partner employee, partner HR) — render in left column when status is completed */
export function SwapCompletedContactBlocks({
  item,
  amSideA,
  getName,
}: SwapCompletedContactBlocksProps) {
  const yourSide = amSideA ? 'A' : 'B';
  const partnerSide = amSideA ? 'B' : 'A';

  const yourResume = amSideA ? item.resumeA : item.resumeB;
  const partnerResume = amSideA ? item.resumeB : item.resumeA;
  const yourName =
    (amSideA ? item.participantAFullName : item.participantBFullName) ??
    (yourResume?.firstName
      ? [yourResume.firstName, (yourResume as { lastName?: string })?.lastName]
          .filter(Boolean)
          .join(' ')
      : null) ??
    '—';
  const partnerName =
    (amSideA ? item.participantBFullName : item.participantAFullName) ??
    (partnerResume?.firstName
      ? [
          partnerResume.firstName,
          (partnerResume as { lastName?: string })?.lastName,
        ]
          .filter(Boolean)
          .join(' ')
      : null) ??
    '—';
  const yourPhone = amSideA
    ? item.participantAPhone
    : item.participantBPhone;
  const yourEmail = amSideA
    ? item.participantAPersonalEmail
    : item.participantBPersonalEmail;
  const partnerPhone = amSideA
    ? item.participantBPhone
    : item.participantAPhone;
  const partnerEmail = amSideA
    ? item.participantBPersonalEmail
    : item.participantAPersonalEmail;

  const jobCoreYour =
    yourResume?.jobCore?.name ??
    getName('job-core', yourResume?.jobCoreId) ??
    null;
  const jobTypeYour = formatJobTypeWithHours(
    yourResume?.jobType?.name ??
      getName('job-types', yourResume?.jobTypeId) ??
      null,
    yourResume?.hoursPerMonth,
  );
  const shiftYour = getName('shift-type', yourResume?.shiftTypeId) ?? null;
  const subtitleYour = [jobCoreYour, jobTypeYour, shiftYour]
    .filter(Boolean)
    .join(' · ') || '—';

  const jobCorePartner =
    partnerResume?.jobCore?.name ??
    getName('job-core', partnerResume?.jobCoreId) ??
    null;
  const jobTypePartner = formatJobTypeWithHours(
    partnerResume?.jobType?.name ??
      getName('job-types', partnerResume?.jobTypeId) ??
      null,
    partnerResume?.hoursPerMonth,
  );
  const shiftPartner =
    getName('shift-type', partnerResume?.shiftTypeId) ?? null;
  const subtitlePartner = [jobCorePartner, jobTypePartner, shiftPartner]
    .filter(Boolean)
    .join(' · ') || '—';

  const partnerManager = amSideA ? item.managerB : item.managerA;
  const partnerHrName =
    partnerManager?.firstName || partnerManager?.lastName
      ? [partnerManager?.firstName, partnerManager?.lastName]
          .filter(Boolean)
          .join(' ')
      : partnerManager?.email ?? '—';
  const partnerHrSubtitle = 'HR · Partner company';

  return (
    <div className="space-y-6">
      <ContactCard
        header={`YOUR EMPLOYEE — SWITCHER ${yourSide}`}
        statusLabel="Moving to partner company"
        statusColorClass="text-[var(--color-info-accent,#2563eb)]"
        name={yourName}
        subtitle={subtitleYour}
        phone={yourPhone ?? null}
        email={yourEmail ?? null}
        avatarInitials={getInitials(yourName)}
        avatarBgClass="bg-[var(--color-info-accent,#2563eb)]"
      />
      <ContactCard
        header={`PARTNER EMPLOYEE — SWITCHER ${partnerSide}`}
        statusLabel="Moving to your company"
        statusColorClass="text-[var(--color-success-accent,#16a34a)]"
        name={partnerName}
        subtitle={subtitlePartner}
        phone={partnerPhone ?? null}
        email={partnerEmail ?? null}
        avatarInitials={getInitials(partnerName)}
        avatarBgClass="bg-[var(--color-success-accent,#16a34a)]"
      />
      <div id="swap-partner-hr-contact" className="scroll-mt-24">
        <ContactCard
          header="PARTNER COMPANY HR"
          statusLabel="Your coordination contact"
          statusColorClass="text-[var(--color-warning-accent,#ea580c)]"
          name={partnerHrName}
          subtitle={partnerHrSubtitle}
          phone={partnerManager?.phone ?? null}
          email={partnerManager?.email ?? null}
          avatarInitials={getInitials(partnerHrName)}
          avatarBgClass="bg-[var(--color-warning-accent,#ea580c)]"
        />
      </div>
    </div>
  );
}
