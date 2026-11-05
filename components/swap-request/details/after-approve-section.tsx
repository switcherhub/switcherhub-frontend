'use client';

import { Check } from 'lucide-react';

export function AfterApproveSection() {
  return (
    <>
      <h4 className="text-sm font-bold uppercase tracking-wide text-foreground mb-3">
        After both companies approve & pay
      </h4>
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <ul className="divide-y divide-border">
          <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 text-sm text-foreground">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
              <Check className="size-3 text-emerald-700" strokeWidth={2.5} />
            </span>
            <span>
              <strong>Full personal details of both employees are unlocked</strong>{' '}
              — names, contacts, and role information.
            </span>
          </li>
          <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 text-sm text-foreground">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
              <Check className="size-3 text-emerald-700" strokeWidth={2.5} />
            </span>
            <span>
              <strong>You receive the HR contact at the partner company</strong>{' '}
              to coordinate all legal and operational details directly.
            </span>
          </li>
          <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 text-sm text-foreground">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
              <Check className="size-3 text-emerald-700" strokeWidth={2.5} />
            </span>
            <span>
              <strong>Until then, all identities remain confidential.</strong>{' '}
              No data is shared without mutual confirmation.
            </span>
          </li>
        </ul>
      </div>
    </>
  );
}
