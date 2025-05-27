'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyAmplifyProps {
  children: React.ReactNode;
}

export function ClientOnlyAmplify({ children }: ClientOnlyAmplifyProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [AuthenticatorProvider, setAuthenticatorProvider] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    // Import and configure Amplify only on client side
    Promise.all([
      import('@/lib/amplify-config'),
      import('@aws-amplify/ui-react')
    ]).then(([, amplifyUI]) => {
      setAuthenticatorProvider(() => amplifyUI.Authenticator.Provider);
      setIsMounted(true);
    });
  }, []);

  if (!isMounted || !AuthenticatorProvider) {
    return <>{children}</>;
  }

  return (
    <AuthenticatorProvider>
      {children}
    </AuthenticatorProvider>
  );
} 