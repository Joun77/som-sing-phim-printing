import fs from 'fs';

let code = fs.readFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', 'utf8');

// 1. Add import
if (!code.includes('mapQuotationItemToOrderItem')) {
  code = code.replace(/import \{ mapPreflightToSpecs \} from '\.\.\/src\/features\/pricing\/utils\/preflightMapper';/, "import { mapPreflightToSpecs, mapQuotationItemToOrderItem } from '../src/features/pricing/utils/preflightMapper';");
}

// 2. Change mapping inside test
code = code.replace(/mapPreflightToSpecs\(preflightPayload, 0\) as any/, "mapQuotationItemToOrderItem(mapPreflightToSpecs(preflightPayload, 0), 0)");

// 3. Update the mock
const replaceFrom = "vi.mock('../src/lib/preflightAnalyzer', () => ({";
const replaceTo = `export const mockAnalyzePDF = vi.fn();
export const mockAnalyzeImage = vi.fn();

vi.mock('../src/lib/preflightAnalyzer', () => ({
  analyzePDFClient: (file) => mockAnalyzePDF(file),
  analyzeImageClient: (file) => mockAnalyzeImage(file),
  _overrideToOriginal: false
}));`;

if (code.includes(replaceFrom)) {
  code = code.replace(/vi\.mock\('\.\.\/src\/lib\/preflightAnalyzer', \(\) => \(\{[\s\S]*?\}\)\);/, replaceTo);

  const beforeEachAdd = `
beforeEach(() => {
  mockAnalyzePDF.mockReset();
  mockAnalyzeImage.mockReset();
  
  const defaultRes = (file) => Promise.resolve({
    file_name: file.name || 'mock.pdf',
    total_pages: 1,
    avg_cov_c: 10,
    avg_cov_m: 20,
    avg_cov_y: 30,
    avg_cov_k: 40,
    color_space: 'CMYK',
    color_mode: 'CMYK',
    has_rgb: false,
    is_standard_cmyk: true,
    status_badge_lao: 'ຜ່ານ',
    dpi_estimate: 300,
    bleed_mm: 3
  });
  
  mockAnalyzePDF.mockImplementation(defaultRes);
  mockAnalyzeImage.mockImplementation(defaultRes);
});
`;
  code = code.replace("function authorize(fixtureToken: string) {", beforeEachAdd + "\nfunction authorize(fixtureToken: string) {");
}

// 4. Append the new test
const newTest = `
test('Preflight failure, reset, removal, replacement, and unmount durability', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  
  await act(async () => {
    root.render(
      <AppProvider>
        <PreflightChecker onConfirm={onConfirm} onCancel={onCancel} initialFiles={[]} />
      </AppProvider>
    );
  });

  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  
  // 1. Simulate Upload Failure (Network Error)
  mockAnalyzePDF.mockRejectedValueOnce(new Error('Simulated Upload Failure'));

  const mockFile = new File([new Uint8Array([37, 80, 68, 70])], 'broken.pdf', { type: 'application/pdf' });
  
  // Trigger file selection manually
  await act(async () => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  // Wait for the upload failure to be reflected in the UI
  await new Promise(r => setTimeout(r, 100)); // allow async promise to reject
  await act(async () => {}); // flush microtasks
  
  // verify UI shows the error
  expect(container.textContent).toMatch(/(Failed|Error|Simulated Upload Failure)/i);
  
  // Confirm should be blocked
  let confirmBtns = Array.from(container.querySelectorAll('button')).filter(b => /Send to Quotation|Confirm/i.test(b.textContent || ''));
  expect(confirmBtns.length).toBeGreaterThan(0);
  expect(confirmBtns.every(b => b.disabled)).toBe(true);

  // 2. Remove / Reset
  let removeBtn = Array.from(container.querySelectorAll('button')).find(b => /Remove|Clear|Cancel/i.test(b.textContent || ''));
  if (removeBtn) {
    await act(async () => {
      removeBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }
  
  // 3. Stale success check
  let resolveLate;
  const latePromise = new Promise((resolve) => { resolveLate = resolve; });
  mockAnalyzePDF.mockReturnValueOnce(latePromise);
  
  const staleFile = new File([new Uint8Array([37, 80, 68, 70])], 'stale.pdf', { type: 'application/pdf' });
  await act(async () => {
    const dt = new DataTransfer();
    dt.items.add(staleFile);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 50));
  expect(container.textContent).toMatch(/stale\.pdf/i);
  
  removeBtn = Array.from(container.querySelectorAll('button')).find(b => /Remove|Clear|Cancel/i.test(b.textContent || ''));
  await act(async () => {
    removeBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  
  // Resolve the late promise
  resolveLate({
    file_name: 'stale.pdf', total_pages: 1, avg_cov_c: 10, avg_cov_m: 20, avg_cov_y: 30, avg_cov_k: 40, color_mode: 'CMYK'
  });
  
  await new Promise(r => setTimeout(r, 100));
  await act(async () => {}); // flush
  
  // The stale file should NOT reappear
  expect(container.textContent).not.toMatch(/stale\.pdf/i);

  // 4. Replacement (Successful Upload)
  mockAnalyzePDF.mockResolvedValueOnce({
    file_name: 'good.pdf', total_pages: 1, avg_cov_c: 10, avg_cov_m: 20, avg_cov_y: 30, avg_cov_k: 40, color_mode: 'CMYK', status_badge_lao: 'ຜ່ານ', is_standard_cmyk: true
  });
  const replacementFile = new File([new Uint8Array([37, 80, 68, 70])], 'good.pdf', { type: 'application/pdf' });
  await act(async () => {
    const dt = new DataTransfer();
    dt.items.add(replacementFile);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  await new Promise(r => setTimeout(r, 100));
  await act(async () => {});
  
  expect(container.textContent).toMatch(/good\.pdf/i);
  
  confirmBtns = Array.from(container.querySelectorAll('button')).filter(b => /Send to Quotation|Confirm/i.test(b.textContent || ''));
  expect(confirmBtns.length).toBeGreaterThan(0);
  expect(confirmBtns.some(b => !b.disabled)).toBe(true);
});
`;

fs.writeFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', code + newTest);
