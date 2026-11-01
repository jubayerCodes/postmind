import { supabase } from './supabase';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If explicitly configured with a relative proxy path (e.g. /api/backend)
    if (envUrl && envUrl.startsWith('/')) {
      return envUrl;
    }
    // When accessed through ngrok, tunnels, or external hostnames, avoid direct calls to localhost from browser
    const isRemote =
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';
    if (isRemote || !envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return '/api/backend';
    }
    return envUrl;
  }

  // Server-side (SSR) requires an absolute URL for fetch()
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.INTERNAL_API_URL ||
    (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith('/')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:5000')
  );
}

interface RequestOptions extends RequestInit {
  storeId?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { storeId, params, ...customConfig } = options;

  const baseUrl = getApiBaseUrl();
  let url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Extract auth token from Supabase if logged in
  let token: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || null;
  } catch {
    // Ignore errors when running outside browser or without active session
  }

  const isFormData =
    typeof FormData !== 'undefined' && customConfig.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(customConfig.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem('postmind_dev_guest') === 'true'
  ) {
    headers['x-dev-user-id'] = 'dev-merchant-urbanwear';
  }

  if (storeId) {
    headers['x-store-id'] = storeId;
  }

  const response = await fetch(url, {
    ...customConfig,
    headers,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    const message =
      typeof errorData === 'object' && errorData.message
        ? Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
