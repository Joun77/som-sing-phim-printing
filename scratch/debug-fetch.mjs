import { spawn } from 'child_process';
import http from 'http';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

try {
  const pkill = spawn('pkill', ['-f', 'remote-debugging-port=9222']);
  await new Promise(r => pkill.on('close', r));
} catch {}
await sleep(1000);

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/qa-debug-console',
  '--disable-extensions',
  '--no-first-run',
  '--window-size=1440,1080'
], { stdio: 'ignore' });

await sleep(1500);

function httpRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: method
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const newPage = await httpRequest('http://127.0.0.1:9222/json/new?http://127.0.0.1:5175', 'PUT');
const ws = new WebSocket(newPage.webSocketDebuggerUrl);

let msgId = 1;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.consoleAPICalled') {
    console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
  }
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  }
};

await new Promise(r => ws.onopen = r);

await send('Runtime.enable');
await send('Page.enable');

await sleep(2000);

// Login
console.log('Logging in...');
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    })()
  `
});

await sleep(3000);

// Evaluate apiFetch('/api/v1/payment-methods') directly in browser context
const evalFetch = await send('Runtime.evaluate', {
  expression: `
    (async () => {
      try {
        const token = localStorage.getItem('somsing_auth_token') || sessionStorage.getItem('somsing_auth_token');
        const res = await fetch('/api/v1/payment-methods', {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        const body = await res.json();
        return { status: res.status, body };
      } catch (err) {
        return { error: err.message };
      }
    })()
  `,
  awaitPromise: true,
  returnByValue: true
});

console.log('Direct in-browser fetch /api/v1/payment-methods:', JSON.stringify(evalFetch.result?.value, null, 2));

chromeProc.kill();
process.exit(0);
