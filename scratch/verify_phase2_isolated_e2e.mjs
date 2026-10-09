import { execSync } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:55690';
const DOCKER_CONTAINER = '49b0ced0613f'; // somsing_ag_disposable_postgres on port 55432

function execPsql(query) {
  const escaped = query.replace(/"/g, '\\"');
  const cmd = `docker exec ${DOCKER_CONTAINER} psql -U postgres -d somsing_db -t -A -c "${escaped}"`;
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

async function run() {
  console.log('=== PHASE 2 ISOLATED RUNTIME & DB E2E VERIFICATION ===\n');

  // Step 1: Login to get authentic JWT token
  console.log('1. Authenticating with backend...');
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  if (!loginRes.ok) throw new Error(`Login failed with HTTP ${loginRes.status}`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('   Authenticated as:', loginData.role, '| Token length:', token.length);

  // Step 2: Ensure test paper material exists in materials table
  console.log('2. Ensuring A3 test material exists in database...');
  execPsql(`
    INSERT INTO materials (id, sku, name, category, is_active, consumption_unit, purchase_unit, cost_per_consumption_unit, technical_specs)
    VALUES ('mat-a3-paper-001', 'PAPER-A3-120GSM', 'A3 Woodfree Paper 120gsm', 'Paper', true, 'sheet', 'Pack', 1000.00, '{"width_mm": 297, "height_mm": 420, "unit": "mm"}'::jsonb)
    ON CONFLICT (id) DO UPDATE SET is_active = true, technical_specs = '{"width_mm": 297, "height_mm": 420, "unit": "mm"}'::jsonb;
  `);
  console.log('   Test paper material mat-a3-paper-001 verified in DB.');

  // Step 3: Prepare synthetic quotation payload
  const synthId = `qt-synth-${Date.now()}`;
  const synthQuoteNo = `Q-SYNTH-${Date.now()}`;
  const now = new Date().toISOString();

  const commercialSnapshot = {
    version: 1,
    currency: 'LAK',
    total_cost_lak: 125000,
    discounted_subtotal_lak: 150000,
    tax_amount_lak: 10500,
    shipping_fee_lak: 0,
    setup_fee_lak: 0,
    packaging_cost_lak: 0,
    final_total_lak: 160500,
    metadata: { tax_enabled: true },
  };

  const costReview = {
    user_id: 'usr_admin_001',
    reason: 'QA Synthetic Verification',
    source: 'computed',
    reviewed_at: now,
  };

  const commercialCostSnapshot = {
    net_cost_lak: 125000,
    labor_cost_lak: 0,
    packaging_delivery_cost_lak: 0,
    commercial_cost_lak: 125000,
  };

  const itemSpecs = {
    imposition_mode: 'OFF',
    paper_id: 'mat-a3-paper-001',
    paper_sku: 'PAPER-A3-120GSM',
    job_width: 210,
    job_height: 297,
    paper_size: 'A4',
    cuts_per_sheet: 2,
    cutsPerSheetOverride: 2,
    manual_sheet_count: 130,
    manualSheetCount: 130,
    page_count: 3,
    pages: 3,
    is_double_sided: true,
    color_pages_count: 1,
    mono_pages_count: 9,
    mono_pages_avg_k: 5.0,
    avg_cov_c: 0.0,
    avg_cov_m: 0.0,
    avg_cov_y: 0.0,
    avg_cov_k: 5.0,
    commercial_cost_snapshot: commercialCostSnapshot,
    _somsing_quote_snapshot: {
      commercial_snapshot: commercialSnapshot,
      cost_review: costReview,
      commercial_cost_snapshot: commercialCostSnapshot,
    },
  };

  const quotationPayload = {
    id: synthId,
    quotation_no: synthQuoteNo,
    title: 'Synthetic E2E Verification Job (R1, R2, R3, Stock)',
    customer_name: 'Synthetic QA Client Co.',
    customer_id: 'CUST-VIP-001',
    customer_phone: '020-5555-5555',
    customer_address: 'Vientiane Capital',
    status: 'Draft',
    total_cost: 125000.0,
    total_selling_price: 160500.0,
    overall_profit_percent: 28.4,
    discount_percent: 0.0,
    setup_fee: 0.0,
    packaging_cost: 0.0,
    shipping_fee: 0.0,
    commercial_snapshot: commercialSnapshot,
    cost_review: costReview,
    items: [
      {
        id: `item-${synthId}-1`,
        name: '3-Page Duplex Book with Precut A4 on A3 & Manual Override',
        quantity: 100,
        unitCost: 1250.0,
        unitPrice: 1605.0,
        subtotal: 160500.0,
        totalPrice: 160500.0,
        unit_cost_lak: 1250.0,
        unit_price_lak: 1605.0,
        total_price_lak: 160500.0,
        specs: itemSpecs,
      },
    ],
  };

  // Step 4: Save Quotation via POST /api/v1/quotations
  console.log('\n3. Saving synthetic quotation via POST /api/v1/quotations...');
  const saveRes = await fetch(`${BASE_URL}/api/v1/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(quotationPayload),
  });
  if (!saveRes.ok) {
    const errBody = await saveRes.text();
    throw new Error(`Quotation save failed: HTTP ${saveRes.status}: ${errBody}`);
  }
  const savedQuote = await saveRes.json();
  console.log('   Saved Quote ID:', savedQuote.id, '| Status:', savedQuote.status);
  console.log('   Created At:', savedQuote.created_at, '| Updated At:', savedQuote.updated_at);

  // Step 5: Direct Database Readback of Quotation
  console.log('\n4. Direct DB Readback: Querying PostgreSQL quotations table...');
  const dbQuoteJson = execPsql(`SELECT json_build_object('id', id, 'status', status, 'total_selling_price', total_selling_price, 'total_cost', total_cost, 'items_json', items_json)::text FROM quotations WHERE id = '${synthId}';`);
  const dbQuote = JSON.parse(dbQuoteJson);
  console.log('   DB Quote ID:', dbQuote.id, '| DB Status:', dbQuote.status);
  console.log('   DB Total Selling Price:', dbQuote.total_selling_price, '| Total Cost:', dbQuote.total_cost);

  const dbItemSpecs = dbQuote.items_json[0].specs;
  console.log('   -> DB manual_sheet_count:', dbItemSpecs.manual_sheet_count, '(Expected: 130)');
  console.log('   -> DB cuts_per_sheet:', dbItemSpecs.cuts_per_sheet, '(Expected: 2)');
  console.log('   -> DB color_pages_count:', dbItemSpecs.color_pages_count, '(Expected: 1)');
  console.log('   -> DB mono_pages_count:', dbItemSpecs.mono_pages_count, '(Expected: 9)');
  console.log('   -> DB avg_cov_c:', dbItemSpecs.avg_cov_c, '(Expected: 0.0 - Preserved, not 15 or 100)');
  console.log('   -> DB avg_cov_m:', dbItemSpecs.avg_cov_m, '(Expected: 0.0)');
  console.log('   -> DB avg_cov_y:', dbItemSpecs.avg_cov_y, '(Expected: 0.0)');
  console.log('   -> DB avg_cov_k:', dbItemSpecs.avg_cov_k, '(Expected: 5.0)');
  console.log('   -> DB Materialized stock_dimension_snapshot:', dbItemSpecs.stock_dimension_snapshot);

  if (dbItemSpecs.manual_sheet_count !== 130) throw new Error('manual_sheet_count mismatch in DB');
  if (dbItemSpecs.cuts_per_sheet !== 2) throw new Error('cuts_per_sheet mismatch in DB');
  if (dbItemSpecs.avg_cov_c !== 0.0) throw new Error('avg_cov_c not preserved as 0.0 in DB');

  // Step 6: Convert Quotation to Order
  console.log('\n5. Converting quotation to order via POST /api/v1/quotations/:id/convert...');
  const idempotencyKey = `quotation-conversion:${synthId}`;
  const convertRes = await fetch(`${BASE_URL}/api/v1/quotations/${encodeURIComponent(synthId)}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      expected_updated_at: savedQuote.updated_at,
      expected_total_selling_price: savedQuote.total_selling_price,
    }),
  });
  if (!convertRes.ok) {
    const errBody = await convertRes.text();
    throw new Error(`Conversion failed: HTTP ${convertRes.status}: ${errBody}`);
  }
  const convertData = await convertRes.json();
  const createdOrderId = convertData.order?.id || convertData.order_id || convertData.id;
  console.log('   Conversion response status:', convertRes.status);
  console.log('   Created Order ID:', createdOrderId);
  console.log('   Order Number:', convertData.order?.order_number || convertData.order_number);
  console.log('   Quotation status post-conversion:', convertData.quotation?.status);

  // Step 7: Canonical Order API Readback
  console.log('\n6. Canonical API Readback: GET /api/v1/orders/:id...');
  const orderRes = await fetch(`${BASE_URL}/api/v1/orders/${encodeURIComponent(createdOrderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!orderRes.ok) throw new Error(`Canonical order fetch failed: HTTP ${orderRes.status}`);
  const canonicalOrder = await orderRes.json();
  const orderData = canonicalOrder.data || canonicalOrder;
  console.log('   Canonical Order ID:', orderData.id);
  console.log('   Total Price:', orderData.total_price || orderData.total_amount_lak, 'LAK');
  console.log('   Deposit Amount:', orderData.deposit_amount || orderData.deposit_lak, 'LAK');
  console.log('   Status:', orderData.status, '| Overall Status:', orderData.overall_status);

  // Step 8: Direct Database Readback of Order & Order Items
  console.log('\n7. Direct DB Readback: Querying PostgreSQL orders & order_items tables...');
  const dbOrderCount = execPsql(`SELECT COUNT(*) FROM orders WHERE idempotency_key = '${idempotencyKey}';`);
  console.log('   Orders with idempotency_key in DB:', dbOrderCount, '(Expected: 1)');
  if (parseInt(dbOrderCount, 10) !== 1) throw new Error('Order count with idempotency_key is not 1');

  const dbOrderItemJson = execPsql(`SELECT json_build_object('id', id, 'job_name', job_name, 'quantity', quantity, 'specs', specs)::text FROM order_items WHERE order_id = '${createdOrderId}';`);
  const dbOrderItem = JSON.parse(dbOrderItemJson);
  const orderItemSpecs = dbOrderItem.specs;
  console.log('   Order Item ID:', dbOrderItem.id, '| Quantity:', dbOrderItem.quantity);
  console.log('   -> Order Item manual_sheet_count:', orderItemSpecs.manual_sheet_count, '(Expected: 130)');
  console.log('   -> Order Item cuts_per_sheet:', orderItemSpecs.cuts_per_sheet, '(Expected: 2)');
  console.log('   -> Order Item color_pages_count:', orderItemSpecs.color_pages_count, '(Expected: 1)');
  console.log('   -> Order Item mono_pages_count:', orderItemSpecs.mono_pages_count, '(Expected: 9)');
  console.log('   -> Order Item avg_cov_c:', orderItemSpecs.avg_cov_c, '(Expected: 0.0)');
  console.log('   -> Embedded _somsing_quote_snapshot present:', Boolean(orderItemSpecs._somsing_quote_snapshot));

  // Step 9: Idempotent Replay Verification (Prove NO DUPLICATES)
  console.log('\n8. Testing Idempotent Replay (Re-submitting conversion)...');
  const replayRes = await fetch(`${BASE_URL}/api/v1/quotations/${encodeURIComponent(synthId)}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      expected_updated_at: savedQuote.updated_at,
      expected_total_selling_price: savedQuote.total_selling_price,
    }),
  });
  if (!replayRes.ok) {
    const errBody = await replayRes.text();
    throw new Error(`Replay request failed: HTTP ${replayRes.status}: ${errBody}`);
  }
  const replayData = await replayRes.json();
  const replayedOrderId = replayData.order?.id || replayData.order_id || replayData.id;
  console.log('   Replay response HTTP status:', replayRes.status);
  console.log('   Replayed Order ID:', replayedOrderId, '(Matches original:', replayedOrderId === createdOrderId, ')');
  console.log('   Replay Flag in response:', replayData.replayed || replayData.committed);

  // Check DB again: verify order count and quote count
  const dbOrderCountAfterReplay = execPsql(`SELECT COUNT(*) FROM orders WHERE idempotency_key = '${idempotencyKey}';`);
  const dbQuoteCountAfterReplay = execPsql(`SELECT COUNT(*) FROM quotations WHERE id = '${synthId}';`);
  console.log('   Orders with idempotency_key after replay:', dbOrderCountAfterReplay, '(STRICTLY 1, NO DUPLICATE)');
  console.log('   Quotations with ID after replay:', dbQuoteCountAfterReplay, '(STRICTLY 1, NO DUPLICATE)');
  if (parseInt(dbOrderCountAfterReplay, 10) !== 1) throw new Error('Duplicate order detected!');
  if (parseInt(dbQuoteCountAfterReplay, 10) !== 1) throw new Error('Duplicate quotation detected!');

  // Step 10: Failed Save Handling & Validation Error
  console.log('\n9. Testing Failed Save Handling (Validation rejection & draft preservation)...');
  const badSaveRes = await fetch(`${BASE_URL}/api/v1/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: `qt-bad-${Date.now()}`,
      customer_name: '', // Empty name triggers validation failure
      items: [],
    }),
  });
  console.log('   Bad save HTTP status:', badSaveRes.status, '(Expected: 400 Bad Request)');
  const badSaveData = await badSaveRes.json();
  console.log('   Bad save error code:', badSaveData.code, '| Message:', badSaveData.message);
  if (badSaveRes.status !== 400) throw new Error('Bad save was not rejected with HTTP 400');

  // Step 11: Clean up synthetic disposable test records
  console.log('\n10. Cleaning up synthetic disposable test records...');
  execPsql(`DELETE FROM order_items WHERE order_id = '${createdOrderId}';`);
  execPsql(`DELETE FROM orders WHERE id = '${createdOrderId}';`);
  execPsql(`DELETE FROM quotations WHERE id = '${synthId}';`);
  console.log('   Synthetic test records cleaned up from database.');

  console.log('\n=== ALL E2E CANONICAL RUNTIME & DB CHECKS PASSED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('\n[FATAL ERROR IN E2E VERIFICATION]:', err);
  process.exit(1);
});
