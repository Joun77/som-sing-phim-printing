// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import OrderCompletedSummaryPage from '../src/features/orders/components/OrderCompletedSummaryPage';
import { AppProvider } from '../src/store/AppContext';
import '../src/i18n';

// Mocks
vi.mock('html-to-image', () => ({ toPng: vi.fn(), toJpeg: vi.fn(), toBlob: vi.fn() }));
vi.mock('jspdf', () => ({ jsPDF: vi.fn(), default: vi.fn() }));
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument: vi.fn() }));
vi.mock('../src/lib/preflightAnalyzer', () => ({ 
  analyzePDFClient: vi.fn(), 
  analyzeImageClient: vi.fn(), 
  convertRGBToCMYKCanvas: vi.fn() 
}));

const formatLAK = (n: number) => `LAK ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe('OrderCompletedSummaryPage Canonical Provenance & Honest Costs', () => {
  it('1. Never invents CONFIRMED receipt, generic reviewer, or method when unrecorded', async () => {
    const unrecordedOrder = {
      id: 'ORD-PROV-001',
      orderNo: 'ORD-PROV-001',
      status: 'COMPLETED',
      payment_status: 'PAID', // Legacy order status
      payment_state: 'PAID',
      totalAmount: 250000,
      paymentSlipUrl: 'https://example.com/slips/slip1.jpg', // Has slip but no record/method
      payment_records: [],
      // No receipt_no, no payment_method, no payment_verified_by
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={unrecordedOrder}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';
    
    // Must NOT invent 'Ref: CONFIRMED'
    expect(text).not.toContain('Ref: CONFIRMED');
    expect(text).toContain('Ref: —');

    // Must NOT invent generic reviewer
    expect(text).not.toContain('Verified by Som-Sing Accounting');
    expect(text).not.toContain('ກວດສອບໂດຍບັນຊີ Som Sing Phim');

    // Must NOT infer payment method from slip presence alone
    expect(text).not.toContain('ຫຼັກຖານການໂອນ (Bank Slip)');

    // Bottom banner must indicate unrecorded / unpaid rather than settled
    expect(text).toContain('ຍັງບໍ່ມີຫຼັກຖານການຊຳລະ');
  });

  it('2. Truthfully displays PENDING review state without false 100% PAID or false settlement', async () => {
    const pendingOrder = {
      id: 'ORD-PROV-002',
      orderNo: 'ORD-PROV-002',
      status: 'IN_PRODUCTION',
      payment_state: 'PENDING',
      totalAmount: 400000,
      payment_records: [
        {
          id: 'pr-pending-1',
          record_kind: 'RECEIPT',
          state: 'PENDING',
          purpose: 'FULL',
          requested_amount_lak: '400000',
          channel: 'MANUAL_QR',
          reference: 'TX-BCEL-9921',
          created_at: '2026-10-20T10:00:00Z'
        }
      ]
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={pendingOrder}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';

    // Must show PENDING REVIEW badge, not 100% PAID
    expect(text).toContain('ລໍຖ້າກວດສອບ (PENDING REVIEW)');
    expect(text).not.toContain('ຊຳລະຄົບຖ້ວນ 100% (100% PAID)');

    // Must show actual reference
    expect(text).toContain('Ref: TX-BCEL-9921');

    // Must indicate pending verification
    expect(text).toContain('ລໍຖ້າການກວດສອບ');

    // Bottom banner must NOT claim settled
    expect(text).not.toContain('ບັນຊີປິດຍອດສົມບູນ');
    expect(text).toContain('ລໍຖ້າການກວດສອບ');
  });

  it('3. Renders canonical receipt, verifier, and 100% PAID when CONFIRMED', async () => {
    const confirmedOrder = {
      id: 'ORD-PROV-003',
      orderNo: 'ORD-PROV-003',
      status: 'COMPLETED',
      payment_state: 'PAID',
      totalAmount: 500000,
      payment_method: 'MANUAL_QR',
      paymentSummary: {
        received_net_lak: '500000',
        remaining_lak: '0',
        total_lak: '500000',
        payment_status: 'PAID'
      },
      payment_records: [
        {
          id: 'pr-conf-1',
          record_kind: 'RECEIPT',
          state: 'CONFIRMED',
          purpose: 'FULL',
          requested_amount_lak: '500000',
          actual_received_amount_lak: '500000',
          channel: 'MANUAL_QR',
          reference: 'RCP-2026-7890',
          reviewed_by: 'acct_user_douangsva',
          created_at: '2026-10-20T10:00:00Z',
          reviewed_at: '2026-10-20T10:15:00Z'
        }
      ]
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={confirmedOrder}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';

    // Receipt and verifier from canonical record
    expect(text).toContain('Ref: RCP-2026-7890');
    expect(text).toContain('ກວດສອບໂດຍ: acct_user_douangsva');

    // Payment method resolved correctly
    expect(text).toContain('ໂອນຜ່ານ QR / ທະນາຄານ (Manual QR)');

    // Full settlement status
    expect(text).toContain('ຊຳລະຄົບຖ້ວນ 100% (100% PAID)');
    expect(text).toContain('ບັນຊີປິດຍອດສົມບູນ');
    expect(text).toContain('LAK 0.00 (ປິດຍອດສົມບູນ)');
  });

  it('4. Renders REVERSED payment state and provenance record truthfully', async () => {
    const reversedOrder = {
      id: 'ORD-PROV-004',
      orderNo: 'ORD-PROV-004',
      status: 'CANCELLED',
      payment_state: 'REVERSED',
      totalAmount: 300000,
      payment_records: [
        {
          id: 'pr-rev-1',
          record_kind: 'REVERSAL',
          state: 'CONFIRMED',
          purpose: 'FULL',
          requested_amount_lak: '300000',
          actual_received_amount_lak: '300000',
          channel: 'MANUAL_QR',
          reference: 'REV-2026-0042',
          reviewed_by: 'manager_keo',
          reason: 'Customer cancelled artwork before production'
        }
      ]
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={reversedOrder}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';

    // Must show REVERSED badge
    expect(text).toContain('ຍົກເລີກ / ຄືນເງິນ (REVERSED)');
    expect(text).toContain('Ref: REV-2026-0042');
    expect(text).toContain('ລາຍການຖືກຍົກເລີກ / ຄືນເງິນ');
  });

  it('5. Protects against fake margin when actual costs are incomplete (unrecorded)', async () => {
    const incompleteCostOrder = {
      id: 'ORD-PROV-005',
      orderNo: 'ORD-PROV-005',
      status: 'COMPLETED',
      totalAmount: 600000,
      realized_paper_cost: null, // Unrecorded
      realized_ink_cost: null,   // Unrecorded
      realized_labor_cost: null, // Unrecorded
      realized_finishing_cost: null,
      realized_spoilage_cost: null,
      realized_total_cost: null,
      cost_completeness: 'INCOMPLETE',
      actual_cost_complete: false
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={incompleteCostOrder}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';

    // Truthful incomplete labels in Lao
    expect(text).toContain('ຍັງບໍ່ມີຂໍ້ມູນຕົ້ນທຶນ');
    expect(text).toContain('ລໍຖ້າບັນທຶກຕົ້ນທຶນຈິງ');
    expect(text).toContain('ຍັງບໍ່ຄົບຖ້ວນ');
    expect(text).toContain('ລໍຖ້າຂໍ້ມູນຕົ້ນທຶນ');

    // Individual unrecorded items show 'ຍັງບໍ່ໄດ້ບັນທຶກ'
    expect(text).toContain('ຍັງບໍ່ໄດ້ບັນທຶກ');

    // Must NEVER claim 100% margin or LAK 600,000 profit
    expect(text).not.toContain('100.0%');
  });

  it('6. Preserves legitimate zero costs (0 LAK finishing & spoilage) with truthful margin', async () => {
    const completeZeroCostOrder = {
      id: 'ORD-PROV-006',
      orderNo: 'ORD-PROV-006',
      status: 'COMPLETED',
      totalAmount: 100000,
      realized_paper_cost: 50000,
      realized_ink_cost: 20000,
      realized_labor_cost: 10000,
      realized_finishing_cost: 0, // Legitimate 0 (no lamination)
      realized_spoilage_cost: 0,   // Legitimate 0 (no scrap)
      realized_total_cost: 80000,  // 50k + 20k + 10k + 0 + 0 = 80k
      cost_completeness: 'COMPLETE',
      actual_cost_complete: true
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={completeZeroCostOrder}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';

    // Finishing and Spoilage must display LAK 0.00 as legitimate values, NOT 'ຍັງບໍ່ໄດ້ບັນທຶກ'
    expect(text).not.toContain('ຍັງບໍ່ໄດ້ບັນທຶກ');
    expect(text).toContain('LAK 80,000.00'); // COGS
    expect(text).toContain('LAK 20,000.00'); // Gross Profit (100k - 80k)
    expect(text).toContain('20.0%');         // Margin % (20k / 100k)
  });

  it('7. Codex: PARTIAL costs whose components disagree with total must not show finalized profit', async () => {
    const order = {
      id: 'codex-partial',
      totalAmount: 1000,
      realized_cost_status: 'PARTIAL',
      realized_cost_provenance: 'MANUAL_ENTRY',
      realized_paper_cost: 100,
      realized_ink_cost: 100,
      realized_labor_cost: 100,
      realized_finishing_cost: 0,
      realized_spoilage_cost: 0,
      realized_total_cost: 100
    };

    await act(async () => {
      root.render(
        <AppProvider>
          <OrderCompletedSummaryPage
            order={order}
            onBack={vi.fn()}
            onSelectStep={vi.fn()}
            formatLAK={formatLAK}
            currentLang="lo"
          />
        </AppProvider>
      );
    });

    const text = container.textContent || '';
    // Suppress false 90% margin
    expect(text).not.toContain('90.0%');
    // Truthful incomplete indicators
    expect(text).toContain('ຍັງບໍ່ຄົບຖ້ວນ');
    expect(text).toContain('ຍັງບໍ່ມີຂໍ້ມູນຕົ້ນທຶນ');
    expect(text).toContain('PARTIAL');
  });
});
