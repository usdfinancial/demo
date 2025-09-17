/**
 * Utility functions to clean up duplicate iframes that can cause issues
 */

/**
 * Remove duplicate Turnkey iframes to prevent ID conflicts
 */
export function cleanupTurnkeyIframes(): void {
  if (typeof window === 'undefined') return;

  try {
    // Find all iframes with Turnkey-related IDs
    const turnkeyIframes = document.querySelectorAll('iframe[id*="turnkey"]');
    
    if (turnkeyIframes.length > 1) {
      console.log(`🧹 Found ${turnkeyIframes.length} Turnkey iframes, cleaning up duplicates...`);
      
      // Keep the first iframe, remove the rest
      turnkeyIframes.forEach((iframe, index) => {
        if (index > 0) {
          iframe.remove();
          console.log(`🗑️ Removed duplicate Turnkey iframe #${index}`);
        }
      });
    }
  } catch (error) {
    console.error('Failed to cleanup Turnkey iframes:', error);
  }
}

/**
 * Clean up any orphaned Account Kit iframes
 */
export function cleanupAccountKitIframes(): void {
  if (typeof window === 'undefined') return;

  try {
    // Find iframes that might be from Account Kit
    const accountKitIframes = document.querySelectorAll('iframe[src*="alchemy"], iframe[id*="account-kit"], iframe[id*="alchemy"]');
    
    // Remove iframes that are not properly attached or are duplicates
    accountKitIframes.forEach((iframe) => {
      const parent = iframe.parentElement;
      if (!parent || parent.style.display === 'none') {
        console.log('🧹 Removing orphaned Account Kit iframe');
        iframe.remove();
      }
    });
  } catch (error) {
    console.error('Failed to cleanup Account Kit iframes:', error);
  }
}

/**
 * Clean up all authentication-related iframes
 */
export function cleanupAuthIframes(): void {
  cleanupTurnkeyIframes();
  cleanupAccountKitIframes();
}

/**
 * Set up periodic cleanup of duplicate iframes
 */
export function setupIframeCleanup(): () => void {
  if (typeof window === 'undefined') return () => {};

  const interval = setInterval(() => {
    cleanupAuthIframes();
  }, 30000); // Clean up every 30 seconds

  // Also clean up on page visibility change
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      cleanupAuthIframes();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}