'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '@/lib/amplify-config';

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export function AmplifyProvider({ children }: AmplifyProviderProps) {
  return (
    <div suppressHydrationWarning>
      <Authenticator.Provider>
        {children}
      </Authenticator.Provider>
    </div>
  );
} 