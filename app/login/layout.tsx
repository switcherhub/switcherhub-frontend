import { ReactNode } from 'react';

/**
 * Layout for auth pages (login, register, etc.).
 * Does not use dashboard layout with sidebar — only the root app layout.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-background">
      {children}
    </div>
  );
}
