import { describe, expect, it } from 'vitest';
import { 
  conversionSourceRevisionMatches, 
  confirmedSavedConversion, 
  confirmedConversionOrder 
} from './confirmedConversion';

const SOURCE = '2026-10-06T18:20:38.234462Z';
const ROW = '2026-10-06T18:20:38.299555Z';
const key = 'quotation-conversion:quot-21819084-e6bb-4bb1-9945-3795bee20906';
const orderId = 'order-eb9a87e6914213efa8e311af7ce336cc';
const envelope = { 
  status: 'success',
  committed: true,
  replayed: true,
  quotation_id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906',
  quotation_status: 'CONVERTED',
  idempotency_key: key,
  source_quotation_updated_at: SOURCE,
  approval_required: false,
  order_id: orderId,
  order_number: 'ORD-20261006-0001',
  data: {
    id: orderId,
    order_no: 'ORD-20261006-0001',
    idempotency_key: key,
    status: 'Pending',
    total_amount_lak: 184,
    total_cost: 103,
    deposit_lak: 0,
    remaining_lak: '184.00',
    items: [
      {
        id: `item-${orderId}-1`,
        quantity: 1,
        unit_cost_lak: 103,
        unit_price_lak: 172,
        total_price_lak: 172,
      }
    ]
  }
};
const order = { id: orderId };
const link = { 
  quotation_id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
  order_id: orderId, 
  idempotency_key: key, 
  source_updated_at: SOURCE 
};

describe('conversionSourceRevisionMatches', () => {
  it('accepts reloaded converted quotation whose row updated_at advanced past immutable source revision', () => {
    expect(conversionSourceRevisionMatches(envelope, order, { 
      id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
      updated_at: ROW, 
      conversion: link 
    })).toBe(true);
  });
  it('accepts first conversion when acknowledged row revision equals envelope revision', () => {
    expect(conversionSourceRevisionMatches(envelope, order, { 
      id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
      updated_at: SOURCE 
    })).toBe(true);
  });
  it('rejects first conversion when row revision differs and no saved linkage', () => {
    expect(conversionSourceRevisionMatches(envelope, order, { 
      id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
      updated_at: ROW 
    })).toBe(false);
  });
  it('rejects saved linkage mismatches (revision, order, key, quotation)', () => {
    const q = (c: object) => ({ 
      id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
      updated_at: ROW, 
      conversion: { ...link, ...c } 
    });
    expect(conversionSourceRevisionMatches(envelope, order, q({ source_updated_at: ROW }))).toBe(false);
    expect(conversionSourceRevisionMatches(envelope, order, q({ order_id: 'order-different' }))).toBe(false);
    expect(conversionSourceRevisionMatches(envelope, order, q({ idempotency_key: 'quotation-conversion:x' }))).toBe(false);
    expect(conversionSourceRevisionMatches(envelope, order, q({ quotation_id: 'quot-different' }))).toBe(false);
  });
  it('rejects missing or empty envelope revision', () => {
    expect(conversionSourceRevisionMatches({ idempotency_key: key }, order, { 
      id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
      conversion: link 
    })).toBe(false);
    expect(conversionSourceRevisionMatches({ source_quotation_updated_at: '', idempotency_key: key }, order, { 
      id: 'quot-21819084-e6bb-4bb1-9945-3795bee20906', 
      conversion: link 
    })).toBe(false);
  });
});

describe('confirmedSavedConversion and confirmedConversionOrder with canonical DTO', () => {
  it('validates canonical order with decimal remaining_lak string 184.00 and normalizes copy', () => {
    const parsed = confirmedConversionOrder(envelope.data);
    expect(parsed.id).toBe(orderId);
    expect(parsed.total_amount_lak).toBe(184);
    expect(parsed.remaining_lak).toBe(184);
    expect(parsed.total_cost).toBe(103);
  });

  it('validates healthy replay envelope against saved quotation ID', () => {
    const res = confirmedSavedConversion(envelope, 'quot-21819084-e6bb-4bb1-9945-3795bee20906');
    expect(res.envelope.replayed).toBe(true);
    expect(res.order.id).toBe(orderId);
  });

  it('rejects uncommitted conversion envelope', () => {
    expect(() => confirmedSavedConversion({ ...envelope, committed: false }, 'quot-21819084-e6bb-4bb1-9945-3795bee20906')).toThrow();
  });

  it('rejects mismatched quotation ID in envelope', () => {
    expect(() => confirmedSavedConversion(envelope, 'quot-other')).toThrow();
  });

  it('rejects newly created conversion that fabricates non-zero deposit', () => {
    const newConv = {
      ...envelope,
      replayed: false,
      data: {
        ...envelope.data,
        deposit_lak: 50,
        remaining_lak: '134.00'
      }
    };
    expect(() => confirmedSavedConversion(newConv, 'quot-21819084-e6bb-4bb1-9945-3795bee20906')).toThrow('New conversion cannot fabricate a receipt');
  });
});
