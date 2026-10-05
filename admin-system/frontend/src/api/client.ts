// Centralized API and Fetch interceptor with JWT bearer auto-attachment

import { useAuthStore } from '../store/useAuthStore';

const getEnvUrl = () => {
  try {
    return import.meta.env.VITE_API_URL || '';
  } catch {
    return (typeof process !== 'undefined' && process.env.VITE_API_URL) || '';
  }
};
const rawEnvUrl = getEnvUrl().trim().replace(/\/+$/, '');
// When VITE_API_URL is 'https://som-sing-phim-printing.onrender.com/api', BACKEND_HOST becomes 'https://som-sing-phim-printing.onrender.com'
export const BACKEND_HOST = rawEnvUrl ? rawEnvUrl.replace(/\/api$/, '') : '';

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

// Scoped fixture credentials for DEV/test review harness
let fixtureLoopbackScope: { origin: string; token: string } | null = null;

/**
 * Validates that a candidate fixture origin is a disjoint, reviewer-owned loopback origin.
 * Strictly rejects:
 * 1. Non-DEV/test environments (production disabled)
 * 2. Non-loopback hostnames (external denial: only localhost and 127.0.0.1 permitted)
 * 3. Collisions with window.location.origin (frontend app origin)
 * 4. Collisions with configured business BACKEND_HOST origin
 */
export function validateDevFixtureOrigin(origin: string): { valid: boolean; reason?: string } {
  const isDevOrTest = (() => {
    try {
      return Boolean(import.meta.env.DEV || import.meta.env.MODE === 'test');
    } catch {
      return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
    }
  })();

  if (!isDevOrTest) {
    return { valid: false, reason: 'Fixture scope is disabled in production' };
  }

  if (!origin || typeof origin !== 'string') {
    return { valid: false, reason: 'Invalid origin string' };
  }

  const windowOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5173';
  let parsed: URL;
  try {
    parsed = new URL(origin, windowOrigin);
  } catch {
    return { valid: false, reason: 'Malformed origin URL' };
  }

  const isLoopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (!isLoopback) {
    return { valid: false, reason: 'Only loopback origins (127.0.0.1 or localhost) are permitted' };
  }

  const getEffectivePort = (urlObj: URL) => urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
  const isSameLoopbackHost = (h1: string, h2: string) => {
    const isL1 = h1 === 'localhost' || h1 === '127.0.0.1';
    const isL2 = h2 === 'localhost' || h2 === '127.0.0.1';
    return isL1 && isL2;
  };

  // Frontend origin collision check
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      const parsedWindow = new URL(window.location.origin);
      if (
        parsed.origin === parsedWindow.origin ||
        (isSameLoopbackHost(parsed.hostname, parsedWindow.hostname) && getEffectivePort(parsed) === getEffectivePort(parsedWindow))
      ) {
        return { valid: false, reason: 'Collision with frontend origin is forbidden; must use a disjoint fixture port' };
      }
    } catch {}
  }

  // Configured business BACKEND_HOST collision check
  if (BACKEND_HOST) {
    try {
      const parsedBackend = new URL(BACKEND_HOST, windowOrigin);
      if (
        parsed.origin === parsedBackend.origin ||
        (isSameLoopbackHost(parsed.hostname, parsedBackend.hostname) && getEffectivePort(parsed) === getEffectivePort(parsedBackend))
      ) {
        return { valid: false, reason: 'Collision with configured business BACKEND_HOST is forbidden; must use a disjoint fixture port' };
      }
    } catch {}
  }

  return { valid: true };
}

/**
 * Sets a scoped fixture token for a specific loopback origin strictly in DEV/test mode.
 * Strictly verifies the origin is disjoint from business backend and frontend origins.
 * Does NOT mutate useAuthStore, localStorage, or allow non-loopback/production trust.
 * Real operator credentials from getAuthToken() are NEVER sent to the fixture origin.
 */
export function setDevFixtureScope(scope: { origin: string; token: string } | null): () => void {
  if (!scope) {
    fixtureLoopbackScope = null;
    return () => {};
  }

  const validation = validateDevFixtureOrigin(scope.origin);
  if (!validation.valid) {
    console.warn(`[Fixture Security] Rejected fixture scope: ${validation.reason}`);
    fixtureLoopbackScope = null;
    return () => {};
  }

  try {
    const windowOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5173';
    const parsed = new URL(scope.origin, windowOrigin);
    fixtureLoopbackScope = { origin: parsed.origin, token: scope.token };
    return () => {
      fixtureLoopbackScope = null;
    };
  } catch {
    fixtureLoopbackScope = null;
    return () => {};
  }
}

/**
 * Determines if a given URL string matches our trusted backend origin exactly.
 */
export function isTrustedOrigin(input: string | URL | Request): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(urlStr, window.location.origin);
    if (BACKEND_HOST) {
      const backendParsed = new URL(BACKEND_HOST, window.location.origin);
      return parsed.origin === backendParsed.origin;
    }
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
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
  const sessionGeneration = useAuthStore.getState().sessionGeneration;
  const assertCurrentSession = () => {
    if (!skipAuth && useAuthStore.getState().sessionGeneration !== sessionGeneration) throw new DOMException('Authentication session changed', 'AbortError');
  };

  let url = endpoint;
  if (BACKEND_HOST && url.startsWith('/api')) {
    url = `${BACKEND_HOST}${url}`;
  }

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

  if (!skipAuth && isTrustedOrigin(url)) {
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

  assertCurrentSession();
  // Handle 401 Unauthorized - Attempt Silent Refresh then Retry once
  if (response.status === 401 && !skipAuth) {
    console.warn(`[API 401 Unauthorized] on ${url}. Attempting silent token refresh...`);
    const newToken = await useAuthStore.getState().silentRefreshToken();

    assertCurrentSession();
    if (newToken) {
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

  assertCurrentSession();
  return response as unknown as T;
}

/**
 * Setup global window.fetch interceptor so existing components and libraries
 * automatically send Bearer token and handle 401 without rewriting all fetch calls.
 *
 * Security: Bearer is ONLY injected for requests to our own backend (same-origin /api/* paths
 * or explicit BACKEND_HOST). External URLs (e.g. CDNs, analytics) are passed through unchanged.
 */
export function setupGlobalFetchInterceptor(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  if ((window as any).__ss_fetch_intercepted__) return;
  (window as any).__ss_fetch_intercepted__ = true;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const originalUrlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    let targetInput: RequestInfo | URL = input;
    let targetUrlStr = originalUrlStr;

    // Resolve intended relative /api or /uploads path to configured BACKEND_HOST BEFORE exact final URL origin trust decision
    if (BACKEND_HOST && typeof input === 'string' && (input.startsWith('/api') || input.startsWith('/uploads'))) {
      targetInput = `${BACKEND_HOST}${input}`;
      targetUrlStr = targetInput as string;
    }

    const isTrusted = isTrustedOrigin(targetUrlStr);
    let isFixture = false;
    if (!isTrusted && fixtureLoopbackScope) {
      try {
        const parsed = new URL(targetUrlStr, window.location.origin);
        isFixture = parsed.origin === fixtureLoopbackScope.origin;
      } catch {
        isFixture = false;
      }
    }

    // Only intercept requests destined for our exact trusted origin or active loopback fixture scope
    if (!isTrusted && !isFixture) {
      return originalFetch(targetInput, init);
    }

    const generation = useAuthStore.getState().sessionGeneration;
    const assertSession = () => { if (useAuthStore.getState().sessionGeneration !== generation) throw new DOMException('Session changed', 'AbortError'); };
    const headers = new Headers(init?.headers || (typeof input === 'object' && 'headers' in input ? input.headers : undefined));

    // CRITICAL SECURITY ENFORCEMENT:
    // Fixture scope requests MUST NEVER send real operator credentials (getAuthToken()).
    // If the request is for the fixture origin, inject ONLY fixtureLoopbackScope.token.
    // If the request is for the trusted business backend, inject getAuthToken().
    if (isFixture && fixtureLoopbackScope) {
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${fixtureLoopbackScope.token}`);
      }
    } else if (isTrusted) {
      const token = getAuthToken();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const newInit: RequestInit = {
      ...init,
      headers,
    };

    let response = await originalFetch(targetInput, newInit);
    assertSession();

    // If 401 Unauthorized, try silent refresh and retry once (trusted backend only)
    if (isTrusted && response.status === 401 && !originalUrlStr.includes('/auth/login') && !originalUrlStr.includes('/auth/refresh')) {
      const newToken = await useAuthStore.getState().silentRefreshToken();
      assertSession();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await originalFetch(targetInput, { ...newInit, headers });
      }
    }

    assertSession();
    // Cloned response bodies must keep the same account boundary as the original.
    const guardBody = (result: Response): Response => {
      for (const method of ['json', 'text', 'blob', 'arrayBuffer', 'formData'] as const) {
        const read = result[method].bind(result);
        Object.defineProperty(result, method, { value: async () => { assertSession(); const body = await read(); assertSession(); return body; } });
      }
      const clone = result.clone.bind(result);
      Object.defineProperty(result, 'clone', { value: () => { assertSession(); return guardBody(clone()); } });
      return result;
    };
    return guardBody(response);
  };
}

/**
 * Normalizes and resolves relative media paths (/uploads/..., /api/...) against BACKEND_HOST.
 * Preserves data: and blob: URLs, rejects protocol-relative // URLs.
 */
export function resolveBackendUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('//')) return '';

  const windowOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
  let candidate = trimmed;

  if (BACKEND_HOST && (trimmed.startsWith('/uploads') || trimmed.startsWith('/api') || trimmed.startsWith('uploads/') || trimmed.startsWith('api/'))) {
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    candidate = `${BACKEND_HOST}${normalizedPath}`;
  }

  try {
    const parsed = new URL(candidate, windowOrigin);
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

/**
 * Normalizes and secures media URLs for private server asset retrieval.
 * - Resolves relative media paths (/uploads/..., /api/...) against BACKEND_HOST (if configured) or window.location.origin.
 * - Strictly rejects protocol-relative URLs (//...) from attaching tokens.
 * - Rejects userinfo in URLs.
 * - Matches exact origin only (no lookalike hosts or mismatched ports).
 * - Restricts to safe schemes (http:, https:).
 * - Correctly parses and preserves existing search params and fragments (#hash).
 * - Avoids token re-append if already present.
 */
export function getAuthenticatedMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data and Blob URLs pass through unchanged
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  // Protocol-relative URLs (e.g. //evil.com/path) are external and must never receive tokens or be rewritten
  if (trimmed.startsWith('//')) {
    return trimmed;
  }

  // Determine trusted base and backend origin
  const windowOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
  let backendOrigin = '';
  if (BACKEND_HOST) {
    try {
      backendOrigin = new URL(BACKEND_HOST, windowOrigin).origin;
    } catch {
      backendOrigin = '';
    }
  }
  const trustedOrigin = backendOrigin || windowOrigin;

  // Check if URL is relative (/uploads, /api, or relative path)
  let candidateUrl = trimmed;
  const isRelative = !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);

  if (isRelative) {
    // If BACKEND_HOST is configured and the path is an API or upload path, normalize to BACKEND_HOST
    if (BACKEND_HOST && (trimmed.startsWith('/uploads') || trimmed.startsWith('/api') || trimmed.startsWith('uploads/') || trimmed.startsWith('api/'))) {
      const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      candidateUrl = `${BACKEND_HOST}${normalizedPath}`;
    }
  }

  // Parse URL safely
  let parsed: URL;
  try {
    parsed = new URL(candidateUrl, trustedOrigin);
  } catch {
    return trimmed;
  }

  // Scheme must be safe (http or https)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return trimmed;
  }

  // Must not have userinfo (username / password)
  if (parsed.username || parsed.password) {
    return trimmed;
  }

  // Exact origin check: must match trustedOrigin exactly
  if (parsed.origin !== trustedOrigin) {
    if (fixtureLoopbackScope && parsed.origin === fixtureLoopbackScope.origin) {
      if (!parsed.searchParams.has('token')) {
        parsed.searchParams.set('token', fixtureLoopbackScope.token);
      }
      return parsed.toString();
    }
    return trimmed;
  }

  // If token is already present in query params, return candidateUrl
  if (parsed.searchParams.has('token')) {
    return candidateUrl;
  }

  const token = getAuthToken();
  if (!token) {
    return candidateUrl;
  }

  // Safely set token on searchParams (handles existing queries properly)
  parsed.searchParams.set('token', token);

  // If original was relative and no BACKEND_HOST is configured, preserve relative pathname + search + hash
  if (isRelative && !BACKEND_HOST) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  // Otherwise return full absolute URL (with preserved search and hash)
  return parsed.toString();
}

export interface AuthenticatedBlobResult {
  blob: Blob;
  blobUrl: string;
  contentType: string;
  size: number;
  filename?: string;
}

/**
 * Fetches private media using Authorization Bearer header, validates response status,
 * content-type, and magic bytes (strictly rejecting HTML 200 SPA fallback or JSON errors),
 * and creates an ephemeral Blob URL.
 */
export async function fetchAuthenticatedBlob(url: string, explicitToken?: string): Promise<AuthenticatedBlobResult> {
  const generation = useAuthStore.getState().sessionGeneration;
  const assertSession = () => { if (useAuthStore.getState().sessionGeneration !== generation) throw new DOMException('Session changed', 'AbortError'); };
  const trimmed = (url || '').trim();
  if (!trimmed) {
    throw new Error('Invalid media URL');
  }

  // Support blob: and data: URLs directly while validating contents against HTML spoofing
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    const res = await fetch(trimmed);
    assertSession();
    if (!res.ok) {
      throw new Error(`Failed to fetch blob media (HTTP ${res.status})`);
    }
    const rawContentType = (res.headers && typeof res.headers.get === 'function' ? (res.headers.get('content-type') || '') : '');
    if (rawContentType.toLowerCase().includes('text/html')) {
      throw new Error('Invalid artwork format: Server returned HTML document instead of valid artwork binary (SPA fallback or error page)');
    }

    const blob = await res.blob();
    let detectedType = rawContentType || (blob && (blob as any).type) || '';

    if (blob && typeof blob.slice === 'function') {
      try {
        const slice = blob.slice(0, 64);
        if (slice && typeof slice.arrayBuffer === 'function') {
          const buffer = await slice.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const textSnippet = new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim().toLowerCase();

          if (textSnippet.startsWith('<!doctype') || textSnippet.startsWith('<html') || textSnippet.startsWith('<?xml')) {
            throw new Error('Invalid artwork content: Detected HTML/XML document instead of binary artwork');
          }

          if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            detectedType = 'application/pdf';
          } else if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            detectedType = 'image/jpeg';
          } else if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            detectedType = 'image/png';
          } else if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
            detectedType = 'image/gif';
          } else if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            detectedType = 'image/webp';
          }
        }
      } catch (sniffErr: any) {
        if (sniffErr.message && sniffErr.message.includes('Invalid artwork content')) {
          throw sniffErr;
        }
      }
    }

    assertSession();
    return {
      blob,
      blobUrl: trimmed,
      contentType: detectedType || 'application/octet-stream',
      size: (blob && blob.size) || 0,
      filename: undefined,
    };
  }

  let targetUrl = trimmed;
  if (BACKEND_HOST && (trimmed.startsWith('/uploads') || trimmed.startsWith('/api') || trimmed.startsWith('uploads/') || trimmed.startsWith('api/'))) {
    targetUrl = `${BACKEND_HOST}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }
  const windowOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
  const parsed = new URL(targetUrl, windowOrigin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Invalid media URL');
  }
  const trusted = isTrustedOrigin(parsed);
  const isFixture = Boolean(fixtureLoopbackScope && parsed.origin === fixtureLoopbackScope.origin);

  if (trusted || isFixture) parsed.searchParams.delete('token');
  const headers: Record<string, string> = {};
  if (isFixture && fixtureLoopbackScope) {
    headers['Authorization'] = `Bearer ${fixtureLoopbackScope.token}`;
  } else if (trusted) {
    const token = explicitToken || getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else if (explicitToken) {
    headers['Authorization'] = `Bearer ${explicitToken}`;
  }

  const res = await fetch(parsed.toString(), { headers, redirect: 'error', referrerPolicy: 'no-referrer' });
  assertSession();
  if (!res.ok) {
    let errDetail = `${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) {
        errDetail += `: ${errJson.error}`;
      }
    } catch {}
    throw new Error(`Failed to fetch authenticated media (${errDetail})`);
  }

  // 1. Validate Content-Type
  const rawContentType = res.headers && typeof res.headers.get === 'function' ? (res.headers.get('content-type') || '') : '';
  const lowerContentType = rawContentType.toLowerCase();

  // Strictly reject HTML 200 (SPA fallback page like index.html)
  if (lowerContentType.includes('text/html')) {
    throw new Error('Invalid artwork format: Server returned HTML document instead of valid artwork binary (SPA fallback or error page)');
  }

  // Reject JSON responses (usually API error messages)
  if (lowerContentType.includes('application/json')) {
    throw new Error('Invalid artwork format: Server returned JSON API response instead of artwork binary');
  }

  // 2. Extract filename from Content-Disposition if present
  let resolvedFilename: string | undefined;
  const disposition = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-disposition') : null;
  if (disposition) {
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      try {
        resolvedFilename = decodeURIComponent(utf8Match[1]);
      } catch {}
    }
    if (!resolvedFilename) {
      const standardMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (standardMatch && standardMatch[1]) {
        resolvedFilename = standardMatch[1];
      }
    }
  }
  if (!resolvedFilename) {
    const pathnameSegment = parsed.pathname.split('/').filter(Boolean).pop();
    if (pathnameSegment) {
      resolvedFilename = decodeURIComponent(pathnameSegment);
    }
  }

  const blob = await res.blob();

  // 3. Inspect first bytes for HTML tags and binary magic bytes if blob supports slice
  let detectedType = rawContentType || (blob && (blob as any).type) || '';
  if (blob && typeof blob.slice === 'function') {
    try {
      const slice = blob.slice(0, 64);
      if (slice && typeof slice.arrayBuffer === 'function') {
        const buffer = await slice.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const textSnippet = new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim().toLowerCase();

        if (textSnippet.startsWith('<!doctype') || textSnippet.startsWith('<html') || textSnippet.startsWith('<?xml')) {
          throw new Error('Invalid artwork content: Detected HTML/XML document instead of binary artwork');
        }

        // Sniff magic bytes
        if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
          detectedType = 'application/pdf';
        } else if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
          detectedType = 'image/jpeg';
        } else if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          detectedType = 'image/png';
        } else if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          detectedType = 'image/gif';
        } else if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
          detectedType = 'image/webp';
        } else if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) {
          detectedType = 'image/bmp';
        } else if (detectedType.startsWith('image/')) {
          detectedType = 'application/octet-stream';
        }
      }
    } catch (sniffErr: any) {
      if (sniffErr.message && sniffErr.message.includes('Invalid artwork content')) {
        throw sniffErr;
      }
    }
  }

  assertSession();
  const blobUrl = URL.createObjectURL(blob);
  return {
    blob,
    blobUrl,
    contentType: detectedType || 'application/octet-stream',
    size: (blob && blob.size) || 0,
    filename: resolvedFilename,
  };
}

/**
 * Fetches private media using Authorization Bearer header and creates an ephemeral Blob URL.
 * Strongly preferred over URL query tokens to avoid token exposure in server logs, Referer headers,
 * and browser history. Caller should URL.revokeObjectURL() when no longer needed.
 */
export async function fetchAuthenticatedBlobUrl(url: string, explicitToken?: string): Promise<string> {
  const result = await fetchAuthenticatedBlob(url, explicitToken);
  return result.blobUrl;
}

/**
 * Downloads a protected private artwork or media file using authenticated fetch,
 * verifying that the binary is valid (not HTML 200 or JSON) and saving the exact
 * original bytes and filename.
 */
export async function downloadAuthenticatedFile(
  url: string,
  defaultFilename?: string,
  explicitToken?: string,
  originalFilename?: string
): Promise<{ filename: string; size: number }> {
  const result = await fetchAuthenticatedBlob(url, explicitToken);
  
  let finalFilename = originalFilename || result.filename || defaultFilename || 'artwork';
  // If defaultFilename had an extension (e.g. .pdf) and finalFilename lacks it, retain extension
  if (defaultFilename && /\.[a-zA-Z0-9]{3,4}$/.test(defaultFilename) && !/\.[a-zA-Z0-9]{3,4}$/.test(finalFilename)) {
    const ext = defaultFilename.match(/\.[a-zA-Z0-9]{3,4}$/)?.[0] || '';
    finalFilename += ext;
  } else if (!/\.[a-zA-Z0-9]{3,4}$/.test(finalFilename)) {
    if (result.contentType.includes('pdf')) finalFilename += '.pdf';
    else if (result.contentType.includes('jpeg')) finalFilename += '.jpg';
    else if (result.contentType.includes('png')) finalFilename += '.png';
    else if (result.contentType.includes('webp')) finalFilename += '.webp';
  }

  if (typeof document !== 'undefined') {
    const link = document.createElement('a');
    link.href = result.blobUrl;
    link.download = finalFilename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Only revoke ephemeral blob URLs that were newly generated (not caller's persistent blob)
    if (result.blobUrl !== url) {
      const cleanupTimer = setTimeout(() => {
        try {
          URL.revokeObjectURL(result.blobUrl);
        } catch {}
      }, 30000);
      if (cleanupTimer && typeof (cleanupTimer as any).unref === 'function') {
        (cleanupTimer as any).unref();
      }
    }
  }

  return { filename: finalFilename, size: result.size };
}

