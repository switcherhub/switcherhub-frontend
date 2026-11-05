import { HeaderBrand } from "./header-brand";
import { HeaderNotifications } from "./header-notifications";
import { HeaderUsers } from "./header-users";

export function Header() {
  return (
    <header className="fixed top-0 start-0 end-0 z-[10] flex items-center justify-between h-[var(--header-height)] bg-zinc-950 border-b border-zinc-950 dark:border-border transition-[start] duration-200 ease-in-out pe-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="container-fluid flex min-w-0 justify-between items-stretch lg:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <HeaderBrand/>
        </div>
        <div className="flex items-center gap-2">
          <HeaderNotifications />
          <HeaderUsers/>
        </div>      
      </div>
    </header>
  )
};
