import { Check } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';

const BENEFITS = [
  {
    title: 'Save $3,000-$6,000 per worker',
    description:
      'Most leave due to commute, not money. Keep your trained employees happy without expensive relocations.',
  },
  {
    title: 'Stop paying for re-hiring',
    description:
      'Every lost worker = 20-40 days downtime. Swaps keep both companies fully staffed with trained employees.',
  },
  {
    title: 'AI finds matches automatically',
    description:
      'We detect opportunities across locations. Get notified when perfect swaps are available for your team.',
  },
  {
    title: 'Pay only when you benefit',
    description:
      '$149 per swap - saves thousands. No subscription fees, no hidden costs. You only pay when a swap completes.',
  },
] as const;

const checkIconClassName =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCF8E5] text-[#00AA28]';

export function WhySwitcherHubSection() {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-none overflow-hidden gap-8">
      <div className="px-5 pt-5 pb-2">
        <CardTitle className="text-xl font-bold text-foreground">
          Why SwitcherHub?
        </CardTitle>
      </div>
      <div className="px-5 pb-6">
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-1 md:grid-cols-2">
          {BENEFITS.map((item) => (
            <li key={item.title} className="flex gap-3 items-start">
              <div className={checkIconClassName}>
                <Check className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
