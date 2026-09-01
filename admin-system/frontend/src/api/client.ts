// Centralized API and Fetch interceptor with JWT bearer auto-attachment

import { useAuthStore } from '../store/useAuthStore';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

/**
 * Get current active token from memory Zustand store or fallback to localStorage
 */
export function getAuthToken(): string | null {
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;

  try {
    const rawAuth = localStorage.getItem('auth-storage');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      if (parsed?.state?.token) {
        return parsed.state.token;
      }
    }
  } catch {
    // ignore json parsing errors
  }

  return localStorage.getItem('token');
}

/**
 * Centralized Fetch wrapper that automatically injects Authorization Header
 * and handles 401 Unauthorized responses with silent token refresh or auto logout.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, headers = {}, ...rest } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const requestHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Do not set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(rest.body instanceof FormData) && !requestHeaders['Content-Type'] && rest.method && rest.method !== 'GET' && rest.method !== 'HEAD') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });
  } catch (networkErr: any) {
    console.error(`[API Network Error] ${url}:`, networkErr);
    throw networkErr;
  }

  // Handle 401 Unauthorized - Attempt Silent Refresh then Retry once
  if (response.status === 401 && !skipAuth) {
    console.warn(`[API 401 Unauthorized] on ${url}. Attempting silent token refresh...`);
    const newToken = await useAuthStore.getState().silentRefreshToken();

    if (newToken && newToken !== 'preview-token') {
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(url, {
          ...rest,
          headers: requestHeaders,
        });
      } catch (retryErr) {
        console.error(`[API Retry Error] ${url}:`, retryErr);
        throw retryErr;
      }
    } else {
      // Refresh failed or token invalid -> clear session
      useAuthStore.getState().logout();
    }
  }

  return response as unknown as T;
}

/**
 * Setup global window.fetch interceptor so existing components and libraries
 * automatically send Bearer token and handle 401 without rewriting all fetch calls.
 */
export function setupGlobalFetchInterceptor(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  if ((window as any).__ss_fetch_intercepted__) return;
  (window as any).__ss_fetch_intercepted__ = true;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept requests destined for our internal API
    const isApiRequest = urlStr.startsWith('/api') || urlStr.includes('/api/');
    if (!isApiRequest) {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers || (typeof input === 'object' && 'headers' in input ? input.headers : undefined));

    const token = getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const newInit: RequestInit = {
      ...init,
      headers,
    };

    let response = await originalFetch(input, newInit);

    // If 401 Unauthorized, try silent refresh and retry once
    if (response.status === 401 && !urlStr.includes('/auth/login') && !urlStr.includes('/auth/refresh')) {
      const newToken = await useAuthStore.getState().silentRefreshToken();
      if (newToken && newToken !== 'preview-token') {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await originalFetch(input, { ...newInit, headers });
      }
    }

    return response;
  };
}
