import { ReactNode } from 'react';

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-background">
      {children}
    </div>
  );
}
