/**
 * Circle API Status Utilities
 * Provides information about Circle API key configuration and status
 */

export interface CircleApiStatus {
  hasApiKey: boolean;
  keyType: 'none' | 'public' | 'private';
  estimatedAttestationTime: string;
  rateLimitInfo: string;
  recommendations: string[];
}

/**
 * Check Circle API configuration status
 */
export function getCircleApiStatus(): CircleApiStatus {
  const publicApiKey = process.env.NEXT_PUBLIC_CIRCLE_API_KEY;
  const privateApiKey = process.env.CIRCLE_API_KEY;
  
  if (publicApiKey || privateApiKey) {
    return {
      hasApiKey: true,
      keyType: publicApiKey ? 'public' : 'private',
      estimatedAttestationTime: '10-15 minutes',
      rateLimitInfo: 'Higher rate limits with dedicated endpoints',
      recommendations: [
        '✅ Circle API key configured',
        '⚡ Faster attestation responses',
        '📈 Better SLA and rate limits'
      ]
    };
  }
  
  return {
    hasApiKey: false,
    keyType: 'none',
    estimatedAttestationTime: '15-30 minutes',
    rateLimitInfo: 'Public endpoints with shared rate limits',
    recommendations: [
      '⚠️ Using public Circle endpoints',
      '🐌 Slower attestation responses expected',
      '💡 Consider adding Circle API key for better performance',
      '🚀 Required for production/mainnet deployment'
    ]
  };
}

/**
 * Get appropriate Circle API endpoint based on environment and key availability
 */
export function getCircleApiEndpoint(environment: 'testnet' | 'mainnet' = 'testnet'): string {
  const status = getCircleApiStatus();
  
  if (environment === 'mainnet') {
    if (!status.hasApiKey) {
      throw new Error('Circle API key is required for mainnet deployment');
    }
    return 'https://iris-api.circle.com';
  }
  
  // Testnet - works with or without API key
  return 'https://iris-api-sandbox.circle.com';
}

/**
 * Format Circle API status for UI display
 */
export function formatCircleApiStatusForUI(status: CircleApiStatus) {
  return {
    title: status.hasApiKey ? 'Circle API Connected' : 'Circle API (Public)',
    subtitle: status.estimatedAttestationTime,
    description: status.rateLimitInfo,
    status: status.hasApiKey ? 'connected' : 'public',
    recommendations: status.recommendations
  };
}

/**
 * Validate Circle API key format (basic validation)
 */
export function validateCircleApiKey(apiKey: string): boolean {
  // Basic validation - Circle API keys are typically UUIDs or similar format
  // This is a simple check, actual validation would be done by Circle's API
  return apiKey.length > 20 && /^[a-zA-Z0-9\-_]+$/.test(apiKey);
}

/**
 * Get Circle API headers with authentication if available
 */
export function getCircleApiHeaders(): Record<string, string> {
  const circleApiKey = process.env.NEXT_PUBLIC_CIRCLE_API_KEY || process.env.CIRCLE_API_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (circleApiKey) {
    headers['Authorization'] = `Bearer ${circleApiKey}`;
  }
  
  return headers;
}

export default getCircleApiStatus;