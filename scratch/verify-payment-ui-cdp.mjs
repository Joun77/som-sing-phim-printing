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
  '--user-data-dir=/tmp/qa-payment-settings-cdp2',
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

// 2. Navigate to Finance tab
console.log('Navigating to Finance tab: ການເງິນ, ບັນຊີ & P/L...');
const navResult = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const target = Array.from(document.querySelectorAll('button, a, span, div')).find(el => el.textContent.includes('ການເງິນ, ບັນຊີ') || el.textContent.includes('P/L'));
      if (target) {
        target.click();
        return 'clicked: ' + target.textContent.trim();
      }
      return 'not found';
    })()
  `,
  returnByValue: true
});
console.log('Nav result:', navResult.value);

await sleep(3000);

// 3. Inspect payment configuration section
console.log('Inspecting payment config section...');
const configSectionInfo = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      if (!sec) return { found: false, allSections: Array.from(document.querySelectorAll('section, h2, h3')).map(s => s.textContent.trim().slice(0, 50)) };
      const text = sec.textContent;
      const gatewayBadge = Array.from(sec.querySelectorAll('span')).find(s => s.textContent.includes('Gateway: ປິດ'));
      const portalBadge = Array.from(sec.querySelectorAll('span')).find(s => s.textContent.includes('ໜ້າລູກຄ້າ: ປິດ'));
      const switchBtn = sec.querySelector('button[role="switch"]');
      const select = sec.querySelector('select');
      const saveBtn = Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('ບັນທຶກການຕັ້ງຄ່າ'));
      const reloadBtn = Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('ລອງໂຫຼດໃໝ່'));
      return {
        found: true,
        hasGatewayBadge: !!gatewayBadge,
        hasPortalBadge: !!portalBadge,
        switchAriaChecked: switchBtn ? switchBtn.getAttribute('aria-checked') : null,
        switchText: switchBtn ? switchBtn.parentElement.textContent.trim() : null,
        hasSelect: !!select,
        selectOptionsCount: select ? select.options.length : 0,
        hasSaveBtn: !!saveBtn,
        hasReloadBtn: !!reloadBtn
      };
    })()
  `,
  returnByValue: true
});

console.log('Payment Config Section Info:', JSON.stringify(configSectionInfo.value, null, 2));

// Screenshot initial section
const initialShot = await send('Page.captureScreenshot');
fs.writeFileSync('/tmp/qa-payment-settings-ui-initial.png', Buffer.from(initialShot.data, 'base64'));
console.log('Saved /tmp/qa-payment-settings-ui-initial.png');

// 4. Toggle QR switch and select bank account
console.log('Toggling QR switch and selecting bank account...');
const toggleResult = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      if (!sec) return 'sec not found';
      const switchBtn = sec.querySelector('button[role="switch"]');
      if (switchBtn) switchBtn.click();
      const select = sec.querySelector('select');
      if (select && select.options.length > 1) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return 'toggled';
    })()
  `,
  returnByValue: true
});
console.log('Toggle result:', toggleResult.value);
await sleep(1000);

// 5. Click Save Settings
console.log('Clicking Save Settings...');
const saveResult = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      if (!sec) return 'sec not found';
      const saveBtn = Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('ບັນທຶກການຕັ້ງຄ່າ'));
      if (saveBtn) {
        saveBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()
  `,
  returnByValue: true
});
console.log('Save click result:', saveResult.value);
await sleep(2500);

// Screenshot after save
const savedShot = await send('Page.captureScreenshot');
fs.writeFileSync('/tmp/qa-payment-settings-saved.png', Buffer.from(savedShot.data, 'base64'));
console.log('Saved /tmp/qa-payment-settings-saved.png');

// 6. Click Reload button
console.log('Clicking Reload button...');
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      if (!sec) return 'sec not found';
      const reloadBtn = Array.from(sec.querySelectorAll('button')).find(b => b.textContent.includes('ລອງໂຫຼດໃໝ່'));
      if (reloadBtn) reloadBtn.click();
    })()
  `
});
await sleep(2500);

// Check persisted state in UI
const reloadedState = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      if (!sec) return 'sec not found';
      const switchBtn = sec.querySelector('button[role="switch"]');
      const select = sec.querySelector('select');
      return {
        switchAriaChecked: switchBtn ? switchBtn.getAttribute('aria-checked') : null,
        selectedOptionValue: select ? select.value : null,
        statusText: sec.querySelector('span.rounded-full')?.textContent.trim()
      };
    })()
  `,
  returnByValue: true
});
console.log('Reloaded state:', JSON.stringify(reloadedState.value, null, 2));

const reloadedShot = await send('Page.captureScreenshot');
fs.writeFileSync('/tmp/qa-payment-settings-reloaded.png', Buffer.from(reloadedShot.data, 'base64'));
console.log('Saved /tmp/qa-payment-settings-reloaded.png');

// Cleanup
chromeProc.kill();
process.exit(0);
