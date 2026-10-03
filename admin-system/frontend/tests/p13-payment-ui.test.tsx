import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import OrderReceptionPage from '../src/features/orders/components/OrderReceptionPage';
import { PaymentVerificationTable } from '../src/features/finance/PaymentVerificationTable';
import { useAuthStore } from '../src/store/useAuthStore';

const context = vi.hoisted(() => ({ refreshData: vi.fn(), orders: [{ id: 'cached', status: 'PENDING_PAYMENT', paymentSlipUrl: '/uploads/cached.png' }] }));
vi.mock('../src/store/AppContext', () => ({ useApp: () => context }));
vi.mock('../src/features/orders/components/reception/ArtworkPrepressCard', () => ({ default: () => null }));
vi.mock('../src/features/orders/components/modals/ConfigureWorkflowModal', () => ({ default: () => null }));
vi.mock('../src/features/orders/components/modals/CustomerInvoiceModal', () => ({ default: () => null }));

let root: Root;
let container: HTMLDivElement;
const slip = { id: 'fixture-order', orderNumber: 'FIXTURE-1', customerName: 'Disposable', totalAmount: 100, currency: 'LAK', paymentSlipUrl: '', createdAt: '2026-10-03' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); }
async function mount(node: React.ReactNode = <PaymentVerificationTable />) { await act(async () => root.render(node)); await settle(); }
const button = (text: string) => [...container.querySelectorAll('button')].find(b => b.textContent?.includes(text))!;
async function click(b: HTMLButtonElement) { expect(b).toBeTruthy(); await act(async () => b.click()); }
function transport(review: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, list = json([slip])) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer disposable-payment-ui');
    expect(String(input)).toContain('/api/v1/finance/');
    if (String(input).endsWith('pending-slips')) return list;
    return review(input, init);
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  useAuthStore.setState({ token: 'disposable-payment-ui' });
  context.refreshData.mockReset();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); useAuthStore.setState({ token: null }); vi.restoreAllMocks(); });

test('protected list failure exposes error without local fallback or false empty-success', async () => {
  transport(async () => json({}), json({ error: 'forbidden' }, 403));
  await mount();
  expect(container.querySelector('[role=alert]')?.textContent).toContain('HTTP 403');
  expect(container.textContent).not.toContain('cached');
  expect(container.textContent).not.toContain('ບໍ່ພົບລາຍການລໍຖ້າ');
  expect(container.querySelector('tbody')).toBeNull();
});

test.each([503, 409, 403])('review HTTP%s keeps row, exposes failure and permits retry', async status => {
  transport(async () => json({ status: 'error' }, status)); await mount();
  await click(button('(Approve)')); await settle();
  expect(container.querySelector('tbody')?.textContent).toContain('FIXTURE-1');
  expect(container.querySelector('[role=alert]')?.textContent).toContain(`HTTP ${status}`);
  expect(button('(Approve)').disabled).toBe(false);
  expect(context.refreshData).not.toHaveBeenCalled();
});

test.each([{ status: 'success', orderId: 'other', newStatus: 'PAID_PREPRESS' }, { status: 'success', orderId: slip.id, newStatus: 'IN_PRODUCTION' }, { status: 'error' }])('HTTP200 malformed/mismatched result cannot remove row %#', async result => {
  transport(async () => json(result)); await mount(); await click(button('(Approve)')); await settle();
  expect(container.querySelector('tbody')?.textContent).toContain('FIXTURE-1');
  expect(container.querySelector('[role=alert]')?.textContent).toContain('confirmation is invalid');
  expect(context.refreshData).not.toHaveBeenCalled();
});

test('pending review issues one authenticated decision and removes only committed row', async () => {
  let resolve!: (response: Response) => void;
  const pending = new Promise<Response>(r => { resolve = r; });
  const review = vi.fn(async (_input, init) => { expect(JSON.parse(String(init.body))).toEqual({ order_id: slip.id, status: 'APPROVED' }); return pending; });
  transport(review); await mount();
  const approve = button('(Approve)'); await click(approve); await click(approve);
  expect(review).toHaveBeenCalledTimes(1); expect(approve.disabled).toBe(true);
  expect(container.querySelector('tbody')?.textContent).toContain('FIXTURE-1');
  await act(async () => resolve(json({ status: 'success', orderId: slip.id, newStatus: 'PAID_PREPRESS' }))); await settle();
  expect(container.querySelector('tbody')).toBeNull(); expect(context.refreshData).toHaveBeenCalledTimes(1);
});

test('rejection uses committed server decision before clearing modal', async () => {
  transport(async (_input, init) => { const body = JSON.parse(String(init?.body)); expect(body.order_id).toBe(slip.id); expect(body.status).toBe('REJECTED'); expect(body.rejection_reason).toBeTruthy(); return json({ status: 'success', orderId: slip.id, newStatus: 'PAYMENT_REJECTED' }); });
  await mount(); await click(button('ປະຕິເສດ')); await click(button('ຢືນຢັນປະຕິເສດສລິບ')); await settle();
  expect(container.querySelector('tbody')).toBeNull(); expect(context.refreshData).toHaveBeenCalledTimes(1);
});

function reception(order: Record<string, unknown>, calls = { onUpdatePayment: vi.fn(), handleStatusChange: vi.fn(), showToast: vi.fn() }) {
  return { calls, node: <OrderReceptionPage order={order} onBack={() => {}} onSelectStep={() => {}} formatLAK={n => String(n)} currentLang="en" {...calls} /> };
}
const receptionOrder = () => ({ id: slip.id, orderNo: 'FIXTURE-1', totalAmount: 100, paymentStatus: 'Unpaid', status: 'PENDING_SLIP_CHECK', items: [] });

test('real reception retains unpaid data and shows retry on failed committed review', async () => {
  transport(async () => json({ status: 'error' }, 503));
  const order = receptionOrder(); const original = structuredClone(order); const view = reception(order);
  await mount(view.node); await click(button('Confirm Full 100%')); await settle();
  expect(container.querySelector('[role=alert]')?.textContent).toContain('HTTP 503');
  expect(order).toEqual(original); expect(view.calls.onUpdatePayment).not.toHaveBeenCalled();
  expect(view.calls.handleStatusChange).not.toHaveBeenCalled(); expect(view.calls.showToast).not.toHaveBeenCalled();
  expect(button('Confirm Full 100%').disabled).toBe(false);
});

test('real reception waits for matching server approval before payment UI and never starts production', async () => {
  let resolve!: (response: Response) => void; const pending = new Promise<Response>(r => { resolve = r; });
  const review = vi.fn(async () => pending); transport(review);
  const order = receptionOrder(); const view = reception(order); await mount(view.node);
  await click(button('Confirm Full 100%')); await click(button('Confirm Full 100%'));
  expect(review).toHaveBeenCalledTimes(1); expect(view.calls.onUpdatePayment).not.toHaveBeenCalled();
  await act(async () => resolve(json({ status: 'success', orderId: order.id, newStatus: 'PAID_PREPRESS' }))); await settle();
  expect(view.calls.onUpdatePayment).toHaveBeenCalledWith(order.id, 'Paid', 100, 0);
  expect(view.calls.handleStatusChange).not.toHaveBeenCalled(); expect(context.refreshData).toHaveBeenCalledOnce();
  expect(order.status).toBe('PENDING_SLIP_CHECK');
});

test('partial deposit control cannot approve full authoritative amount or invent a paid result', async () => {
  const fetch = transport(async () => json({})); const order = receptionOrder(); const view = reception(order);
  await mount(view.node); const deposit = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('ຢືນຢັນມັດຈຳ'))!;
  await click(deposit); expect(fetch).not.toHaveBeenCalled(); expect(view.calls.onUpdatePayment).not.toHaveBeenCalled();
  expect(view.calls.showToast).toHaveBeenCalledWith(expect.stringContaining('Partial deposit review is unavailable'), 'warning');
  expect(order.paymentStatus).toBe('Unpaid');
});

test('reception selection change ignores earlier order review completion', async () => {
  let resolve!: (response: Response) => void; const pending = new Promise<Response>(r => { resolve = r; }); transport(async () => pending);
  const first = reception(receptionOrder()); await mount(first.node); await click(button('Confirm Full 100%'));
  const second = reception({ ...receptionOrder(), id: 'fixture-other', orderNo: 'FIXTURE-2' }); await mount(second.node);
  await act(async () => resolve(json({ status: 'success', orderId: slip.id, newStatus: 'PAID_PREPRESS' }))); await settle();
  expect(first.calls.onUpdatePayment).not.toHaveBeenCalled(); expect(second.calls.onUpdatePayment).not.toHaveBeenCalled();
  expect(context.refreshData).not.toHaveBeenCalled(); expect(container.textContent).toContain('FIXTURE-2');
});


test('malformed successful list is shown as unavailable rather than crashing or inventing an empty list', async () => {
  transport(async () => json({}), json([{}])); await mount();
  expect(container.querySelector('[role=alert]')?.textContent).toContain('Invalid payment review list');
  expect(container.querySelector('tbody')).toBeNull();
});

test('failed rejection retains modal, row and visible error without refreshing paid state', async () => {
  transport(async () => json({ status: 'error' }, 500)); await mount();
  await click(button('ປະຕິເສດ')); await click(button('ຢືນຢັນປະຕິເສດສລິບ')); await settle();
  expect(container.querySelector('textarea')).not.toBeNull();
  expect(container.querySelector('[role=alert]')?.textContent).toContain('HTTP 500');
  expect(container.querySelector('tbody')?.textContent).toContain('FIXTURE-1');
  expect(context.refreshData).not.toHaveBeenCalled();
});
