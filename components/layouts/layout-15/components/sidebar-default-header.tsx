import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  PanelRightOpen,
  Check,
  Plus,
  Settings,
} from 'lucide-react';
import { useLayout } from './layout-context';
import { useOrganization } from '@/context/organization-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ORG_COLORS = [
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-violet-500',
];

function getOrgColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length];
}

export function SidebarDefaultHeader() {
  const { sidebarCollapse, setSidebarCollapse } = useLayout();
  const {
    organizations,
    activeOrganization,
    isLoading,
    setActiveOrganization,
  } = useOrganization();

  const displayName = activeOrganization
    ? activeOrganization.name
    : 'Personal workspace';
  const displayInitial = activeOrganization
    ? activeOrganization.name[0]?.toUpperCase() ?? 'P'
    : 'P';
  const displayColor = activeOrganization
    ? getOrgColor(activeOrganization.name)
    : 'bg-muted-foreground/50';

  return (
    <div className="group flex justify-between items-center gap-2.5 border-b border-border h-11 lg:h-(--sidebar-header-height) shrink-0 px-2.5">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between gap-2.5 px-1.5 hover:bg-accent -ms-0.5"
              disabled={isLoading}
            >
              <span
                className={cn(
                  'rounded-md text-white text-sm shrink-0 size-6 flex items-center justify-center',
                  displayColor,
                )}
              >
                {displayInitial}
              </span>
              <span className="text-foreground text-sm font-medium truncate max-w-[120px] in-data-[sidebar-collapsed]:hidden">
                {displayName}
              </span>
              <ChevronDown className="size-4 text-muted-foreground shrink-0 in-data-[sidebar-collapsed]:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            side="bottom"
            align="start"
            sideOffset={7}
            alignOffset={0}
          >
            <DropdownMenuLabel>
              {organizations.length > 0 ? 'Organizations' : 'Workspace'}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {organizations.length === 0 ? (
                <>
                  {/* Personal workspace - only when no organizations */}
                  <DropdownMenuItem
                    onClick={() => setActiveOrganization(null)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-muted-foreground/50 text-white text-xs uppercase shrink-0 size-5 flex items-center justify-center">
                        P
                      </span>
                      <span className="truncate">Personal workspace</span>
                    </div>
                    <Check className="size-4 text-primary shrink-0" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/team"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Create organization</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => setActiveOrganization(org)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-md text-white text-xs uppercase shrink-0 size-5 flex items-center justify-center',
                            getOrgColor(org.name),
                          )}
                        >
                          {org.name[0]?.toUpperCase() ?? '?'}
                        </span>
                        <span className="truncate">{org.name}</span>
                      </div>
                      {activeOrganization?.id === org.id && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/team" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="size-4" />
                      <span>Configure organization</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        variant="ghost"
        mode="icon"
        size="icon"
        className="hidden lg:group-hover:flex lg:in-data-[sidebar-collapsed]:hidden!"
        onClick={() => setSidebarCollapse(!sidebarCollapse)}
      >
        <PanelRightOpen className="size-4" />
      </Button>
    </div>
  );
}
