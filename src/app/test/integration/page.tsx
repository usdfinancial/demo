'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import components that use browser APIs dynamically with SSR disabled
const IntegrationTestContent = dynamic(
  () => import('@/components/test/IntegrationTestContent'),
  { ssr: false }
);

export default function IntegrationTestPage() {
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show a simple loading state during SSR and initial client render
  if (!isClient) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Blockchain Integration Tests</h1>
        <div className="p-4 text-center">
          <p>Loading integration tests...</p>
        </div>
      </div>
    );
  }

  // Render the actual content client-side only
  return <IntegrationTestContent />;
}
