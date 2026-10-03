import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { test, expect, vi } from 'vitest';
import { LoginPage } from '../src/features/auth/LoginPage';
import { useAuthStore } from '../src/store/useAuthStore';

test.each([502, 503, 504, 200])('login rejects gateway/HTML response HTTP%s without inventing cold-start cause', async status => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const login = vi.spyOn(useAuthStore.getState(), 'login');
  const fetch = vi.fn(async () => new Response('<html>Disposable gateway/SPA response</html>', { status, headers: { 'Content-Type': 'text/html' } }));
  vi.stubGlobal('fetch', fetch);
  const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<LoginPage />));
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fetch).toHaveBeenCalledTimes(1); expect(login).not.toHaveBeenCalled();
    expect(container.textContent).toContain(`HTTP ${status}`); expect(container.textContent).not.toMatch(/Render|Cold-start|30-50/);
    expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
  } finally { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
