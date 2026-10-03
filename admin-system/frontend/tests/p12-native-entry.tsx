import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import { AppProvider, useApp } from '../src/store/AppContext';
import { LoginPage } from '../src/features/auth/LoginPage';
import { useAuthStore } from '../src/store/useAuthStore';
import { PreflightPage } from '../src/features/production/PreflightPage';
import { PaymentVerificationTable } from '../src/features/finance/PaymentVerificationTable';
import { CustomerInvoiceModal } from '../src/features/orders/components/modals/CustomerInvoiceModal';
import { apiFetch } from '../src/api/client';
import ArtworkPartsPanel from '../src/features/orders/components/ArtworkPartsPanel';
import { ArtworkPrepressCard } from '../src/features/orders/components/reception/ArtworkPrepressCard';
import { ArtworkPreviewCard } from '../src/features/orders/components/production/ArtworkPreviewCard';
import Lightbox, { type LightboxProps } from '../src/features/orders/components/Lightbox';
import QuotationManager from '../src/features/pricing/components/QuotationManager';
import type { ArtworkPart } from '../src/features/orders/types';
import '../src/i18n';

const pdf = (name: string, pages: number): ArtworkPart => {
  const document = new jsPDF();
  for (let page = 1; page <= pages; page++) { if (page > 1) document.addPage(); document.text(`${name} fixture page ${page}`, 12, 20); }
  const bytes = document.output('arraybuffer');
  return { role: name === 'cover' ? 'cover' : 'inner', source: { url: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), name: `${name}_original_ຕົ້ນສະບັບ_long_filename_for_narrow_wrapping.pdf`, size: bytes.byteLength, mimeType: 'application/pdf' }, pageCount: pages, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1, m: 2, y: 3, k: 4 } };
};
const parts = [pdf('cover', 2), pdf('inner', 3)];
const picture = (color: string) => { const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 120; const context = canvas.getContext('2d')!; context.fillStyle = color; context.fillRect(0, 0, 160, 120); return canvas.toDataURL('image/png'); };
const photos = [{ name: 'ຮູບ_first_original.png', url: picture('#0284c7') }, { name: 'ຮູບ_second_original.png', url: picture('#16a34a') }];
const specs = { jobName: 'Disposable native split fixture', artworkParts: parts, fileName: parts[1].source.name, fileSize: parts[1].source.size, artworkUrl: parts[1].source.url, coverArtworkUrl: parts[0].source.url, includeCover: true, pageCount: 3, pagesPerBook: 3, printVolume: 1 };
function Fixture() {
  const [width, setWidth] = useState(false); const [surface, setSurface] = useState('reception'); const [lightbox, setLightbox] = useState<LightboxProps | null>(null);
  return <main style={{ width: width ? 320 : '100%', maxWidth: 1100, margin: 'auto', padding: 12 }}>
    <p>Disposable fixture: generated local PDF/PNG bytes only. All API requests are blocked locally.</p>
    <nav className="flex flex-wrap gap-2 mb-4">{['reception', 'production', 'quotation', 'parts'].map(name => <button type="button" key={name} onClick={() => setSurface(name)} className="border rounded-lg p-2 focus-visible:ring-2">{name}</button>)}<button type="button" onClick={() => setWidth(!width)} className="border rounded-lg p-2">{width ? 'Full width' : '320px'}</button></nav>
    {surface === 'reception' && <ArtworkPrepressCard orderIdDisplay="DISPOSABLE" customerName="Fixture" customerPhone="" items={[{ id: 'split', name: 'Split fixture', artworkParts: parts }, { id: 'batch', name: 'Batch fixture', batch_files: photos }]} currentLang="lo" isArtworkApproved={false} setLightbox={setLightbox} onApproveArtwork={() => {}} onRevertArtwork={() => {}} onOpenDriveLink={() => {}} />}
    {surface === 'production' && <><ArtworkPreviewCard orderIdDisplay="SPLIT" currentLang="lo" order={{ items: [{ artworkParts: parts, inner_file_url: parts[1].source.url, cover_file_url: parts[0].source.url, inner_file_name: parts[1].source.name, cover_file_name: parts[0].source.name }] }} setLightbox={setLightbox} onOpenDriveLink={() => {}} /><ArtworkPreviewCard orderIdDisplay="BATCH" currentLang="lo" order={{ items: [{ batch_files: photos }] }} setLightbox={setLightbox} onOpenDriveLink={() => {}} /></>}
    {surface === 'quotation' && <QuotationManager prefilledSpecs={specs} />}
    {surface === 'parts' && <ArtworkPartsPanel parts={parts} />}
    {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
  </main>;
}
// Connected mode mounts actual production components/callers; fixture controls expose
// missing test entry points only, and do not implement pricing or auth themselves.
function ConnectedContent() {
  const app = useApp();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const [surface, setSurface] = useState('quotation');
  const [lightbox, setLightbox] = useState<LightboxProps | null>(null);
  const [quoteId, setQuoteId] = useState('fixture-legacy');
  const [paymentId, setPaymentId] = useState('fixture-payment-audit');
  const [invoice, setInvoice] = useState(false);
  const [fields, setFields] = useState('{}');
  const [result, setResult] = useState('');
  const [pending, setPending] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    if (pending) return;
    setPending(true);
    try { setResult(JSON.stringify(await action(), null, 2)); }
    catch (error) { setResult(String(error)); }
    finally { setPending(false); }
  };
  return <main className="p-3 max-w-7xl mx-auto">
    <p>Connected disposable session: {user?.username} / {user?.role}. Actual component and caller evidence; viewer tab remains generated-file evidence.</p>
    <nav className="flex flex-wrap gap-2 mb-4">{['quotation', 'preflight', 'orders', 'finance', 'private original', 'viewer', 'fixture controls'].map(name => <button className="border p-2 rounded" key={name} onClick={() => { setSurface(name); if (name === 'quotation' || name === 'preflight') app.setActiveTab(name); }}>{name}</button>)}<button className="border p-2 rounded" onClick={logout}>Logout</button></nav>
    {app.toast && <p role="status">{app.toast.message}</p>}
    {surface === 'private original' ? <><p>BE-seeded private original only; this does not establish the unavailable native upload-to-order chain.</p><button className="border p-2" onClick={() => setLightbox({ src: '/uploads/artworks/sample_document.pdf', fileName: 'sample_document.pdf', fileSize: 361, contentType: 'application/pdf', onClose: () => setLightbox(null) })}>Open actual protected fixture original</button></> : surface === 'finance' ? <PaymentVerificationTable /> : surface === 'orders' ? <section>{app.orders.map(order => <ArtworkPreviewCard key={order.id} orderIdDisplay={String(order.id)} currentLang="lo" order={order} setLightbox={setLightbox} onOpenDriveLink={() => {}} />)}</section> : surface === 'viewer' ? <Fixture /> : surface === 'fixture controls' ? <section>
      <p>Test-only entry for actual AppContext.updateQuotation (manager completion). Enter complete measured snapshot fields and snapshot_completion_reason; no cost calculation occurs here.</p>
      <label>Quotation ID<input aria-label="Fixture quotation ID" value={quoteId} onChange={event => setQuoteId(event.target.value)} /></label>
      <label>Update fields JSON<textarea aria-label="Fixture update fields JSON" className="border w-full h-40" value={fields} onChange={event => setFields(event.target.value)} /></label>
      <button disabled={pending} className="border p-2" onClick={() => run(() => app.updateQuotation(quoteId, JSON.parse(fields)))}>Actual updateQuotation</button>
      <button disabled={pending} className="border p-2" onClick={() => run(() => app.convertQuotationToOrder(quoteId))}>Actual convertQuotationToOrder</button>
      <button disabled={pending} className="border p-2" onClick={() => run(async () => { await app.refreshData(); return 'Refresh complete'; })}>Actual refreshData</button>
      <button disabled={pending} className="border p-2" onClick={() => run(async () => { const response = await apiFetch<Response>('/fixture/restart', { method: 'POST' }); const body = await response.json(); if (!response.ok) throw new Error(JSON.stringify(body)); return body; })}>Restart owned backend</button>
      <label>Disposable payment order ID<input aria-label="Fixture payment ID" value={paymentId} onChange={event => setPaymentId(event.target.value)} /></label>
      {[true, false].map(enabled => <button key={String(enabled)} disabled={pending} className="border p-2" onClick={() => run(async () => { const response = await apiFetch<Response>('/fixture/fault', { method: 'POST', body: JSON.stringify({ stage: 'audit', order_id: paymentId, enabled }) }); const body = await response.json(); if (!response.ok) throw new Error(JSON.stringify(body)); return body; })}>{enabled ? 'Enable owned audit fault' : 'Disable owned audit fault'}</button>)}
      <button disabled={pending} className="border p-2" onClick={() => run(async () => { const response = await apiFetch<Response>(`/fixture/inspect/${encodeURIComponent(paymentId)}`); const body = await response.json(); if (!response.ok) throw new Error(JSON.stringify(body)); return body; })}>Inspect owned payment persistence</button>
      <button disabled={!app.orders.some(order => order.id === paymentId)} className="border p-2" onClick={() => setInvoice(true)}>Open actual customer invoice</button>
      <pre data-testid="fixture-action-result">{result}</pre>
      <details><summary>Authoritative app state (no tokens)</summary><pre data-testid="fixture-app-state">{JSON.stringify({ quotations: app.quotations, orders: app.orders }, null, 2)}</pre></details>
    </section> : app.activeTab === 'quotation' ? <QuotationManager /> : <PreflightPage />}
    {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
    <CustomerInvoiceModal isOpen={invoice} onClose={() => setInvoice(false)} order={app.orders.find(order => order.id === paymentId)} currentLang="lo" />
    {app.confirmDialog && <div role="dialog" aria-modal="true" aria-label="Fixture confirmation" className="fixed inset-0 z-[999999] bg-black/60 flex items-center justify-center"><section className="bg-white p-6 rounded"><p>{app.confirmDialog.message}</p><button className="border p-2" onClick={app.confirmDialog.onCancel}>ຍົກເລີກ</button><button className="border p-2" onClick={app.confirmDialog.onConfirm}>ຢືນຢັນ</button></section></div>}
  </main>;
}
function ConnectedFixture() {
  const authenticated = useAuthStore(state => state.isAuthenticated);
  return authenticated ? <AppProvider><ConnectedContent /></AppProvider> : <LoginPage />;
}
const connected = (import.meta.env as Record<string, unknown>).VITE_NATIVE_CONNECTED === true;
if (connected) {
  // Synthetic calculator inputs in this health-validated fixture origin only.
  // Inventory persistence/bootstrap is outside this minimal backend fixture proof.
  localStorage.setItem('ss_print_inventory_v6', JSON.stringify([{ id: 'contract-paper', name: 'Disposable A4 paper', category: 'Paper', stockQty: 1000, costPerConsumptionUnit: 184, costPerPurchaseUnit: 92000, purchaseMultiplier: 500, batches: [] }]));
  localStorage.setItem('ss_print_customers_v6', JSON.stringify([{ id: 'fixture-customer', name: 'Disposable Phase1 Customer', phone: '02000000000', address: 'Fixture only' }]));
}
createRoot(document.getElementById('root')!).render(connected ? <ConnectedFixture /> : <AppProvider><Fixture /></AppProvider>);
window.addEventListener('pagehide', () => parts.forEach(part => URL.revokeObjectURL(part.source.url)));
