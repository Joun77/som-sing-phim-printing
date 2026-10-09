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
  '--user-data-dir=/tmp/qa-payment-settings-select',
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
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const btn = document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ເຂົ້າສູ່ລະບົບ'));
      if (btn) btn.click();
    })()
  `
});

await sleep(3000);

// 2. Click Finance button
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

// 3. Inspect select options
const selectCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      const select = sec?.querySelector('select');
      if (!select) return { count: 0, options: [] };
      return {
        count: select.options.length,
        options: Array.from(select.options).map(o => ({ value: o.value, text: o.text }))
      };
    })()
  `,
  returnByValue: true
});
console.log('Select check:', JSON.stringify(selectCheck.result?.value || selectCheck, null, 2));

// 4. If options > 1, select option index 1, toggle switch if needed, and save
const saveAttempt = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      const select = sec?.querySelector('select');
      const switchBtn = sec?.querySelector('button[role="switch"]');
      const saveBtn = Array.from(sec?.querySelectorAll('button') || []).find(b => b.textContent.includes('ບັນທຶກການຕັ້ງຄ່າ'));
      
      let selectedText = '';
      if (select && select.options.length > 1) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        selectedText = select.options[1].text;
      }
      
      // Ensure switch is checked
      if (switchBtn && switchBtn.getAttribute('aria-checked') !== 'true') {
        switchBtn.click();
      }

      return { selectedText, canSave: !!saveBtn && !saveBtn.disabled };
    })()
  `,
  returnByValue: true
});
console.log('Save attempt setup:', JSON.stringify(saveAttempt.result?.value || saveAttempt, null, 2));
await sleep(1000);

// Click save
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      const saveBtn = Array.from(sec?.querySelectorAll('button') || []).find(b => b.textContent.includes('ບັນທຶກການຕັ້ງຄ່າ'));
      if (saveBtn) saveBtn.click();
    })()
  `
});

await sleep(3000);

// Screenshot of successfully saved configuration
const savedSuccessShot = await send('Page.captureScreenshot');
fs.writeFileSync('/tmp/qa-payment-settings-saved-success.png', Buffer.from(savedSuccessShot.data, 'base64'));
console.log('Saved /tmp/qa-payment-settings-saved-success.png');

// 5. Reload via "ລອງໂຫຼດໃໝ່" button to verify persistence
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      const reloadBtn = Array.from(sec?.querySelectorAll('button') || []).find(b => b.textContent.includes('ລອງໂຫຼດໃໝ່'));
      if (reloadBtn) reloadBtn.click();
    })()
  `
});

await sleep(3000);

const reloadCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const sec = document.querySelector('section[aria-label="ຕັ້ງຄ່າຮັບຊຳລະ"]');
      const switchBtn = sec?.querySelector('button[role="switch"]');
      const select = sec?.querySelector('select');
      const detail = sec?.querySelector('[data-testid="selected-payment-account-detail"]');
      const error = sec?.querySelector('[role="alert"]');
      return {
        switchAriaChecked: switchBtn?.getAttribute('aria-checked'),
        selectValue: select?.value,
        detailText: detail?.textContent.trim(),
        hasError: !!error,
        errorText: error?.textContent.trim()
      };
    })()
  `,
  returnByValue: true
});
console.log('Reload check:', JSON.stringify(reloadCheck.result?.value || reloadCheck, null, 2));

const reloadedSuccessShot = await send('Page.captureScreenshot');
fs.writeFileSync('/tmp/qa-payment-settings-reloaded-success.png', Buffer.from(reloadedSuccessShot.data, 'base64'));
console.log('Saved /tmp/qa-payment-settings-reloaded-success.png');

chromeProc.kill();
process.exit(0);
