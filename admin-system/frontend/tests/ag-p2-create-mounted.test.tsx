// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { AppProvider, useApp } from '../src/store/AppContext';
import { QuotationHistoryModal } from '../src/features/pricing/components/QuotationHistoryModal';
import QuotationManager from '../src/features/pricing/components/QuotationManager';
import { useAuthStore } from '../src/store/useAuthStore';
import '../src/i18n';

// Mock optional UI generators not tested here
vi.mock('html-to-image', () => ({ toPng: vi.fn(), toJpeg: vi.fn(), toBlob: vi.fn() }));
vi.mock('jspdf', () => ({ jsPDF: vi.fn(), default: vi.fn() }));
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument: vi.fn() }));
vi.mock('../src/lib/preflightAnalyzer', () => ({ 
  analyzePDFClient: vi.fn(), 
  analyzeImageClient: vi.fn(), 
  convertRGBToCMYKCanvas: vi.fn() 
}));

const tick = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check: () => boolean, maxAttempts = 150) {
  for (let i = 0; i < maxAttempts; i++) {
    await act(async () => { await tick(); });
    if (check()) return;
  }
  throw new Error(`Timed out waiting for condition. Body: ${document.body.textContent?.slice(0, 400)}`);
}

let root: Root;
let container: HTMLDivElement;

const QUOTE_ID = 'quot-21819084-e6bb-4bb1-9945-3795bee20906';
const ORDER_ID = 'order-eb9a87e6914213efa8e311af7ce336cc';
const IDEMPOTENCY_KEY = `quotation-conversion:${QUOTE_ID}`;
const IMMUTABLE_SOURCE_REVISION = '2026-10-06T18:20:38.234462Z';
const ADVANCED_ROW_REVISION = '2026-10-06T18:20:38.299555Z';

// Exact canonical quotation DTO as reloaded from server in QA reports
const canonicalConvertedQuote = {
  id: QUOTE_ID,
  quotation_no: 'Q-20261006-0001',
  quotationNumber: 'Q-20261006-0001',
  title: 'QA NEW CommercialPDFOFF20261007',
  customer_name: 'QACommercialNew20261007',
  customerName: 'QACommercialNew20261007',
  customer_phone: '020-0000-0003',
  phone: '020-0000-0003',
  customer_address: 'Vientiane',
  customerAddress: 'Vientiane',
  status: 'CONVERTED',
  total_cost: 103,
  totalCost: 103,
  total_selling_price: 184,
  grandTotal: 184,
  overall_profit_percent: 44.02,
  profitMargin: 44.02,
  discount_percent: 0,
  setup_fee: 0,
  packaging_cost: 0,
  shipping_fee: 0,
  shippingFee: 0,
  updated_at: ADVANCED_ROW_REVISION,
  updatedAt: ADVANCED_ROW_REVISION,
  convertedOrderId: ORDER_ID,
  conversion: {
    approval_required: false,
    idempotency_key: IDEMPOTENCY_KEY,
    order_id: ORDER_ID,
    quotation_id: QUOTE_ID,
    source_updated_at: IMMUTABLE_SOURCE_REVISION,
  },
  commercial_snapshot: {
    version: 1,
    currency: 'LAK',
    total_cost_lak: 103,
    final_total_lak: 184,
    discounted_subtotal_lak: 184,
    tax_amount_lak: 0,
    shipping_fee_lak: 0,
    setup_fee_lak: 0,
    packaging_cost_lak: 0,
    metadata: { tax_enabled: false }
  },
  items: [
    {
      id: `item-${QUOTE_ID}-1`,
      name: 'Commercial Item',
      quantity: 1,
      unit_cost_lak: 103,
      unitCost: 103,
      unit_price_lak: 172,
      unitPrice: 172,
      total_price_lak: 172,
      subtotal: 172,
      specs: {
        paper_name: 'OwnedStock',
        color_mode: 'MONO_K'
      }
    }
  ]
};

// Exact canonical order DTO as returned from server
const canonicalOrder = {
  id: ORDER_ID,
  order_id: ORDER_ID,
  order_no: 'ORD-20261006-0001',
  order_number: 'ORD-20261006-0001',
  idempotency_key: IDEMPOTENCY_KEY,
  status: 'Pending',
  overall_status: 'Pending',
  total_amount_lak: 184,
  total_price: 184,
  total_cost: 103,
  deposit_lak: 0,
  deposit_amount: 0,
  remaining_lak: '184.00',
  customer_id: 'cust-1',
  customer_name: 'QACommercialNew20261007',
  customer_phone: '020-0000-0003',
  customer_address: 'Vientiane',
  payment_status: 'Unpaid',
  items: [
    {
      id: `item-${ORDER_ID}-1`,
      order_id: ORDER_ID,
      quantity: 1,
      unit_cost_lak: 103,
      unit_price_lak: 172,
      total_price_lak: 172,
      specs: {
        paper_name: 'OwnedStock',
        color_mode: 'MONO_K'
      }
    }
  ]
};

// Successful replay envelope
const canonicalReplayEnvelope = {
  status: 'success',
  committed: true,
  replayed: true,
  quotation_id: QUOTE_ID,
  quotation_status: 'CONVERTED',
  idempotency_key: IDEMPOTENCY_KEY,
  source_quotation_updated_at: IMMUTABLE_SOURCE_REVISION,
  approval_required: false,
  order_id: ORDER_ID,
  orderId: ORDER_ID,
  order_number: 'ORD-20261006-0001',
  orderNumber: 'ORD-20261006-0001',
  data: canonicalOrder
};

function defaultFetchHandler(input: RequestInfo | URL, init?: RequestInit): Response | null {
  const url = String(input);
  if (url.includes('/api/v1/quotations') && !url.includes('/convert') && (!init?.method || init?.method === 'GET')) {
    return new Response(JSON.stringify([canonicalConvertedQuote]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/api/v1/orders') && (!init?.method || init?.method === 'GET') && !url.includes(ORDER_ID)) {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/api/v1/inventory') || url.includes('/api/v1/equipment') || url.includes('/api/customers') || url.includes('/api/spoilage')) {
    return new Response(JSON.stringify({ status: 'success', data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/api/v1/settings')) {
    return new Response(JSON.stringify({ status: 'success', data: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return null;
}

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  if (typeof window !== 'undefined') window.history.replaceState(null, '', '/');
  localStorage.setItem('ss_print_quotations_v6', JSON.stringify([canonicalConvertedQuote]));
  localStorage.setItem('ss_print_customers_v6', JSON.stringify([{ id: 'cust-1', name: 'QACommercialNew20261007', phone: '020-0000-0003', address: 'Vientiane' }]));
  useAuthStore.setState({ token: 'test-token', user: { id: 'u1', username: 'admin', fullName: 'Admin', role: 'admin' }, isAuthenticated: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  vi.restoreAllMocks();
  // Clear modal portals left on body
  document.body.innerHTML = '';
});

test('SCOPE: Mocked API - QuotationHistoryModal renders open existing order button in portal when convertedOrderId is set', async () => {
  const onConvertToOrder = vi.fn();
  const onOpenConvertedOrder = vi.fn();
  
  await act(async () => {
    root.render(
      <QuotationHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        quotations={[canonicalConvertedQuote as any]}
        onLoad={vi.fn()}
        onRevise={vi.fn()}
        onDelete={vi.fn()}
        onConvertToOrder={onConvertToOrder}
        onOpenConvertedOrder={onOpenConvertedOrder}
        onOpenApproval={vi.fn()}
        onSaveDraft={vi.fn()}
        currentLang="lo"
        formatCurrency={(n) => `${n.toLocaleString()} ₭`}
      />
    );
  });
  await tick();

  // FormModalTemplate portals into document.body
  const buttons = Array.from(document.body.querySelectorAll('button'));
  const openOrderBtn = buttons.find(b => b.textContent?.includes('ເປີດອໍເດີທີ່ມີແລ້ວ'));
  expect(openOrderBtn).toBeTruthy();

  // Click it
  await act(async () => { openOrderBtn!.click(); });
  expect(onOpenConvertedOrder).toHaveBeenCalledWith(canonicalConvertedQuote);
  expect(onConvertToOrder).not.toHaveBeenCalled();
});

test('SCOPE: Mocked API - Actual caller recovery succeeds with canonical replay envelope and navigates without duplicate quote/order', async () => {
  const onConvertToOrderSpy = vi.fn();
  let appInstance: ReturnType<typeof useApp> | null = null;
  
  function TestWrapper() {
    appInstance = useApp();
    return <QuotationManager onConvertToOrder={onConvertToOrderSpy} />;
  }

  // Intercept fetch calls
  const fetchCalls: { url: string; method?: string; body?: any; headers?: any }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const defaultResp = defaultFetchHandler(input, init);
    if (defaultResp) return defaultResp;

    const url = String(input);
    fetchCalls.push({ url, method: init?.method, body: init?.body, headers: init?.headers });

    if (url.includes(`/api/v1/quotations/${encodeURIComponent(QUOTE_ID)}/convert`) && init?.method === 'POST') {
      const headers = new Headers(init.headers);
      expect(headers.get('Idempotency-Key')).toBe(IDEMPOTENCY_KEY);
      return new Response(JSON.stringify(canonicalReplayEnvelope), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes(`/api/v1/orders/${encodeURIComponent(ORDER_ID)}`) && (!init?.method || init?.method === 'GET')) {
      return new Response(JSON.stringify({ status: 'success', data: canonicalOrder }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ status: 'error', message: 'not found' }), { status: 404 });
  });

  await act(async () => {
    root.render(
      <AppProvider>
        <TestWrapper />
      </AppProvider>
    );
  });
  await tick();
  await until(() => appInstance?.quotations?.length === 1);

  // 1. Open Quotation History Modal
  const historyBtn = container.querySelector('button[title="ປະຫວັດໃບສະເໜີ"]') as HTMLButtonElement;
  expect(historyBtn).toBeTruthy();
  await act(async () => { historyBtn.click(); });
  await tick();

  // 2. Click "ເປີດອໍເດີທີ່ມີແລ້ວ →" (rendered in modal portal on document.body)
  const openOrderBtn = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('ເປີດອໍເດີທີ່ມີແລ້ວ'));
  expect(openOrderBtn).toBeTruthy();
  await act(async () => { openOrderBtn!.click(); });

  // 3. Wait for reconciliation and navigation
  await until(() => onConvertToOrderSpy.mock.calls.length > 0);

  // Assert navigation payload
  expect(onConvertToOrderSpy).toHaveBeenCalledWith({
    orderId: ORDER_ID,
    sourceQuotationId: QUOTE_ID,
  });

  // Assert activeTab switched to orders
  expect(appInstance!.activeTab).toBe('orders');

  // Assert order is present in AppContext orders state
  const recoveredOrder = appInstance!.orders.find(o => o.id === ORDER_ID);
  expect(recoveredOrder).toBeTruthy();
  expect(recoveredOrder?.total_amount_lak).toBe(184);
  expect(recoveredOrder?.total_cost).toBe(103);
  expect(recoveredOrder?.remaining_lak).toBe(184);

  // Assert no second quote was created
  expect(appInstance!.quotations.length).toBe(1);
  expect(appInstance!.quotations[0].id).toBe(QUOTE_ID);

  // Assert exactly 1 convert POST was made with the stable idempotency key
  const convertPosts = fetchCalls.filter(c => c.url.includes('/convert') && c.method === 'POST');
  expect(convertPosts.length).toBe(1);
});

test('SCOPE: Mocked API - Replay envelope revision mismatch is rejected by caller without navigation', async () => {
  const onConvertToOrderSpy = vi.fn();
  let appInstance: ReturnType<typeof useApp> | null = null;
  
  function TestWrapper() {
    appInstance = useApp();
    return <QuotationManager onConvertToOrder={onConvertToOrderSpy} />;
  }

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const defaultResp = defaultFetchHandler(input, init);
    if (defaultResp) return defaultResp;

    const url = String(input);
    if (url.includes(`/api/v1/quotations/${encodeURIComponent(QUOTE_ID)}/convert`)) {
      const corruptedEnvelope = {
        ...canonicalReplayEnvelope,
        source_quotation_updated_at: '2026-10-06T00:00:00.000000Z' // Does not match stored conversion
      };
      return new Response(JSON.stringify(corruptedEnvelope), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes(`/api/v1/orders/${encodeURIComponent(ORDER_ID)}`)) {
      return new Response(JSON.stringify({ status: 'success', data: canonicalOrder }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  });

  await act(async () => {
    root.render(
      <AppProvider>
        <TestWrapper />
      </AppProvider>
    );
  });
  await tick();
  await until(() => appInstance?.quotations?.length === 1);

  // Open History & Click Recover
  const historyBtn = container.querySelector('button[title="ປະຫວັດໃບສະເໜີ"]') as HTMLButtonElement;
  await act(async () => { historyBtn.click(); });
  await tick();

  const openOrderBtn = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('ເປີດອໍເດີທີ່ມີແລ້ວ'));
  expect(openOrderBtn).toBeTruthy();
  await act(async () => { openOrderBtn!.click(); });
  await tick();
  await tick();

  // Assert NO navigation occurred
  expect(onConvertToOrderSpy).not.toHaveBeenCalled();
  expect(appInstance!.activeTab).not.toBe('orders');
  expect(appInstance!.toast?.type).toBe('error');
});

test('SCOPE: Mocked API - Canonical order readback HTTP 503 is rejected by caller without navigation', async () => {
  const onConvertToOrderSpy = vi.fn();
  let appInstance: ReturnType<typeof useApp> | null = null;
  
  function TestWrapper() {
    appInstance = useApp();
    return <QuotationManager onConvertToOrder={onConvertToOrderSpy} />;
  }

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const defaultResp = defaultFetchHandler(input, init);
    if (defaultResp) return defaultResp;

    const url = String(input);
    if (url.includes('/convert')) {
      return new Response(JSON.stringify(canonicalReplayEnvelope), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes(`/api/v1/orders/${encodeURIComponent(ORDER_ID)}`)) {
      return new Response(JSON.stringify({ error: 'Backend storage temporarily unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  });

  await act(async () => {
    root.render(
      <AppProvider>
        <TestWrapper />
      </AppProvider>
    );
  });
  await tick();
  await until(() => appInstance?.quotations?.length === 1);

  const historyBtn = container.querySelector('button[title="ປະຫວັດໃບສະເໜີ"]') as HTMLButtonElement;
  await act(async () => { historyBtn.click(); });
  await tick();

  const openOrderBtn = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('ເປີດອໍເດີທີ່ມີແລ້ວ'));
  expect(openOrderBtn).toBeTruthy();
  await act(async () => { openOrderBtn!.click(); });
  await tick();
  await tick();

  expect(onConvertToOrderSpy).not.toHaveBeenCalled();
  expect(appInstance!.toast?.type).toBe('error');
});

test('SCOPE: Mocked API - Canonical order money mismatch is rejected by caller without navigation', async () => {
  const onConvertToOrderSpy = vi.fn();
  let appInstance: ReturnType<typeof useApp> | null = null;
  
  function TestWrapper() {
    appInstance = useApp();
    return <QuotationManager onConvertToOrder={onConvertToOrderSpy} />;
  }

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const defaultResp = defaultFetchHandler(input, init);
    if (defaultResp) return defaultResp;

    const url = String(input);
    if (url.includes('/convert')) {
      return new Response(JSON.stringify(canonicalReplayEnvelope), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes(`/api/v1/orders/${encodeURIComponent(ORDER_ID)}`)) {
      const mismatchedOrder = { ...canonicalOrder, total_amount_lak: 999 };
      return new Response(JSON.stringify({ status: 'success', data: mismatchedOrder }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('{}', { status: 404 });
  });

  await act(async () => {
    root.render(
      <AppProvider>
        <TestWrapper />
      </AppProvider>
    );
  });
  await tick();
  await until(() => appInstance?.quotations?.length === 1);

  const historyBtn = container.querySelector('button[title="ປະຫວັດໃບສະເໜີ"]') as HTMLButtonElement;
  await act(async () => { historyBtn.click(); });
  await tick();

  const openOrderBtn = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('ເປີດອໍເດີທີ່ມີແລ້ວ'));
  expect(openOrderBtn).toBeTruthy();
  await act(async () => { openOrderBtn!.click(); });
  await tick();
  await tick();

  expect(onConvertToOrderSpy).not.toHaveBeenCalled();
  expect(appInstance!.toast?.type).toBe('error');
});
