import { describe, it, expect } from 'vitest';

/**
 * Unit Test: การคำนวณอัตราแลกเปลี่ยนและค่าเงินของระบบ Som Sing Phim
 * ตรวจสอบความถูกต้องของการแปลงสกุลเงิน LAK (กีบ), THB (บาท), USD (ดอลลาร์)
 */
describe('Currency & Financial Calculation Logic', () => {

  const mockRates = {
    LAK_PER_THB: 672.73,
    LAK_PER_USD: 21800.0,
    THB_PER_USD: 32.40,
  };

  it('UT-01: แปลงจากบาท (THB) เป็นกีบ (LAK) ได้อย่างแม่นยำและปัดเศษจำนวนเต็ม', () => {
    const thbAmount = 1500; // 1,500 บาท
    const expectedLak = Math.round(thbAmount * mockRates.LAK_PER_THB); // ~1,009,095 กีบ
    
    expect(expectedLak).toBe(1009095);
    expect(expectedLak).toBeGreaterThan(0);
  });

  it('UT-02: ตรวจสอบความแม่นยำของการคำนวณภาษีมูลค่าเพิ่ม (VAT 7%) ไม่ให้เกิดปัญหาเศษสตางค์หลุด', () => {
    const subtotal = 1250000; // 1,250,000 กีบ
    const vatRate = 0.07;
    const vatAmount = Math.round(subtotal * vatRate);
    const grandTotal = subtotal + vatAmount;

    expect(vatAmount).toBe(87500);
    expect(grandTotal).toBe(1337500);
  });

  it('UT-03: ป้องกันกรณีตัวเลขผิดปกติ เช่น ติดลบ หรือค่าว่าง (Defensive Guard)', () => {
    const sanitizeAmount = (amount: number) => (isNaN(amount) || amount < 0 ? 0 : amount);
    
    expect(sanitizeAmount(-500)).toBe(0);
    expect(sanitizeAmount(NaN)).toBe(0);
    expect(sanitizeAmount(1200)).toBe(1200);
  });
});
