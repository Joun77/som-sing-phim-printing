import { writeFileSync } from 'node:fs';
import { Blob as NodeBlob } from 'node:buffer';
import { createCanvas, DOMMatrix, Path2D, ImageData } from '@napi-rs/canvas';
import { PreflightPage } from '../src/features/production/PreflightPage';
import QuotationManager from '../src/features/pricing/components/QuotationManager';
import ArtworkPartsPanel from '../src/features/orders/components/ArtworkPartsPanel';
import PdfCanvasPreview from '../src/components/common/PdfCanvasPreview';
import ArtworkColorPreviewModal from '../src/features/pricing/components/ArtworkColorPreviewModal';
import { ArtworkPrepressCard } from '../src/features/orders/components/reception/ArtworkPrepressCard';
import { updateArtworkPart } from '../src/features/orders/utils/artworkParts';
import JSZip from 'jszip';
import React, { StrictMode, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { ArtworkPreviewCard } from '../src/features/orders/components/production/ArtworkPreviewCard';
import { CustomerInvoiceModal } from '../src/features/orders/components/modals/CustomerInvoiceModal';
import Lightbox from '../src/features/orders/components/Lightbox';
import { useLightboxAssetController, extractPdfPageCount } from '../src/features/orders/utils/lightboxAssetController';
import { configurePdfWorker, getPdfWorkerSrc } from '../src/lib/pdfWorker';
import { downloadAuthenticatedFile, resolveBackendUrl } from '../src/api/client';
import { useAuthStore } from '../src/store/useAuthStore';
import { PreflightChecker } from '../src/components/PreflightChecker';
import { AppProvider, useApp } from '../src/store/AppContext';
import { mapPreflightToSpecs, mapQuotationItemToOrderItem } from '../src/features/pricing/utils/preflightMapper';
import { QuotationMarginApprovalModal } from '../src/features/pricing/components/QuotationMarginApprovalModal';
import { UniversalExportPreviewModal } from '../src/components/common/UniversalExportPreviewModal';

const pdfLoads = vi.hoisted(() => ({ count: 0 }));
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', async importOriginal => {
  const actual = await importOriginal<typeof import('pdfjs-dist/legacy/build/pdf.mjs')>();
  return { ...actual, getDocument: (options: Parameters<typeof actual.getDocument>[0]) => { pdfLoads.count++; return actual.getDocument(options); } };
});
const analyzer = vi.hoisted(() => ({ pdf: vi.fn(), image: vi.fn() }));
vi.mock('../src/lib/preflightAnalyzer', () => ({ analyzePDFClient: analyzer.pdf, analyzeImageClient: analyzer.image, convertRGBToCMYKCanvas: vi.fn() }));

const pdfOutputs = vi.hoisted(() => [] as { name: string; bytes: Uint8Array }[]);
vi.mock('jspdf', async importOriginal => {
  const actual = await importOriginal<typeof import('jspdf')>();
  const constructor = function (options?: any) {
    const pdf = new actual.jsPDF(options);
    pdf.save = (name: string) => { pdfOutputs.push({ name, bytes: new Uint8Array(pdf.output('arraybuffer')) }); return pdf; };
    return pdf;
  };
  return { ...actual, default: constructor, jsPDF: constructor };
});
function authorize(fixtureToken: string) {
  const previous = useAuthStore.getState().token;
  useAuthStore.setState({ token: fixtureToken });
  return () => useAuthStore.setState({ token: previous });
}

const jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=';
vi.mock('html-to-image', () => ({ toPng: vi.fn(), toJpeg: vi.fn(), toBlob: vi.fn() }));
import { toPng, toJpeg } from 'html-to-image';

let painted: WeakMap<HTMLCanvasElement, ReturnType<typeof createCanvas>>;
let root: Root;
let container: HTMLDivElement;
let seq = 0;
let blobs: Map<string, Blob>;
let revoked: string[];
let downloads: { name: string; href: string; blob?: Blob }[];
const origin = process.env.P12_FIXTURE_ORIGIN!;
let token: string;
const realFetch = globalThis.fetch;
let uploadOverride: ((file: File) => Promise<Response>) | null = null;
let orderPosts: any[] = [];
let quotationPosts: Record<string, unknown>[] = [];
let uploadCalls = 0;
const analysis = (file: File) => ({ file_name: file.name, file_url: image, total_pages: 1, avg_cov_c: 10, avg_cov_m: 20, avg_cov_y: 30, avg_cov_k: 40, color_space: 'CMYK', has_rgb: false, is_standard_cmyk: true, status_badge_lao: 'OK', dpi_estimate: 300, bleed_mm: 3 });

const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(check: () => boolean) {
  for (let i = 0; i < 200; i++) {
    await act(async () => { await tick(); });
    if (check()) return;
  }
  throw new Error(`Timed out: ${document.body.textContent}`);
}
async function render(node: React.ReactNode) { await act(async () => root.render(node)); }
async function click(button: Element) { expect(button).toBeTruthy(); await act(async () => (button as HTMLElement).click()); }
const byTitle = (title: string) => document.querySelector(`button[title="${title}"]`)!;
const downloadButton = () => byTitle('ດາວໂຫຼດຕົ້ນສະບັບ') as HTMLButtonElement;
function deferred<T>() { let resolve!: (v: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

// jsdom File lacks arrayBuffer; FileReader reads its actual bytes without replacing the upload boundary.
async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (file.arrayBuffer) return file.arrayBuffer();
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(file); });
}

beforeAll(async () => {
  Object.assign(globalThis, { DOMMatrix, Path2D, ImageData });
  globalThis.Blob = NodeBlob as typeof Blob;
  URL.createObjectURL = () => '';
  URL.revokeObjectURL = () => {};
  expect(origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  token = (await (await realFetch(`${origin}/fixture/token`)).json()).token;
});
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  pdfLoads.count = 0;
  localStorage.clear();
  localStorage.setItem('ss_print_customers_v6', JSON.stringify([{ id: 'disposable-phase1-customer', name: 'Disposable Phase1 Customer', phone: '02000000000', address: 'Fixture only' }]));
  window.history.replaceState(null, "", "/");
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  painted = new WeakMap();
  blobs = new Map(); revoked = []; downloads = []; pdfOutputs.length = 0;
  uploadOverride = null; orderPosts = []; quotationPosts = []; uploadCalls = 0;
  analyzer.pdf.mockReset(); analyzer.image.mockReset();
  analyzer.pdf.mockImplementation(async (file: File) => ({ ...analysis(file), total_pages: await extractPdfPageCount(await file.arrayBuffer()) }));
  analyzer.image.mockImplementation(async (file: File) => analysis(file));
  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => { const url = `blob:p12-${++seq}`; blobs.set(url, blob); return url; });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(url => { revoked.push(url); });
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    let url = String(input);
    if (url.startsWith('blob:p12-')) { const blob = blobs.get(url); return new Response(blob, { headers: { 'Content-Type': blob!.type } }); }
    if (url.startsWith('/api') || url.startsWith('/uploads')) url = `${origin}${url}`;
    if (url === `${origin}/api/v1/upload/artwork` && init?.body instanceof FormData) {
      uploadCalls++;
      const file = init.body.get('file') as File;
      if (uploadOverride) return uploadOverride(file);
      // jsdom has no native multipart encoder. Adapt only body encoding, not auth,
      // status, endpoint, metadata or bytes; all of those come from production.
      const headers = new Headers(init.headers);
      expect(headers.get('Authorization')).toBe(`Bearer ${token}`);
      const boundary = 'p12-dom-multipart';
      headers.set('Content-Type', `multipart/form-data; boundary=${boundary}`);
      const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`), Buffer.from(await readFileBytes(file)), Buffer.from(`\r\n--${boundary}--\r\n`)]);
      return realFetch(url, { ...init, headers, body });
    }
    if (url === `${origin}/api/orders` && init?.method === 'POST') {
      const response = await realFetch(url, init);
      orderPosts.push({ submitted: JSON.parse(init.body as string), response: await response.clone().json() });
      return response;
    }
    if (url.match(/\/api\/v1\/quotations(?:\/[^/]+)?$/) && ['POST', 'PUT'].includes(init?.method || '')) {
      // Contract stub only. Captured actual caller DTO is joined with BE typed SQL evidence separately.
      const body = JSON.parse(String(init?.body)); quotationPosts.push(body);
      return new Response(JSON.stringify({ ...body, committed: true, created_at: '2026-10-03T00:00:00.000001Z', updated_at: '2026-10-03T00:00:00.000001Z' }));
    }
    if (url.startsWith(`${origin}/api`) && !url.includes('/upload/artwork') && !url.includes('/orders/files/')) {
      // Provider boot/settings/report endpoints are outside the fixture contract.
      // Never forward these to shop services or a business database.
      return new Response(JSON.stringify({ data: [] }), { headers: { 'Content-Type': 'application/json' } });
    }
    return realFetch(url, init);
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
    const native = createCanvas(this.width, this.height); painted.set(this, native);
    const context = native.getContext('2d'); const drawImage = context.drawImage.bind(context);
    context.drawImage = ((source: unknown, ...args: number[]) => Reflect.apply(drawImage, context, [source instanceof HTMLCanvasElement ? painted.get(source)! : source, ...args])) as typeof context.drawImage;
    return context as any;
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { downloads.push({ name: this.download, href: this.href, blob: blobs.get(this.href) }); });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  vi.mocked(toPng).mockResolvedValue(image); vi.mocked(toJpeg).mockResolvedValue(jpeg);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.clearAllMocks(); });

test('browser branch overrides CDN with the installed version’s local worker URL', () => {
  const old = window.Worker;
  Object.defineProperty(window, 'Worker', { value: function Worker() {}, configurable: true });
  const parser = { GlobalWorkerOptions: { workerSrc: 'https://cdn.invalid/worker.js' } };
  configurePdfWorker(parser);
  expect(parser.GlobalWorkerOptions.workerSrc).toBe(getPdfWorkerSrc());
  expect(parser.GlobalWorkerOptions.workerSrc).not.toContain('cdn.invalid');
  Object.defineProperty(window, 'Worker', { value: old, configurable: true });
});

test('mounted production hook under StrictMode: late A, B, empty transition and unmount cleanup', async () => {
  const requests: { url: string; task: ReturnType<typeof deferred<any>> }[] = [];
  const fetchBlobFn = vi.fn((url: string) => { const task = deferred<any>(); requests.push({ url, task }); return task.promise; });
  function Probe({ url }: { url?: string }) {
    const state = useLightboxAssetController({ activeItem: url ? { url, name: url } : undefined, fetchBlobFn, revokeUrlFn: u => revoked.push(u) });
    return <output>{state.loadingStatus}:{state.resolvedBlobUrl}</output>;
  }
  await render(<StrictMode><Probe url="A" /></StrictMode>);
  expect(requests.map(r => r.url)).toEqual(['A', 'A']);
  await render(<StrictMode><Probe url="B" /></StrictMode>);
  expect(requests.map(r => r.url)).toEqual(['A', 'A', 'B']);
  await act(async () => requests[2].task.resolve({ blobUrl: 'blob:B', contentType: 'image/png', size: 1 }));
  expect(container.textContent).toBe('success:blob:B');
  await act(async () => { requests[0].task.resolve({ blobUrl: 'blob:A1' }); requests[1].task.resolve({ blobUrl: 'blob:A2' }); });
  expect(container.textContent).toBe('success:blob:B');
  expect(revoked).toEqual(expect.arrayContaining(['blob:A1', 'blob:A2']));
  await render(<StrictMode><Probe /></StrictMode>);
  expect(container.textContent).toBe('error:'); expect(revoked).toContain('blob:B');
  await render(<StrictMode><Probe url="C" /></StrictMode>);
  await act(async () => root.unmount());
  await act(async () => requests[3].task.resolve({ blobUrl: 'blob:C' }));
  expect(revoked).toContain('blob:C');
  // Give afterEach a fresh root; the tested root above really was unmounted.
  root = createRoot(container);
});

test('mounted Lightbox zoom/rotation/rerender keep fetch stable and revoke on empty transition', async () => {
  const unregister = authorize(token);
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  try {
    const props = { src: `${origin}/uploads/artworks/batch_02.png`, fileName: 'batch_02.png', onClose: () => {} };
    await render(<StrictMode><Lightbox {...props} /></StrictMode>);
    await until(() => !!document.querySelector('img[alt="batch_02.png"]'));
    const count = fetchSpy.mock.calls.length;
    const url = document.querySelector('img[alt="batch_02.png"]')!.getAttribute('src')!;
    await click(byTitle('ຂະຫຍາຍ')); await click(byTitle('ໝຸນຮູບ 90°'));
    expect(document.querySelector('img[alt="batch_02.png"]')!.getAttribute('style')).toContain('rotate(90deg)');
    await render(<StrictMode><Lightbox {...props} /></StrictMode>);
    expect(fetchSpy.mock.calls).toHaveLength(count);
    await render(<StrictMode><Lightbox onClose={props.onClose} /></StrictMode>);
    expect(document.querySelector('img')).toBeNull(); expect(revoked).toContain(url);
    expect(downloadButton()?.disabled ?? true).toBe(true);
  } finally { unregister(); }
});

test('real Go upload response → mounted production PDF Lightbox → original download bytes', async () => {
  const doc = new jsPDF(); doc.text('P1.2 artwork cover', 10, 10); doc.addPage(); doc.text('P1.2 artwork inner', 10, 10);
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  const boundary = 'p12-real-production-upload';
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="master_order_doc.pdf"\r\nContent-Type: application/pdf\r\n\r\n`), Buffer.from(bytes), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const upload = await realFetch(`${origin}/api/upload/artwork`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body });
  expect(upload.status).toBe(200); const metadata = await upload.json();
  expect(metadata.fileName).toBe('master_order_doc.pdf'); expect(metadata.fileSize).toBe(bytes.length);
  expect(metadata.url).toMatch(/^\/uploads\/artworks\/art-/);
  const unregister = authorize(token);
  try {
    const resolved = resolveBackendUrl(metadata.url); expect(resolved).toBe(`${origin}${metadata.url}`);
    function Journey() {
      const [lightbox, setLightbox] = React.useState<any>(null);
      return <><ArtworkPreviewCard orderIdDisplay="P12" currentLang="en" onOpenDriveLink={() => {}}
        order={{ items: [{ artwork_url: metadata.url, artwork_file_name: metadata.fileName }] }} setLightbox={setLightbox} />
        {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}</>;
    }
    await render(<Journey />);
    await until(() => Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('ເບິ່ງຕົວຢ່າງ')));
    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ເບິ່ງຕົວຢ່າງ'))!);
    await until(() => document.body.textContent!.includes('ໜ້າ 1 / 2'));
    const object = document.querySelector('canvas[data-source]')!;
    expect(object.getAttribute('data-source')).toMatch(/^blob:p12-/); expect(object.getAttribute('data-page')).toBe('1'); expect(document.querySelector('object,embed,iframe')).toBeNull();
    await click(byTitle('ໜ້າຖັດໄປ')); expect(object.getAttribute('data-page')).toBe('2');
    expect((byTitle('ໜ້າຖັດໄປ') as HTMLButtonElement).disabled).toBe(true);
    const previewBlob = blobs.get(object.getAttribute('data-source')!)!;
    expect(new Uint8Array(await previewBlob.arrayBuffer())).toEqual(bytes);
    await click(downloadButton()); await until(() => downloads.length === 1);
    // The card supplies known canonical metadata without changing generic-client precedence.
    expect(downloads[0].name).toBe(metadata.fileName);
    expect(new Uint8Array(await downloads[0].blob!.arrayBuffer())).toEqual(bytes);
    expect(document.querySelector('iframe')).toBeNull();
  } finally { unregister(); }
});

test.each(['html', '401', '403', '404'])('mounted production Lightbox shows %s failure and disables download', async scenario => {
  const tokenRes = scenario === '403' ? await (await realFetch(`${origin}/fixture/unauthorized-token`)).json() : null;
  const unregister = authorize(scenario === '401' ? 'invalid.jwt' : tokenRes?.token || token);
  try {
    const url = scenario === 'html' ? `${origin}/fixture/simulate-html-fallback` : `${origin}/uploads/artworks/${scenario === '404' ? 'missing.pdf' : 'sample_document.pdf'}`;
    await render(<Lightbox src={url} fileName="failed.pdf" onClose={() => {}} />);
    await until(() => document.body.textContent!.includes('ຕົ້ນສະບັບເປີດບໍ່ໄດ້'));
    expect(document.querySelector('object,embed,iframe')).toBeNull(); expect(downloadButton().disabled).toBe(true);
    expect(downloads).toHaveLength(0);
  } finally { unregister(); }
});

test('mounted Universal exports invoke PNG/JPEG/PDF callbacks with document DOM and produce filenames/valid PDF', async () => {
  await render(<UniversalExportPreviewModal isOpen onClose={() => {}} title="Invoice" documentNumber="INV/1001" defaultFileName="Invoice test"><article>LO / EN invoice fixture</article></UniversalExportPreviewModal>);
  const exportButton = (kind: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(kind))!;
  await click(exportButton('PNG')); await until(() => downloads.length === 1);
  expect(downloads[0].name).toBe('Invoice_test_INV_1001.png');
  expect(downloads[0].href).toBe(image); expect(new jsPDF().getImageProperties(downloads[0].href)).toMatchObject({ width: 1, height: 1 });
  expect(vi.mocked(toPng).mock.calls[0][0].textContent).toContain('LO / EN invoice fixture');
  expect(vi.mocked(toPng).mock.calls[0][1]).toMatchObject({ pixelRatio: 2.5, backgroundColor: '#ffffff', quality: 1 });
  await click(exportButton('JPEG')); await until(() => downloads.length === 2);
  expect(downloads[1].name).toBe('Invoice_test_INV_1001.jpg');
  expect(downloads[1].href).toBe(jpeg); expect(new jsPDF().getImageProperties(downloads[1].href)).toMatchObject({ width: 1, height: 1 }); expect(toJpeg).toHaveBeenCalledTimes(1);
  await click(exportButton('PDF')); await until(() => pdfOutputs.length === 1);
  expect(pdfOutputs[0].name).toBe('Invoice_test_INV_1001.pdf');
  expect(Buffer.from(pdfOutputs[0].bytes).subarray(0, 5).toString()).toBe('%PDF-');
  expect(Buffer.from(pdfOutputs[0].bytes).toString()).toContain('/Subtype /Image');
  expect(vi.mocked(toPng).mock.calls).toHaveLength(2);
  expect(await extractPdfPageCount(pdfOutputs[0].bytes)).toBe(1);
});


test('mounted CustomerInvoiceModal exports follow actual language and QR toolbar state', async () => {
  const order = { orderNo: '1001', customerName: 'P12 fixture customer', paymentStatus: 'Paid', totalPriceCharged: 10000, items: [] };
  await render(<CustomerInvoiceModal isOpen onClose={() => {}} order={order} currentLang="lo" />);
  const button = (text: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(text))!;
  expect(document.body.textContent).toContain('ໃບເສັດຮັບເງິນ');
  expect(document.querySelector('img[src*="BCELONE_SOM_SING_PRINTING"]')).not.toBeNull();
  await click(button('English (EN)')); await click(button('No QR'));
  expect(document.body.textContent).toContain('OFFICIAL RECEIPT');
  expect(document.querySelector('img[src*="BCELONE_SOM_SING_PRINTING"]')).toBeNull();
  await click(button('PNG')); await until(() => downloads.length === 1);
  expect(downloads[0].name).toBe('Customer_Invoice_1001_INV-1001.png');
  const exported = vi.mocked(toPng).mock.calls[0][0];
  expect(exported.textContent).toContain('OFFICIAL RECEIPT');
  expect(exported.querySelector('img[src*="BCELONE_SOM_SING_PRINTING"]')).toBeNull();
});



function pdfFile(name: string, pages = 1) {
  const doc = new jsPDF();
  for (let i = 1; i <= pages; i++) { if (i > 1) doc.addPage(); doc.text(`${name} page ${i}`, 10, 10); }
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  const file = new File([bytes], name, { type: 'application/pdf' });
  file.arrayBuffer = async () => bytes.slice().buffer;
  return { file, bytes };
}
const buttonText = (text: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(text))!;
const splitSend = () => buttonText('ສົ່ງຂໍ້ມູນແຍກປົກ') as HTMLButtonElement;
const blockedSend = () => Array.from(document.querySelectorAll('button')).filter(b => /Send to Quotation|ສົ່ງຂໍ້ມູນແຍກປົກ/.test(b.textContent || '')).every(b => b.disabled);
async function selectFile(slot: 'single' | 'cover' | 'inner', file: File) {
  const id = slot === 'single' ? 'preflight-file-input' : `checker-split-${slot}-input`;
  const input = document.getElementById(id) as HTMLInputElement;
  expect(input).toBeTruthy();
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
}
async function mountPreflight(callback = vi.fn(), split = true) {
  await render(<AppProvider><PreflightChecker onSendToQuotation={callback} /></AppProvider>);
  if (split) await click(buttonText('ແຍກປົກ & ເນື້ອໃນ'));
  return callback;
}

test('split original PDFs → reused quotation mappers → real AppContext.addOrder → fixture readback → both original previews/downloads', async () => {
  const cover = pdfFile('master_cover.pdf'); const inner = pdfFile('master_inner.pdf', 3);
  const unregister = authorize(token);
  let app: ReturnType<typeof useApp>;
  let payload: any;
  function Journey() { app = useApp(); return <PreflightChecker onSendToQuotation={data => { payload = data; }} />; }
  try {
    await render(<AppProvider><Journey /></AppProvider>);
    await click(buttonText('ແຍກປົກ & ເນື້ອໃນ'));
    await selectFile('cover', cover.file); await selectFile('inner', inner.file);
    await until(() => !splitSend().disabled);
    await click(splitSend());
    expect(payload.file_url).toMatch(/^\/uploads\/artworks\//);
    expect(payload.cover_file_url).toMatch(/^\/uploads\/artworks\//);
    expect(payload.file_url).not.toBe(payload.cover_file_url);
    // The same exported mapping functions are called by QuotationManager.
    const specs = mapPreflightToSpecs(payload, 0);
    expect(specs.fileName).toBe(inner.file.name); expect(specs.fileSize).toBe(inner.bytes.length);
    const orderItem = mapQuotationItemToOrderItem(specs, 0);
    expect(orderItem.cover_file_url).toBe(payload.cover_file_url);
    expect(orderItem.inner_file_url).toBe(payload.file_url);
    expect(orderItem.artwork.preview_thumbnail_url).toBe(image);
    await act(async () => app!.addOrder({ customerName: 'P12 disposable fixture', items: [orderItem], totalPriceCharged: 10000, status: 'Received' }, false));
    await until(() => orderPosts.length === 1);
    const created = orderPosts[0];
    const response = await realFetch(`${origin}/api/v1/orders/${created.response.id}`);
    expect(response.ok).toBe(true); const readback = await response.json();
    expect(readback.items[0].cover_file_url).toBe(payload.cover_file_url);
    expect(readback.items[0].inner_file_url).toBe(payload.file_url);
    // Discard the source objects/provider; only the independent HTTP readback is used.
    payload = null;
    function PreviewJourney() {
      const [lightbox, setLightbox] = React.useState<any>(null);
      return <><ArtworkPreviewCard orderIdDisplay={readback.id} currentLang="en" order={readback} setLightbox={setLightbox} onOpenDriveLink={() => {}} />
        {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}</>;
    }
    await render(<PreviewJourney />);
    await until(() => !!buttonText('ເບິ່ງຕົວຢ່າງ (2)'));
    await click(buttonText('ເບິ່ງຕົວຢ່າງ (2)'));
    await until(() => !!document.querySelector(`span[title="${cover.file.name}"]`));
    await click(document.querySelector(`span[title="${cover.file.name}"]`)!.closest('button')!);
    await until(() => document.body.textContent!.includes('ໜ້າ 1 / 1'));
    let object = document.querySelector('canvas[data-source]')!;
    expect(new Uint8Array(await blobs.get(object.getAttribute('data-source')!)!.arrayBuffer())).toEqual(cover.bytes);
    await click(downloadButton()); await until(() => downloads.length === 1);
    expect(new Uint8Array(await downloads[0].blob!.arrayBuffer())).toEqual(cover.bytes);
    await click(byTitle('ໄຟລ໌ຖັດໄປ (→)'));
    await until(() => document.body.textContent!.includes('ໜ້າ 1 / 3'));
    object = document.querySelector('canvas[data-source]')!;
    expect(new Uint8Array(await blobs.get(object.getAttribute('data-source')!)!.arrayBuffer())).toEqual(inner.bytes);
    await click(byTitle('ໜ້າຖັດໄປ')); await click(byTitle('ໜ້າຖັດໄປ')); expect(object.getAttribute('data-page')).toBe('3');
    expect((byTitle('ໜ້າຖັດໄປ') as HTMLButtonElement).disabled).toBe(true);
    await click(downloadButton()); await until(() => downloads.length === 2);
    expect(new Uint8Array(await downloads[1].blob!.arrayBuffer())).toEqual(inner.bytes);
    await click(byTitle('ໄຟລ໌ກ່ອນ (←)')); await until(() => document.body.textContent!.includes('ໜ້າ 1 / 1'));
    expect(document.querySelector('canvas[data-source]')!.getAttribute('data-page')).toBe('1');
  } finally { unregister(); }
});

test.each(['single', 'cover', 'inner'] as const)('%s upload failure/missing URL clears old result, blocks send, and permits retry of same File', async slot => {
  const unregister = authorize(token);
  try {
    const send = await mountPreflight(vi.fn(), slot !== 'single');
    const { file } = pdfFile(`${slot}_retry.pdf`);
    uploadOverride = async () => new Response('{"error":"fixture failure"}', { status: 500 });
    await selectFile(slot, file);
    await until(() => document.querySelector('[role="alert"]')?.textContent?.includes('500') === true);
    expect(blockedSend()).toBe(true); expect(send).not.toHaveBeenCalled();
    uploadOverride = async () => new Response('{"status":"success"}', { headers: { 'Content-Type': 'application/json' } });
    await click(buttonText(slot === 'single' ? 'Retry upload' : `Retry ${slot} upload`));
    await until(() => document.querySelector('[role="alert"]')?.textContent?.includes('no valid original artwork URL') === true);
    expect(blockedSend()).toBe(true);
    uploadOverride = null;
    await click(buttonText(slot === 'single' ? 'Retry upload' : `Retry ${slot} upload`));
    await until(() => document.querySelector('[role="alert"]') === null);
    await until(() => slot === 'single' ? !!buttonText('Send to Quotation') : container.textContent!.includes('C:10%'));
    if (slot === 'single') { await click(buttonText('Send to Quotation')); expect(send).toHaveBeenCalledOnce(); }
    else { expect(splitSend().disabled).toBe(true); }
    expect(analyzer.pdf.mock.calls.filter(([selected]) => selected === file)).toHaveLength(3);
  } finally { unregister(); }
});

test.each([{ slot: 'cover', status: 200 }, { slot: 'cover', status: 500 }, { slot: 'inner', status: 200 }, { slot: 'inner', status: 500 }] as const)('$slot replacement gates stale $status success/error/finally and clears previously accepted result', async ({ slot, status }) => {
  const unregister = authorize(token);
  try {
    const send = await mountPreflight();
    await selectFile(slot === 'cover' ? 'inner' : 'cover', pdfFile('other.pdf').file);
    await selectFile(slot, pdfFile('accepted.pdf').file);
    await until(() => !splitSend().disabled);
    await click(document.querySelector(`[aria-label="Remove ${slot} file"]`)!);
    expect(splitSend().disabled).toBe(true);
    const oldUpload = deferred<Response>();
    uploadOverride = () => oldUpload.promise;
    await selectFile(slot, pdfFile('old.pdf').file);
    await until(() => uploadCalls === 3);
    await click(document.querySelector(`[aria-label="Remove ${slot} file"]`)!);
    const newUpload = deferred<Response>(); uploadOverride = () => newUpload.promise;
    await selectFile(slot, pdfFile('new.pdf').file);
    await until(() => uploadCalls === 4);
    await act(async () => oldUpload.resolve(new Response(status === 200 ? '{"url":"/uploads/artworks/stale.pdf"}' : '{"error":"late failure"}', { status, headers: { 'Content-Type': 'application/json' } })));
    expect(document.querySelector('[role="alert"]')).toBeNull(); expect(splitSend().disabled).toBe(true);
    expect(container.textContent).toContain('ກຳລັງວິເຄາະ');
    await act(async () => newUpload.resolve(new Response('{"url":"/uploads/artworks/current.pdf"}', { headers: { 'Content-Type': 'application/json' } })));
    await until(() => !splitSend().disabled);
    await click(splitSend());
    const result = send.mock.calls[0][0]; expect(slot === 'cover' ? result.cover_file_url : result.file_url).toBe('/uploads/artworks/current.pdf');
  } finally { unregister(); }
});

test.each(['single', 'cover', 'inner'] as const)('%s reset/removal/unmount invalidates late analysis, progress and upload completion', async slot => {
  const unregister = authorize(token);
  try {
    const send = await mountPreflight(vi.fn(), slot !== 'single');
    const pending = deferred<any>(); analyzer.pdf.mockImplementationOnce(() => pending.promise);
    const selected = pdfFile('late.pdf'); await selectFile(slot, selected.file);
    await click(slot === 'single' ? buttonText('New File') : buttonText('Reset Split'));
    const uploads = vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/upload/artwork')).length;
    await act(async () => pending.resolve(analysis(selected.file)));
    expect(container.textContent).not.toContain('late.pdf'); expect(document.querySelector('[role="alert"]')).toBeNull(); expect(blockedSend()).toBe(true);
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/upload/artwork'))).toHaveLength(uploads);
    const completion = deferred<Response>(); uploadOverride = () => completion.promise;
    await selectFile(slot, pdfFile('unmount.pdf').file);
    await until(() => vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('/upload/artwork')).length === uploads + 1);
    await act(async () => root.unmount()); root = createRoot(container);
    await act(async () => completion.resolve(new Response('{"url":"/uploads/artworks/late.pdf"}', { headers: { 'Content-Type': 'application/json' } })));
    expect(container.textContent).toBe(''); expect(send).not.toHaveBeenCalled();
  } finally { unregister(); }
});


test('single replacement ignores stale upload error/finally and old analysis progress while B scans', async () => {
  const unregister = authorize(token);
  try {
    const send = await mountPreflight(vi.fn(), false);
    const a = pdfFile('A.pdf'); const b = pdfFile('B.pdf');
    const lateUpload = deferred<Response>(); uploadOverride = () => lateUpload.promise;
    let oldProgress: (current: number, total: number, pct: number) => void;
    analyzer.pdf.mockImplementationOnce(async (file, opts) => { oldProgress = opts.onProgress; return analysis(file); });
    await selectFile('single', a.file); await until(() => uploadCalls === 1);
    await click(buttonText('New File'));
    const pendingB = deferred<any>(); analyzer.pdf.mockImplementationOnce((_file, opts) => { opts.onProgress(5, 100, 5); return pendingB.promise; });
    await selectFile('single', b.file);
    await act(async () => { oldProgress!(99, 100, 99); lateUpload.resolve(new Response('{"error":"old failure"}', { status: 500 })); });
    expect(container.textContent).toContain('(5%)'); expect(container.textContent).not.toContain('(99%)');
    expect(document.querySelector('[role="alert"]')).toBeNull(); expect(blockedSend()).toBe(true);
    uploadOverride = null;
    await act(async () => pendingB.resolve(analysis(b.file)));
    await until(() => !!buttonText('Send to Quotation'));
    await click(buttonText('Send to Quotation'));
    expect(send).toHaveBeenCalledOnce(); expect(send.mock.calls[0][0].file_name).toBe(b.file.name);
  } finally { unregister(); }
});

async function uploadOriginal(file: ReturnType<typeof pdfFile>) {
  const boundary = 'p12-parts-original';
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.file.name}"\r\nContent-Type: application/pdf\r\n\r\n`), Buffer.from(file.bytes), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const response = await realFetch(`${origin}/api/upload/artwork`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body });
  expect(response.ok).toBe(true); return response.json();
}
async function selectRole(role: string) {
  await click(Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('1. ຂະໜາດ & ຈຳນວນ'))!);
  await click(Array.from(document.querySelectorAll('[data-testid="quotation-sidebar-artwork-parts"] button')).find(b => b.getAttribute('data-select-artwork-role') === role)!);
}
async function changeInput(label: string, value: string) {
  if(label==='C density') await click(Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('2. ເຈ້ຍ & ການພິມ'))!);
  const element = document.querySelector(`[aria-label="${label}"]`) as HTMLInputElement;
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
  await act(async () => element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })));
}
function pageGraphic(color: string) {
  const doc = new jsPDF({ unit: 'pt', format: [100, 100] });
  doc.setFillColor(color); doc.rect(0, 0, 100, 100, 'F');
  doc.addPage(); doc.setFillColor('#0000ff'); doc.rect(0, 0, 100, 100, 'F');
  return new NodeBlob([doc.output('arraybuffer')], { type: 'application/pdf' });
}

test('actual mounted quotation preserves 176 cover + 392 inner within one persisted job and cover edit leaves inner specs/cost unchanged with shared charges once', async () => {
  const unregister = authorize(token);
  const cover = pdfFile('customer_cover_176.pdf', 176); const inner = pdfFile('customer_inner_392.pdf', 392);
  const [c, i] = await Promise.all([uploadOriginal(cover), uploadOriginal(inner)]);
  const coverResult = { ...analysis(cover.file), total_pages: 176, file_url: c.url, file_size: c.fileSize, target_width_mm: 210, target_height_mm: 297, avg_cov_c: 5, avg_cov_m: 6, avg_cov_y: 7, avg_cov_k: 8 };
  const innerResult = { ...analysis(inner.file), total_pages: 392, file_url: i.url, file_size: i.fileSize, target_width_mm: 148, target_height_mm: 210, avg_cov_c: 11, avg_cov_m: 12, avg_cov_y: 13, avg_cov_k: 14 };
  const specs = mapPreflightToSpecs({ ...innerResult, is_split_cover: true, cover_result: coverResult, inner_result: innerResult, cover_file_url: c.url, cover_file_name: c.fileName }, 0);
  let app: ReturnType<typeof useApp>;
  const converted = vi.fn();
  function QuotationJourney() { app = useApp(); return <QuotationManager prefilledSpecs={specs} onConvertToOrder={converted} />; }
  try {
    await render(<AppProvider><QuotationJourney /></AppProvider>);
    await click(document.querySelector('[data-inspect-artwork-role="inner"]')!);
    await until(() => !!document.querySelector('[data-testid="universal-viewer-embedded"] canvas[data-painted-page="1"]'));
    const sidebarPreview = document.querySelector('[data-testid="universal-viewer-embedded"] canvas[data-source]')!;
    expect(new Uint8Array(await blobs.get(sidebarPreview.getAttribute('data-source')!)!.arrayBuffer())).toEqual(inner.bytes);
    expect(document.querySelectorAll('[data-testid="universal-viewer-embedded"]')).toHaveLength(1);
    await click(buttonText('ປິດໜ້າຕ່າງ'));

    await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
    await until(() => !!document.querySelector('[aria-label="Width mm"]'));
    expect(document.querySelector('section[data-artwork-role="inner"]')!.textContent).toContain('392 ໜ້າ');
    await selectRole('cover');
    expect(document.querySelector('section[data-artwork-role="cover"]')!.textContent).toContain('176 ໜ້າ');
    await selectRole('inner');
    expect(document.querySelector('section[data-artwork-role="inner"]')!.textContent).toContain('392 ໜ້າ');
    await selectRole('cover');
    expect(document.querySelectorAll('section[data-artwork-role="cover"]')).toHaveLength(1);
    const sourceSnapshot = JSON.stringify(specs);
    await click(document.querySelector('[data-testid="quotation-sidebar-artwork-parts"] [data-artwork-action="preview"][data-artwork-role="cover"]')!);
    await until(() => !!document.querySelector('[data-testid="universal-viewer-embedded"] canvas[data-painted-page="1"]'));
    expect(document.querySelectorAll('[data-testid="universal-viewer-embedded"]')).toHaveLength(1);
    expect(document.body.textContent).toContain('Production Specs'); expect(document.body.textContent).toContain('CMYK');
    expect(document.querySelector('object,iframe,embed')).toBeNull();
    const originalCanvas = document.querySelector('[data-testid="quotation-original-preview"] canvas[data-source]')!;
    expect(new Uint8Array(await blobs.get(originalCanvas.getAttribute('data-source')!)!.arrayBuffer())).toEqual(cover.bytes);
    await click(byTitle('ຂະຫຍາຍ')); await until(() => originalCanvas.getAttribute('data-painted-scale') === '1');
    expect(JSON.stringify(specs)).toBe(sourceSnapshot); await click(buttonText('ປິດໜ້າຕ່າງ'));
    expect(document.querySelector('[data-testid="universal-viewer-embedded"]')).toBeNull();

    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ສະຫຼຸບຕົ້ນທຶນ'))!);
    await click(buttonText('Confirm Order')); await until(() => !!app!.confirmDialog);
    await act(async () => app!.confirmDialog.onConfirm()); await until(() => orderPosts.length === 1);
    const before = orderPosts[0].submitted;
    expect(converted.mock.calls[0][0].items[0].specs.artwork_parts.map((p: any) => p.role)).toEqual(['cover', 'inner']);
    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ກຳນົດສະເປັກ'))!);
    await changeInput('Width mm', '222'); await changeInput('C density', '42');
    await selectRole('cover');
    expect((document.querySelector('[aria-label="Width mm"]') as HTMLInputElement).value).toBe('222');
    await selectRole('inner');
    expect((document.querySelector('[aria-label="Width mm"]') as HTMLInputElement).value).toBe('148');
    expect((document.querySelector('[aria-label="Source pages"]') as HTMLInputElement).value).toBe('392');
    expect((document.querySelector('[aria-label="Source pages"]') as HTMLInputElement).readOnly).toBe(true);
    await click(buttonText('2. ເຈ້ຍ & ການພິມ'));
    expect((document.querySelector('[aria-label="C density"]') as HTMLInputElement).value).toBe('11');
    expect(document.querySelector('#sec-phase3')).not.toBeNull();
    expect(document.querySelector('#sec-phase4 input[type="file"]')).toBeNull();
    expect(document.querySelector('#sec-phase4')!.textContent).not.toContain('ໄຟລ໌ພ້ອມພິມ');
    await click(buttonText('3. ຫຼັງພິມ & ວັດຖຸດິບ'));
    expect(document.querySelector('#sec-phase5')).not.toBeNull();
    expect(document.querySelector('#sec-phase6')).not.toBeNull();
    await selectRole('inner');
    const previousQuotes = app!.quotations.length;
    await click(buttonText('ບັນທຶກສະບັບຮ່າງ')); await until(() => app!.quotations.length === previousQuotes + 1);
    expect(app!.quotations[0].items[0].specs.artwork_parts[0].coverage.c).toBe(42);
    await click(buttonText('ປະຫວັດ'));
    await until(() => !!byTitle('ແກ້ໄຂ / ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ'));
    await click(byTitle('ແກ້ໄຂ / ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ'));
    await selectRole('cover');
    await click(Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('2. ເຈ້ຍ & ການພິມ'))!);
    await until(() => !!document.querySelector('[aria-label="C density"]'));
    expect((document.querySelector('[aria-label="C density"]') as HTMLInputElement).value).toBe('42');
    await selectRole('inner');
    expect((document.querySelector('[aria-label="Width mm"]') as HTMLInputElement).value).toBe('148');

    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ສະຫຼຸບຕົ້ນທຶນ'))!);
    await click(buttonText('Confirm Order')); await until(() => !!app!.confirmDialog);
    await act(async () => app!.confirmDialog.onConfirm()); await until(() => orderPosts.length === 2);
    const after = await (await realFetch(`${origin}/api/v1/orders/${orderPosts[1].response.id}`)).json();
    expect(after.items).toHaveLength(1); expect(after.totalPriceCharged).not.toBe(before.totalPriceCharged);
    expect(after.items[0].specs.price_components.parts[1]).toEqual(before.items[0].specs.price_components.parts[1]);
    const components = after.items[0].specs.price_components;
    expect(components.shared.finishingMaterialsCost).toBe(100); // one 2×50 staple material charge for this one-copy job, not twice
    expect(after.items[0].artwork.page_count).toBe(392);
    expect(after.items[0].specs.paper_cutting_tickets.map((t: any) => t.role)).toEqual(['cover', 'inner']);
    const direct = components.parts.reduce((sum: number, p: any) => sum + p.paperCost + p.inkCost + p.machineOverhead, 0) - components.shared.offcutRebate + components.shared.postPressCost + components.shared.finishingMaterialsCost;
    expect(after.items[0].unitCost).toBe(Math.round(direct));
    const parts = after.items[0].specs.artwork_parts;
    expect(parts.map((p: any) => [p.role, p.pageCount])).toEqual([['cover', 176], ['inner', 392]]);
    expect(parts[0].widthMM).toBe(222); expect(parts[0].coverage.c).toBe(42);
    expect(parts[1]).toEqual(before.items[0].specs.artwork_parts[1]);
    expect(parts[0].source.url).toBe(c.url); expect(parts[1].source.url).toBe(i.url);
    expect(after.items[0].specifications.artwork_parts).toEqual(parts);
    for (const [part, original] of [[parts[0], cover], [parts[1], inner]] as const) {
      const response = await realFetch(origin + part.source.url, { headers: { Authorization: `Bearer ${token}` } });
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(original.bytes);
    }
    expect(after.items[0].specs.part_pricing_status).toBe('separate_parts');
    await render(<AppProvider><ArtworkPrepressCard orderIdDisplay={after.id} customerName="Disposable" customerPhone="" items={after.items} isArtworkApproved={false} currentLang="en" onApproveArtwork={() => {}} onRevertArtwork={() => {}} onOpenDriveLink={() => {}} /></AppProvider>);
    expect(document.querySelectorAll('section[data-artwork-role]')).toHaveLength(2);
    expect(document.querySelector('input,select')).toBeNull();
    expect(document.querySelector('[data-testid="cover-print-cost"]')).toBeTruthy();
    expect(document.querySelector('section[data-artwork-role="inner"]')!.textContent).toContain('C11');
    await render(<ArtworkPreviewCard orderIdDisplay={after.id} order={after} currentLang="en" onOpenDriveLink={() => {}} />);
    expect(document.querySelectorAll('section[data-artwork-role]')).toHaveLength(2);
    expect(document.querySelector('[data-testid="inner-print-cost"]')).toBeTruthy();

  } finally { unregister(); }
});

test('mandatory simultaneous part previews and direct downloads use each original, never thumbnails', async () => {
  const unregister = authorize(token);
  const cover = pdfFile('cover_original.pdf', 2); const inner = pdfFile('inner_original.pdf', 3);
  const [c, i] = await Promise.all([uploadOriginal(cover), uploadOriginal(inner)]);
  const result = (file: typeof cover, meta: any, pages: number) => ({ ...analysis(file.file), total_pages: pages, file_url: meta.url, file_size: meta.fileSize, preview_thumbnail_url: image });
  const parts = mapPreflightToSpecs({ ...result(inner, i, 3), is_split_cover: true, cover_result: result(cover, c, 2), inner_result: result(inner, i, 3) }, 0).artworkParts!;
  try {
    await render(<ArtworkPartsPanel parts={parts} />);
    expect(document.querySelectorAll('section[data-artwork-role]')).toHaveLength(2);
    for (const [role, original, pages] of [['cover', cover, 2], ['inner', inner, 3]] as const) {
      await click(document.querySelector(`[data-artwork-action="preview"][data-artwork-role="${role}"]`)!);
      await until(() => document.body.textContent!.includes(`ໜ້າ 1 / ${pages}`));
      await until(() => !!painted.get(document.querySelector('canvas[data-source]')!) && !document.querySelector('[data-testid="pdf-canvas-preview"] [role="status"]'));
      const canvas = document.querySelector('canvas[data-source]')!;
      expect(new Uint8Array(await blobs.get(canvas.getAttribute('data-source')!)!.arrayBuffer())).toEqual(original.bytes);
      expect(document.querySelector('object,embed,iframe')).toBeNull();
      expect(document.querySelectorAll('button[title="ຂະຫຍາຍ"]')).toHaveLength(1);
      await click(byTitle('ຂະຫຍາຍ')); await until(() => canvas.getAttribute('data-scale') === '1');
      await click(byTitle('ໜ້າຖັດໄປ')); await until(() => canvas.getAttribute('data-page') === '2');
      // Closing only the modal keeps both role sections visible.
      await click(document.querySelector('button[title="ປິດ (Esc)"]') || document.querySelector('button[aria-label="Close"]')!);
      await click(document.querySelector(`[data-artwork-action="download"][data-artwork-role="${role}"]`)!);
      await until(() => downloads.length === (role === 'cover' ? 1 : 2));
      expect(new Uint8Array(await downloads.at(-1)!.blob!.arrayBuffer())).toEqual(original.bytes);
    }
  } finally { unregister(); }
});

test('PDF.js canvas paints real page pixels and zoom; source replacement cannot retain previous document', async () => {
  const first = pageGraphic('#ff0000'); const second = pageGraphic('#00ff00');
  await render(<PdfCanvasPreview blob={first as Blob} page={1} scale={1} />);
  await until(() => !container.querySelector('[role="status"]'));
  let canvas = container.querySelector('canvas')!;
  expect(Array.from(painted.get(canvas)!.getContext('2d').getImageData(10, 10, 1, 1).data)).toEqual([255, 0, 0, 255]);
  await render(<PdfCanvasPreview blob={first as Blob} page={2} scale={2} />);
  await until(() => !container.querySelector('[role="status"]'));
  canvas = container.querySelector('canvas')!; expect(canvas.width).toBe(200);
  expect(Array.from(painted.get(canvas)!.getContext('2d').getImageData(10, 10, 1, 1).data)).toEqual([0, 0, 255, 255]);
  await render(<PdfCanvasPreview blob={second as Blob} page={1} scale={1} />);
  await until(() => !container.querySelector('[role="status"]'));
  canvas = container.querySelector('canvas')!;
  expect(Array.from(painted.get(canvas)!.getContext('2d').getImageData(10, 10, 1, 1).data)).toEqual([0, 255, 0, 255]);
});

test('PDF canvas corrupt input and missing context report errors without native viewer fallback', async () => {
  await render(<PdfCanvasPreview blob={new NodeBlob(['corrupt']) as Blob} page={1} scale={1} />);
  await until(() => !!container.querySelector('[role="alert"]'));
  expect(container.querySelector('object,embed,iframe')).toBeNull();
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
  await render(<PdfCanvasPreview blob={pageGraphic('#ff0000') as Blob} page={1} scale={1} />);
  await until(() => container.textContent!.includes('ບໍ່ສາມາດສະແດງ PDF'));
});

test('part settings helper preserves supplied source IDs and immutable originals while single-file mapping stays compatible', () => {
  const original = { ...analysis(pdfFile('inner.pdf').file), file_id: 'actual-supplied-file-id', file_url: '/uploads/artworks/immutable.pdf', total_pages: 3 };
  const single = mapPreflightToSpecs(original, 0); expect(single.artworkParts).toBeUndefined(); expect(single.pageCount).toBe(3);
  const parts = mapPreflightToSpecs({ ...original, is_split_cover: true, cover_result: { ...original, file_id: 'actual-cover-id' }, inner_result: original }, 0).artworkParts!;
  const changed = updateArtworkPart(parts, 'cover', { paperId: 'new-paper', doubleSided: true });
  expect(changed[1]).toBe(parts[1]); expect(changed[0].source).toBe(parts[0].source);
  expect(changed[0].source.fileId).toBe('actual-cover-id'); expect(changed[1].source.fileId).toBe('actual-supplied-file-id');
});

test('PDF canvas late source bytes and unmount are invalidated without stale paint or error', async () => {
  const late = deferred<ArrayBuffer>();
  const oldBlob = pageGraphic('#ff0000');
  oldBlob.arrayBuffer = () => late.promise;
  await render(<PdfCanvasPreview blob={oldBlob as Blob} page={1} scale={1} />);
  expect(container.querySelector('[role="status"]')).toBeTruthy();
  const newBlob = pageGraphic('#00ff00');
  await render(<PdfCanvasPreview blob={newBlob as Blob} page={1} scale={1} />);
  await until(() => !container.querySelector('[role="status"]'));
  await act(async () => late.resolve(await pageGraphic('#ff0000').arrayBuffer()));
  const canvas = container.querySelector('canvas')!;
  expect(Array.from(painted.get(canvas)!.getContext('2d').getImageData(10, 10, 1, 1).data)).toEqual([0, 255, 0, 255]);
  const afterUnmount = deferred<ArrayBuffer>();
  const pending = pageGraphic('#0000ff'); pending.arrayBuffer = () => afterUnmount.promise;
  await render(<PdfCanvasPreview blob={pending as Blob} page={1} scale={1} />);
  await render(null);
  await act(async () => afterUnmount.resolve(await pageGraphic('#0000ff').arrayBuffer()));
  expect(container.querySelector('canvas,[role="alert"]')).toBeNull();
});

test('Lightbox resolves original URL ahead of thumbnail and one toolbar remains for image/PDF', async () => {
  const unregister = authorize(token);
  const file = pdfFile('original_over_thumbnail.pdf', 2); const uploaded = await uploadOriginal(file);
  try {
    await render(<Lightbox photos={[{ name: file.file.name, url: image, originalUrl: uploaded.url, contentType: 'image/png' }]} onClose={() => {}} />);
    await until(() => document.body.textContent!.includes('ໜ້າ 1 / 2'));
    const canvas = document.querySelector('canvas[data-source]')!;
    expect(new Uint8Array(await blobs.get(canvas.getAttribute('data-source')!)!.arrayBuffer())).toEqual(file.bytes);
    expect(document.body.textContent).not.toContain('PDF Vector');
    expect(document.querySelectorAll('button[title="ຂະຫຍາຍ"]')).toHaveLength(1);
    await render(<Lightbox src={image} fileName="image.png" onClose={() => {}} />);
    await until(() => !!document.querySelector('img[alt="image.png"]'));
    expect(document.querySelectorAll('button[title="ຂະຫຍາຍ"]')).toHaveLength(1); expect(document.querySelector('object,embed,iframe')).toBeNull();
  } finally { unregister(); }
});


test('actual PreflightPage navigation sends split originals into mounted quotation sidebar, independent specs and serialized order', async () => {
  const unregister = authorize(token);
  const cover = pdfFile('EnglishVocabulary.pdf', 176), inner = pdfFile('Grammar.pdf', 392);
  let app: ReturnType<typeof useApp>;
  function Navigation() { app = useApp(); return app.activeTab === 'quotation' ? <QuotationManager /> : <PreflightPage />; }
  try {
    await render(<AppProvider><Navigation /></AppProvider>);
    await click(buttonText('ແຍກປົກ & ເນື້ອໃນ'));
    await selectFile('cover', cover.file); await selectFile('inner', inner.file);
    await until(() => !splitSend().disabled); await click(splitSend());
    await until(() => !!buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
    await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
    await until(() => !!document.querySelector('[data-testid="quotation-sidebar-artwork-parts"]'));
    const sidebar = document.querySelector('[data-testid="quotation-sidebar-artwork-parts"]')!;
    expect(sidebar.textContent).toContain('EnglishVocabulary.pdf'); expect(sidebar.textContent).toContain('176 ໜ້າ');
    expect(sidebar.textContent).toContain('Grammar.pdf'); expect(sidebar.textContent).toContain('392 ໜ້າ');
    expect(sidebar.querySelector('img')).toBeNull();
    await changeInput('Width mm', '199');
    await selectRole('inner');
    expect((document.querySelector('[aria-label="Width mm"]') as HTMLInputElement).value).toBe('210');
    await click(sidebar.querySelector('button')!);
    expect(document.querySelector('iframe,object,embed')).toBeNull();
    expect(document.querySelectorAll('section[data-artwork-role]')).toHaveLength(1);
    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ສະຫຼຸບຕົ້ນທຶນ'))!);
    await click(buttonText('Confirm Order')); await until(() => !!app!.confirmDialog);
    await act(async () => app!.confirmDialog.onConfirm());
    await until(() => orderPosts.length === 1);
    const item = orderPosts[0].submitted.items[0];
    const parts = item.specs.artwork_parts;
    expect(parts.map((p: any) => p.pageCount)).toEqual([176,392]);
    expect(parts[0].widthMM).toBe(199); expect(parts[1].widthMM).toBe(210);
    for (const [idx, original] of [cover,inner].entries()) {
      const response = await realFetch(`${origin}${parts[idx].source.url}`, { headers: { Authorization: `Bearer ${token}` } });
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(original.bytes);
    }
  } finally { unregister(); }
});

test('PDF thumbnail selection and direct input select real original pages with bounded sidebar and fit controls', async () => {
  const blob = pageGraphic('#ff0000'); const url = URL.createObjectURL(blob as Blob);
  await render(<Lightbox src={url} fileName="original.pdf" onClose={() => {}} />);
  await until(() => !!document.querySelector('button[aria-label="ໄປໜ້າ PDF 2"]'));
  expect((byTitle('ເບິ່ງເຕັມໜ້າ') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true');
  await click(document.querySelector('button[aria-label="ໄປໜ້າ PDF 2"]')!);
  await until(() => document.querySelector('canvas[data-source]')?.getAttribute('data-painted-page') === '2' && !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  expect(document.querySelector('button[aria-label="ໄປໜ້າ PDF 2"]')!.getAttribute('aria-current')).toBe('page');
  const main = document.querySelector('canvas[data-source]') as HTMLCanvasElement;
  expect(Array.from(painted.get(main)!.getContext('2d').getImageData(10,10,1,1).data)).toEqual([0,0,255,255]);
  await changeInput('ເລກໜ້າ PDF', '1');
  await until(() => main.getAttribute('data-page') === '1');
  await click(byTitle('ເບິ່ງພໍດີຄວາມກວ້າງ')); expect(byTitle('ເບິ່ງພໍດີຄວາມກວ້າງ').getAttribute('aria-pressed')).toBe('true');
  await click(byTitle('ຂະຫຍາຍ')); expect(byTitle('ເບິ່ງພໍດີຄວາມກວ້າງ').getAttribute('aria-pressed')).toBe('false');
  expect(document.querySelector('iframe,object,embed')).toBeNull();
  const large = pdfFile('large.pdf', 176);
  const largeUrl = URL.createObjectURL(new NodeBlob([large.bytes], { type: 'application/pdf' }) as Blob);
  await render(<Lightbox src={largeUrl} fileName="large.pdf" onClose={() => {}} />);
  await until(() => document.body.textContent!.includes('ໜ້າ 1 / 176'));
  expect(document.querySelectorAll('[data-testid="pdf-thumbnail"]').length).toBeLessThanOrEqual(8);
  await changeInput('ເລກໜ້າ PDF', '176');
  await until(() => !!document.querySelector('button[aria-label="ໄປໜ້າ PDF 176"]'));
  expect(document.querySelectorAll('[data-testid="pdf-thumbnail"]').length).toBeLessThanOrEqual(8);
});


test('actual signatures choose PDF/image behaviors over wrong extension and MIME; unsupported binary is download only and HTML fails closed', async () => {
  const original = pageGraphic('#ff0000');
  const pdfUrl = URL.createObjectURL(new NodeBlob([await original.arrayBuffer()], { type: 'image/png' }) as Blob);
  await render(<Lightbox src={pdfUrl} fileName="wrong.png" contentType="image/png" onClose={() => {}} />);
  await until(() => !!document.querySelector('[data-testid="pdf-viewer"]'));
  expect(document.body.textContent).toContain('ເອກະສານ PDF'); expect(byTitle('ໝຸນຮູບ 90°')).toBeNull();
  const pngUrl = URL.createObjectURL(new NodeBlob([Buffer.from(image.split(',')[1], 'base64')], { type: 'application/pdf' }) as Blob);
  await render(<Lightbox src={pngUrl} fileName="wrong.pdf" contentType="application/pdf" onClose={() => {}} />);
  await until(() => !!document.querySelector('img[alt="wrong.pdf"]'));
  expect(document.querySelector('[data-testid="pdf-viewer"]')).toBeNull();
  await click(byTitle('ໝຸນຮູບ 90°'));
  expect(document.querySelector('img[alt="wrong.pdf"]')!.getAttribute('style')).toContain('rotate(90deg)');
  const picture = document.querySelector('img[alt="wrong.pdf"]')!;
  const host = picture.parentElement!;
  await act(async () => { host.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 20 })); });
  await act(async () => { host.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 40, clientY: 60 })); host.dispatchEvent(new MouseEvent('pointerup', { bubbles: true })); });
  expect(picture.getAttribute('style')).toContain('translate(30px, 40px)');
  await act(async () => picture.dispatchEvent(new Event('error')));
  expect(document.body.textContent).toContain('ບໍ່ສາມາດສະແດງຮູບ');
  const unsupported = URL.createObjectURL(new NodeBlob(['II*unsupported TIFF'], { type: 'image/tiff' }) as Blob);
  await render(<Lightbox src={unsupported} fileName="unknown.jpg" contentType="image/jpeg" onClose={() => {}} />);
  await until(() => document.body.textContent!.includes('ບໍ່ຮອງຮັບຕົວຢ່າງ'));
  expect(document.querySelector('img,canvas,iframe,object,embed')).toBeNull(); expect(byTitle('ຂະຫຍາຍ')).toBeNull();
  await click(downloadButton()); await until(() => downloads.length === 1);
  expect(await downloads[0].blob!.text()).toBe('II*unsupported TIFF');
  const htmlUrl = URL.createObjectURL(new NodeBlob(['<!doctype html><html>error</html>'], { type: 'application/pdf' }) as Blob);
  await render(<Lightbox src={htmlUrl} fileName="error.pdf" onClose={() => {}} />);
  await until(() => document.body.textContent!.includes('ຕົ້ນສະບັບເປີດບໍ່ໄດ້'));
  expect(downloadButton().disabled).toBe(true); expect(document.querySelector('canvas,iframe,object,embed')).toBeNull();
});

test('whole-page and width fit retain original page ratio; main canvas uses device pixels', async () => {
  const oldObserver = globalThis.ResizeObserver;
  const oldRatio = window.devicePixelRatio;
  class Observer { constructor(private callback: ResizeObserverCallback) {} observe(target: Element) { this.callback([{ target, contentRect: { width: 232, height: 132 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } unobserve() {} disconnect() {} }
  globalThis.ResizeObserver = Observer as unknown as typeof ResizeObserver;
  Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
  const original = pageGraphic('#ff0000');
  try {
    await render(<PdfCanvasPreview blob={original as Blob} page={1} scale={1} fit="page" />);
    await until(() => !!document.querySelector('canvas') && !(document.querySelector('canvas') as HTMLCanvasElement).hidden);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.width).toBe('100px'); expect(canvas.style.height).toBe('100px'); expect(canvas.width).toBe(200);
    await render(<PdfCanvasPreview blob={original as Blob} page={1} scale={1} fit="width" />);
    await until(() => canvas.width === 400 && !canvas.hidden);
    expect(canvas.style.width).toBe('200px'); expect(canvas.style.height).toBe('200px');
  } finally { globalThis.ResizeObserver = oldObserver; Object.defineProperty(window, 'devicePixelRatio', { value: oldRatio, configurable: true }); }
});


test('actual single PreflightPage navigation retains one original and legacy page count in quotation', async () => {
  const unregister = authorize(token); const original = pdfFile('single_original.pdf', 3);
  function Navigation() { const app = useApp(); return app.activeTab === 'quotation' ? <QuotationManager /> : <PreflightPage />; }
  try {
    await render(<AppProvider><Navigation /></AppProvider>); await selectFile('single', original.file);
    await until(() => !!buttonText('Send to Quotation'));
    await click(buttonText('Send to Quotation'));
    await until(() => !!buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
    expect(document.body.textContent).toContain('single_original.pdf');
    expect(document.body.textContent).toContain('3 ໜ້າ');
    expect(document.querySelector('[data-testid="artwork-parts-panel"]')).toBeNull();
  } finally { unregister(); }
});


test('actual batch PreflightPage client fallback navigation preserves one set with two photos and legacy pricing path', async () => {
  const unregister = authorize(token);
  try {
  const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input).includes('/preflight/batch-analyze') ? new Response('{}', { status: 503 }) : dispatcher(input, init));
  const files = ['photo_one.png', 'photo_two.png'].map(name => new File([Buffer.from(image.split(',')[1], 'base64')], name, { type: 'image/png' }));
  function Navigation() { const app = useApp(); return app.activeTab === 'quotation' ? <QuotationManager /> : <PreflightPage />; }
  await render(<AppProvider><Navigation /></AppProvider>);
  await click(buttonText('ຊຸດໄຟລ໌ (1-100)'));
  const input = document.querySelector('#preflight-batch-input') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  await until(() => !!buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ'));
  await click(buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ'));
  await until(() => !!buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
  expect(document.body.textContent).toContain('Photo Prints');
  expect(document.querySelector('[data-testid="artwork-parts-panel"]')).toBeNull();
  await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
  expect(document.body.textContent).toContain('2');
  expect(document.body.textContent).toContain('1 ຊຸດ');
  } finally { unregister(); }
});


test('one PDF document load per source supplies page count, first page and bounded lazy thumbnails through page/zoom changes', async () => {
  const blob = pageGraphic('#ff0000'); const url = URL.createObjectURL(blob as Blob);
  await render(<Lightbox src={url} fileName="one_document.pdf" onClose={() => {}} />);
  expect(document.body.textContent).not.toContain('ບໍ່ຮອງຮັບຕົວຢ່າງ');
  await until(() => !!document.querySelector('canvas[data-source]') && !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  expect(pdfLoads.count).toBe(1);
  await until(() => !!document.querySelector('button[aria-label="ໄປໜ້າ PDF 2"]'));
  await click(document.querySelector('button[aria-label="ໄປໜ້າ PDF 2"]')!); await click(byTitle('ຂະຫຍາຍ'));
  await until(() => !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  expect(pdfLoads.count).toBe(1);
  const other = URL.createObjectURL(pageGraphic('#00ff00') as Blob);
  await render(<Lightbox src={other} fileName="other.pdf" onClose={() => {}} />);
  await until(() => !!document.querySelector('canvas[data-source]') && !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  expect(pdfLoads.count).toBe(2);
});

test('actual AppContext creates isolated A/B order IDs and snapshots even at the old 10-second collision interval; replace B leaves A readback and original bytes intact', async () => {
  const unregister = authorize(token);
  const a = pdfFile('original_A.pdf', 2), b = pdfFile('original_B.pdf', 3), replacement = pdfFile('replacement_B.pdf', 4);
  const [am,bm,rm] = await Promise.all([uploadOriginal(a),uploadOriginal(b),uploadOriginal(replacement)]);
  const part = (original: typeof a, metadata: typeof am) => ({ role: 'inner' as const, source: { url: metadata.url, name: original.file.name, size: original.bytes.length, mimeType: 'application/pdf' }, pageCount: original === a ? 2 : 3, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1,m: 2,y: 3,k: 4 } });
  let app: ReturnType<typeof useApp>;
  function Probe() { app = useApp(); return null; }
  await render(<AppProvider><Probe /></AppProvider>);
  const clock = vi.spyOn(Date, 'now');
  const aItem = { id: 'fixture-A-item', name: 'A', quantity: 1, artworkUrl: am.url, artworkParts: [part(a,am)], specs: { artwork_parts: [part(a,am)] } };
  try {
    clock.mockReturnValue(1700000012345);
    await act(async () => app!.addOrder({ customerName: 'Disposable A', items: [aItem], status: 'Received' }, false));
    await until(() => orderPosts.length === 1);
    const aId = orderPosts[0].submitted.id;
    const snapshot = JSON.stringify(app!.orders.find((order: any) => order.id === aId));
    aItem.artworkParts[0].source.name = 'mutated editor buffer'; aItem.specs.artwork_parts[0].coverage.c = 99;
    clock.mockReturnValue(1700000022345);
    const bItem = { id: 'fixture-B-item', name: 'B', quantity: 1, artworkUrl: bm.url, artworkParts: [part(b,bm)], specs: { artwork_parts: [part(b,bm)] } };
    await act(async () => app!.addOrder({ customerName: 'Disposable B', items: [bItem], status: 'Received' }, false));
    await until(() => orderPosts.length === 2);
    const bId = orderPosts[1].submitted.id;
    expect(bId).not.toBe(aId);
    const updated = { ...bItem, artworkUrl: rm.url, artworkParts: [{ ...part(replacement,rm), pageCount: 4 }] };
    const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
    const bSnapshot = orderPosts[1].submitted;
    let updateReadback: Promise<Response> | undefined;
    // Existing Go fixture has POST/GET map storage only. Translate this one isolated PUT
    // to fixture map storage; this is transport simulation, never a business handler/DB check.
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      if (String(input) === `/api/v1/orders/${bId}` && init?.method === 'PUT') {
        updateReadback = realFetch(`${origin}/api/v1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bSnapshot, ...JSON.parse(init.body as string), id: bId }) });
        return updateReadback;
      }
      return dispatcher(input, init);
    });
    await act(async () => app!.updateOrderDetails(bId, { items: [updated] }));
    expect(updateReadback).toBeDefined(); await updateReadback;
    updated.artworkParts[0].source.name = 'mutated B buffer';
    const readbackB = await (await realFetch(`${origin}/api/v1/orders/${bId}`)).json();
    expect(readbackB.items[0].artworkParts[0].source.name).toBe('replacement_B.pdf');
    expect(JSON.stringify(app!.orders.find((order: any) => order.id === aId))).toBe(snapshot);
    const readbackA = await (await realFetch(`${origin}/api/v1/orders/${aId}`)).json();
    expect(readbackA.items[0].artworkParts[0].source.name).toBe('original_A.pdf');
    expect(readbackA.items[0].specs.artwork_parts[0].coverage.c).toBe(1);
    const response = await realFetch(`${origin}${readbackA.items[0].artworkParts[0].source.url}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(a.bytes);
    for (const orderId of [bId,aId,bId,aId]) {
      const order = app!.orders.find((value: any) => value.id === orderId)!;
      await render(<AppProvider><ArtworkPrepressCard orderIdDisplay={order.id} customerName="Disposable" customerPhone="" items={order.items} isArtworkApproved={false} currentLang="en" onApproveArtwork={() => {}} onRevertArtwork={() => {}} onOpenDriveLink={() => {}} /></AppProvider>);
      expect(document.body.textContent).toContain(orderId === aId ? 'original_A.pdf' : 'replacement_B.pdf');
      expect(document.body.textContent).not.toContain(orderId === aId ? 'replacement_B.pdf' : 'original_A.pdf');
      const downloaded = downloads.length;
      await click(document.querySelector('[data-artwork-action="download"][data-artwork-role="inner"]')!);
      await until(() => downloads.length === downloaded + 1);
      expect(new Uint8Array(await downloads.at(-1)!.blob!.arrayBuffer())).toEqual(orderId === aId ? a.bytes : replacement.bytes);
    }
  } finally { clock.mockRestore(); unregister(); }
});


test('read-only order panel reused for another order cannot retain the previous original preview; reopening uses that order bytes', async () => {
  const unregister = authorize(token);
  const a = pdfFile('A.pdf',2), b = pdfFile('B.pdf',3);
  const [am,bm] = await Promise.all([uploadOriginal(a),uploadOriginal(b)]);
  const aUrl = am.url, bUrl = bm.url;
  try {
  const part = (url: string, name: string) => ({ role: 'inner' as const, source: { url, name, size: 100, mimeType: 'application/pdf' }, pageCount: 2, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1, m: 2, y: 3, k: 4 } });
  await render(<ArtworkPartsPanel parts={[part(aUrl,'A.pdf')]} />);
  expect(document.querySelector('input,select')).toBeNull();
  await click(document.querySelector('[data-artwork-action="preview"][data-artwork-role="inner"]')!);
  await until(() => !!document.querySelector('canvas[data-source]') && !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  const resolvedA = document.querySelector('canvas[data-source]')!.getAttribute('data-source')!;
  await render(<ArtworkPartsPanel parts={[part(bUrl,'B.pdf')]} />);
  expect(document.querySelector('canvas[data-source]')).toBeNull(); expect(revoked).toContain(resolvedA);
  expect(document.body.textContent).not.toContain('A.pdf');
  await click(document.querySelector('[data-artwork-action="preview"][data-artwork-role="inner"]')!);
  await until(() => !!document.querySelector('canvas[data-source]') && !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  const resolvedB = document.querySelector('canvas[data-source]')!.getAttribute('data-source')!;
  expect(new Uint8Array(await blobs.get(resolvedB)!.arrayBuffer())).toEqual(b.bytes);
  await render(<ArtworkPartsPanel parts={[part(aUrl,'A.pdf')]} />);
  expect(document.querySelector('canvas[data-source]')).toBeNull(); expect(revoked).toContain(resolvedB);
  } finally { unregister(); }
});

import CustomerOrders from '../src/features/orders/components/CustomerOrders';
import '../src/i18n';
for (const stage of ['reception','production'] as const) test(`actual Orders navigation keeps persisted B ${stage} originals after uploaded invoice quotation C creates order C`,async()=>{
  const unregister=authorize(token);let app:ReturnType<typeof useApp>;
  const originalB=pdfFile('B_original.pdf',2),originalC=pdfFile('Customer_Invoice_ord-2285_INV-ord-2285.pdf',3);
  const metadataB=await uploadOriginal(originalB);
  const itemB=mapQuotationItemToOrderItem({id:'B-item',name:'B original job',printVolume:1,pagesPerBook:2,jobWidth:210,jobHeight:297,artworkUrl:metadataB.url,fileName:originalB.file.name,fileSize:originalB.bytes.length,mimeType:'application/pdf',artworkParts:[{role:'inner',source:{url:metadataB.url,name:originalB.file.name,size:originalB.bytes.length,mimeType:'application/pdf'},pageCount:2,widthMM:210,heightMM:297,colorMode:'CMYK',coverage:{c:1,m:2,y:3,k:4}}]},0);
  const savedB={id:'ord-p12-persisted-B',customerName:'B customer',status:'IN_PRODUCTION',paymentStatus:'Paid',totalPriceCharged:10000,items:[itemB],artworkUrl:metadataB.url,artworkFileName:originalB.file.name};
  const stored=await realFetch(`${origin}/api/orders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(savedB)});expect(stored.ok).toBe(true);
  const readB=await (await realFetch(`${origin}/api/v1/orders/${savedB.id}`)).json();
  localStorage.setItem('ss_print_orders_v6',JSON.stringify([readB]));
  Object.defineProperty(HTMLElement.prototype,'scrollIntoView',{value:()=>{},configurable:true});
  function Navigation(){app=useApp();return <><button onClick={()=>app.setActiveTab('preflight')}>Fixture navigation Preflight</button><button onClick={()=>app.setActiveTab('orders')}>Fixture navigation Orders</button>{app.activeTab==='preflight'?<PreflightPage/>:app.activeTab==='quotation'?<QuotationManager/>:<CustomerOrders/>}</>;}
  const openB=async()=>{await until(()=>!!Array.from(document.querySelectorAll('tr')).find(row=>row.textContent?.includes(savedB.id)));const row=Array.from(document.querySelectorAll('tr')).find(row=>row.textContent?.includes(savedB.id))!;await click(row.querySelector('button[title="ເບິ່ງລາຍລະອຽດ"]')!);await tick();if(stage==='reception') await click(buttonText('1. ຮັບອໍເດີ'));};
  try{
    await render(<AppProvider><Navigation/></AppProvider>);await openB();expect(document.body.textContent).toContain('B original job');
    // Exercise invoice export from the actual selected production page before uploading C.
    if(stage==='production'){expect(document.body.textContent).toContain('Step 2: Press & Finishing Tracking');await click(byTitle('ໃບບິນລູກຄ້າ (Invoice / Receipt)'));await click(buttonText('PNG'));await until(()=>downloads.some(d=>d.name.includes('Customer_Invoice')));await click(byTitle('Close (Esc)'));}
    const before=structuredClone(app!.orders.find(order=>order.id===savedB.id));expect(before.items).toEqual(readB.items);
    await click(buttonText('Fixture navigation Preflight'));await selectFile('single',originalC.file);await until(()=>!!buttonText('Send to Quotation'));await click(buttonText('Send to Quotation'));
    await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));await click(Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('ສະຫຼຸບຕົ້ນທຶນ'))!);await click(buttonText('Confirm Order'));await until(()=>!!app!.confirmDialog);await act(async()=>app!.confirmDialog.onConfirm());await until(()=>orderPosts.length===1);
    expect(app!.orders.find(order=>order.id===savedB.id)).toEqual(before);
    await click(buttonText('Fixture navigation Orders'));await openB();
    expect(document.body.textContent).toContain('B original job');expect(document.body.textContent).not.toContain(originalC.file.name);
    if(stage==='production') expect(document.body.textContent).toContain('Step 2: Press & Finishing Tracking');
    expect(document.querySelector('section[data-artwork-role="inner"]')!.textContent).toContain(originalB.file.name);
    const panel=document.querySelector('section[data-artwork-role="inner"]')!;await click(Array.from(panel.querySelectorAll('button')).find(b=>b.textContent?.includes('ດາວໂຫຼດຕົ້ນສະບັບ'))!);await until(()=>downloads.some(d=>d.blob && d.name===originalB.file.name));expect(new Uint8Array(await downloads.find(d=>d.name===originalB.file.name)!.blob!.arrayBuffer())).toEqual(originalB.bytes);
    await click(buttonText('ກັບຄືນ'));
    const cId=orderPosts[0].response.id;const rowC=Array.from(document.querySelectorAll('tr')).find(row=>row.textContent?.includes(cId))!;await click(rowC.querySelector('button[title="ເບິ່ງລາຍລະອຽດ"]')!);await tick();expect(document.body.textContent).toContain('Customer Invoice ord-2285 INV-ord-2285');
    await click(buttonText('ກັບຄືນ'));await openB();expect(document.body.textContent).toContain('B original job');
    // Discard mounted provider and reopen from persisted local and independent fixture HTTP data.
    await render(<div/>);await render(<AppProvider><Navigation/></AppProvider>);await openB();expect(document.body.textContent).toContain('B original job');
    const reloaded=await (await realFetch(`${origin}/api/v1/orders/${savedB.id}`)).json();expect(reloaded.items).toEqual(readB.items);expect(reloaded.items[0].id).toBe('B-item');expect(reloaded.items[0].specs.artwork_parts[0].source.url).toBe(metadataB.url);
  }finally{unregister();}
});

test('simple photo switch reuses existing yield input, divides once and OFF restores the exact legacy price',async()=>{
  const unregister=authorize(token);let app:ReturnType<typeof useApp>;
  const files=['one','two','three'].map(name=>({name:`${name}.png`,url:image,mimeType:'image/png',size:68}));
  const specs={jobName:'Photo Prints',is_batch_photo:true,photoCount:3,pageCount:3,orderQuantity:10,jobSizePreset:'Custom',jobWidth:102,jobHeight:152,useSpoilage:false,batchFiles:files,paperId:'p12-switch-a4',cutsPerSheetOverride:2};
  function Journey(){app=useApp();return <QuotationManager prefilledSpecs={specs}/>;}
  const save=async()=>{const n=app!.quotations.length;await click(buttonText('ບັນທຶກສະບັບຮ່າງ'));await until(()=>app!.quotations.length>n);return structuredClone(app!.quotations[0]);};
  try{
    localStorage.setItem('ss_print_inventory_v6',JSON.stringify([{id:'p12-switch-a4',name:'Fixture A4',category:'paper',stockQty:1000,costPerConsumptionUnit:184,costPerPurchaseUnit:184,purchaseMultiplier:1,batches:[]} ]));
    await render(<AppProvider><Journey/></AppProvider>);await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));expect(document.body.textContent).not.toContain('1-Click:');expect(document.querySelector('[aria-label="Photo sheet layout"]')).toBeNull();
    await click(buttonText('2. ເຈ້ຍ & ການພິມ'));expect(document.querySelector('#sec-phase3')).not.toBeNull();
    const off=await save();expect(off.items[0].specs.paper_cutting_ticket.total_parent_sheets).toBe(15);
    await click(document.querySelector('[aria-label="พิมพ์หลายรูปต่อแผ่น"]')!);expect(document.querySelector('[aria-label="รูปต่อแผ่น"]')).not.toBeNull();
    const four=await save();expect(four.items[0].specs.paper_cutting_ticket.total_parent_sheets).toBe(8);expect(four.items[0].specs.paper_cutting_ticket.cuts_per_parent).toBe(4);
    await changeInput('รูปต่อแผ่น','6');const six=await save();expect(six.items[0].specs.paper_cutting_ticket.total_parent_sheets).toBe(5);expect(six.rawItems[0].cutsPerSheetOverride).toBe(2);expect(six.items[0].specs.multi_image_print).toEqual({enabled:true,images_per_sheet:6});expect(six.rawItems[0].batchFiles).toEqual(files);
    await click(document.querySelector('[aria-label="พิมพ์หลายรูปต่อแผ่น"]')!);const restored=await save();expect(restored.subtotal).toBe(off.subtotal);expect(restored.grandTotal).toBe(off.grandTotal);expect(restored.items[0].specs.paper_cutting_ticket).toEqual(off.items[0].specs.paper_cutting_ticket);expect(restored.rawItems[0].imagesPerSheet).toBe(6);
    await click(buttonText('ປະຫວັດ'));await until(()=>!!byTitle('ແກ້ໄຂ / ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ'));await click(byTitle('ແກ້ໄຂ / ໂຫຼດໃສ່ເຄື່ອງຄິດເລກ'));await click(buttonText('2. ເຈ້ຍ & ການພິມ'));expect((document.querySelector('[aria-label="พิมพ์หลายรูปต่อแผ่น"]') as HTMLInputElement).checked).toBe(false);await click(document.querySelector('[aria-label="พิมพ์หลายรูปต่อแผ่น"]')!);expect((document.querySelector('[aria-label="รูปต่อแผ่น"]') as HTMLInputElement).value).toBe('6');
    await changeInput('รูปต่อแผ่น','4.7');expect((document.querySelector('[aria-label="รูปต่อแผ่น"]') as HTMLInputElement).value).toBe('4');
  }finally{unregister();}
});


test('actual AppProvider API refresh preserves split, single and batch original metadata from server readback', async () => {
  const unregister = authorize(token);
  const original = pdfFile('original_ປົກ_long_name.pdf', 2);
  const meta = await uploadOriginal(original);
  const part = { role: 'cover' as const, source: { url: meta.url, name: original.file.name, size: original.bytes.length, mimeType: 'application/pdf' }, pageCount: 2, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1, m: 2, y: 3, k: 4 } };
  const rawItem = { id: 'metadata-item', artwork_file_name: original.file.name, artwork_file_size: original.bytes.length, artwork_url: meta.url, cover_file_name: original.file.name, cover_file_size: original.bytes.length, cover_file_url: meta.url, specifications: { artwork_parts: [part] }, batch_files: [{ name: original.file.name, url: meta.url, size: original.bytes.length }] };
  const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input) === '/api/v1/orders' ? new Response(JSON.stringify([{ id: 'metadata-order', items: [rawItem] }]), { headers: { 'Content-Type': 'application/json' } }) : dispatcher(input, init));
  let app: ReturnType<typeof useApp>;
  function Probe() { app = useApp(); return null; }
  try {
    await render(<AppProvider><Probe /></AppProvider>);
    await until(() => !!app!.orders.find((order: { id: string }) => order.id === 'metadata-order'));
    const item = app!.orders.find((order: { id: string }) => order.id === 'metadata-order').items[0];
    expect(item.artwork_file_name).toBe(original.file.name);
    expect(item.artwork_file_size).toBe(original.bytes.length);
    expect(item.cover_file_name).toBe(original.file.name);
    expect(item.specifications.artwork_parts[0]).toEqual(part);
    expect(item.batch_files).toEqual(rawItem.batch_files);
    expect(JSON.parse(localStorage.getItem('ss_print_orders_v6')!).find((order: { id: string }) => order.id === 'metadata-order').items[0].artwork_file_size).toBe(original.bytes.length);
  } finally { unregister(); }
});


test('known original-name download opts in without changing default header precedence or original bytes', async () => {
  const unregister = authorize(token); const original = pdfFile('ຕົ້ນສະບັບ.pdf', 2); const meta = await uploadOriginal(original);
  try {
    const standard = await downloadAuthenticatedFile(meta.url, 'fallback.pdf');
    const explicit = await downloadAuthenticatedFile(meta.url, original.file.name, undefined, original.file.name);
    expect(standard.filename).toBe(meta.url.split('/').pop()); expect(explicit.filename).toBe(original.file.name);
    for (const downloaded of downloads) expect(new Uint8Array(await downloaded.blob!.arrayBuffer())).toEqual(original.bytes);
  } finally { unregister(); }
});

test('Lao file cards distinguish unknown and tiny known sizes and production PDFs are fetched only on preview', async () => {
  const unregister = authorize(token); const original = pdfFile('long_original_name_ປົກ.pdf', 2); const meta = await uploadOriginal(original);
  const part = { role: 'inner' as const, source: { url: meta.url, name: original.file.name, size: 0, mimeType: 'application/pdf' }, pageCount: 2, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1,m: 2,y: 3,k: 4 } };
  try {
    await render(<ArtworkPartsPanel parts={[part]} />);
    expect(document.body.textContent).toContain('ບໍ່ຮູ້ຂະໜາດໄຟລ໌'); expect(document.body.textContent).not.toContain('0.00 MB');
    expect(document.querySelector('[data-artwork-action="preview"]')!.textContent).toBe('ເບິ່ງຕົວຢ່າງ');
    expect(document.querySelector('[data-artwork-action="download"] svg')).not.toBeNull();
    await render(<ArtworkPartsPanel parts={[{ ...part, source: { ...part.source, size: 5 } }]} />); expect(document.body.textContent).toContain('5 bytes');
    const before = vi.mocked(globalThis.fetch).mock.calls.length;
    function Journey() { const [preview, setPreview] = React.useState<Record<string, unknown> | null>(null); return <><ArtworkPreviewCard orderIdDisplay="lazy-pdf" currentLang="lo" order={{ items: [{ artwork_url: meta.url, artwork_file_name: original.file.name, artwork_file_size: original.bytes.length }] }} setLightbox={setPreview} onOpenDriveLink={() => {}} />{preview && <Lightbox {...preview} onClose={() => setPreview(null)} />}</>; }
    await render(<Journey />);
    expect(vi.mocked(globalThis.fetch).mock.calls.slice(before).filter(([url]) => String(url).includes(meta.url))).toHaveLength(0);
    expect(document.body.textContent).toContain(original.file.name);
    await click(document.querySelector('[data-artwork-action="preview"]')!);
    await until(() => !!document.querySelector('canvas[data-source]') && !document.querySelector('[data-testid="pdf-canvas-preview"] [role="status"]'));
    expect(new Uint8Array(await blobs.get(document.querySelector('canvas[data-source]')!.getAttribute('data-source')!)!.arrayBuffer())).toEqual(original.bytes);
  } finally { unregister(); }
});

test.each(['flat', 'nested', 'parts', 'conflict', 'mismatch-unknown', 'matching-nested'] as const)('actual AppProvider quotation conversion retains %s original-name and size metadata', async mode => {
  const unregister = authorize(token); const original = pdfFile('saved_original.pdf', 2); const meta = await uploadOriginal(original);
  const cover = pdfFile('saved_cover_original.pdf', 3); const coverMeta = await uploadOriginal(cover);
  const parts = [{ role: 'cover' as const, source: { url: coverMeta.url, name: cover.file.name, size: cover.bytes.length, mimeType: 'application/pdf' }, pageCount: 3, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1,m: 2,y: 3,k: 4 } }, { role: 'inner' as const, source: { url: meta.url, name: original.file.name, size: original.bytes.length, mimeType: 'application/pdf' }, pageCount: 2, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1,m: 2,y: 3,k: 4 } }];
  const metadata = mode === 'parts' ? { specifications: { artwork_parts: parts } } : mode === 'nested' ? { artwork: { file_url: meta.url, file_name: original.file.name, file_size_bytes: original.bytes.length } } : { artwork_url: meta.url, artwork_file_name: original.file.name, artwork_file_size: original.bytes.length };
  const nestedOriginal = { file_url: mode === 'matching-nested' ? meta.url : coverMeta.url, file_name: mode === 'matching-nested' ? original.file.name : cover.file.name, file_size_bytes: mode === 'matching-nested' ? original.bytes.length : cover.bytes.length };
  const selectedMetadata = mode === 'conflict' ? { artwork_url: meta.url, artwork_file_name: original.file.name, artwork_file_size: original.bytes.length, artwork: nestedOriginal } : mode === 'mismatch-unknown' || mode === 'matching-nested' ? { artwork_url: meta.url, artwork: nestedOriginal } : metadata;
  const expectedName = mode === 'mismatch-unknown' ? meta.url.split('/').pop() : original.file.name;
  const expectedSize = mode === 'mismatch-unknown' ? 0 : original.bytes.length;
  const quote = { ...conversionFixture(), id: 'metadata-quote', items: [{ ...conversionFixture().items[0], ...selectedMetadata }] };
  localStorage.setItem('ss_print_quotations_v6', JSON.stringify([quote]));
  const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
    if (String(input).endsWith('/quotations/metadata-quote/convert') && init?.method === 'POST') {
      expect(new Headers(init.headers).get('Authorization')).toBe(`Bearer ${token}`);
      const reply = conversionReply(quote);
      // Canonical server metadata fixture; actual BE save/reader join is separate.
      reply.data.items[0] = { ...reply.data.items[0], artwork_url: meta.url, artwork_file_name: expectedName, artwork_file_size: expectedSize, artwork: { file_url: meta.url, file_name: expectedName, file_size_bytes: expectedSize }, ...(mode === 'parts' ? { specs: { ...reply.data.items[0].specs, artwork_parts: parts }, cover_file_name: cover.file.name, cover_file_size: cover.bytes.length } : {}) };
      const stored = await realFetch(`${origin}/api/v1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reply.data) });
      expect(stored.ok).toBe(true); const persisted = await stored.json();
      orderPosts.push({ submitted: JSON.parse(String(init.body)), response: persisted });
      return new Response(JSON.stringify({ ...reply, order_id: persisted.id, data: persisted }), { status: 201 });
    }
    return dispatcher(input, init);
  });
  let app: ReturnType<typeof useApp>; function Probe() { app = useApp(); return null; }
  try {
    await render(<AppProvider><Probe /></AppProvider>); await act(async () => { await app!.convertQuotationToOrder('metadata-quote'); });
    await until(() => orderPosts.length === 1);
    expect(orderPosts[0].submitted).toEqual({ expected_updated_at: quote.updated_at, expected_total_selling_price: quote.total_selling_price });
    const readback = await (await realFetch(`${origin}/api/v1/orders/${orderPosts[0].response.id}`)).json();
    expect(app!.orders[0].items[0].artworkUrl).toBe(meta.url); expect(app!.orders[0].items[0].artworkFileName).toBe(expectedName); expect(app!.orders[0].items[0].artworkFileSize).toBe(expectedSize);
    expect(readback.items[0].artwork.file_url).toBe(meta.url);
    expect(readback.items[0].artwork.file_name).toBe(expectedName); expect(readback.items[0].artwork.file_size_bytes).toBe(expectedSize);
    expect(new Uint8Array(await (await realFetch(`${origin}${readback.items[0].artwork.file_url}`, { headers: { Authorization: `Bearer ${token}` } })).arrayBuffer())).toEqual(original.bytes);
    if (mode === 'parts') {
      expect(readback.items[0].specs.artwork_parts).toEqual(parts);
      expect(readback.items[0].cover_file_name).toBe(cover.file.name); expect(readback.items[0].cover_file_size).toBe(cover.bytes.length);
      expect(app!.orders[0].items[0].artworkParts).toEqual(parts);
    }
  } finally { unregister(); }
});


test('mounted quotation batch action packages original named bytes with Lao ZIP label', async () => {
  const specs = { jobName: 'ຊຸດຮູບ', is_batch_photo: true, photoCount: 2, pageCount: 2, batchFiles: [{ name: 'original_ຮູບ.png', url: image, size: 68 }, { name: 'second.png', url: image, size: 68 }] };
  await render(<AppProvider><QuotationManager prefilledSpecs={specs} /></AppProvider>);
  await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
  const button = document.querySelector('[data-artwork-action="download"]')!;
  expect(button.textContent).toBe('ດາວໂຫຼດ ZIP'); await click(button); await until(() => downloads.length === 1);
  const zip = await JSZip.loadAsync(Buffer.from(await downloads[0].blob!.arrayBuffer()));
  const entries = Object.values(zip.files).filter(entry => !entry.dir);
  expect(entries.map(entry => entry.name.split('/').pop())).toEqual(['original_ຮູບ.png', 'second.png']);
  const originalBytes = new Uint8Array(await (await realFetch(image)).arrayBuffer());
  for (const entry of entries) expect(await entry.async('uint8array')).toEqual(originalBytes);
});

test('mounted original action shows Lao denial and retry; stale failure cannot overwrite a newly selected source', async () => {
  const makePart = (name: string) => ({ role: 'inner' as const, source: { url: `/uploads/artworks/${name}.pdf`, name: `${name}.pdf`, size: 5, mimeType: 'application/pdf' }, pageCount: 1, widthMM: 210, heightMM: 297, colorMode: 'CMYK', coverage: { c: 1, m: 2, y: 3, k: 4 } });
  const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  const late = deferred<Response>();
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input).includes('stale-A.pdf') ? late.promise : String(input).includes('denied-B.pdf') ? new Response('{}', { status: 403 }) : dispatcher(input, init));
  await render(<ArtworkPartsPanel parts={[makePart('stale-A')]} />);
  await click(document.querySelector('[data-artwork-action="download"]')!);
  expect((document.querySelector('[data-artwork-action="download"]') as HTMLButtonElement).disabled).toBe(true);
  expect(document.body.textContent).toContain('ກຳລັງດາວໂຫຼດ');
  await render(<ArtworkPartsPanel parts={[makePart('denied-B')]} />);
  await act(async () => { late.resolve(new Response('{}', { status: 403 })); });
  expect(document.querySelector('[role="alert"]')).toBeNull();
  await click(document.querySelector('[data-artwork-action="download"]')!);
  await until(() => !!document.querySelector('[role="alert"]'));
  expect(document.querySelector('[role="alert"]')!.textContent).toContain('ກະລຸນາລອງອີກຄັ້ງ');
  expect((document.querySelector('[data-artwork-action="download"]') as HTMLButtonElement).disabled).toBe(false);
});


test('actual production ZIP late failure cannot replace feedback or pending state after switching orders', async () => {
  const order = (prefix: string) => ({ items: [{ batch_files: [{ name: `${prefix}_one.png`, url: image }, { name: `${prefix}_two.png`, url: image }] }] });
  const late = deferred<Response>(); const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  await render(<ArtworkPreviewCard orderIdDisplay="A" currentLang="lo" order={order('A')} onOpenDriveLink={() => {}} />);
  await until(() => !!document.querySelector('[data-testid="artwork-download-btn"]'));
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input) === image ? late.promise : dispatcher(input, init));
  await click(document.querySelector('[data-testid="artwork-download-btn"]')!);
  expect((document.querySelector('[data-testid="artwork-download-btn"]') as HTMLButtonElement).disabled).toBe(true);
  await render(<ArtworkPreviewCard orderIdDisplay="B" currentLang="lo" order={order('B')} onOpenDriveLink={() => {}} />);
  await act(async () => { late.resolve(new Response('{}', { status: 403 })); await new Promise(resolve => setTimeout(resolve, 20)); });
  expect(document.querySelector('[role="alert"]')).toBeNull();
  expect((document.querySelector('[data-testid="artwork-download-btn"]') as HTMLButtonElement).disabled).toBe(false);
  expect(document.body.textContent).toContain('B_one.png'); expect(document.body.textContent).not.toContain('A_one.png');
});


test('actual reception thumbnail exposes Lao native keyboard-focusable preview action and original metadata', async () => {
  const preview = vi.fn();
  await render(<AppProvider><ArtworkPrepressCard orderIdDisplay="thumbnail-fixture" customerName="Disposable" customerPhone="" items={[{ id: 'batch', name: 'ຊຸດຮູບ', batch_files: [{ name: 'first-original.png', url: image }, { name: 'second-original.png', url: image }] }]} currentLang="lo" isArtworkApproved={false} setLightbox={preview} onApproveArtwork={() => {}} onRevertArtwork={() => {}} onOpenDriveLink={() => {}} /></AppProvider>);
  const button = document.querySelector('button[aria-label="ເບິ່ງຕົວຢ່າງຮູບ 2"]') as HTMLButtonElement;
  expect(button).not.toBeNull(); expect(button.tabIndex).toBe(0); button.focus(); expect(document.activeElement).toBe(button);
  expect(button.title).toBe('ເບິ່ງຕົວຢ່າງຮູບ 2'); await until(() => !!button.querySelector('img')); expect(button.querySelector('img')!.alt).toBe('ຮູບ 2');
  await click(button); expect(preview).toHaveBeenCalledTimes(1);
  expect(preview.mock.calls[0][0].initialPhotoIndex).toBe(1); expect(preview.mock.calls[0][0].photos[1].name).toBe('second-original.png');
});


test('actual batch client fallback uploads durable originals through quote save/create/reload instead of persisting local previews', async () => {
  const unregister = authorize(token); const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input).includes('/preflight/batch-analyze') ? new Response('{}', { status: 503 }) : dispatcher(input, init));
  analyzer.image.mockImplementation(async (file: File) => ({ ...analysis(file), file_url: URL.createObjectURL(file) }));
  const bytes = Buffer.from(image.split(',')[1], 'base64'); const files = ['durable_one.png','durable_two.png'].map(name => new File([bytes], name, { type: 'image/png' }));
  let app: ReturnType<typeof useApp>;
  function Navigation() { app = useApp(); return app.activeTab === 'quotation' ? <QuotationManager /> : <PreflightPage />; }
  try {
    await render(<AppProvider><Navigation /></AppProvider>); await click(buttonText('ຊຸດໄຟລ໌ (1-100)'));
    const input = document.querySelector('#preflight-batch-input') as HTMLInputElement; Object.defineProperty(input,'files',{value:files,configurable:true});
    await act(async () => input.dispatchEvent(new Event('change',{bubbles:true})));
    await until(() => !!buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ')); await click(buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ'));
    const customerInput = document.querySelector('input[placeholder="ພິມຄົ້ນຫາຊື່ ຫຼື ພິມຊື່ລູກຄ້າໃໝ່..."]') as HTMLInputElement;
    expect(customerInput).toBeTruthy();
    await act(async () => customerInput.focus());
    const customerOption = Array.from(document.querySelectorAll('div.cursor-pointer')).find(el => el.classList.contains('justify-between') && el.textContent?.includes('Disposable Phase1 Customer'))!;
    await click(customerOption);
    expect(customerInput.value).toBe('Disposable Phase1 Customer');
    await until(() => !!buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ')); await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
    await click(buttonText('ບັນທຶກສະບັບຮ່າງ')); await until(() => app!.quotations.length > 0);
    if (process.env.P12_SAVED_QUOTE_DTO_PATH) writeFileSync(process.env.P12_SAVED_QUOTE_DTO_PATH, JSON.stringify(quotationPosts.at(-1), null, 2) + '\n');
    const saved = app!.quotations[0].rawItems[0].batchFiles;
    expect(saved).toHaveLength(2); for (const file of saved) expect(file.file_url || file.url).toMatch(/^\/uploads\/artworks\//);
    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ສະຫຼຸບຕົ້ນທຶນ'))!);
    await click(buttonText('Confirm Order')); await until(() => !!app!.confirmDialog); await act(async () => app!.confirmDialog.onConfirm()); await until(() => orderPosts.length === 1);
    const outgoing = orderPosts[0].submitted; const submitted = outgoing.items[0];
    // Actual root transport must survive required typed decoder fields too.
    expect(outgoing.customer_name).toBe('Disposable Phase1 Customer'); expect(outgoing.order_no).toBe(outgoing.id);
    expect(outgoing.total_amount_lak).toBe(outgoing.totalPriceCharged);
    expect(outgoing.depositAmountPaid).toBe(0); expect(outgoing.paymentStatus).toBe('Unpaid');
    expect(outgoing.status).toBe('WAITING_DEPOSIT');
    // This assertion is on the real create caller BEFORE the generic fixture map readback.
    expect(submitted.specs.batch_files).toEqual(saved); expect(submitted.specifications.batch_files).toEqual(saved);
    expect(submitted.specs.batch_files.map((file: { mime_type: string }) => file.mime_type)).toEqual(['image/png','image/png']);
    if (process.env.P12_BATCH_DTO_PATH) writeFileSync(process.env.P12_BATCH_DTO_PATH, JSON.stringify(outgoing, null, 2) + '\n');
    const readback = await (await realFetch(`${origin}/api/v1/orders/${orderPosts[0].response.id}`)).json();
    const originals = readback.items[0].specs.batch_files; expect(originals).toHaveLength(2);
    expect(originals.map((file: { file_name: string }) => file.file_name)).toEqual(files.map(file => file.name));
    for (const file of originals) expect(new Uint8Array(await (await realFetch(`${origin}${file.file_url || file.url}`,{headers:{Authorization:`Bearer ${token}`}})).arrayBuffer())).toEqual(new Uint8Array(bytes));
    await render(<div />); blobs.clear();
    await render(<ArtworkPreviewCard orderIdDisplay={readback.id} currentLang="lo" order={readback} onOpenDriveLink={() => {}} />);
    await until(() => !!document.querySelector('img[alt="durable_one.png"]'));
    expect(document.body.textContent).not.toContain('ໄຟລ໌ຊົ່ວຄາວ');
    // Component evidence for supported specs-only shape; actual Go DTO/SQL evidence is separate.
    const specsOnlyItems = readback.items.map((item: Record<string, unknown>) => { const { batch_files, batchFiles, artwork, ...supported } = item; return supported; });
    await render(<AppProvider><ArtworkPrepressCard orderIdDisplay={readback.id} customerName="Disposable" customerPhone="" items={specsOnlyItems} currentLang="lo" isArtworkApproved={false} onApproveArtwork={() => {}} onRevertArtwork={() => {}} onOpenDriveLink={() => {}} /></AppProvider>);
    await until(() => !!document.querySelector('img[alt="ຮູບ 2"]'));
    expect(document.body.textContent).toContain('ຊຸດໄຟລ໌ຮູບພາບ (2 ຮູບ)');
  } finally { unregister(); }
});


async function selectBatchFiles(files: File[]) {
  const input = document.querySelector('#preflight-batch-input') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
}
function photoFile(name: string) { return new File([Buffer.from(image.split(',')[1], 'base64')], name, { type: 'image/png' }); }
function clientBatchFallback() {
  const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input).includes('/preflight/batch-analyze') ? new Response('{}', { status: 503 }) : dispatcher(input, init));
  analyzer.image.mockImplementation(async (file: File) => ({ ...analysis(file), file_url: URL.createObjectURL(file) }));
}
test('batch failed original upload publishes no result or send and same files retry through authenticated durable uploads', async () => {
  const unregister = authorize(token); const send = vi.fn(); clientBatchFallback();
  try {
    await render(<AppProvider><PreflightChecker onSendToQuotation={send} /></AppProvider>);
    await click(buttonText('ຊຸດໄຟລ໌ (1-100)')); const files = [photoFile('retry1.png'), photoFile('retry2.png')];
    uploadOverride = async () => new Response('{}', { status: 500 });
    await selectBatchFiles(files); await until(() => !!document.querySelector('[role="alert"]'));
    expect(buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ')).toBeUndefined(); expect(send).not.toHaveBeenCalled();
    uploadOverride = null; await selectBatchFiles(files); await until(() => !!buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ'));
    await click(buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ')); expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].batch_files.map((file: { file_url: string }) => file.file_url)).toEqual(expect.arrayContaining([expect.stringMatching(/^\/uploads\/artworks\//), expect.stringMatching(/^\/uploads\/artworks\//)]));
  } finally { unregister(); }
});
test('batch reset invalidates pending original upload and cannot publish or upload remaining stale files', async () => {
  const unregister = authorize(token); const send = vi.fn(); clientBatchFallback(); const late = deferred<Response>();
  try {
    uploadOverride = () => late.promise;
    await render(<AppProvider><PreflightChecker onSendToQuotation={send} /></AppProvider>); await click(buttonText('ຊຸດໄຟລ໌ (1-100)'));
    await selectBatchFiles([photoFile('stale1.png'), photoFile('stale2.png')]); await until(() => uploadCalls === 1);
    await click(buttonText('Reset Photos')); await act(async () => { late.resolve(new Response(JSON.stringify({ fileUrl: '/uploads/artworks/stale1.png' }), { headers: { 'Content-Type': 'application/json' } })); await tick(); });
    expect(uploadCalls).toBe(1); expect(send).not.toHaveBeenCalled(); expect(buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ')).toBeUndefined();
    uploadOverride = null; await selectBatchFiles([photoFile('current.png')]); await until(() => !!buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ')); await click(buttonText('ສົ່ງໄປຍັງໃບສະເໜີລາຄາ'));
    expect(send.mock.calls[0][0].batch_files.map((file: { file_name: string }) => file.file_name)).toEqual(['current.png']);
  } finally { unregister(); }
});
test('expired temporary original has Lao explanation, unavailable status and retry; runtime blob remains usable', async () => {
  const expired = 'blob:http://localhost:5174/expired-original'; const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  vi.mocked(globalThis.fetch).mockImplementation((input, init) => String(input) === expired ? Promise.reject(new TypeError('Failed to fetch')) : dispatcher(input, init));
  await render(<Lightbox src={expired} fileName="historic.png" onClose={() => {}} />); await until(() => !!document.querySelector('[role="alert"]'));
  expect(document.querySelector('[role="alert"]')!.textContent).toContain('ໄຟລ໌ຊົ່ວຄາວ'); expect(document.body.textContent).not.toContain('Fetching authenticated');
  expect(document.body.textContent).not.toContain('Download only'); expect(downloadButton().disabled).toBe(true); expect(document.body.textContent).toContain('ບໍ່ຮູ້ຂະໜາດໄຟລ໌');
  expect(byTitle('ປິດ (Esc)').getAttribute('aria-label')).toBe('ປິດ (Esc)'); await click(buttonText('ລອງໃໝ່')); await until(() => !!document.querySelector('[role="alert"]'));
  const bytes = Buffer.from(image.split(',')[1], 'base64'); const active = URL.createObjectURL(new NodeBlob([bytes], { type: 'image/png' }) as Blob);
  await render(<Lightbox src={active} fileName="active.png" onClose={() => {}} />); await until(() => !!document.querySelector('img'));
  expect(document.querySelector('[role="alert"]')).toBeNull(); expect(document.body.textContent).toContain(`${bytes.length} bytes`); expect(downloadButton().disabled).toBe(false);
  await click(downloadButton()); await until(() => downloads.length === 1); expect(new Uint8Array(await downloads[0].blob!.arrayBuffer())).toEqual(new Uint8Array(bytes));
});
test('private reception thumbnail uses protected original with bearer and releases its resolved preview on unmount', async () => {
  const unregister = authorize(token); const bytes = Buffer.from(image.split(',')[1], 'base64');
  try {
    const file = photoFile('private-thumbnail.png'); const body = new FormData(); body.append('file', file);
    // Exercise actual multipart adapter and real protected upload route.
    const response = await fetch(`${origin}/api/v1/upload/artwork`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body }); const metadata = await response.json(); const originalUrl = metadata.url || metadata.fileUrl; expect(originalUrl).toMatch(/^\/uploads\/artworks\//);
    await render(<AppProvider><ArtworkPrepressCard orderIdDisplay="private" customerName="Disposable" customerPhone="" items={[{ id: 'photo', name: 'Photo', batch_files: [{ file_url: originalUrl, file_name: file.name }, { file_url: originalUrl, file_name: file.name }] }]} currentLang="lo" isArtworkApproved={false} onApproveArtwork={() => {}} onRevertArtwork={() => {}} onOpenDriveLink={() => {}} /></AppProvider>);
    await until(() => !!document.querySelector('img[alt="ຮູບ 1"]')); const resolved = document.querySelector('img')!.getAttribute('src')!;
    expect(resolved).toMatch(/^blob:/); expect(new Uint8Array(await blobs.get(resolved)!.arrayBuffer())).toEqual(new Uint8Array(bytes));
    const call = vi.mocked(fetch).mock.calls.find(([input, init]) => String(input) === `${origin}${originalUrl}` && !init?.method)!;
    expect(new Headers(call[1]?.headers).get('Authorization')).toBe(`Bearer ${token}`); await render(<div />); expect(revoked).toContain(resolved);
  } finally { unregister(); }
});
test('consecutive PDF zoom keeps completed canvas visible, commits latest page pixels and loads one original document', async () => {
  const url = URL.createObjectURL(pageGraphic('#ff0000') as Blob);
  await render(<Lightbox src={url} fileName="zoom-original.pdf" onClose={() => {}} />);
  await until(() => !!document.querySelector('canvas[data-source]') && !(document.querySelector('canvas[data-source]') as HTMLCanvasElement).hidden);
  const main = document.querySelector('canvas[data-source]') as HTMLCanvasElement;
  for (let i = 0; i < 5; i++) { await click(byTitle('ຂະຫຍາຍ')); expect(main.hidden).toBe(false); expect(main.width).toBeGreaterThan(0); }
  await until(() => main.dataset.paintedScale === '1.4' && !document.querySelector('[data-testid="pdf-canvas-preview"] [role="status"]'));
  expect(main.width).toBe(140); await click(byTitle('ໜ້າຖັດໄປ')); expect(main.hidden).toBe(false);
  await until(() => main.dataset.paintedPage === '2' && !document.querySelector('[data-testid="pdf-canvas-preview"] [role="status"]'));
  expect(Array.from(painted.get(main)!.getContext('2d').getImageData(10, 10, 1, 1).data)).toEqual([0,0,255,255]); expect(pdfLoads.count).toBe(1);
});


test('quotation inspector original upload shares authenticated durable boundary, failure preserves old source and close invalidates late publication', async () => {
  const unregister = authorize(token); const update = vi.fn(); const sync = vi.fn();
  const item = { id: 'inspector-file', name: 'Inspector', artworkUrl: image, fileName: 'existing.png', mimeType: 'image/png', fileSize: 68, cCoverage: 5, mCoverage: 6, yCoverage: 7, kCoverage: 8 } as React.ComponentProps<typeof ArtworkColorPreviewModal>['item'];
  const props = { isOpen: true, onClose: () => {}, item, onUpdateArtwork: update, onSyncColorsToPrinter: sync, currentLang: 'lo' };
  async function select(file: File) { const input = document.querySelector('input[type="file"][multiple]') as HTMLInputElement; Object.defineProperty(input, 'files', { value: [file], configurable: true }); await act(async () => input.dispatchEvent(new Event('change', { bubbles: true }))); }
  try {
    await render(<ArtworkColorPreviewModal {...props} />); await until(() => !!document.querySelector('[data-testid="universal-viewer-embedded"] img'));
    expect(update).not.toHaveBeenCalled(); expect(sync).not.toHaveBeenCalled(); expect(item!.artworkUrl).toBe(image);
    uploadOverride = async () => new Response('{}', { status: 500 }); const file = photoFile('inspector-durable.png');
    await select(file); await until(() => !!document.querySelector('[role="alert"]')); expect(update).not.toHaveBeenCalled(); expect(item!.artworkUrl).toBe(image);
    uploadOverride = null; await select(file); await until(() => update.mock.calls.length === 1);
    const payload = update.mock.calls[0][0]; expect(payload.artworkUrl).toMatch(/^\/uploads\/artworks\//); expect(payload.fileName).toBe(file.name); expect(payload.fileSize).toBe(file.size);
    await until(() => !!document.querySelector('img[alt="inspector-durable.png"]')); expect(document.querySelector('img[alt="inspector-durable.png"]')!.getAttribute('src')).toMatch(/^blob:/);
    const bytes = await readFileBytes(file); expect(new Uint8Array(await (await realFetch(`${origin}${payload.artworkUrl}`, { headers: { Authorization: `Bearer ${token}` } })).arrayBuffer())).toEqual(new Uint8Array(bytes));
    const late = deferred<Response>(); uploadOverride = () => late.promise;
    await select(photoFile('late-inspector.png')); await until(() => uploadCalls === 3); await render(<ArtworkColorPreviewModal {...props} isOpen={false} />);
    await act(async () => { late.resolve(new Response(JSON.stringify({ fileUrl: '/uploads/artworks/late.png' }), { headers: { 'Content-Type': 'application/json' } })); await tick(); });
    expect(update).toHaveBeenCalledTimes(1); expect(sync).not.toHaveBeenCalled();
  } finally { unregister(); }
});


test('actual quotation mapper snapshots two durable originals in typed direct-create specs and matching specifications', () => {
  const originals = [
    { file_url: '/uploads/artworks/actual-one.png', file_name: 'original-one.png', file_size: 68, mime_type: 'image/png', preview_thumbnail_url: 'data:image/jpeg;base64,preview-only' },
    { file_url: '/uploads/artworks/actual-two.jpg', file_name: 'original-two.jpg', file_size: 420, mime_type: 'image/jpeg' },
  ];
  const item = { id: 'mapper-batch', name: 'Batch', batchFiles: originals, artworkUrl: originals[0].file_url, fileName: originals[0].file_name, fileSize: originals[0].file_size };
  const mapped = mapQuotationItemToOrderItem(item, 0);
  expect(mapped.specs.batch_files).toEqual(originals); expect(mapped.specifications.batch_files).toEqual(originals);
  expect(mapped.batch_files).toEqual(originals); expect(mapped.artwork.batch_files).toEqual(originals);
  expect(mapped.specs.batch_files).not.toBe(originals); expect(mapped.specifications.batch_files).not.toBe(mapped.specs.batch_files);
  mapped.specs.batch_files![0].file_name = 'changed-output-only';
  expect(originals[0].file_name).toBe('original-one.png'); expect(mapped.specifications.batch_files![0].file_name).toBe('original-one.png');
  const legacy = mapQuotationItemToOrderItem({ preflightData: { batch_files: originals } }, 0);
  expect(legacy.specs.batch_files).toEqual(originals);
});


test('actual create caller rejects missing customer before local order publication or POST', async () => {
  let app: ReturnType<typeof useApp>;
  function Probe() { app = useApp(); return null; }
  const unregister = authorize(token);
  try {
    await render(<AppProvider><Probe /></AppProvider>); await tick();
    const previous = structuredClone(app!.orders);
    await act(async () => app!.addOrder({ customerName: '   ', items: [{ name: 'Disposable', quantity: 1 }], totalPriceCharged: 100 }, false));
    expect(orderPosts).toHaveLength(0); expect(app!.orders).toEqual(previous);
  } finally { unregister(); }
});


const snapshotFixture = () => ({ version: 1, currency: 'LAK', total_cost_lak: 1500, final_total_lak: 2600, discounted_subtotal_lak: 2250, tax_amount_lak: 225, shipping_fee_lak: 125, setup_fee_lak: 0, packaging_cost_lak: 0, base_selling_price_lak: 2500, discount_amount_lak: 250, discount_percent: 10, target_margin_percent: 40, metadata: { tax_enabled: true, tax_rate: 10, tax_mode: 'percent', shipping_method: 'fixture' } });
const conversionFixture = () => ({ id: 'phase1-saved-quote', quotation_no: 'FIXTURE-Q1', quotationNumber: 'FIXTURE-Q1', status: 'Draft', customer_name: 'Disposable Phase1 Customer', customerName: 'Disposable Phase1 Customer', total_selling_price: 2600, total_cost: 1500, grandTotal: 99999, updated_at: '2026-10-03T00:00:00.000001Z', commercial_snapshot: snapshotFixture(), items: [{ id: 'saved-job', name: 'Original saved job', quantity: 2, unit_price_lak: 1125, total_price_lak: 2250, unit_cost_lak: 750, unitPrice: 1125, subtotal: 2250, unitCost: 750, artwork_url: '/uploads/artworks/fixture-original.pdf', artwork_file_name: 'fixture-original.pdf', artwork_file_size: 123, specs: { commercial_cost_snapshot: { net_cost_lak: 1500, labor_cost_lak: 0, packaging_delivery_cost_lak: 0, commercial_cost_lak: 1500 } } }] });
async function mountSavedConversion(quote = conversionFixture()) {
  localStorage.setItem('ss_print_quotations_v6', JSON.stringify([quote]));
  let app: ReturnType<typeof useApp>; function Probe() { app = useApp(); return null; }
  await render(<AppProvider><Probe /></AppProvider>); await tick(); return () => app!;
}
function conversionReply(quote = conversionFixture(), replayed = false) {
  const key = `quotation-conversion:${quote.id}`;
  const order = { id: 'canonical-order', order_no: 'ORD-CANONICAL', idempotency_key: key, total_amount_lak: quote.total_selling_price, total_price: quote.total_selling_price, total_cost: quote.total_cost, deposit_lak: 0, deposit_amount: 0, remaining_lak: quote.total_selling_price, status: 'REQUIRES_MANAGER_APPROVAL', overall_status: 'REQUIRES_MANAGER_APPROVAL', items: quote.items.map((item, index) => ({ ...structuredClone(item), id: `canonical-item-${index}`, item_name: item.name, artwork: { file_url: item.artwork_url, file_name: item.artwork_file_name, file_size_bytes: item.artwork_file_size } })) };
  return { status: 'success', committed: true, replayed, quotation_id: quote.id, quotation_status: 'CONVERTED', idempotency_key: key, source_quotation_updated_at: quote.updated_at, approval_required: true, order_id: order.id, order_number: order.order_no, data: order };
}
function conversionTransport(convert: (body: Record<string, unknown>) => Promise<Response>) {
  const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    if (init?.method === 'POST' && (url.endsWith('/api/v1/orders') || url.endsWith('/approve') || url.endsWith('/convert'))) {
      expect(new URL(url, origin).pathname).toBe('/api/v1/quotations/phase1-saved-quote/convert');
      expect(new Headers(init.headers).get('Authorization')).toBe(`Bearer ${token}`);
      expect(new Headers(init.headers).get('Idempotency-Key')).toBe('quotation-conversion:phase1-saved-quote');
      const body = JSON.parse(String(init.body)); requests.push({ url, body }); return convert(body);
    }
    return dispatcher(input, init);
  }); return requests;
}

test.each([403, 500, 503, 422])('canonical saved conversion HTTP%s cannot publish/accept a quote', async status => {
  const unregister = authorize(token); const requests = conversionTransport(async () => new Response(JSON.stringify({ code: status === 422 ? 'quotation_snapshot_incomplete' : 'quotation_operation_failed' }), { status }));
  try { const app = await mountSavedConversion(); const before = structuredClone(app().orders);
    await act(async () => { expect(await app().convertQuotationToOrder('phase1-saved-quote')).toBeNull(); });
    expect(app().orders).toEqual(before); expect(app().quotations[0].status).toBe('Draft'); expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({ expected_updated_at: conversionFixture().updated_at, expected_total_selling_price: 2600 });
  } finally { unregister(); }
});

test.each(['commit', 'quote', 'key', 'id', 'money', 'status', 'items'])('malformed canonical acknowledgment rejects %s without local success', async fault => {
  const unregister = authorize(token); const reply = conversionReply();
  if (fault === 'commit') reply.committed = false;
  if (fault === 'quote') reply.quotation_id = 'other';
  if (fault === 'key') reply.idempotency_key = 'other';
  if (fault === 'id') reply.order_id = 'other';
  if (fault === 'money') reply.data.total_price++;
  if (fault === 'status') reply.data.status = 'WAITING_DEPOSIT';
  if (fault === 'items') reply.data.items = [];
  conversionTransport(async () => new Response(JSON.stringify(reply)));
  try { const app = await mountSavedConversion(); const before = structuredClone(app().orders);
    await act(async () => { expect(await app().convertQuotationToOrder('phase1-saved-quote')).toBeNull(); }); expect(app().orders).toEqual(before); expect(app().quotations[0].status).toBe('Draft');
  } finally { unregister(); }
});

test('canonical conversion preserves document adjustments and server item cost/sale and manager state without auto approval', async () => {
  const unregister = authorize(token); const requests = conversionTransport(async body => { if (process.env.P12_CONVERSION_DTO_PATH) writeFileSync(process.env.P12_CONVERSION_DTO_PATH, JSON.stringify(body, null, 2) + '\n'); return new Response(JSON.stringify(conversionReply()), { status: 201 }); });
  try { const app = await mountSavedConversion();
    await act(async () => { expect(await app().convertQuotationToOrder('phase1-saved-quote')).toBe('canonical-order'); });
    const order = app().orders.find(o => o.id === 'canonical-order')!;
    expect(order.totalPriceCharged).toBe(2600); expect(order.remainingUnpaidBalance).toBe(2600); expect(order.depositAmountPaid).toBe(0); expect(order.paymentStatus).toBe('Unpaid');
    expect(order.status).toBe('REQUIRES_MANAGER_APPROVAL'); expect(order.items[0].totalPrice).toBe(2250); expect(order.items[0].unit_cost_lak).toBe(750);
    expect(order.items[0].artworkFileName).toBe('fixture-original.pdf'); expect(order.items[0].artworkFileSize).toBe(123);
    expect(app().quotations[0].status).toBe('CONVERTED'); expect(app().quotations[0].status).not.toBe('Accepted'); expect(requests).toHaveLength(1);
    expect(requests[0].body).not.toHaveProperty('items'); expect(requests[0].body).not.toHaveProperty('deposit_lak');
  } finally { unregister(); }
});

test('timeout, pending duplicate and reload retry keep one canonical source/key and consume authoritative replay payments', async () => {
  const unregister = authorize(token); const pending = deferred<Response>(); let calls = 0;
  const requests = conversionTransport(async () => { calls++; if (calls === 1) return pending.promise; const reply = conversionReply(undefined, true); reply.data.deposit_lak = 100; reply.data.deposit_amount = 100; reply.data.remaining_lak = 2500; return new Response(JSON.stringify(reply)); });
  try { let app = await mountSavedConversion(); let first: Promise<string | null>;
    await act(async () => { first = app().convertQuotationToOrder('phase1-saved-quote'); });
    await act(async () => { expect(await app().convertQuotationToOrder('phase1-saved-quote')).toBeNull(); }); expect(requests).toHaveLength(1);
    await act(async () => { pending.resolve(new Response('{}', { status: 500 })); await first!; }); expect(app().quotations[0].status).toBe('Draft');
    await render(<div />); app = await mountSavedConversion();
    await act(async () => { expect(await app().convertQuotationToOrder('phase1-saved-quote')).toBe('canonical-order'); });
    expect(requests[1].body).toEqual(requests[0].body); expect(app().orders.filter(o => o.id === 'canonical-order')).toHaveLength(1);
    expect(app().orders.find(o => o.id === 'canonical-order')?.depositAmountPaid).toBe(100);
    expect(app().orders.find(o => o.id === 'canonical-order')?.remainingUnpaidBalance).toBe(2500);
  } finally { unregister(); }
});

test('existing generic conversion conflict remains visibly reconciliation pending and never navigates', async () => {
  const unregister = authorize(token); const requests = conversionTransport(async () => new Response(JSON.stringify({ code: 'existing_conversion_requires_review', existing_order_id: 'existing-order' }), { status: 409 }));
  localStorage.setItem('ss_print_quotations_v6', JSON.stringify([conversionFixture()]));
  let app: ReturnType<typeof useApp>; const onConverted = vi.fn(); function Journey() { app = useApp(); return <QuotationManager onConvertToOrder={onConverted} />; }
  try { await render(<AppProvider><Journey /></AppProvider>); await click(byTitle('ປະຫວັດໃບສະເໜີ')); await click(buttonText('ປ່ຽນເປັນອໍເດີ →')); await until(() => !!app!.confirmDialog); await act(async () => app!.confirmDialog.onConfirm());
    expect(onConverted).not.toHaveBeenCalled(); expect(app!.quotations[0].status).toBe('Draft'); expect(app!.quotations[0].pendingConversionOrderId).toBe('existing-order'); expect(document.body.textContent).toContain('existing-order'); expect(requests).toHaveLength(1);
  } finally { unregister(); }
});

test('canonical reload overrides stale cached money aliases including zero and ignores cached editor sale', async () => {
  const unregister = authorize(token); const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  const quote = conversionFixture(); localStorage.setItem('ss_print_quotations_v6', JSON.stringify([{ ...quote, totalCost: 9999, shippingFee: 999, discountPercent: 99 }]));
  const server = { ...quote, total_cost: 0, shipping_fee: 0, discount_percent: 0, overall_profit_percent: 0, commercial_snapshot: { ...snapshotFixture(), total_cost_lak: 0, shipping_fee_lak: 0 } };
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => String(input) === '/api/v1/quotations' && !init?.method ? new Response(JSON.stringify([server])) : dispatcher(input, init));
  let app: ReturnType<typeof useApp>; function Probe() { app = useApp(); return null; }
  try { await render(<AppProvider><Probe /></AppProvider>); await until(() => app!.quotations[0]?.grandTotal === 2600); expect(app!.quotations[0].totalCost).toBe(0); expect(app!.quotations[0].shippingFee).toBe(0); expect(app!.quotations[0].discountPercent).toBe(0); expect(app!.quotations[0].profitMargin).toBe(0); } finally { unregister(); }
});

test.each([500, 200])('real draft save failure/malformed HTTP%s stays in editor, then same-ID authenticated retry commits full computed snapshot', async status => {
  const unregister = authorize(token); const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!; const bodies: Record<string, unknown>[] = []; let fail = true;
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
    if (new URL(String(input), origin).pathname === '/api/v1/quotations' && init?.method === 'POST') { expect(new Headers(init.headers).get('Authorization')).toBe(`Bearer ${token}`); const body = JSON.parse(String(init.body)); bodies.push(body); if (fail) return new Response('{}', { status }); return dispatcher(input, init); }
    return dispatcher(input, init);
  });
  const specs = { jobName: 'Saved real fixture', pageCount: 3, orderQuantity: 2, paperId: 'contract-paper', useSpoilage: false };
  let app: ReturnType<typeof useApp>; function Journey() { app = useApp(); return <QuotationManager prefilledSpecs={specs} />; }
  try { localStorage.setItem('ss_print_inventory_v6', JSON.stringify([{ id: 'contract-paper', name: 'Fixture A4', category: 'Paper', stockQty: 1000, costPerConsumptionUnit: 184, costPerPurchaseUnit: 92000, purchaseMultiplier: 500, batches: [] }])); await render(<AppProvider><Journey /></AppProvider>); await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ'));
    const count = app!.quotations.length; await click(buttonText('ບັນທຶກສະບັບຮ່າງ')); await tick(); expect(app!.quotations).toHaveLength(count); expect(app!.toast?.message).toContain('ບັນທຶກບໍ່ສຳເລັດ');
    fail = false; await click(buttonText('ບັນທຶກສະບັບຮ່າງ')); await until(() => app!.quotations.length > count);
    expect(bodies[1].id).toBe(bodies[0].id); const body = bodies[1]; const snapshot = body.commercial_snapshot as Record<string, number>;
    expect(body.total_cost).toBe(snapshot.total_cost_lak); expect(snapshot.total_cost_lak).toBeGreaterThan(0); expect(body.total_selling_price).toBe(snapshot.final_total_lak);
    const item = (body.items as Record<string, unknown>[])[0]; const costs = (item.specs as Record<string, unknown>).commercial_cost_snapshot as Record<string, number>;
    expect(item.unit_cost_lak).toBe(Math.round(costs.net_cost_lak / Number(item.quantity))); expect(costs.commercial_cost_lak).toBe(costs.net_cost_lak + costs.labor_cost_lak + costs.packaging_delivery_cost_lak);
    expect(item.subtotal).toBe(item.total_price_lak); expect((item.specs as Record<string, unknown>)._somsing_quote_snapshot).toBeUndefined();
    expect(app!.quotations[0].updated_at).toBe('2026-10-03T00:00:00.000001Z');
  } finally { unregister(); }
});


test('actual confirm-save then history revision failure/retry and canonical conversion use one committed computed snapshot', async () => {
  const unregister = authorize(token); const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!;
  const saves: { method: string; body: Record<string, unknown> }[] = []; const conversions: Record<string, unknown>[] = []; let failUpdate = false;
  let app: ReturnType<typeof useApp>; const onConverted = vi.fn();
  const specs = { jobName: 'Confirm-save actual caller', pageCount: 3, orderQuantity: 2, paperId: 'contract-paper', useSpoilage: false, artworkUrl: '/uploads/artworks/fixture-original.pdf', fileName: 'fixture-original.pdf', fileSize: 123 };
  function Journey() { app = useApp(); return <QuotationManager prefilledSpecs={specs} onConvertToOrder={onConverted} />; }
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
    const path = new URL(String(input), origin).pathname;
    if (path.includes('/quotations') && ['POST','PUT'].includes(init?.method || '') && !path.endsWith('/convert')) {
      expect(new Headers(init.headers).get('Authorization')).toBe(`Bearer ${token}`);
      saves.push({ method: init!.method!, body: JSON.parse(String(init!.body)) });
      if (failUpdate && init?.method === 'PUT') return new Response('{}', { status: 500 });
    }
    if (path.endsWith('/convert') && init?.method === 'POST') {
      const quote = structuredClone(app!.quotations[0]);
      expect(path).toBe(`/api/v1/quotations/${quote.id}/convert`);
      expect(new Headers(init.headers).get('Idempotency-Key')).toBe(`quotation-conversion:${quote.id}`);
      conversions.push(JSON.parse(String(init.body))); return new Response(JSON.stringify(conversionReply(quote)), { status: 201 });
    }
    return dispatcher(input, init);
  });
  try {
    localStorage.setItem('ss_print_inventory_v6', JSON.stringify([{ id: 'contract-paper', name: 'Fixture A4', category: 'Paper', stockQty: 1000, costPerConsumptionUnit: 184, costPerPurchaseUnit: 92000, purchaseMultiplier: 500, batches: [] }]));
    await render(<AppProvider><Journey /></AppProvider>); await click(buttonText('ຕໍ່ໄປ: ກຳນົດສະເປັກ')); await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ສະຫຼຸບຕົ້ນທຶນ'))!);
    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '10%' && b.parentElement?.parentElement?.textContent?.includes('ສ່ວນຫຼຸດລູກຄ້າລວມ'))!); await click(buttonText('ຄິດ % VAT'));
    const taxInput = Array.from(document.querySelectorAll('input')).find(input => input.closest('div.flex.items-center.justify-between')?.textContent?.includes('ອັດຕາພາສີ'))!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(taxInput, '10'); await act(async () => taxInput.dispatchEvent(new Event('input', { bubbles: true })));
    await click(Array.from(document.querySelectorAll('button[role="switch"]')).find(button => button.closest('div.bg-white')?.textContent?.includes('ກ່ອງບັນຈຸພັນ & ຂົນສົ່ງ'))!);
    const shippingInput = Array.from(document.querySelectorAll('input')).find(input => input.closest('div.flex.justify-between')?.textContent?.includes('Courier Fee'))!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(shippingInput, '125'); await act(async () => shippingInput.dispatchEvent(new Event('input', { bubbles: true })));
    await click(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('ບັນທຶກໃບສະເໜີລາຄາ (Save Quotation)'))!);
    await click(buttonText('ຢືນຢັນການບັນທຶກ')); await until(() => app!.quotations.length === 1);
    const saved = structuredClone(app!.quotations[0]); const snapshot = saves[0].body.commercial_snapshot as Record<string, number>;
    if (process.env.P12_SAVED_QUOTE_DTO_PATH) writeFileSync(process.env.P12_SAVED_QUOTE_DTO_PATH.replace('.json','-confirm.json'), JSON.stringify(saves[0].body, null, 2) + '\n');
    expect(snapshot.discount_percent).toBe(10); expect(snapshot.tax_amount_lak).toBeGreaterThan(0); expect(snapshot.final_total_lak).toBe(snapshot.discounted_subtotal_lak + snapshot.tax_amount_lak + snapshot.shipping_fee_lak); expect(snapshot.total_cost_lak).toBeGreaterThan(0);
    await click(byTitle('ປະຫວັດໃບສະເໜີ')); failUpdate = true;
    await click(buttonText('ສ້າງເວີຊັນ v2')); await tick(); expect(app!.quotations[0].version).toBe(saved.version); expect(app!.quotations[0].totalCost).toBe(saved.totalCost); expect(app!.toast?.type).toBe('error');
    failUpdate = false; await click(buttonText('ສ້າງເວີຊັນ v2')); await until(() => app!.quotations[0].version === 2); expect(saves.filter(s => s.method === 'PUT')).toHaveLength(2);
    await click(buttonText('ປ່ຽນເປັນອໍເດີ →')); await until(() => !!app!.confirmDialog); await act(async () => app!.confirmDialog.onConfirm()); await until(() => onConverted.mock.calls.length === 1);
    expect(conversions).toHaveLength(1); expect(conversions[0]).toEqual({ expected_updated_at: app!.quotations[0].updated_at, expected_total_selling_price: snapshot.final_total_lak });
    const order = app!.orders.find(o => o.id === 'canonical-order')!; expect(order.totalPriceCharged).toBe(snapshot.final_total_lak); expect(order.total_cost).toBe(snapshot.total_cost_lak); expect(order.depositAmountPaid).toBe(0); expect(app!.quotations[0].status).toBe('CONVERTED');
    expect(order.items[0].totalPrice).toBe(app!.quotations[0].items[0].total_price_lak);
    if (process.env.P12_SAVED_QUOTE_DTO_PATH) writeFileSync(process.env.P12_SAVED_QUOTE_DTO_PATH.replace('.json','-confirm.json'), JSON.stringify(saves[0].body, null, 2) + '\n');
  } finally { unregister(); }
});


test.each(['approve', 'reject'] as const)('actual manager %s rejects HTTP403 and legacy false200, then accepts only matching committed server acknowledgment', async action => {
  const unregister = authorize(token); const dispatcher = vi.mocked(globalThis.fetch).getMockImplementation()!; let mode: 'forbidden' | 'legacy' | 'committed' = 'forbidden'; let accepted = false; const calls: Record<string, unknown>[] = [];
  const quote = { ...conversionFixture(), status: 'REQUIRES_MANAGER_APPROVAL' }; localStorage.setItem('ss_print_quotations_v6', JSON.stringify([quote]));
  vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
    const path = new URL(String(input), origin).pathname;
    if (path.endsWith(`/${action}`) && init?.method === 'POST') { const headers = new Headers(init.headers); expect(headers.get('Authorization')).toBe(`Bearer ${token}`); expect(headers.has('X-User-Role')).toBe(false); const body = JSON.parse(String(init.body)); expect(body).not.toHaveProperty('manager_id'); calls.push(body);
      if (mode === 'forbidden') return new Response('{}', { status: 403 });
      if (mode === 'legacy') return new Response(JSON.stringify({ status: 'success' }));
      accepted = true; return new Response(JSON.stringify({ status: 'success', committed: true, target_type: 'quotation', quotation_id: quote.id, quotation_status: action === 'approve' ? 'ACCEPTED' : 'REJECTED' }));
    }
    if (path === '/api/v1/quotations' && !init?.method) return new Response(JSON.stringify([{ ...quote, status: accepted ? action === 'approve' ? 'ACCEPTED' : 'REJECTED' : quote.status }]));
    return dispatcher(input, init);
  });
  let app: ReturnType<typeof useApp>; function Journey() { app = useApp(); return <QuotationManager />; }
  try { await render(<AppProvider><Journey /></AppProvider>); await click(byTitle('ປະຫວັດໃບສະເໜີ')); await click(buttonText('ອະນຸມັດສ່ວນຫຼຸດ'));
    expect(document.querySelector('textarea')?.parentElement?.parentElement?.textContent).toMatch(/ຍອດລວມ: [^0-9]*2[.,]600/);
    const reason = document.querySelector('textarea[placeholder^="ໃສ່ເຫດຜົນການອະນຸມັດ"]') as HTMLTextAreaElement; Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(reason, 'Disposable review reason'); await act(async () => reason.dispatchEvent(new Event('input', { bubbles: true })));
    const decisionButton = () => buttonText(action === 'approve' ? 'ອະນຸມັດສ່ວນຫຼຸດ (Approve)' : 'ປະຕິເສດສ່ວນຫຼຸດ (Reject)');
    await click(decisionButton()); await until(() => calls.length === 1); expect(app!.quotations[0].status).toBe('REQUIRES_MANAGER_APPROVAL'); expect(decisionButton()).toBeTruthy();
    mode = 'legacy'; await click(decisionButton()); await until(() => calls.length === 2); expect(app!.quotations[0].status).toBe('REQUIRES_MANAGER_APPROVAL'); expect(app!.toast?.type).toBe('error');
    mode = 'committed'; await click(decisionButton()); await until(() => app!.quotations[0].status === (action === 'approve' ? 'ACCEPTED' : 'REJECTED')); expect(app!.toast?.type).toBe('success'); expect(document.querySelector('textarea[placeholder^="ໃສ່ເຫດຜົນການອະນຸມັດ"]')).toBeNull();
  } finally { unregister(); }
});


test.each(['viewer', 'export'] as const)('N1 %s contains keyboard focus and restores invoker under StrictMode', async kind => {
  let closes = 0;
  function Journey() {
    const [open, setOpen] = React.useState(false);
    const [revision, setRevision] = React.useState(0);
    const close = () => { closes++; setOpen(false); };
    return <><button id="focus-invoker" onClick={() => setOpen(true)}>Open</button><button id="background-control">Background</button>
      {open && (kind === 'viewer' ? <Lightbox imageUrl={image} onClose={close} /> : <UniversalExportPreviewModal isOpen onClose={close} title="Focus export"><button onClick={() => setRevision(revision + 1)}>Revision {revision}</button></UniversalExportPreviewModal>)}
    </>;
  }
  await render(<StrictMode><Journey /></StrictMode>);
  const invoker = document.getElementById('focus-invoker')!; invoker.focus(); await click(invoker);
  const dialog = document.querySelector('[role="dialog"]')!;
  const first = dialog.querySelector('button')!;
  expect(document.activeElement).toBe(first);
  const tab = (shiftKey = false) => { const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }); document.activeElement!.dispatchEvent(event); return event; };
  expect(tab(true).defaultPrevented).toBe(true); expect(dialog.contains(document.activeElement)).toBe(true); expect(document.activeElement).not.toBe(first);
  expect(tab().defaultPrevented).toBe(true); expect(document.activeElement).toBe(first);
  document.getElementById('background-control')!.focus(); expect(dialog.contains(document.activeElement)).toBe(true);
  if (kind === 'export') { const revision = Array.from(dialog.querySelectorAll('button')).find(button => button.textContent === 'Revision 0')!; revision.focus(); await click(revision); expect(document.activeElement).toBe(revision); }
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
  expect(closes).toBe(1); expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(document.activeElement).toBe(invoker);
  await click(invoker); await click(document.querySelector('[role="dialog"] button')!); expect(closes).toBe(2); expect(document.activeElement).toBe(invoker);
});

test.each([
  [{ total_selling_price: 2600, grandTotal: 99999, finalGrandTotal: 88888 }, 'LAK 2600'],
  [{ total_selling_price: 0, grandTotal: 2600 }, 'LAK 0'],
  [{ grandTotal: 1036 }, 'LAK 1036'],
  [{ finalGrandTotal: 920 }, 'LAK 920'],
  [{}, 'ບໍ່ມີຂໍ້ມູນຍອດລວມ'],
  [{ total_selling_price: NaN, grandTotal: 2600 }, 'ບໍ່ມີຂໍ້ມູນຍອດລວມ'],
])('N2 approval displays saved total without inventing zero: %j', async (amounts, expected) => {
  await render(<QuotationMarginApprovalModal quote={{ id: 'amount-fixture', ...amounts }} isOpen isProcessing={false} approvalReason="" currentLang="lo" formatCurrency={value => `LAK ${value}`} onReasonChange={() => {}} onApprove={() => {}} onReject={() => {}} onClose={() => {}} />);
  expect(document.body.textContent).toContain(`ຍອດລວມ: ${expected}`);
});


test('N1 production gallery keyboard journey restores live gallery control after Escape and Close', async () => {
  const photos = [{ name: 'gallery-first.png', url: image }, { name: 'gallery-second.png', url: image }];
  let lastPreview: any;
  function Journey() {
    const [preview, setPreview] = React.useState<any>(null);
    return <><ArtworkPreviewCard orderIdDisplay="gallery-focus-fixture" currentLang="lo" order={{ items: [{ batch_files: photos }] }} onOpenDriveLink={() => {}} setLightbox={value => { lastPreview = value; setPreview(value); }} />
      {preview && <Lightbox {...preview} onClose={() => setPreview(null)} />}</>;
  }
  await render(<StrictMode><Journey /></StrictMode>);
  await until(() => !!document.querySelector('button[title="gallery-second.png"]'));
  await click(document.querySelector('button[title="gallery-second.png"]')!);
  const gallery = Array.from(document.querySelectorAll('button')).find(button => button.textContent?.includes('ເບິ່ງທັງໝົດ'))!;
  for (const closeWith of ['Escape', 'Close']) {
    gallery.focus(); await click(gallery);
    const thumbnail = document.querySelector('button[aria-label="ເບິ່ງຕົວຢ່າງຮູບ 2"]') as HTMLButtonElement;
    thumbnail.focus(); expect(document.activeElement).toBe(thumbnail); expect(thumbnail.tabIndex).toBe(0);
    // Native button activation dispatches click for Enter/Space; jsdom has no default key activation.
    thumbnail.dispatchEvent(new KeyboardEvent('keydown', { key: closeWith === 'Escape' ? ' ' : 'Enter', bubbles: true })); await click(thumbnail);
    expect(thumbnail.isConnected).toBe(false); expect(lastPreview.initialPhotoIndex).toBe(1); expect(lastPreview.photos.map((photo: any) => photo.originalUrl)).toEqual(photos.map(photo => photo.url));
    const dialog = document.querySelector('[role="dialog"]')!; expect(dialog.contains(document.activeElement)).toBe(true); expect(dialog.textContent).toContain('gallery-second.png');
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    expect(dialog.textContent).toContain('gallery-first.png');
    if (closeWith === 'Escape') await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    else await click(dialog.querySelector('button')!);
    expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(document.activeElement).toBe(gallery); expect(gallery.isConnected).toBe(true);
    expect(document.querySelector('button[title="gallery-second.png"]')?.className).toContain('border-sky-500');
  }
});
