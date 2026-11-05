'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

interface GoogleGSI {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: { theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small' }
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleGSI;
  }
}

export interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
  className,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    (response: { credential: string }) => {
      void Promise.resolve(onSuccess(response.credential)).catch((err) => {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      });
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    if (!scriptLoaded || !clientId || !containerRef.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
    });
  }, [scriptLoaded, clientId, handleCredential]);

  if (!clientId) {
    return null;
  }

  return (
    <>
      <Script
        src={GSI_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div
        ref={containerRef}
        className={className}
        style={disabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
        aria-hidden={disabled}
      />
    </>
  );
}
