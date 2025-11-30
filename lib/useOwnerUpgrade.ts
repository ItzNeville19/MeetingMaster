import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

// Hook to automatically upgrade owner account
export function useOwnerUpgrade() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const userEmail = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                     user.emailAddresses?.[0]?.emailAddress;
    
    // Check if this is the owner email
    if (userEmail?.toLowerCase() === 'neville@rayze.xyz') {
      // Check current subscription
      const subscription = user.publicMetadata?.subscription as any;
      
      // If not already upgraded, trigger upgrade
      if (!subscription?.isOwner && !subscription?.isDev) {
        fetch('/api/auto-upgrade-owner', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // Reload the page to get updated metadata
              window.location.reload();
            }
          })
          .catch(err => console.error('Auto-upgrade failed:', err));
      }
    }
  }, [isLoaded, user]);
}

