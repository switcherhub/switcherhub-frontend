'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';
import { SiAppstore, SiGoogleplay } from 'react-icons/si';
import { HiOutlineBriefcase } from 'react-icons/hi2';

const APP_STORE_URL = 'https://apps.apple.com/app/switcherhub-work-near-me/id6744177983';
const PLAY_MARKET_URL = 'https://play.google.com/store/apps/details?id=com.switcherhub';

export function NonEmployerRedirect() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen w-full min-w-0 flex-1 flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto my-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Smartphone className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Web version is currently available for HR only</CardTitle>
          <CardDescription>
            Use the mobile app for full access to all features
          </CardDescription>
        </CardHeader>
        <CardContent className="grow-0 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full gap-2" variant="primary">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2">
              <SiAppstore className="size-5 shrink-0" />
              Download on the App Store
            </a>
          </Button>
          <Button asChild size="lg" className="w-full gap-2" variant="outline">
            <a href={PLAY_MARKET_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2">
              <SiGoogleplay className="size-5 shrink-0" />
              Get it on Google Play
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 gap-2 text-muted-foreground"
            onClick={logout}
          >
            <HiOutlineBriefcase className="size-4 shrink-0" />
            Sign in as HR
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
