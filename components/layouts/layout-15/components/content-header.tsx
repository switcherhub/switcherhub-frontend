import { Button } from '@/components/ui/button';
import { useLayout } from './layout-context';
import { PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ContentHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  const { setSidebarCollapse } = useLayout();
  return (
    <div className="bg-background flex min-h-(--content-header-height) items-center border-b lg:fixed top-[var(--header-height)] start-(--sidebar-width) end-0 in-data-[sidebar-collapsed]:start-(--sidebar-width-collapsed) z-[10] lg:h-(--content-header-height) pe-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="container-fluid flex min-w-0 items-center py-2 lg:py-0">
        <Button variant="ghost" size="icon" className="hidden in-data-[sidebar-collapsed]:inline-flex -ms-2.5 me-1" onClick={() => setSidebarCollapse(false)}>
          <PanelRightClose/>
        </Button>
        <div className={cn('flex min-w-0 grow items-center justify-between gap-2', className)}>
          {children}
        </div>
      </div>
    </div>
  )
};