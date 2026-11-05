'use client';

import { Layout15 } from '@/components/layouts/layout-15';
import { ReactNode, useEffect, useState } from 'react';

import { ScreenLoader } from '@/components/screen-loader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ScreenLoader />;
  }

  return <Layout15>{children}</Layout15>;
}
