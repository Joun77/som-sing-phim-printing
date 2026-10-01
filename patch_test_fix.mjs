import fs from 'fs';
let code = fs.readFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', 'utf8');

// Replace the previous test block
code = code.replace(/test\('Preflight failure, reset, removal, replacement, and unmount durability', async \(\) => \{[\s\S]*?\}\);/, `test('Preflight failure, reset, removal, replacement, and unmount durability', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  
  const { unmount } = render(
    <AppProvider>
      <PreflightChecker onConfirm={onConfirm} onCancel={onCancel} initialFiles={[]} />
    </AppProvider>
  );

  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  
  // 1. Simulate Upload Failure (Network Error)
  mockAnalyzePDF.mockRejectedValueOnce(new Error('Simulated Upload Failure'));

  const mockFile = new File([new Uint8Array([37, 80, 68, 70])], 'broken.pdf', { type: 'application/pdf' });
  fireEvent.change(fileInput, { target: { files: [mockFile] } });
  
  await waitFor(() => {
    expect(document.body.textContent).toMatch(/(Failed|Error|Simulated Upload Failure)/i);
  });
  
  let confirmBtn = screen.getByText(/Send to Quotation|Confirm/i) as HTMLButtonElement;
  expect(confirmBtn.disabled).toBe(true);

  // 2. Remove / Reset
  let removeBtn = screen.queryByText(/Remove|Clear/i);
  if (removeBtn) {
    fireEvent.click(removeBtn);
  } else {
    removeBtn = screen.getByText(/Cancel/i);
    fireEvent.click(removeBtn);
  }
  
  // 3. Stale success check
  let resolveLate: any;
  const latePromise = new Promise((resolve) => { resolveLate = resolve; });
  mockAnalyzePDF.mockReturnValueOnce(latePromise);
  
  const staleFile = new File([new Uint8Array([37, 80, 68, 70])], 'stale.pdf', { type: 'application/pdf' });
  fireEvent.change(fileInput, { target: { files: [staleFile] } });
  
  await waitFor(() => {
    expect(document.body.textContent).toMatch(/stale\.pdf/i);
  });
  
  removeBtn = screen.queryByText(/Remove|Clear|Cancel/i)!;
  fireEvent.click(removeBtn);
  
  resolveLate({
    file_name: 'stale.pdf', total_pages: 1, avg_cov_c: 10, avg_cov_m: 20, avg_cov_y: 30, avg_cov_k: 40, color_mode: 'CMYK'
  });
  
  await new Promise(r => setTimeout(r, 100));
  
  expect(document.body.textContent).not.toMatch(/stale\.pdf/i);

  // 4. Replacement (Successful Upload)
  mockAnalyzePDF.mockResolvedValueOnce({
    file_name: 'good.pdf', total_pages: 1, avg_cov_c: 10, avg_cov_m: 20, avg_cov_y: 30, avg_cov_k: 40, color_mode: 'CMYK', status_badge_lao: 'ຜ່ານ', is_standard_cmyk: true
  });
  const replacementFile = new File([new Uint8Array([37, 80, 68, 70])], 'good.pdf', { type: 'application/pdf' });
  fireEvent.change(fileInput, { target: { files: [replacementFile] } });
  
  await waitFor(() => {
    expect(document.body.textContent).toMatch(/good\.pdf/i);
  });
  
  confirmBtn = screen.getByText(/Send to Quotation|Confirm/i) as HTMLButtonElement;
  expect(confirmBtn.disabled).toBe(false);
  
  unmount();
});`);

// Import fireEvent
if (!code.includes('fireEvent')) {
  code = code.replace(/import \{ render, screen, waitFor, act \} from '@testing-library\/react';/, "import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';");
} else {
  // Check if fireEvent is actually exported in that specific line
  const regex = /import \{ render, screen, waitFor, act \} from '@testing-library\/react';/;
  if (regex.test(code)) {
    code = code.replace(regex, "import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';");
  }
}

fs.writeFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', code);
