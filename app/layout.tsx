import { ReactNode, Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { OrganizationProvider } from '@/context/organization-context';
import { ReferenceDataProvider } from '@/context/reference-data-context';
import { ThemeProvider } from 'next-themes';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OrganizationInvitationModal } from '@/components/organization-invitation-modal';
import { RequiredProfileFieldsModal } from '@/components/required-profile-fields-modal';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | SwitcherHub',
    default: 'SwitcherHub', // a default is required when creating a template
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex h-full w-full min-w-0 text-base text-foreground bg-background',
          inter.className,
        )}
        suppressHydrationWarning
      >
        <div className="flex flex-1 w-full min-w-0 flex-col">
          <ThemeProvider
            attribute="class"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <AuthProvider>
              <ReferenceDataProvider>
                <OrganizationProvider>
                  <TooltipProvider delayDuration={0}>
                    <Suspense>{children}</Suspense>
                    <OrganizationInvitationModal />
                    <RequiredProfileFieldsModal />
                    <Toaster />
                  </TooltipProvider>
                </OrganizationProvider>
              </ReferenceDataProvider>
            </AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
