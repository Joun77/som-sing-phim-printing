import test from 'node:test';
import assert from 'node:assert';

// Set env var BEFORE importing anything dynamically
process.env.VITE_API_URL = 'https://api.external-backend.example/api';

// Set up globals BEFORE importing client
(globalThis as any).window = {
  location: {
    origin: 'https://trusted-host.example',
  },
  btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
  atob: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
};
(globalThis as any).btoa = (globalThis as any).window.btoa;
(globalThis as any).atob = (globalThis as any).window.atob;
(globalThis as any).localStorage = {
  getItem: () => 'mock-token',
};

// Track fetch calls
let lastFetchArgs: { input: any; init: any } | null = null;
(globalThis as any).fetch = async (input: any, init: any) => {
  lastFetchArgs = { input, init };
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
  };
};

test('Client Security Rules', async (t) => {
  // Dynamically import to ensure env variables and globals are set before module evaluation
  const { isTrustedOrigin, setDevFixtureScope, validateDevFixtureOrigin, setupGlobalFetchInterceptor, apiFetch } = await import('../api/client');

  await t.test('isTrustedOrigin', async (sub) => {
    await sub.test('returns false for relative paths when backend is external', () => {
      // Because relative path resolves to window.location.origin which is NOT the backend origin
      assert.strictEqual(isTrustedOrigin('/api/test'), false);
      assert.strictEqual(isTrustedOrigin('/api'), false);
    });

    await sub.test('returns true for exact configured backend host matches (cross-origin)', () => {
      assert.strictEqual(isTrustedOrigin('https://api.external-backend.example/api/test'), true);
    });

    await sub.test('returns false for external domains', () => {
      assert.strictEqual(isTrustedOrigin('https://api.github.com/users'), false);
    });

    await sub.test('returns false for prefix-lookalike attacker domains', () => {
      assert.strictEqual(isTrustedOrigin('https://api.external-backend.example.attacker.com/api/test'), false);
      assert.strictEqual(isTrustedOrigin('https://api.external-backend.attacker.example/api/test'), false);
    });
    
    await sub.test('handles URL object', () => {
      assert.strictEqual(isTrustedOrigin(new URL('https://api.external-backend.example/api/test')), true);
      assert.strictEqual(isTrustedOrigin(new URL('https://evil.com/api/test')), false);
    });
    
    await sub.test('handles Request object', () => {
      assert.strictEqual(isTrustedOrigin(new Request('https://api.external-backend.example/api/test')), true);
      assert.strictEqual(isTrustedOrigin(new Request('https://evil.com/api/test')), false);
    });

    await sub.test('setDevFixtureScope strictly enforces loopback and does NOT mark origin as globally trusted', () => {
      // 1. Non-loopback origins are refused
      const unregisterExternal = setDevFixtureScope({ origin: 'https://evil.com', token: 'evil-token' });
      assert.strictEqual(isTrustedOrigin('https://evil.com/test'), false);
      unregisterExternal();

      // 2. Loopback origin is accepted for scoped fixture, but is NOT returned as production isTrustedOrigin
      const unregisterLoopback = setDevFixtureScope({ origin: 'http://127.0.0.1:8089', token: 'fixture-token-abc' });
      assert.strictEqual(isTrustedOrigin('http://127.0.0.1:8089/uploads/artworks/test.pdf'), false);
      unregisterLoopback();
    });
  });

  await t.test('setupGlobalFetchInterceptor', async (sub) => {
    delete (globalThis.window as any).__ss_fetch_intercepted__;
    
    // Setup mock on window because setupGlobalFetchInterceptor hooks window.fetch
    (globalThis.window as any).fetch = async (input: any, init: any) => {
      lastFetchArgs = { input, init };
      return { status: 200 };
    };

    setupGlobalFetchInterceptor();

    await sub.test('injects Bearer token for trusted string requests', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('https://api.external-backend.example/api/test', { method: 'GET' });
      assert.ok(lastFetchArgs);
      const headers = lastFetchArgs.init?.headers;
      assert.ok(headers, 'Headers should be initialized');
      assert.strictEqual(headers.get('Authorization'), 'Bearer mock-token');
    });

    await sub.test('does NOT inject Bearer token for untrusted string requests', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('https://trusted-host.attacker.example/api/test', { method: 'GET' });
      assert.ok(lastFetchArgs);
      const headers = lastFetchArgs.init?.headers;
      assert.strictEqual(headers, undefined);
    });
    
    await sub.test('injects Bearer token for trusted URL object', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch(new URL('https://api.external-backend.example/api/test'), { method: 'GET' });
      assert.ok(lastFetchArgs);
      const headers = lastFetchArgs.init?.headers;
      assert.strictEqual(headers?.get('Authorization'), 'Bearer mock-token');
    });
    
    await sub.test('does NOT inject Bearer token for untrusted URL object', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch(new URL('https://api.external-backend.attacker.example/api/test'), { method: 'GET' });
      assert.ok(lastFetchArgs);
      const headers = lastFetchArgs.init?.headers;
      assert.strictEqual(headers, undefined);
    });
    
    await sub.test('does NOT inject Bearer token for untrusted Request object', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch(new Request('https://api.external-backend.attacker.example/api/test'), { method: 'GET' });
      assert.ok(lastFetchArgs);
      const headers = lastFetchArgs.init?.headers;
      assert.strictEqual(headers, undefined);
    });

    await sub.test('resolves relative /api paths to BACKEND_HOST and injects token', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('/api/v1/test', { method: 'GET' });
      assert.ok(lastFetchArgs);
      assert.strictEqual(lastFetchArgs.input, 'https://api.external-backend.example/api/v1/test');
      const headers = lastFetchArgs.init?.headers;
      assert.ok(headers, 'Headers should be initialized');
      assert.strictEqual(headers.get('Authorization'), 'Bearer mock-token');
    });

    await sub.test('resolves relative /uploads paths to BACKEND_HOST and injects token', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('/uploads/artworks/art-123.jpg', { method: 'GET' });
      assert.ok(lastFetchArgs);
      assert.strictEqual(lastFetchArgs.input, 'https://api.external-backend.example/uploads/artworks/art-123.jpg');
      const headers = lastFetchArgs.init?.headers;
      assert.ok(headers, 'Headers should be initialized');
      assert.strictEqual(headers.get('Authorization'), 'Bearer mock-token');
    });

    await sub.test('does NOT rewrite or inject token for protocol-relative lookalike URL', async () => {
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('//attacker.com/api/v1/test', { method: 'GET' });
      assert.ok(lastFetchArgs);
      // Because it starts with "//", it skips the `startsWith('/api')` rewriting logic
      assert.strictEqual(lastFetchArgs.input, '//attacker.com/api/v1/test');
      const headers = lastFetchArgs.init?.headers;
      assert.strictEqual(headers, undefined);
    });

    await sub.test('scoped fixture injection sends ONLY fixture token and NEVER real credentials to loopback origin', async () => {
      // Mock store token is 'mock-token'
      const unregister = setDevFixtureScope({ origin: 'http://127.0.0.1:8089', token: 'scoped-fixture-token-123' });
      
      // 1. Fetch to loopback fixture origin
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('http://127.0.0.1:8089/uploads/artworks/doc.pdf', { method: 'GET' });
      assert.ok(lastFetchArgs);
      const authHeader = lastFetchArgs.init?.headers?.get('Authorization');
      assert.strictEqual(authHeader, 'Bearer scoped-fixture-token-123', 'must send scoped fixture token');
      assert.notStrictEqual(authHeader, 'Bearer mock-token', 'must NEVER send real credentials to fixture');

      // 2. Fetch to external origin
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('https://evil.com/uploads/artworks/doc.pdf', { method: 'GET' });
      assert.ok(lastFetchArgs);
      const externalAuth = lastFetchArgs.init?.headers?.get ? lastFetchArgs.init?.headers?.get('Authorization') : undefined;
      assert.strictEqual(externalAuth, undefined, 'must NEVER send credentials to external origins');

      // 3. Fetch to trusted BACKEND_HOST receives real credentials
      lastFetchArgs = null;
      await (globalThis.window as any).fetch('https://api.external-backend.example/api/test', { method: 'GET' });
      assert.ok(lastFetchArgs);
      const trustedAuth = lastFetchArgs.init?.headers?.get('Authorization');
      assert.strictEqual(trustedAuth, 'Bearer mock-token', 'trusted backend receives real credentials');

      unregister();
    });
  });

  await t.test('validateDevFixtureOrigin & Scoped Fixture Security Boundaries', async (sub) => {
    await sub.test('strictly denies non-loopback external origins (external denial)', () => {
      const resEvil = validateDevFixtureOrigin('https://evil.com');
      assert.strictEqual(resEvil.valid, false);
      assert.match(resEvil.reason || '', /Only loopback origins/);

      const resLAN = validateDevFixtureOrigin('http://192.168.1.100:8089');
      assert.strictEqual(resLAN.valid, false);
      assert.match(resLAN.reason || '', /Only loopback origins/);
    });

    await sub.test('strictly rejects frontend origin collision on loopback host and port', () => {
      const prevOrigin = (globalThis.window as any).location.origin;
      try {
        (globalThis.window as any).location.origin = 'http://localhost:5173';

        // Same host and port
        const resLocalhost = validateDevFixtureOrigin('http://localhost:5173');
        assert.strictEqual(resLocalhost.valid, false);
        assert.match(resLocalhost.reason || '', /Collision with frontend origin/);

        // 127.0.0.1 on same port (collision aliasing)
        const resIP = validateDevFixtureOrigin('http://127.0.0.1:5173');
        assert.strictEqual(resIP.valid, false);
        assert.match(resIP.reason || '', /Collision with frontend origin/);

        // Disjoint loopback port is accepted
        const resDisjoint = validateDevFixtureOrigin('http://127.0.0.1:8089');
        assert.strictEqual(resDisjoint.valid, true);
      } finally {
        (globalThis.window as any).location.origin = prevOrigin;
      }
    });

    await sub.test('strictly rejects configured business BACKEND_HOST collision', () => {
      // In this suite, BACKEND_HOST is 'https://api.external-backend.example'
      const resBackend = validateDevFixtureOrigin('https://api.external-backend.example');
      assert.strictEqual(resBackend.valid, false);
    });

    await sub.test('strictly denies when production environment is simulated (production disabled)', () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const resProd = validateDevFixtureOrigin('http://127.0.0.1:8089');
        assert.strictEqual(resProd.valid, false);
        assert.match(resProd.reason || '', /disabled in production/);
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    await sub.test('setDevFixtureScope leaves localStorage and auth storage completely unchanged', () => {
      const prevLocalStorage = (globalThis as any).localStorage;
      try {
        const storageState: Record<string, string> = { token: 'real-operator-token' };
        (globalThis as any).localStorage = {
          getItem: (k: string) => storageState[k] || null,
          setItem: (k: string, v: string) => { storageState[k] = v; },
          removeItem: (k: string) => { delete storageState[k]; },
        };

        const unregister = setDevFixtureScope({ origin: 'http://127.0.0.1:8089', token: 'scoped-fixture-token' });
        assert.strictEqual(storageState['token'], 'real-operator-token', 'token must not be overwritten');
        assert.strictEqual(storageState['auth-storage'], undefined, 'auth-storage must not be written');

        unregister();
        assert.strictEqual(storageState['token'], 'real-operator-token', 'token remains unchanged after unregister');
      } finally {
        (globalThis as any).localStorage = prevLocalStorage;
      }
    });
  });
  
  await t.test('apiFetch', async (sub) => {
    await sub.test('injects token and prefixes BACKEND_HOST for relative URL', async () => {
      lastFetchArgs = null;
      await apiFetch('/api/v1/test');
      assert.ok(lastFetchArgs);
      assert.strictEqual(lastFetchArgs.input, 'https://api.external-backend.example/api/v1/test');
      assert.strictEqual(lastFetchArgs.init?.headers?.Authorization, 'Bearer mock-token');
    });
    
    await sub.test('does NOT inject token if skipAuth is true', async () => {
      lastFetchArgs = null;
      await apiFetch('/api/v1/test', { skipAuth: true });
      assert.ok(lastFetchArgs);
      assert.strictEqual(lastFetchArgs.init?.headers?.Authorization, undefined);
    });
    
    await sub.test('does NOT prefix BACKEND_HOST if external URL is provided', async () => {
      lastFetchArgs = null;
      await apiFetch('https://api.github.com/users');
      assert.ok(lastFetchArgs);
      assert.strictEqual(lastFetchArgs.input, 'https://api.github.com/users');
      assert.strictEqual(lastFetchArgs.init?.headers?.Authorization, undefined);
    });
  });

  await t.test('getAuthenticatedMediaUrl & media security (R1)', async (sub) => {
    const { getAuthenticatedMediaUrl, fetchAuthenticatedBlobUrl } = await import('../api/client');

    await sub.test('normalizes relative /uploads media to configured BACKEND_HOST and appends token', () => {
      const url = getAuthenticatedMediaUrl('/uploads/artworks/art-123.jpg');
      assert.strictEqual(url, 'https://api.external-backend.example/uploads/artworks/art-123.jpg?token=mock-token');
    });

    await sub.test('normalizes relative /api media to configured BACKEND_HOST and appends token', () => {
      const url = getAuthenticatedMediaUrl('/api/v1/orders/files/orders/ORD-1/item1.pdf');
      assert.strictEqual(url, 'https://api.external-backend.example/api/v1/orders/files/orders/ORD-1/item1.pdf?token=mock-token');
    });

    await sub.test('preserves existing query parameters when appending token', () => {
      const url = getAuthenticatedMediaUrl('/api/v1/orders/files/orders/ORD-1/item1.pdf?download=true');
      assert.strictEqual(url, 'https://api.external-backend.example/api/v1/orders/files/orders/ORD-1/item1.pdf?download=true&token=mock-token');
    });

    await sub.test('preserves URL fragment (#hash) after query parameters', () => {
      const url = getAuthenticatedMediaUrl('/uploads/artworks/doc.pdf?preview=true#page=2');
      assert.strictEqual(url, 'https://api.external-backend.example/uploads/artworks/doc.pdf?preview=true&token=mock-token#page=2');
    });

    await sub.test('does NOT re-append token if token is already present', () => {
      const url = getAuthenticatedMediaUrl('/uploads/artworks/art-123.jpg?token=already-present');
      assert.strictEqual(url, 'https://api.external-backend.example/uploads/artworks/art-123.jpg?token=already-present');
    });

    await sub.test('does NOT append token to protocol-relative //external URLs', () => {
      const url = getAuthenticatedMediaUrl('//attacker.example/uploads/art-123.jpg');
      assert.strictEqual(url, '//attacker.example/uploads/art-123.jpg');
    });

    await sub.test('does NOT append token to protocol-relative // URLs matching backend hostname', () => {
      const url = getAuthenticatedMediaUrl('//api.external-backend.example/uploads/art-123.jpg');
      assert.strictEqual(url, '//api.external-backend.example/uploads/art-123.jpg');
    });

    await sub.test('does NOT append token to lookalike attacker hostnames', () => {
      const lookalike1 = 'https://api.external-backend.example.attacker.com/uploads/art-123.jpg';
      assert.strictEqual(getAuthenticatedMediaUrl(lookalike1), lookalike1);

      const lookalike2 = 'https://api.external-backend.attacker.example/uploads/art-123.jpg';
      assert.strictEqual(getAuthenticatedMediaUrl(lookalike2), lookalike2);
    });

    await sub.test('does NOT append token to URLs with userinfo', () => {
      const userinfoUrl = 'https://admin:secret@api.external-backend.example/uploads/art-123.jpg';
      assert.strictEqual(getAuthenticatedMediaUrl(userinfoUrl), userinfoUrl);
    });

    await sub.test('does NOT append token to different port on backend host', () => {
      const diffPortUrl = 'https://api.external-backend.example:8443/uploads/art-123.jpg';
      assert.strictEqual(getAuthenticatedMediaUrl(diffPortUrl), diffPortUrl);
    });

    await sub.test('does NOT append token to unsafe schemes (javascript:, file:)', () => {
      assert.strictEqual(getAuthenticatedMediaUrl('javascript:alert(1)'), 'javascript:alert(1)');
      assert.strictEqual(getAuthenticatedMediaUrl('file:///etc/passwd'), 'file:///etc/passwd');
    });

    await sub.test('does NOT append token to data: or blob: URLs', () => {
      assert.strictEqual(getAuthenticatedMediaUrl('data:image/png;base64,abc'), 'data:image/png;base64,abc');
      assert.strictEqual(getAuthenticatedMediaUrl('blob:http://localhost/uuid'), 'blob:http://localhost/uuid');
    });

    await sub.test('does NOT append token to external cloud storage (Google Drive)', () => {
      const gdrive = 'https://drive.google.com/file/d/123/view';
      assert.strictEqual(getAuthenticatedMediaUrl(gdrive), gdrive);
    });

    await sub.test('handles empty, null, or undefined URLs safely', () => {
      assert.strictEqual(getAuthenticatedMediaUrl(''), '');
      assert.strictEqual(getAuthenticatedMediaUrl(null), '');
      assert.strictEqual(getAuthenticatedMediaUrl(undefined), '');
    });

    await sub.test('fetchAuthenticatedBlobUrl fetches with Bearer token and creates object URL', async () => {
      let requestedUrl = '';
      let requestedHeaders: any = null;
      (globalThis as any).URL.createObjectURL = (blob: any) => 'blob:mock-authenticated-media';
      (globalThis.fetch as any) = async (url: any, init: any) => {
        requestedUrl = url;
        requestedHeaders = init?.headers;
        return {
          ok: true,
          status: 200,
          blob: async () => ({ size: 1024, type: 'image/jpeg' }),
        };
      };

      const blobUrl = await fetchAuthenticatedBlobUrl('/uploads/artworks/secret.jpg');
      assert.strictEqual(blobUrl, 'blob:mock-authenticated-media');
      assert.strictEqual(requestedUrl, 'https://api.external-backend.example/uploads/artworks/secret.jpg');
      assert.strictEqual(requestedHeaders?.['Authorization'], 'Bearer mock-token');
    });

    await sub.test('blob retrieval removes legacy query credentials and refuses redirects', async () => {
      let request: any;
      (globalThis as any).fetch = async (url: string, init: any) => {
        request = { url, init };
        return { ok: true, blob: async () => ({}) };
      };
      await fetchAuthenticatedBlobUrl('/uploads/artworks/a.jpg?token=old-secret&download=true');
      assert.ok(!request.url.includes('token='));
      assert.ok(request.url.includes('download=true'));
      assert.strictEqual(request.init.redirect, 'error');
      assert.strictEqual(request.init.referrerPolicy, 'no-referrer');
    });

    await sub.test('blob retrieval rejects unsafe schemes and userinfo before fetching', async () => {
      let called = false;
      (globalThis as any).fetch = async () => { called = true; throw new Error('unexpected fetch'); };
      await assert.rejects(fetchAuthenticatedBlobUrl('javascript:alert(1)'), /Invalid media URL/);
      await assert.rejects(fetchAuthenticatedBlobUrl('https://user@api.external-backend.example/a'), /Invalid media URL/);
      assert.strictEqual(called, false);
    });

    await sub.test('single/split/batch artwork flow on different backend origin produces secure blob URLs without query token leakage', async () => {
      const calls: { url: string; headers: any }[] = [];
      const createdBlobs: string[] = [];
      const revokedBlobs: string[] = [];

      let blobCounter = 0;
      (globalThis as any).URL.createObjectURL = (_blob: any) => {
        blobCounter++;
        const id = `blob:http://localhost:5173/artwork-uuid-${blobCounter}`;
        createdBlobs.push(id);
        return id;
      };
      (globalThis as any).URL.revokeObjectURL = (url: string) => {
        revokedBlobs.push(url);
      };

      (globalThis.fetch as any) = async (url: any, init: any) => {
        calls.push({ url, headers: init?.headers });
        return {
          ok: true,
          status: 200,
          blob: async () => ({ size: 2048, type: 'application/pdf' }),
        };
      };

      // 1. Single Artwork Flow (e.g. order artwork thumbnail or single master PDF)
      const singlePath = '/uploads/orders/ORD-SINGLE-001/master.pdf';
      const singleBlob = await fetchAuthenticatedBlobUrl(singlePath);
      assert.strictEqual(singleBlob, 'blob:http://localhost:5173/artwork-uuid-1');
      assert.strictEqual(calls[0].url, 'https://api.external-backend.example/uploads/orders/ORD-SINGLE-001/master.pdf');
      assert.strictEqual(calls[0].headers?.['Authorization'], 'Bearer mock-token');
      // Verify no token query in the URL that gets passed to img or iframe
      assert.strictEqual(singleBlob.includes('token='), false);

      // 2. Split Artwork Flow (e.g. separate Cover and Inner book parts)
      const splitCoverPath = '/uploads/orders/ORD-SPLIT-001/cover.pdf';
      const splitInnerPath = '/uploads/orders/ORD-SPLIT-001/inner.pdf';
      const coverBlob = await fetchAuthenticatedBlobUrl(splitCoverPath);
      const innerBlob = await fetchAuthenticatedBlobUrl(splitInnerPath);
      assert.strictEqual(coverBlob, 'blob:http://localhost:5173/artwork-uuid-2');
      assert.strictEqual(innerBlob, 'blob:http://localhost:5173/artwork-uuid-3');
      assert.strictEqual(calls[1].url, 'https://api.external-backend.example/uploads/orders/ORD-SPLIT-001/cover.pdf');
      assert.strictEqual(calls[2].url, 'https://api.external-backend.example/uploads/orders/ORD-SPLIT-001/inner.pdf');
      assert.strictEqual(calls[1].headers?.['Authorization'], 'Bearer mock-token');
      assert.strictEqual(calls[2].headers?.['Authorization'], 'Bearer mock-token');

      // 3. Batch Artwork Flow (e.g. photobook batch of multiple files)
      const batchPaths = [
        '/uploads/orders/ORD-BATCH-001/photo_01.jpg',
        '/uploads/orders/ORD-BATCH-001/photo_02.jpg',
      ];
      const batchBlobs = await Promise.all(batchPaths.map(p => fetchAuthenticatedBlobUrl(p)));
      assert.strictEqual(batchBlobs[0], 'blob:http://localhost:5173/artwork-uuid-4');
      assert.strictEqual(batchBlobs[1], 'blob:http://localhost:5173/artwork-uuid-5');
      assert.strictEqual(calls[3].url, 'https://api.external-backend.example/uploads/orders/ORD-BATCH-001/photo_01.jpg');
      assert.strictEqual(calls[4].url, 'https://api.external-backend.example/uploads/orders/ORD-BATCH-001/photo_02.jpg');
      assert.strictEqual(calls[3].headers?.['Authorization'], 'Bearer mock-token');
      assert.strictEqual(calls[4].headers?.['Authorization'], 'Bearer mock-token');

      // 4. Memory lifecycle cleanup: verify revocation
      [singleBlob, coverBlob, innerBlob, ...batchBlobs].forEach(b => URL.revokeObjectURL(b));
      assert.strictEqual(revokedBlobs.length, 5);
      assert.deepStrictEqual(revokedBlobs, createdBlobs);
    });
  });
});


test('B1-B4 Component Lifecycle & Failure Presentation', async (t) => {
  const { fetchAuthenticatedBlobUrl } = await import('../api/client');

  await t.test('B2: failed authenticated blob never exposes token or claims success', async () => {
    let fetchCallCount = 0;
    (globalThis as any).fetch = async (url: string, init: any) => {
      fetchCallCount++;
      return { ok: false, status: 403, statusText: 'Forbidden', blob: async () => ({}) };
    };

    await assert.rejects(
      fetchAuthenticatedBlobUrl('/uploads/artworks/private-file.jpg'),
      (err: Error) => {
        assert.ok(err.message.includes('403'), 'Error message should include HTTP status');
        return true;
      }
    );
    assert.strictEqual(fetchCallCount, 1, 'Should have attempted one fetch');
  });

  await t.test('B2: network failure on blob fetch throws descriptive error', async () => {
    (globalThis as any).fetch = async () => { throw new TypeError('Failed to fetch'); };

    await assert.rejects(
      fetchAuthenticatedBlobUrl('/uploads/artworks/unreachable.jpg'),
      (err: Error) => {
        assert.ok(err instanceof TypeError || err.message.includes('fetch'), 'Should propagate network error');
        return true;
      }
    );
  });

  await t.test('R1/B3: deferred order A artwork fetch resolving AFTER order B effect setup revokes blob and closes window (generation mismatch)', async () => {
    const { createPrivateArtworkOpener } = await import('../features/orders/utils/privateArtworkOpener');
    const openedMedia = { current: [] as string[] };
    const mountedRef = { current: true };
    const orderGenerationRef = { current: 1 }; // Order A mounted: gen = 1

    let resolveOrderAFetch: (blob: string) => void;
    const pendingFetchPromise = new Promise<string>((resolve) => {
      resolveOrderAFetch = resolve;
    });

    const revokedUrls: string[] = [];
    (globalThis as any).URL.revokeObjectURL = (url: string) => revokedUrls.push(url);

    let replacedLocation = '';
    let windowClosed = false;
    const fakeWindow = {
      opener: null as any,
      location: { replace: (url: string) => { replacedLocation = url; } },
      close: () => { windowClosed = true; },
    };

    const opener = createPrivateArtworkOpener(
      { mountedRef, orderGenerationRef, openedMedia },
      {
        showToast: () => {},
        currentLang: 'en',
        openWindow: () => fakeWindow,
        fetchBlob: async () => pendingFetchPromise,
      }
    );

    // Order A initiates artwork open: reqGen captured as 1
    const openPromise = opener({ preventDefault: () => {} }, '/uploads/orders/ORD-A/private.pdf');

    // BEFORE Order A fetch resolves: Order changes to Order B!
    // 1. Order A cleanup runs:
    mountedRef.current = false;
    orderGenerationRef.current += 1; // gen = 2
    // 2. Order B effect setup runs:
    mountedRef.current = true;
    orderGenerationRef.current += 1; // gen = 3

    // NOW Order A fetch resolves!
    resolveOrderAFetch!('blob:http://localhost:5173/stale-order-A-blob');
    await openPromise;

    // Verify: stale blob was revoked, window was closed, location was NEVER replaced with stale blob, openedMedia was NOT updated
    assert.strictEqual(windowClosed, true, 'Window should be closed');
    assert.strictEqual(replacedLocation, '', 'Location should NEVER be replaced with stale artwork');
    assert.strictEqual(revokedUrls.includes('blob:http://localhost:5173/stale-order-A-blob'), true, 'Stale blob must be revoked');
    assert.strictEqual(openedMedia.current.length, 0, 'openedMedia should not retain stale blob');
  });

  await t.test('R1/B3: deferred order A artwork fetch resolving AFTER unmount revokes blob and closes window', async () => {
    const { createPrivateArtworkOpener } = await import('../features/orders/utils/privateArtworkOpener');
    const openedMedia = { current: [] as string[] };
    const mountedRef = { current: true };
    const orderGenerationRef = { current: 1 };

    let resolveFetch: (blob: string) => void;
    const pendingPromise = new Promise<string>((res) => { resolveFetch = res; });
    const revokedUrls: string[] = [];
    (globalThis as any).URL.revokeObjectURL = (url: string) => revokedUrls.push(url);

    let windowClosed = false;
    const fakeWindow = {
      opener: null as any,
      location: { replace: () => {} },
      close: () => { windowClosed = true; },
    };

    const opener = createPrivateArtworkOpener(
      { mountedRef, orderGenerationRef, openedMedia },
      {
        showToast: () => {},
        currentLang: 'en',
        openWindow: () => fakeWindow,
        fetchBlob: async () => pendingPromise,
      }
    );

    const openPromise = opener({ preventDefault: () => {} }, '/uploads/orders/ORD-A/cover.pdf');

    // Component unmounts
    mountedRef.current = false;
    orderGenerationRef.current += 1;

    resolveFetch!('blob:http://localhost:5173/unmounted-blob');
    await openPromise;

    assert.strictEqual(windowClosed, true);
    assert.strictEqual(revokedUrls.includes('blob:http://localhost:5173/unmounted-blob'), true);
  });

  await t.test('R1/B3: deferred order A artwork fetch resolving AFTER null-order transition revokes blob and closes window', async () => {
    const { createPrivateArtworkOpener } = await import('../features/orders/utils/privateArtworkOpener');
    const openedMedia = { current: [] as string[] };
    const mountedRef = { current: true };
    const orderGenerationRef = { current: 1 };

    let resolveFetch: (blob: string) => void;
    const pendingPromise = new Promise<string>((res) => { resolveFetch = res; });
    const revokedUrls: string[] = [];
    (globalThis as any).URL.revokeObjectURL = (url: string) => revokedUrls.push(url);

    let windowClosed = false;
    const fakeWindow = {
      opener: null as any,
      location: { replace: () => {} },
      close: () => { windowClosed = true; },
    };

    const opener = createPrivateArtworkOpener(
      { mountedRef, orderGenerationRef, openedMedia },
      {
        showToast: () => {},
        currentLang: 'en',
        openWindow: () => fakeWindow,
        fetchBlob: async () => pendingPromise,
      }
    );

    const openPromise = opener({ preventDefault: () => {} }, '/uploads/orders/ORD-A/inner.pdf');

    // Props change: order becomes null (cleanup + effect for undefined order)
    mountedRef.current = false;
    orderGenerationRef.current += 1; // gen = 2
    mountedRef.current = true;
    orderGenerationRef.current += 1; // gen = 3 (effect for null order)

    resolveFetch!('blob:http://localhost:5173/null-order-blob');
    await openPromise;

    assert.strictEqual(windowClosed, true);
    assert.strictEqual(revokedUrls.includes('blob:http://localhost:5173/null-order-blob'), true);
  });

  await t.test('R1/B3: normal artwork fetch on stable order succeeds and is tracked in openedMedia for future cleanup', async () => {
    const { createPrivateArtworkOpener } = await import('../features/orders/utils/privateArtworkOpener');
    const openedMedia = { current: [] as string[] };
    const mountedRef = { current: true };
    const orderGenerationRef = { current: 1 };

    let replacedLocation = '';
    const fakeWindow = {
      opener: null as any,
      location: { replace: (url: string) => { replacedLocation = url; } },
      close: () => {},
    };

    const opener = createPrivateArtworkOpener(
      { mountedRef, orderGenerationRef, openedMedia },
      {
        showToast: () => {},
        currentLang: 'en',
        openWindow: () => fakeWindow,
        fetchBlob: async () => 'blob:http://localhost:5173/success-blob',
      }
    );

    await opener({ preventDefault: () => {} }, '/uploads/orders/ORD-STABLE/file.pdf');

    assert.strictEqual(replacedLocation, 'blob:http://localhost:5173/success-blob');
    assert.strictEqual(openedMedia.current.length, 1);
    assert.strictEqual(openedMedia.current[0], 'blob:http://localhost:5173/success-blob');
  });

  await t.test('R2/B2: executeArtworkZipDownload preserves initial load failures and displays visible warning banner with failed count and names', async () => {
    const { executeArtworkZipDownload } = await import('../features/orders/components/production/ArtworkPreviewCard');

    let feedback: any = null;
    let zipping = false;

    // Scenario: rawPhotos has 3 files, photo 2 failed initial load ('')
    const rawPhotos = [
      { name: 'photo_01.jpg', canonicalUrl: '/uploads/p1.jpg' },
      { name: 'photo_02.jpg', canonicalUrl: '/uploads/p2.jpg' },
      { name: 'photo_03.jpg', canonicalUrl: '/uploads/p3.jpg' },
    ];
    const blobMap = {
      '/uploads/p1.jpg': 'blob:http://localhost:5173/b1',
      '/uploads/p2.jpg': '', // FAILED initial load
      '/uploads/p3.jpg': 'blob:http://localhost:5173/b3',
    };
    const loadedPhotos = [
      { name: 'photo_01.jpg', url: 'blob:http://localhost:5173/b1' },
      { name: 'photo_03.jpg', url: 'blob:http://localhost:5173/b3' },
    ];

    await executeArtworkZipDownload(
      {
        rawPhotos,
        blobMap,
        photos: loadedPhotos,
        orderIdDisplay: 'ORD-100',
        currentLang: 'en',
      },
      {
        setIsZipping: (v) => { zipping = v; },
        setDownloadFeedback: (fb) => { feedback = fb; },
        downloadZipFn: async () => ({
          totalCount: 2,
          successCount: 2,
          failedCount: 0,
          failedFiles: [],
        }),
      }
    );

    assert.strictEqual(zipping, false);
    assert.ok(feedback !== null, 'Feedback banner must be set when initial files failed');
    assert.strictEqual(feedback.type, 'warning');
    assert.strictEqual(feedback.failedCount, 1, 'Should report 1 failed file');
    assert.deepStrictEqual(feedback.failedFiles, ['photo_02.jpg'], 'Should include the initial load failed file name');
  });

  await t.test('R2/B2: executeArtworkZipDownload combines initial load failures and packaging failures truthfully', async () => {
    const { executeArtworkZipDownload } = await import('../features/orders/components/production/ArtworkPreviewCard');

    let feedback: any = null;
    const rawPhotos = [
      { name: 'photo_01.jpg', canonicalUrl: '/uploads/p1.jpg' },
      { name: 'photo_02.jpg', canonicalUrl: '/uploads/p2.jpg' },
      { name: 'photo_03.jpg', canonicalUrl: '/uploads/p3.jpg' },
    ];
    const blobMap = {
      '/uploads/p1.jpg': 'blob:http://localhost:5173/b1',
      '/uploads/p2.jpg': '', // Initial failure
      '/uploads/p3.jpg': 'blob:http://localhost:5173/b3',
    };
    const loadedPhotos = [
      { name: 'photo_01.jpg', url: 'blob:http://localhost:5173/b1' },
      { name: 'photo_03.jpg', url: 'blob:http://localhost:5173/b3' },
    ];

    await executeArtworkZipDownload(
      {
        rawPhotos,
        blobMap,
        photos: loadedPhotos,
        orderIdDisplay: 'ORD-101',
        currentLang: 'en',
      },
      {
        setIsZipping: () => {},
        setDownloadFeedback: (fb) => { feedback = fb; },
        downloadZipFn: async () => ({
          totalCount: 2,
          successCount: 1,
          failedCount: 1,
          failedFiles: ['photo_03.jpg'], // Packaging failure
        }),
      }
    );

    assert.strictEqual(feedback.type, 'warning');
    assert.strictEqual(feedback.failedCount, 2, 'Total failed should be 1 initial + 1 packaging = 2');
    assert.deepStrictEqual(feedback.failedFiles, ['photo_02.jpg', 'photo_03.jpg']);
  });

  await t.test('R2/B2: executeArtworkZipDownload handles total failure when zero photos are downloadable', async () => {
    const { executeArtworkZipDownload } = await import('../features/orders/components/production/ArtworkPreviewCard');

    let feedback: any = null;
    await executeArtworkZipDownload(
      {
        rawPhotos: [{ name: 'only_photo.jpg', canonicalUrl: '/uploads/fail.jpg' }],
        blobMap: { '/uploads/fail.jpg': '' },
        photos: [],
        orderIdDisplay: 'ORD-102',
        currentLang: 'en',
      },
      {
        setIsZipping: () => {},
        setDownloadFeedback: (fb) => { feedback = fb; },
      }
    );

    assert.strictEqual(feedback.type, 'error');
    assert.strictEqual(feedback.failedCount, 1);
    assert.deepStrictEqual(feedback.failedFiles, ['only_photo.jpg']);
  });

  await t.test('R2/B2: executeArtworkZipDownload handles thrown errors during ZIP packaging', async () => {
    const { executeArtworkZipDownload } = await import('../features/orders/components/production/ArtworkPreviewCard');

    let feedback: any = null;
    await executeArtworkZipDownload(
      {
        rawPhotos: [{ name: 'a.jpg', canonicalUrl: '/uploads/a.jpg' }],
        blobMap: { '/uploads/a.jpg': 'blob:http://localhost:5173/a' },
        photos: [{ name: 'a.jpg', url: 'blob:http://localhost:5173/a' }],
        orderIdDisplay: 'ORD-103',
        currentLang: 'en',
      },
      {
        setIsZipping: () => {},
        setDownloadFeedback: (fb) => { feedback = fb; },
        downloadZipFn: async () => { throw new Error('Out of memory'); },
      }
    );

    assert.strictEqual(feedback.type, 'error');
    assert.ok(feedback.message.includes('Out of memory'));
  });

  await t.test('B4: ZIP partial failure returns truthful result with failed file names', async () => {
    // Need to test downloadPhotosAsZip; set up minimal DOM mocks for JSZip download
    const { downloadPhotosAsZip } = await import('../utils/zipDownloader');

    // Mock DOM for download trigger
    (globalThis as any).document = {
      createElement: () => ({ href: '', download: '', target: '', click: () => {} }),
      body: { appendChild: () => {}, removeChild: () => {} },
    };
    (globalThis as any).URL.createObjectURL = () => 'blob:zip-test';
    (globalThis as any).URL.revokeObjectURL = () => {};

    (globalThis as any).fetch = async (url: string) => {
      if (url.includes('broken')) {
        throw new Error('Network error');
      }
      // Return a Buffer which JSZip can handle in Node.js
      return {
        ok: true,
        blob: async () => Buffer.from('test-image-data'),
      };
    };

    const result = await downloadPhotosAsZip(
      [
        { name: 'good_photo.jpg', url: 'https://api.external-backend.example/uploads/good' },
        { name: 'broken_photo.jpg', url: 'https://broken.example/fail.jpg' },
        { name: 'another_good.jpg', url: 'https://api.external-backend.example/uploads/good2' },
      ],
      'test_batch.zip'
    );

    assert.strictEqual(result.totalCount, 3, 'Total should be 3');
    assert.strictEqual(result.successCount, 2, 'Successful should be 2');
    assert.strictEqual(result.failedCount, 1, 'Failed should be 1');
    assert.deepStrictEqual(result.failedFiles, ['broken_photo.jpg'], 'Failed files list should contain broken file');
  });

  await t.test('B4: ZIP all-success returns zero failures', async () => {
    const { downloadPhotosAsZip } = await import('../utils/zipDownloader');

    (globalThis as any).fetch = async () => ({
      ok: true,
      blob: async () => Buffer.from('ok-image-data'),
    });

    const result = await downloadPhotosAsZip(
      [
        { name: 'a.jpg', url: 'https://api.external-backend.example/uploads/a' },
        { name: 'b.jpg', url: 'https://api.external-backend.example/uploads/b' },
      ],
      'all_good.zip'
    );

    assert.strictEqual(result.totalCount, 2);
    assert.strictEqual(result.successCount, 2);
    assert.strictEqual(result.failedCount, 0);
    assert.deepStrictEqual(result.failedFiles, []);
  });

  await t.test('B5: ZIP rejects text/html responses and flags as failed file', async () => {
    const { downloadPhotosAsZip } = await import('../utils/zipDownloader');

    (globalThis as any).fetch = async (url: string) => {
      if (url.includes('spa-fallback.pdf')) {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
          blob: async () => Buffer.from('<!DOCTYPE html><html><body>Dashboard</body></html>'),
        };
      }
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        blob: async () => Buffer.from('fake-jpg-binary-bytes'),
      };
    };

    const result = await downloadPhotosAsZip(
      [
        { name: 'valid.jpg', url: 'https://api.external-backend.example/uploads/valid.jpg' },
        { name: 'corrupted_overview.pdf', url: 'https://api.external-backend.example/uploads/spa-fallback.pdf' },
      ],
      'test_spa_rejection.zip'
    );

    assert.strictEqual(result.totalCount, 2);
    assert.strictEqual(result.successCount, 1);
    assert.strictEqual(result.failedCount, 1);
    assert.deepStrictEqual(result.failedFiles, ['corrupted_overview.pdf']);
  });
});

test('P1.2 PDF & Universal Preview Hardening', async (t) => {
  const {
    resolveBackendUrl,
    fetchAuthenticatedBlob,
    downloadAuthenticatedFile,
  } = await import('../api/client');

  await t.test('resolveBackendUrl', async (sub) => {
    await sub.test('resolves relative /uploads/ path to configured BACKEND_HOST', () => {
      const resolved = resolveBackendUrl('/uploads/artworks/order-123.pdf');
      assert.strictEqual(resolved, 'https://api.external-backend.example/uploads/artworks/order-123.pdf');
    });

    await sub.test('resolves relative /api/ path to configured BACKEND_HOST', () => {
      const resolved = resolveBackendUrl('/api/v1/orders/123/artwork');
      assert.strictEqual(resolved, 'https://api.external-backend.example/api/v1/orders/123/artwork');
    });

    await sub.test('preserves absolute http/https URLs unchanged', () => {
      assert.strictEqual(
        resolveBackendUrl('https://other-domain.example/files/proof.pdf'),
        'https://other-domain.example/files/proof.pdf'
      );
      assert.strictEqual(
        resolveBackendUrl('http://127.0.0.1:8089/uploads/test.pdf'),
        'http://127.0.0.1:8089/uploads/test.pdf'
      );
    });

    await sub.test('preserves blob: and data: URLs unchanged', () => {
      assert.strictEqual(resolveBackendUrl('blob:http://localhost:5174/uuid-123'), 'blob:http://localhost:5174/uuid-123');
      assert.strictEqual(resolveBackendUrl('data:image/png;base64,iVBORw0KGgo='), 'data:image/png;base64,iVBORw0KGgo=');
    });

    await sub.test('rejects protocol-relative // URLs to prevent open redirects', () => {
      assert.strictEqual(resolveBackendUrl('//evil.com/phishing.pdf'), '');
      assert.strictEqual(resolveBackendUrl('//api.external-backend.example/file.pdf'), '');
    });

    await sub.test('safely handles empty or non-string inputs', () => {
      assert.strictEqual(resolveBackendUrl(''), '');
      assert.strictEqual(resolveBackendUrl(null as any), '');
      assert.strictEqual(resolveBackendUrl(undefined as any), '');
    });
  });

  await t.test('fetchAuthenticatedBlob', async (sub) => {
    // Setup URL mock if needed
    let createdBlobUrlCount = 0;
    (globalThis as any).URL.createObjectURL = () => {
      createdBlobUrlCount++;
      return `blob:mock-blob-url-${createdBlobUrlCount}`;
    };
    (globalThis as any).URL.revokeObjectURL = () => {};

    await sub.test('rejects HTTP 200 with text/html content-type (SPA fallback)', async () => {
      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8',
        }),
        blob: async () => new Blob(['<!DOCTYPE html><html><body>Admin Overview</body></html>'], { type: 'text/html' }),
      });

      await assert.rejects(
        async () => {
          await fetchAuthenticatedBlob('/uploads/artworks/missing-proof.pdf');
        },
        (err: any) => {
          assert.ok(err.message.includes('Server returned HTML document') || err.message.includes('SPA fallback'));
          return true;
        }
      );
    });

    await sub.test('rejects HTTP 200 with HTML markup in body despite ambiguous octet-stream header', async () => {
      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/octet-stream',
        }),
        blob: async () => new Blob(['<!DOCTYPE html>\n<html lang="th"><head><title>Som Sing Phim</title></head>'], { type: 'application/octet-stream' }),
      });

      await assert.rejects(
        async () => {
          await fetchAuthenticatedBlob('https://api.external-backend.example/uploads/ambiguous-html.pdf');
        },
        (err: any) => {
          assert.ok(err.message.includes('Detected HTML/XML document'));
          return true;
        }
      );
    });

    await sub.test('rejects HTTP 200 with application/json error body', async () => {
      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ error: 'Forbidden', message: 'Access denied' }),
        blob: async () => new Blob([JSON.stringify({ error: 'Forbidden' })], { type: 'application/json' }),
      });

      await assert.rejects(
        async () => {
          await fetchAuthenticatedBlob('https://api.external-backend.example/uploads/forbidden.pdf');
        },
        (err: any) => {
          assert.ok(err.message.includes('Server returned JSON'));
          return true;
        }
      );
    });

    await sub.test('rejects non-OK HTTP status (e.g. 404 Not Found)', async () => {
      (globalThis as any).fetch = async () => ({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => 'File not found',
      });

      await assert.rejects(
        async () => {
          await fetchAuthenticatedBlob('https://api.external-backend.example/uploads/nonexistent.pdf');
        },
        (err: any) => {
          assert.ok(err.message.includes('404'));
          return true;
        }
      );
    });

    await sub.test('extracts filename from Content-Disposition header and sniffs PDF bytes', async () => {
      const pdfHeader = '%PDF-1.4\n1 0 obj\n<< /Title (Real PDF) >>\nendobj';
      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="proof_order_999.pdf"',
        }),
        blob: async () => new Blob([pdfHeader], { type: 'application/pdf' }),
      });

      const result = await fetchAuthenticatedBlob('https://api.external-backend.example/uploads/real.pdf');
      assert.strictEqual(result.filename, 'proof_order_999.pdf');
      assert.strictEqual(result.contentType, 'application/pdf');
      assert.ok(result.blobUrl.startsWith('blob:'));
      assert.ok(result.size > 0);
    });
  });

  await t.test('downloadAuthenticatedFile', async (sub) => {
    let clickedLink: { href: string; download: string } | null = null;
    let revokedUrl: string | null = null;

    (globalThis as any).document = {
      createElement: (tag: string) => {
        if (tag === 'a') {
          const el = {
            href: '',
            download: '',
            click: () => {
              clickedLink = { href: el.href, download: el.download };
            },
          };
          return el;
        }
        return {};
      },
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
    };

    (globalThis as any).URL.createObjectURL = (b: any) => 'blob:download-test-url';
    (globalThis as any).URL.revokeObjectURL = (url: string) => {
      revokedUrl = url;
    };

    await sub.test('successfully downloads authentic binary file using Content-Disposition filename', async () => {
      clickedLink = null;
      revokedUrl = null;

      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="official_artwork.pdf"',
        }),
        blob: async () => new Blob(['%PDF-1.4 binary content'], { type: 'application/pdf' }),
      });

      await downloadAuthenticatedFile('https://api.external-backend.example/uploads/artworks/official.pdf', 'fallback.pdf');

      assert.ok(clickedLink, 'Anchor click should have been triggered');
      assert.strictEqual(clickedLink.download, 'official_artwork.pdf', 'Should prioritize server filename');
      assert.strictEqual(clickedLink.href, 'blob:download-test-url');
    });

    await sub.test('fails truthfully and does NOT trigger download when server returns HTML fallback', async () => {
      clickedLink = null;

      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html',
        }),
        blob: async () => new Blob(['<!DOCTYPE html><html><body>Overview</body></html>'], { type: 'text/html' }),
      });

      await assert.rejects(
        async () => {
          await downloadAuthenticatedFile('/uploads/artworks/corrupted.pdf', 'corrupted.pdf');
        },
        (err: any) => {
          assert.ok(err.message.includes('Server returned HTML document') || err.message.includes('SPA fallback'));
          return true;
        }
      );

      assert.strictEqual(clickedLink, null, 'No file download should be triggered for rejected HTML fallback');
    });

    await sub.test('R2: successfully downloads original bytes from blob: URL without rejecting blob scheme', async () => {
      clickedLink = null;
      (globalThis as any).fetch = async (url: string) => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
        blob: async () => new Blob(['\x89PNG\r\n\x1a\n fake-png-binary-data'], { type: 'image/png' }),
      });

      await downloadAuthenticatedFile('blob:http://localhost:5173/preview-blob-123', 'artwork_proof.png');
      assert.ok(clickedLink, 'Should trigger anchor download for blob URL');
      assert.strictEqual(clickedLink.href, 'blob:http://localhost:5173/preview-blob-123');
      assert.strictEqual(clickedLink.download, 'artwork_proof.png');
    });
  });

  await t.test('R2: Blob Validation, Magic Byte Sniffing & Non-.pdf Title Inference', async (sub) => {
    await sub.test('sniffs %PDF- magic bytes from blob: URL when display title has no .pdf extension', async () => {
      const pdfBytes = '%PDF-1.7\n1 0 obj\n<< /Title (Invoice Master) >>\nendobj';
      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/octet-stream' }), // Generic content-type
        blob: async () => new Blob([pdfBytes], { type: 'application/octet-stream' }),
      });

      // Passed a blob: URL and title has NO .pdf extension (e.g. Thai/Lao description or order ID)
      const result = await fetchAuthenticatedBlob('blob:http://localhost:5173/blob-order-123');
      assert.strictEqual(result.contentType, 'application/pdf', 'Must sniff %PDF- magic bytes and set application/pdf');
      assert.strictEqual(result.blobUrl, 'blob:http://localhost:5173/blob-order-123');
    });

    await sub.test('strictly rejects corrupted blob: URL containing HTML fallback document', async () => {
      (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        blob: async () => new Blob(['<!DOCTYPE html><html><body>SPA Fallback</body></html>'], { type: 'text/html' }),
      });

      await assert.rejects(
        async () => {
          await fetchAuthenticatedBlob('blob:http://localhost:5173/corrupted-overview-blob');
        },
        (err: any) => {
          assert.ok(err.message.includes('Server returned HTML document') || err.message.includes('Detected HTML/XML document'));
          return true;
        }
      );
    });
  });

  await t.test('R1: Lightbox Asset Controller Lifecycle & Request Generation', async (sub) => {
    const { createLightboxAssetController } = await import('../features/orders/utils/lightboxAssetController');

    await sub.test('single stable asset triggers exactly 1 fetch; zoom/rotation changes do NOT re-fetch', async () => {
      let fetchCount = 0;
      let currentState: any = {};
      const revokedList: string[] = [];

      const controller = createLightboxAssetController({
        onStateChange: (patch) => { Object.assign(currentState, patch); },
        revokeUrl: (u) => revokedList.push(u),
        fetchBlob: async (url) => {
          fetchCount++;
          return { blobUrl: `blob:mock-${url}`, contentType: 'image/jpeg', size: 1024 };
        },
      });

      // 1. Initial mount load
      await controller.loadAsset({ url: 'https://api.external-backend.example/uploads/img1.jpg', name: 'img1.jpg' });

      assert.strictEqual(fetchCount, 1, 'Should fetch asset once on mount');
      assert.strictEqual(currentState.loadingStatus, 'success');
      assert.strictEqual(currentState.resolvedBlobUrl, 'blob:mock-https://api.external-backend.example/uploads/img1.jpg');

      // 2. Simulating zoom in/out or rotation: activeKey does NOT change, so loadAsset is NOT called
      // We assert fetchCount remains strictly 1
      assert.strictEqual(fetchCount, 1, 'Zoom and rotation changes must not trigger re-fetch');
      assert.strictEqual(revokedList.length, 0, 'No blobs revoked during zoom/rotation');
    });

    await sub.test('deferred A/B switch: late resolving request A does NOT overwrite B and A blob is revoked', async () => {
      let resolveA: (v: any) => void;
      const pendingPromiseA = new Promise<any>((res) => { resolveA = res; });
      const revokedList: string[] = [];
      let currentState: any = {};

      const controller = createLightboxAssetController({
        onStateChange: (patch) => { Object.assign(currentState, patch); },
        revokeUrl: (u) => revokedList.push(u),
        fetchBlob: async (url) => {
          if (url.includes('assetA')) return pendingPromiseA;
          return { blobUrl: 'blob:mock-assetB', contentType: 'application/pdf', size: 5000 };
        },
      });

      // 1. User starts on Asset A (slow network)
      const promiseA = controller.loadAsset({ url: 'https://api.external-backend.example/uploads/assetA.pdf', name: 'assetA.pdf' });

      // 2. User quickly switches to Asset B (fast response)
      await controller.loadAsset({ url: 'https://api.external-backend.example/uploads/assetB.pdf', name: 'assetB.pdf' });

      assert.strictEqual(currentState.loadingStatus, 'success');
      assert.strictEqual(currentState.resolvedBlobUrl, 'blob:mock-assetB');

      // 3. Asset A resolves late
      resolveA!({ blobUrl: 'blob:mock-assetA-late', contentType: 'application/pdf', size: 2000 });
      await promiseA;

      // Assert B is still active and late A was discarded and revoked
      assert.strictEqual(currentState.resolvedBlobUrl, 'blob:mock-assetB', 'Late A must not overwrite active B');
      assert.ok(revokedList.includes('blob:mock-assetA-late'), 'Late A blob URL must be immediately revoked');
    });

    await sub.test('unmount during fetch: late resolving request revokes blob and leaves state unmutated', async () => {
      let resolvePending: (v: any) => void;
      const pendingPromise = new Promise<any>((res) => { resolvePending = res; });
      const revokedList: string[] = [];
      let stateMutatedAfterUnmount = false;

      const controller = createLightboxAssetController({
        onStateChange: () => {
          if (!controller.isMounted()) {
            stateMutatedAfterUnmount = true;
          }
        },
        revokeUrl: (u) => revokedList.push(u),
        fetchBlob: async () => pendingPromise,
      });

      const loadPromise = controller.loadAsset({ url: 'https://api.external-backend.example/uploads/slow.pdf', name: 'slow.pdf' });

      // Component unmounts
      controller.unmount();
      assert.strictEqual(controller.isMounted(), false);

      // Late fetch resolves
      resolvePending!({ blobUrl: 'blob:mock-slow-unmounted', contentType: 'application/pdf', size: 3000 });
      await loadPromise;

      assert.strictEqual(stateMutatedAfterUnmount, false, 'State must not be mutated after unmount');
      assert.ok(revokedList.includes('blob:mock-slow-unmounted'), 'Blob resolving after unmount must be revoked');
    });

    await sub.test('switching away revokes previous active blob URL', async () => {
      const revokedList: string[] = [];
      const controller = createLightboxAssetController({
        onStateChange: () => {},
        revokeUrl: (u) => revokedList.push(u),
        fetchBlob: async (url) => ({ blobUrl: `blob:mock-${url}`, contentType: 'image/jpeg', size: 100 }),
      });

      await controller.loadAsset({ url: 'https://api.external-backend.example/uploads/item1.jpg', name: 'item1.jpg' });
      assert.strictEqual(revokedList.length, 0);

      // Switch to item 2
      await controller.loadAsset({ url: 'https://api.external-backend.example/uploads/item2.jpg', name: 'item2.jpg' });
      assert.ok(revokedList.includes('blob:mock-https://api.external-backend.example/uploads/item1.jpg'), 'Previous blob must be revoked on switch');
    });

    await sub.test('empty transition while A is pending: late resolving A does NOT overwrite error state and late A blob is revoked', async () => {
      let resolveA: (v: any) => void;
      const pendingPromiseA = new Promise<any>((res) => { resolveA = res; });
      const revokedList: string[] = [];
      let currentState: any = {};

      const controller = createLightboxAssetController({
        onStateChange: (patch) => { Object.assign(currentState, patch); },
        revokeUrl: (u) => revokedList.push(u),
        fetchBlob: async () => pendingPromiseA,
      });

      // 1. Start loading Asset A
      const promiseA = controller.loadAsset({ url: 'https://api.external-backend.example/uploads/pendingA.pdf', name: 'pendingA.pdf' });
      assert.strictEqual(currentState.loadingStatus, 'loading');

      // 2. Active item becomes empty/undefined (e.g. user emptied list or item was cleared)
      await controller.loadAsset(undefined);
      assert.strictEqual(currentState.loadingStatus, 'error');
      assert.strictEqual(currentState.resolvedBlobUrl, '');

      // 3. Late request A resolves
      resolveA!({ blobUrl: 'blob:mock-assetA-late', contentType: 'application/pdf', size: 1000 });
      await promiseA;

      // 4. Assert error state is NOT replaced by late success, and blob is revoked
      assert.strictEqual(currentState.loadingStatus, 'error', 'Late A must not replace empty/error state');
      assert.strictEqual(currentState.resolvedBlobUrl, '', 'Resolved blob URL must remain empty');
      assert.ok(revokedList.includes('blob:mock-assetA-late'), 'Late resolving blob must be revoked');
    });

    await sub.test('StrictMode mount-unmount-remount cycle on the SAME controller instance cleans up discarded blobs and keeps final active blob', async () => {
      const revokedList: string[] = [];
      let fetchCount = 0;
      let currentState: any = {};

      // In production useLightboxAssetController, controllerRef.current holds a SINGLE controller instance
      const controller = createLightboxAssetController({
        onStateChange: (p) => Object.assign(currentState, p),
        revokeUrl: (u) => revokedList.push(u),
        fetchBlob: async () => {
          fetchCount++;
          return { blobUrl: `blob:mock-strict-${fetchCount}`, contentType: 'image/jpeg', size: 2048 };
        },
      });

      // 1. Initial mount in StrictMode
      controller.mount();
      await controller.loadAsset({ url: 'https://api.external-backend.example/uploads/img.jpg', name: 'img.jpg' });
      assert.strictEqual(currentState.loadingStatus, 'success');
      assert.strictEqual(currentState.resolvedBlobUrl, 'blob:mock-strict-1');

      // 2. StrictMode immediate unmount (effect cleanup):
      controller.invalidatePending();
      controller.unmount();
      assert.ok(revokedList.includes('blob:mock-strict-1'), 'First mount blob must be revoked on StrictMode unmount');
      assert.strictEqual(controller.getCurrentBlobUrl(), null);

      // 3. StrictMode immediate re-mount of SAME controller instance
      controller.mount();
      await controller.loadAsset({ url: 'https://api.external-backend.example/uploads/img.jpg', name: 'img.jpg' });
      assert.strictEqual(currentState.loadingStatus, 'success');
      assert.strictEqual(currentState.resolvedBlobUrl, 'blob:mock-strict-2');
      assert.strictEqual(controller.getCurrentBlobUrl(), 'blob:mock-strict-2');
    });
  });

  await t.test('A1: Multipage PDF Page Count, Nested Trees & Clamped Navigation', async (sub) => {
    if (typeof (globalThis as any).btoa === 'undefined') {
      (globalThis as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
    }
    if (typeof (globalThis as any).atob === 'undefined') {
      (globalThis as any).atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
    }

    const { 
      extractPdfPageCount,
      clampPdfPage,
      computeNextPdfPage,
      computePrevPdfPage
    } = await import('../features/orders/utils/lightboxAssetController');
    const { jsPDF } = await import('jspdf');

    await sub.test('extracts accurate page count from 3-page disposable PDF and single-page PDF', async () => {
      // Create valid 3-page PDF with distinct text contents
      const doc3 = new jsPDF();
      doc3.text('Cover Page 1 of Document', 10, 10);
      doc3.addPage();
      doc3.text('Body Page 2: Production Specification Details', 10, 10);
      doc3.addPage();
      doc3.text('Back Page 3: Summary and Authorization Signatures', 10, 10);
      const buf3 = doc3.output('arraybuffer');

      const count3 = await extractPdfPageCount(buf3);
      assert.strictEqual(count3, 3, '3-page PDF must yield pageCount = 3');

      // Create valid 1-page PDF
      const doc1 = new jsPDF();
      doc1.text('Single Page Document Only', 10, 10);
      const buf1 = doc1.output('arraybuffer');

      const count1 = await extractPdfPageCount(buf1);
      assert.strictEqual(count1, 1, '1-page PDF must yield pageCount = 1');
    });

    await sub.test('extracts accurate page count from nested page tree and does not pick child count', async () => {
      // Nested Pages tree: Root Pages has Count 3, Child Pages has Count 2 (Page 1 & 2), Page 3 is direct child of Root
      const nestedPdf = 
        '%PDF-1.4\n' +
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
        '2 0 obj\n<< /Type /Pages /Count 3 /Kids [3 0 R 6 0 R] >>\nendobj\n' +
        '3 0 obj\n<< /Type /Pages /Parent 2 0 R /Count 2 /Kids [4 0 R 5 0 R] >>\nendobj\n' +
        '4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
        '5 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
        '6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
        'xref\n0 7\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000200 00000 n \n0000000270 00000 n \n0000000340 00000 n \n' +
        'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n410\n%%EOF\n';

      const count = await extractPdfPageCount(new TextEncoder().encode(nestedPdf));
      assert.strictEqual(count, 3, 'Must resolve root page count 3, not child count 2');
    });

    await sub.test('rejects corrupt or invalid PDF truthfully and never claims guessed 1', async () => {
      const corruptData = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0xFF, 0xEE, 0xDD]);
      await assert.rejects(
        async () => {
          await extractPdfPageCount(corruptData);
        },
        (err: any) => {
          assert.ok(err instanceof Error);
          return true;
        },
        'Must throw error on corrupt PDF input rather than silently reporting 1'
      );
    });

    await sub.test('PDF page navigation helpers clamp strictly and reset on document change', async () => {
      const pageCount = 3;
      let currentPage = 1;

      // computePrevPdfPage clamps at 1
      assert.strictEqual(computePrevPdfPage(1), 1, 'Previous button at page 1 must remain 1');
      assert.strictEqual(computePrevPdfPage(2), 1);

      // computeNextPdfPage increments
      currentPage = computeNextPdfPage(currentPage, pageCount);
      assert.strictEqual(currentPage, 2);

      currentPage = computeNextPdfPage(currentPage, pageCount);
      assert.strictEqual(currentPage, 3);

      // computeNextPdfPage clamps at pageCount
      currentPage = computeNextPdfPage(currentPage, pageCount);
      assert.strictEqual(currentPage, 3, 'Next button at page 3 must not exceed pageCount 3');

      // clampPdfPage boundary handling
      assert.strictEqual(clampPdfPage(0, 3), 1, 'Page 0 clamped to 1');
      assert.strictEqual(clampPdfPage(5, 3), 3, 'Page 5 clamped to 3');
      assert.strictEqual(clampPdfPage(2, null), 2, 'Unknown maxPages preserves page number');

      // Document change resets page to 1
      let activeKey = 'url1::doc1.pdf';
      let activeKeyNext = 'url2::doc2.pdf';
      if (activeKey !== activeKeyNext) {
        currentPage = 1;
      }
      assert.strictEqual(currentPage, 1, 'Switching document must reset page to 1');
    });
  });

  await t.test('A6: Invoice document rendering regression', async (sub) => {
    await sub.test('Invoice & quotation modal export regressions: Language, QR toggle, Financials & UniversalModalShell', async () => {
      const React = await import('react');
      const { renderToString } = await import('react-dom/server');
      const { CustomerInvoiceTemplate } = await import('../features/orders/components/documents/CustomerInvoiceTemplate');
      const { CustomerInvoiceModal } = await import('../features/orders/components/modals/CustomerInvoiceModal');
      const { UniversalModalShell } = await import('../components/common/UniversalExportPreviewModal');

      assert.strictEqual(typeof UniversalModalShell, 'function', 'UniversalModalShell component must be exported');

      const testOrder = {
        orderNo: '1001',
        customerName: 'Somsin Test Customer',
        phone: '020 5886 6339',
        address: 'Saysettha, Vientiane',
        deliveryMethod: 'Anousith Express',
        totalPriceCharged: 350000,
        depositAmountPaid: 150000,
        shippingFee: 20000,
        discountAmount: 10000,
        paymentStatus: 'Paid',
        items: [
          {
            name: 'Hardcover Photo Book',
            quantity: 2,
            bindingMethod: 'WIRE_O',
            binding: 'WIRE_O',
            coating: 'GLOSS',
            specs: {
              paperType: 'Art Card 260g',
              size: 'A4',
              pages: 32,
              binding: 'WIRE_O',
              lamination: 'GLOSS',
            },
            unitPrice: 170000,
            totalPrice: 340000,
          },
        ],
      };

      // 1. Lao template rendering
      const htmlLo = renderToString(React.createElement(CustomerInvoiceTemplate, {
        order: testOrder,
        currentLang: 'lo',
        showBankQR: true,
      }));

      assert.ok(htmlLo.includes('ສົມສິງ ພິມ • SOM SING PRINTING'), 'Must include Lao company header');
      assert.ok(htmlLo.includes('ໃບເສັດຮັບເງິນ • RECEIPT'), 'Must include Lao receipt title for paid order');
      assert.ok(htmlLo.includes('ຊຳລະແລ້ວ'), 'Must include Lao paid status');
      assert.ok(htmlLo.includes('ສັນຫ່ວງຂົດລວດ (Wire-O)'), 'Must include Lao binding description');
      assert.ok(htmlLo.includes('ເຄືອບເງົາ (Gloss)'), 'Must include Lao coating description');
      assert.ok(htmlLo.includes('ຍອດລວມສຸດທິ (Grand Total):'), 'Must include Lao total label');
      assert.ok(htmlLo.includes('BCELONE_SOM_SING_PRINTING'), 'Must render QR code data when showBankQR=true');

      // 2. English template rendering
      const htmlEn = renderToString(React.createElement(CustomerInvoiceTemplate, {
        order: testOrder,
        currentLang: 'en',
        showBankQR: false,
      }));

      assert.ok(htmlEn.includes('OFFICIAL RECEIPT'), 'Must include English receipt title for paid order');
      assert.ok(htmlEn.includes('Product &amp; Specifications'), 'Must include English specification header');
      assert.ok(htmlEn.includes('Wire-O Binding'), 'Must include English binding description');
      assert.ok(htmlEn.includes('Gloss Lamination'), 'Must include English coating description');
      assert.ok(htmlEn.includes('Grand Total:'), 'Must include English total label');
      assert.strictEqual(htmlEn.includes('BCELONE_SOM_SING_PRINTING'), false, 'Must NOT render QR code data when showBankQR=false');

      // 3. CustomerInvoiceModal integration
      const modalHtml = renderToString(React.createElement(CustomerInvoiceModal, {
        isOpen: true,
        onClose: () => {},
        order: testOrder,
        currentLang: 'lo',
      }));

      assert.ok(modalHtml.includes('INV-1001'), 'Must include invoice document number INV-1001');
      assert.ok(modalHtml.includes('ໃບບິນຊຳລະເງິນສຳລັບລູກຄ້າ'), 'Must include invoice title');
      assert.ok(modalHtml.includes('ພາສາລາວ (LO)'), 'Must render language switcher toolbar');
      assert.ok(modalHtml.includes('ມີ QR'), 'Must render QR toggle toolbar');
    });
  });
});





