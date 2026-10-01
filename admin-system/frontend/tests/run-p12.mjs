import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(frontend, '../backend');
const tools = process.env.P12_TEST_TOOLS;
if (!tools) throw new Error('Set P12_TEST_TOOLS to an isolated node_modules containing vitest@3 and jsdom@26');
const temp = await mkdtemp(join(tmpdir(), 'somsing-p12-'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const dataPaths = ['couriers_data.json', 'payment_methods_data.json'].map(name => join(backend, name));
async function hashes() {
  return Promise.all(dataPaths.map(async path => {
    const bytes = await readFile(path);
    if (!bytes.length) throw new Error(`Empty protected fixture baseline: ${path}`);
    return hash(bytes);
  }));
}
const before = await hashes();
const home = join(temp, 'home'); await mkdir(home);
const fixtureEnv = { PATH: process.env.PATH, HOME: home, TMPDIR: temp, ENVIRONMENT: 'test', GOCACHE: process.env.GOCACHE || join(process.env.HOME, 'Library/Caches/go-build'), GOPATH: process.env.GOPATH || join(process.env.HOME, 'go') };
function run(command, args, cwd, env = fixtureEnv) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
}
let server;
try {
  // Compilation never executes settings.init. All execution starts in fresh temp cwd/HOME.
  const binary = join(temp, 'fixture-server');
  run('go', ['build', '-o', binary, './cmd/fixture-server'], backend);
  for (const [pkg, selector] of [
    ['cmd/fixture-server', '.'],
    ['orders', 'Test(UploadValidation_U1|ProtectedFileServing_U2|SingleSplitBatchUploadPreviewDownload_U3|SymlinkAndContainedResolution|OrderUploadValidationAndDraftPreservation)'],
  ]) {
    const testBinary = join(temp, pkg.replaceAll('/', '-') + '.test');
    run('go', ['test', '-c', '-o', testBinary, './' + pkg], backend);
    run(testBinary, ['-test.v', '-test.run=' + selector], temp);
  }
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  server = spawn(binary, ['-port', String(port)], { cwd: temp, env: fixtureEnv, stdio: ['ignore', 'ignore', 'pipe'] });
  server.stderr.on('data', bytes => process.stderr.write(bytes));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await fetch(origin + '/fixture/health')).ok; if (ready) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (!ready) throw new Error('Disposable Go fixture never became ready');
  run(process.execPath, [join(tools, 'vitest/vitest.mjs'), 'run', '--config', join(frontend, 'tests/p12.config.mjs'), '--reporter=verbose'], frontend,
    { ...fixtureEnv, P12_TEST_TOOLS: tools, P12_TEMP_DIR: temp, P12_FIXTURE_ORIGIN: origin });

  const require = createRequire(join(frontend, 'package.json'));
  const { build } = await import(require.resolve('vite'));
  const { default: react } = await import(require.resolve('@vitejs/plugin-react'));
  const { default: tailwindcss } = await import(require.resolve('@tailwindcss/vite'));
  // Full production entry, no shop .env, no shop proxy or services, no repository build writes.
  await build({ root: frontend, configFile: false, envDir: temp, cacheDir: join(temp, 'build-cache'), plugins: [react(), tailwindcss()],
    build: { outDir: join(temp, 'dist'), emptyOutDir: true, manifest: true } });
  const assets = await readdir(join(temp, 'dist/assets'));
  const workers = assets.filter(name => /^pdf\.worker\.min-.*\.mjs$/.test(name));
  if (workers.length !== 1) throw new Error(`Expected one locally bundled worker; found ${workers}`);
  const installed = await readFile(join(frontend, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'));
  const emitted = await readFile(join(temp, 'dist/assets', workers[0]));
  if (hash(installed) !== hash(emitted)) throw new Error('Bundled worker differs from installed PDF.js worker');
  console.log(`MATCHING LOCAL WORKER: ${workers[0]} ${emitted.length} bytes SHA256=${hash(emitted)}`);
  const bundles = await Promise.all(assets.filter(name => name.endsWith('.js')).map(name => readFile(join(temp, 'dist/assets', name), 'utf8')));
  if (!bundles.some(text => text.includes(workers[0]))) throw new Error('Application does not reference the bundled worker');
  console.log('Production application references the emitted local worker asset');
} finally {
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGTERM'); await stopped;
  }
  const after = await hashes();
  await rm(temp, { recursive: true, force: true });
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Repository courier/payment JSON changed');
  console.log(`NONEMPTY REPOSITORY JSON UNCHANGED: ${before.join(', ')}`);
}
