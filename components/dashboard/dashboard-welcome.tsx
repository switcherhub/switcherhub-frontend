interface DashboardWelcomeProps {
  roleLabel?: string;
}

export function DashboardWelcome({ roleLabel = 'HR Manager' }: DashboardWelcomeProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Welcome to SwitcherHub!
      </h2>
      <p className="mt-1 text-muted-foreground">
        You&apos;re all set up as an {roleLabel}
      </p>
    </div>
  );
}
