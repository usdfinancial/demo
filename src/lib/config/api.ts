// API configuration for AWS Amplify
export const API_CONFIG = {
  // Base URL for API calls - will be set by Amplify automatically
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  
  // API endpoints
  endpoints: {
    signin: '/signin',
    signup: '/signup',
    testDb: '/test-db',
  },
  
  // Default headers
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Timeout in milliseconds
  timeout: 30000,
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    return `${url}?${searchParams.toString()}`;
  }
  return url;
};

// API client with error handling
export class ApiClient {
  static async request(endpoint: string, options: RequestInit = {}) {
    const url = buildApiUrl(endpoint);
    
    const defaultOptions: RequestInit = {
      headers: API_CONFIG.defaultHeaders,
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  static async get(endpoint: string, params?: Record<string, string>) {
    const url = params ? buildApiUrl(endpoint, params) : buildApiUrl(endpoint);
    return this.request(url, { method: 'GET' });
  }

  static async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}