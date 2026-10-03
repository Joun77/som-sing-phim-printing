import { fileURLToPath } from 'node:url';
const tools = process.env.P12_TEST_TOOLS;
if (!tools) throw new Error('Set P12_TEST_TOOLS to an isolated install of vitest and jsdom');
const allTests = ['tests/p12-mounted.test.tsx', 'tests/p12-evidence.test.tsx', 'tests/p12-login.test.tsx', 'tests/p13-payment-ui.test.tsx'];
const scope = process.env.P12_EVIDENCE_SCOPE;
const testFiles = process.env.P12_EVIDENCE_ONLY === '1' && scope !== 'regression'
  ? [scope === 'login' ? 'tests/p12-login.test.tsx' : 'tests/p12-evidence.test.tsx']
  : allTests;
export default {
  root: fileURLToPath(new URL('..', import.meta.url)),
  envDir: process.env.P12_TEMP_DIR,
  cacheDir: `${process.env.P12_TEMP_DIR}/vite-cache`,
  resolve: { alias: { vitest: `${tools}/vitest/dist/index.js`, '@': fileURLToPath(new URL('../src', import.meta.url)), '@components': fileURLToPath(new URL('../src/components', import.meta.url)), '@utils': fileURLToPath(new URL('../src/utils', import.meta.url)), '@features': fileURLToPath(new URL('../src/features', import.meta.url)), '@store': fileURLToPath(new URL('../src/store', import.meta.url)), '@lib': fileURLToPath(new URL('../src/lib', import.meta.url)) }, dedupe: ['react', 'react-dom'] },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'jsdom', include: testFiles, env: { VITE_API_URL: `${process.env.P12_FIXTURE_ORIGIN}/api`, P12_FIXTURE_ORIGIN: process.env.P12_FIXTURE_ORIGIN }, pool: 'forks', maxWorkers: 1, minWorkers: 1, testTimeout: 15000 },
};
