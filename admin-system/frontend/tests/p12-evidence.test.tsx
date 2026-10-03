import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeAll, beforeEach, afterEach, test, expect, vi } from 'vitest';
import { createCanvas, DOMMatrix, Path2D, ImageData } from '@napi-rs/canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { ArtworkPreviewCard } from '../src/features/orders/components/production/ArtworkPreviewCard';
import { useAuthStore } from '../src/store/useAuthStore';
import { mapPreflightToSpecs } from '../src/features/pricing/utils/preflightMapper';

// Native canvas and FileReader are Node boundary adapters; parser/render/ZIP/caller are real.
const origin = process.env.P12_FIXTURE_ORIGIN!;
const realFetch = globalThis.fetch;
let analyze: typeof import('../src/lib/preflightAnalyzer').analyzePDFClient;
let token: string;
let root: Root;
let container: HTMLDivElement;
let blobs: Map<string, Blob>;
let saved: { name: string; blob: Blob }[];
let packagingFailures = 0;
let blobReads = 0;
let sequence = 0;
let previousToken: string | null;

function pdfFile() {
  const pdf = new jsPDF({ compress: false });
  pdf.setFillColor(0); pdf.rect(10, 10, 100, 100, 'F');
  pdf.addPage(); pdf.setFillColor(255, 0, 0); pdf.rect(10, 10, 100, 100, 'F');
  pdf.addPage(); pdf.setFillColor(80); pdf.rect(10, 10, 100, 100, 'F');
  return new NodeFile([pdf.output('arraybuffer')], 'three-original-pages.pdf', { type: 'application/pdf' });
}
function nativeCanvas(mode: 'normal' | 'missing' | 'sampling-failure' = 'normal') {
  const original = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string, options?: any) => {
    if (tag !== 'canvas') return original(tag, options);
    const canvas = createCanvas(1, 1);
    if (mode === 'missing') canvas.getContext = (() => null) as any;
    if (mode === 'sampling-failure') {
      const context = canvas.getContext('2d');
      context.getImageData = () => { throw new Error('Disposable pixel sampling failure'); };
    }
    return canvas as any;
  }) as any);
}
async function upload(bytes: Uint8Array, name: string, mime: string) {
  const boundary = 'p12-evidence-disposable';
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`), Buffer.from(bytes), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const response = await realFetch(`${origin}/api/upload/artwork`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body });
  expect(response.status).toBe(200);
  const metadata = await response.json();
  expect(metadata.fileSize).toBe(bytes.length); expect(metadata.fileName).toBe(name);
  return { name: metadata.fileName, url: metadata.url, size: metadata.fileSize, bytes };
}
async function images(count: number) {
  return Promise.all(Array.from({ length: count }, async (_, i) => {
    const canvas = createCanvas(8 + i, 9); const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgb(${i * 11},${200 - i * 7},60)`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const mime = i % 2 ? 'image/jpeg' : 'image/png';
    return upload(canvas.toBuffer(mime as any), `original_${i + 1}.${i % 2 ? 'jpg' : 'png'}`, mime);
  }));
}
async function until(check: () => boolean) {
  for (let i = 0; i < 300; i++) { await act(async () => { await new Promise(r => setTimeout(r, 10)); }); if (check()) return; }
  throw new Error(`Timed out: ${container.textContent}`);
}
async function mountBatch(files: any[]) {
  await act(async () => root.render(<ArtworkPreviewCard orderIdDisplay="DISPOSABLE" order={{ items: [{ batch_files: files }] }} currentLang="en" onOpenDriveLink={() => {}} />));
  await until(() => !container.textContent?.includes('Loading'));
  await until(() => { const b = container.querySelector('[data-testid="artwork-download-btn"]') as HTMLButtonElement; return !!b && !b.disabled; });
  // Wait for sequential private loads to finish, including failure entries.
  await until(() => container.querySelectorAll('img').length > 0 || container.textContent!.includes('failed'));
}
async function clickDownload() {
  await act(async () => (container.querySelector('[data-testid="artwork-download-btn"]') as HTMLButtonElement).click());
}
async function extracted(files: { name: string; bytes: Uint8Array }[]) {
  expect(saved).toHaveLength(1);
  const zip = await JSZip.loadAsync(Buffer.from(await saved[0].blob.arrayBuffer()));
  const entries = Object.values(zip.files).filter(f => !f.dir);
  for (const file of files) {
    const entry = entries.find(e => e.name.endsWith('/' + file.name)); expect(entry).toBeTruthy();
    expect(Buffer.from(await entry!.async('uint8array'))).toEqual(Buffer.from(file.bytes));
  }
  return entries;
}
beforeAll(async () => {
  Object.assign(globalThis, { DOMMatrix, Path2D, ImageData, Blob: NodeBlob });
  // JSZip reads native Node blobs through FileReader; no archive logic is mocked.
  (globalThis as any).FileReader = class {
    result: any; onload: any; onerror: any;
    readAsArrayBuffer(blob: Blob) { blob.arrayBuffer().then(result => { this.result = Buffer.from(result); this.onload?.({ target: this }); }, error => this.onerror?.(error)); }
  };
  URL.createObjectURL = () => ''; URL.revokeObjectURL = () => {};
  analyze = (await import('../src/lib/preflightAnalyzer')).analyzePDFClient;
  token = (await (await realFetch(`${origin}/fixture/token`)).json()).token;
});
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  blobs = new Map(); saved = []; packagingFailures = 0; blobReads = 0;
  previousToken = useAuthStore.getState().token; useAuthStore.setState({ token });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => { const url = `blob:evidence-${++sequence}`; blobs.set(url, blob); return url; });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(url => { blobs.delete(url); });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { saved.push({ name: this.download, blob: blobs.get(this.href)! }); });
  vi.stubGlobal('fetch', async (input: any, init?: RequestInit) => {
    let url = String(input);
    if (url.startsWith('blob:evidence-')) {
      blobReads++;
      if (packagingFailures > 0) { packagingFailures--; return new Response('disposable packaging failure', { status: 503 }); }
      return new Response(blobs.get(url));
    }
    if (url.startsWith('/api') || url.startsWith('/uploads')) url = origin + url;
    expect(new URL(url).origin).toBe(origin); // Never access a business origin.
    return realFetch(url, init);
  });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); useAuthStore.setState({ token: previousToken }); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('actual PDF.js renders every page, samples color/mono pixels and reports truthful progress', async () => {
  nativeCanvas(); const progress: number[][] = [];
  const result = await analyze(pdfFile() as any, { onProgress: (...p) => progress.push(p) });
  expect(result.total_pages).toBe(3); expect(result.color_pages_count).toBe(1); expect(result.mono_pages_count).toBe(2);
  expect(progress).toEqual([[1, 3, 33], [2, 3, 67], [3, 3, 100]]);
  expect(result.file_url).toMatch(/^data:image\/jpeg;base64,/); expect(result.avg_cov_k).toBeGreaterThan(0);
  expect(result.execution_notice).toContain('PDF.js Full-Scan Complete');
});
test('actual corrupt PDF rejects rather than inventing pages and preflight measurements', async () => {
  nativeCanvas(); await expect(analyze(new NodeFile(['%PDF-1.7\nnot a valid PDF'], 'corrupt.pdf') as any)).rejects.toThrow();
});
test('missing canvas context rejects instead of reporting a completed scan', async () => {
  nativeCanvas('missing'); await expect(analyze(pdfFile() as any)).rejects.toThrow();
});
test('pixel sampling failure rejects instead of silently omitting pages', async () => {
  nativeCanvas('sampling-failure'); await expect(analyze(pdfFile() as any)).rejects.toThrow('Disposable pixel sampling failure');
});
test('real analyzer thumbnail remains distinct from uploaded original in quotation metadata', async () => {
  nativeCanvas(); const file = pdfFile(); const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await analyze(file as any); const original = await upload(bytes, file.name, 'application/pdf');
  const specs = mapPreflightToSpecs({ ...result, file_url: original.url, file_size: original.size, preview_thumbnail_url: result.file_url }, 0);
  expect(specs.artworkUrl).toBe(original.url); expect(specs.fileSize).toBe(bytes.length);
  expect(specs.previewThumbnailUrl).toBe(result.file_url); expect(specs.artworkUrl).not.toBe(specs.previewThumbnailUrl);
});
test('mounted batch download packages 16 real uploaded image originals with exact names and bytes', async () => {
  const files = await images(16); await mountBatch(files); await clickDownload();
  await until(() => saved.length === 1); expect(await extracted(files)).toHaveLength(16); expect(blobReads).toBe(16);
  expect(container.textContent).not.toContain('ດາວໂຫຼດສຳເລັດບາງສ່ວນ');
});
test('mounted partial packaging retains originals and reports exact failed filename with error note', async () => {
  const files = await images(3); await mountBatch(files); packagingFailures = 1; await clickDownload();
  await until(() => container.textContent!.includes('ດາວໂຫຼດສຳເລັດບາງສ່ວນ'));
  const entries = await extracted(files.slice(1)); expect(entries).toHaveLength(3);
  expect(entries.some(e => e.name.endsWith(files[0].name + '_error_note.txt'))).toBe(true);
  expect(container.textContent).toContain(files[0].name); expect(container.textContent).toContain('ດາວໂຫຼດສຳເລັດ 2 ໄຟລ໌, ແຕ່ພົບຂໍ້ຜິດພາດ 1 ໄຟລ໌');
});
test('mounted total packaging failure reports error and saves no error-note-only archive', async () => {
  await mountBatch(await images(2)); packagingFailures = 2; await clickDownload();
  await until(() => container.textContent!.includes('ດາວໂຫຼດ ZIP ບໍ່ສຳເລັດ'));
  expect(saved).toHaveLength(0);
});
test('mounted initial missing originals report total failure without an archive', async () => {
  await mountBatch([{ name: 'missing_a.png', url: '/uploads/artworks/missing_a.png' }, { name: 'missing_b.png', url: '/uploads/artworks/missing_b.png' }]);
  await clickDownload(); await until(() => container.textContent!.includes('ດາວໂຫຼດບໍ່ສຳເລັດ')); expect(saved).toHaveLength(0);
});
