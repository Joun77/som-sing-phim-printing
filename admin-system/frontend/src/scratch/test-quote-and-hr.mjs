import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const PREVIEW_URL = 'http://127.0.0.1:5175';

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/qa-test-quote-hr',
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
console.log('Connected to target WS');

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false
});

// Inject pre-authenticated session
await send('Runtime.evaluate', {
  expression: `
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwidXNlcl9pZCI6InVzcl9hZG1pbl8wMDEiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6Im93bmVyQHNvbXNpbmdwaGltLmxhIiwiZnVsbG5hbWUiOiJTb20tU2luZyBQcmludGluZyBPd25lciAoU3VwZXIgQWRtaW4pIiwiaXNzIjoic29tLXNpbmctcGhpbS1lcnAiLCJzdWIiOiJ1c3JfYWRtaW5fMDAxIiwiZXhwIjoxNzkxNDg0MTEwLCJpYXQiOjE3OTEzOTc3MTB9.YNSDDiTsgFu0NWqyWfe3QflUWyiKEye5DwpvcXLnQio');
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwidXNlcl9pZCI6InVzcl9hZG1pbl8wMDEiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6Im93bmVyQHNvbXNpbmdwaGltLmxhIiwiZnVsbG5hbWUiOiJTb20tU2luZyBQcmludGluZyBPd25lciAoU3VwZXIgQWRtaW4pIiwiaXNzIjoic29tLXNpbmctcGhpbS1lcnAiLCJzdWIiOiJ1c3JfYWRtaW5fMDAxIiwiZXhwIjoxNzkxNDg0MTEwLCJpYXQiOjE3OTEzOTc3MTB9.YNSDDiTsgFu0NWqyWfe3QflUWyiKEye5DwpvcXLnQio',
        user: {
          id: 'usr_admin_001',
          username: 'admin',
          fullName: 'Som-Sing Printing Owner (Super Admin)',
          role: 'admin',
          roles: ['admin', 'manager', 'finance'],
          permissions: ['*']
        },
        isAuthenticated: true
      },
      version: 0
    }));
  `
});

await send('Page.navigate', { url: 'http://127.0.0.1:5175' });
await sleep(2500);

const testOut = {};

// ==========================================
// TEST A: HR ATOMIC EMPLOYEE + ACCOUNT FAILURE & RETRY
// ==========================================
console.log('[A] Testing HR Atomic Employee + Account UI...');
// Navigate to HR tab
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const allBtns = Array.from(document.querySelectorAll('button, a'));
      const hrBtn = allBtns.find(b => b.textContent.includes('ພະນັກງານ (HR / Staff)'));
      if (hrBtn) hrBtn.click();
    })()
  `
});
await sleep(2500);

// Click "+ ເພີ່ມພະນັກງານໃໝ່"
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ເພີ່ມພະນັກງານ'));
      if (addBtn) addBtn.click();
    })()
  `
});
await sleep(1500);

// Fill form: Name & Phone, and toggle Login Account ON, but leave password empty
const fillPartial = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const nameInput = document.querySelector('input[placeholder*="ສົມຈິດ"]') || document.querySelector('input[required]');
      if (nameInput) {
        nameInput.value = 'ທ້າວ ສົມສັກ ທົດສອບ HR';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const phoneInput = document.querySelector('input[placeholder*="020"]');
      if (phoneInput) {
        phoneInput.value = '020-5588-9900';
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Toggle Login Account switch
      const switchBtn = document.querySelector('button[role="switch"]');
      if (switchBtn) switchBtn.click();
      return { nameFilled: !!nameInput, phoneFilled: !!phoneInput, switchClicked: !!switchBtn };
    })()
  `,
  returnByValue: true
});
console.log('Fill Partial Form:', fillPartial.result.value);
await sleep(1000);

// Submit with missing password -> triggers warning toast, modal stays open
const submitFail = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const submitBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.trim() === 'ເພີ່ມພະນັກງານ' || b.textContent.trim() === 'Add Employee');
      if (submitBtn) {
        submitBtn.click();
        return { clicked: true, text: submitBtn.textContent.trim() };
      }
      return { clicked: false };
    })()
  `,
  returnByValue: true
});
console.log('Submit Fail Result:', submitFail.result.value);
await sleep(1500);

// Check that modal is still open and name is still "ທ້າວ ສົມສັກ ທົດສອບ HR"
const checkDraft = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const bodyText = document.body.innerText;
      const isModalOpen = bodyText.includes('ເພີ່ມພະນັກງານໃໝ່');
      const nameInput = document.querySelector('input[placeholder*="ສົມຈິດ"]') || document.querySelector('input[required]');
      const draftVal = nameInput ? nameInput.value : '';
      return {
        isModalOpen,
        draftVal,
        preserved: draftVal.includes('ສົມສັກ')
      };
    })()
  `,
  returnByValue: true
});
console.log('Check Draft Retention:', checkDraft.result.value);

const shotHrDraft = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('/tmp/qa-hr-draft-retained.png', Buffer.from(shotHrDraft.data, 'base64'));

// Now RETRY: enter valid password and submit
console.log('Retrying with valid password...');
const fillPassAndRetry = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const passInput = document.querySelector('input[type="password"]');
      if (passInput) {
        passInput.value = 'Pass123456';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const submitBtn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.trim() === 'ເພີ່ມພະນັກງານ' || b.textContent.trim() === 'Add Employee');
      if (submitBtn) {
        submitBtn.click();
        return { submitted: true };
      }
      return { submitted: false };
    })()
  `,
  returnByValue: true
});
console.log('Fill Password & Retry Result:', fillPassAndRetry.result.value);
await sleep(3500);

// Verify modal closed and employee appears in staff table
const checkTable = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const bodyText = document.body.innerText;
      return {
        modalClosed: !bodyText.includes('1. ຂໍ້ມູນທົ່ວໄປ & ຕຳແໜ່ງ'),
        employeeInTable: bodyText.includes('ສົມສັກ ທົດສອບ HR')
      };
    })()
  `,
  returnByValue: true
});
console.log('Check Staff Table Post-Creation:', checkTable.result.value);
const shotHrSuccess = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('/tmp/qa-hr-creation-success.png', Buffer.from(shotHrSuccess.data, 'base64'));

testOut.hr_atomic = {
  status: (checkDraft.result.value.preserved && checkTable.result.value.employeeInTable) ? 'PASS' : 'FAIL',
  draftRetention: checkDraft.result.value,
  tableResult: checkTable.result.value
};

// ==========================================
// TEST B: NEW UI QUOTATION -> SAVE -> CONVERT -> CANONICAL READBACK
// ==========================================
console.log('\n[B] Testing New UI Quotation Creation -> Save -> Convert...');
// Navigate to Quotations Studio
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const allBtns = Array.from(document.querySelectorAll('button, a'));
      const quoteBtn = allBtns.find(b => b.textContent.includes('2. ໃບສະເໜີລາຄາ') || b.textContent.includes('Quotation'));
      if (quoteBtn) quoteBtn.click();
    })()
  `
});
await sleep(2500);

// Wizard Step 1 (Intake): Fill in Customer Name & Phone
const fillCustomer = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      // Customer name input
      const nameInput = inputs.find(i => i.placeholder?.includes('ຊື່ລູກຄ້າ') || i.name === 'customerName' || i.id === 'customerName') || inputs[0];
      if (nameInput) {
        nameInput.value = 'QA End-to-End Customer 2026';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const phoneInput = inputs.find(i => i.placeholder?.includes('020') || i.name === 'customerPhone' || i.id === 'customerPhone') || inputs[1];
      if (phoneInput) {
        phoneInput.value = '020-7788-9911';
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return { filled: true, name: nameInput?.value, phone: phoneInput?.value };
    })()
  `,
  returnByValue: true
});
console.log('Fill Customer in Step 1:', fillCustomer.result.value);
await sleep(1000);

// Advance to Step 3 (Summary & Quote)
const gotoSummary = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const step3Btn = btns.find(b => b.textContent.includes('3') && (b.textContent.includes('ສະຫຼຸບຕົ້ນທຶນ') || b.textContent.includes('Summary')));
      if (step3Btn) {
        step3Btn.click();
        return { clicked: true, text: step3Btn.textContent.trim() };
      }
      return { clicked: false };
    })()
  `,
  returnByValue: true
});
console.log('Go to Summary Step 3:', gotoSummary.result.value);
await sleep(2000);

// In Step 3: Click "ຢືນຢັນສັ່ງຜະລິດ (Confirm Order)"
const clickConfirmOrder = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.textContent.includes('ຢືນຢັນສັ່ງຜະລິດ') || b.textContent.includes('Confirm Order'));
      if (confirmBtn) {
        confirmBtn.click();
        return { clicked: true };
      }
      return { clicked: false, available: btns.map(b => b.textContent.trim()).filter(Boolean).slice(0, 10) };
    })()
  `,
  returnByValue: true
});
console.log('Click Confirm Order Result:', clickConfirmOrder.result.value);
await sleep(1500);

// Confirm Dialog appears -> Click "ຢືນຢັນ"
const clickDialogConfirm = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dialogConfirmBtn = btns.find(b => b.textContent.trim() === 'ຢືນຢັນ' || b.textContent.trim() === 'Confirm' || b.textContent.includes('ຢືນຢັນການເປີດອໍເດີ'));
      if (dialogConfirmBtn) {
        dialogConfirmBtn.click();
        return { clicked: true, text: dialogConfirmBtn.textContent.trim() };
      }
      return { clicked: false, allBtns: btns.map(b => b.textContent.trim()).filter(Boolean).slice(0, 15) };
    })()
  `,
  returnByValue: true
});
console.log('Click Dialog Confirm Result:', clickDialogConfirm.result.value);
await sleep(5000);

// Check if navigated to CRM Orders or order created
const postConversionCheck = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const text = document.body.innerText;
      return {
        onOrdersPage: text.includes('3. ອໍເດີ & ຕິດຕາມສະຖານະ') || text.includes('Orders'),
        hasNewCustomerInOrders: text.includes('QA End-to-End Customer 2026'),
        orderRows: Array.from(document.querySelectorAll('tr')).map(r => r.innerText.replace(/\\n/g, ' ')).filter(r => r.includes('ORD-') || r.includes('QA'))
      };
    })()
  `,
  returnByValue: true
});
console.log('Post-Conversion Check:', postConversionCheck.result.value);

const shotNewOrder = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('/tmp/qa-new-order-converted.png', Buffer.from(shotNewOrder.data, 'base64'));

testOut.new_order = {
  status: postConversionCheck.result.value.hasNewCustomerInOrders ? 'PASS' : 'FAIL',
  result: postConversionCheck.result.value,
  screenshot: '/tmp/qa-new-order-converted.png'
};

console.log('\n==========================================');
console.log('TEST OUTCOME:', JSON.stringify(testOut, null, 2));

ws.close();
chromeProc.kill();
process.exit(0);
