import fs from 'fs';

let code = fs.readFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', 'utf8');

if (!code.includes('import { AppProvider')) {
  code = code.replace(/import \{ PreflightChecker \} from '\.\.\/src\/components\/PreflightChecker';/, "import { PreflightChecker } from '../src/components/PreflightChecker';\nimport { AppProvider } from '../src/store/AppContext';");
}

fs.writeFileSync('admin-system/frontend/tests/p12-mounted.test.tsx', code);
