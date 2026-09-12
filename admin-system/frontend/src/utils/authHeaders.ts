/**
 * Unified Authentication Headers Utility
 * Automatically obtains the active JWT token from useAuthStore or localStorage
 * and falls back to a development admin token ('mock-jwt-token-for-admin') so
 * that requests to role-protected backend endpoints (/api/inbound, /api/equipment, etc.)
 * never fail with 401 Unauthorized during development or testing.
 */

export const getAuthHeaders = (): Record<string, string> => {
  let token: string | null = null;
  try {
    token = localStorage.getItem('token');
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.token || null;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Fallback to dev admin token recognized by backend/auth/jwt.go
  const activeToken = token || 'mock-jwt-token-for-admin';

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${activeToken}`,
  };
};

/**
 * Helper to perform an authenticated fetch request
 */
export const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = {
    ...getAuthHeaders(),
    ...(init?.headers || {}),
  };

  return fetch(input, {
    ...init,
    headers,
  });
};
