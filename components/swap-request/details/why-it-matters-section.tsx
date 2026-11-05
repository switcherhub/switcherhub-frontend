'use client';

export function WhyItMattersSection() {
  return (
    <>
      <h4 className="text-sm font-bold uppercase tracking-wide text-foreground mb-3">
        Why it matters for you
      </h4>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          <li className="flex items-start gap-2 text-sm bg-muted/30 px-4 py-3">
            <span className="shrink-0 mt-1.5 size-2 rounded-full bg-[var(--color-success-accent,var(--color-green-700))]" />
            <div>
              <p className="font-semibold text-foreground">Retain your employee</p>
              <p className="text-muted-foreground mt-0.5">
                Employees who get location flexibility stay longer. Replacing one
                costs $3,000–$6,000.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2 text-sm bg-muted/30 px-4 py-3">
            <span className="shrink-0 mt-1.5 size-2 rounded-full bg-[var(--color-success-accent,var(--color-green-700))]" />
            <div>
              <p className="font-semibold text-foreground">No hiring, no gaps</p>
              <p className="text-muted-foreground mt-0.5">
                A trained replacement arrives at the same time your employee
                leaves. Operations stay stable.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2 text-sm bg-muted/30 px-4 py-3">
            <span className="shrink-0 mt-1.5 size-2 rounded-full bg-[var(--color-success-accent,var(--color-green-700))]" />
            <div>
              <p className="font-semibold text-foreground">
                Your decision is recorded
              </p>
              <p className="text-muted-foreground mt-0.5">
                Match confirmed. Payment is the final step to activate the swap.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </>
  );
}
