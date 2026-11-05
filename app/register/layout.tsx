import { ReactNode } from 'react';

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-background">
      {children}
    </div>
  );
}
