import fs from 'fs';
let code = fs.readFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', 'utf8');

const replaceFrom = "vi.mock('../src/lib/preflightAnalyzer', () => ({";
const replaceTo = `export const mockAnalyzePDF = vi.fn();
export const mockAnalyzeImage = vi.fn();

vi.mock('../src/lib/preflightAnalyzer', () => ({
  analyzePDFClient: (file) => mockAnalyzePDF(file),
  analyzeImageClient: (file) => mockAnalyzeImage(file),
  _overrideToOriginal: false
}));`;

// Since I just want to replace the whole block, I'll regex it out.
code = code.replace(/vi\.mock\('\.\.\/src\/lib\/preflightAnalyzer', \(\) => \(\{[\s\S]*?\}\)\);/, replaceTo);

// For the regular tests, we need mockAnalyzePDF to resolve to the default mock object.
// I will set up the default implementation in beforeEach.
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

fs.writeFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', code);
