import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

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
  '--user-data-dir=/tmp/qa-payment-settings-reload-login',
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
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  }
};

await new Promise(r => ws.onopen = r);

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false
});

await sleep(2000);

// 1. Submit login
console.log('Submitting login...');
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ເຂົ້າສູ່ລະບົບ'));
      if (btn) btn.click();
    })()
  `
});

await sleep(3000);

// 2. Reload page so AppContext re-runs refreshData with saved auth token
console.log('Reloading page after login...');
await send('Page.reload');
await sleep(4000);

// 3. Click Finance button
console.log('Navigating to Finance tab...');
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const financeBtn = allButtons.find(b => b.textContent.includes('ການເງິນ, ບັນຊີ') || (b.textContent.includes('P/L') && b.closest('nav')));
      if (financeBtn) financeBtn.click();
    })()
  `
});

await sleep(3000);

// 4. Inspect select options now
const optionsEval = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      const select = sec?.querySelector('select');
      return {
        optionsCount: select?.options.length,
        options: Array.from(select?.options || []).map(o => ({ value: o.value, text: o.text }))
      };
    })()
  `,
  returnByValue: true
});

console.log('Bank options after authenticated reload:', JSON.stringify(optionsEval.result?.value, null, 2));

// Screenshot showing populated bank options
const shot = await send('Page.captureScreenshot');
fs.writeFileSync('/tmp/qa-payment-settings-bank-options.png', Buffer.from(shot.data, 'base64'));
console.log('Saved /tmp/qa-payment-settings-bank-options.png');

chromeProc.kill();
process.exit(0);
