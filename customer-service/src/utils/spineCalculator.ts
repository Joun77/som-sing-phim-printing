/**
 * Spine Thickness & Book Binding Calculation Engine
 * Designed for Som Sing Phim Print On Demand Workshop
 */

export interface SpineCalculationResult {
  sheetCount: number;         // จำนวนแผ่นเนื้อใน (เช่น 100 หน้า 2 หน้า/แผ่น = 50 แผ่น)
  innerThicknessMm: number;   // ความหนาเฉพาะเนื้อใน (มม.)
  coverThicknessMm: number;   // ความหนาเฉพาะปก (มม.)
  spineThicknessMm: number;   // ความหนาสันรวมกาว (มม.)
  canPrintSpineText: boolean; // แนะนำให้พิมพ์ตัวหนังสือที่สันหรือไม่ (ถ้า >= 3.0 มม. พิมพ์ได้)
  spineStatusText: string;    // คำแนะนำภาษาลาว/ไทย
}

// Paper Caliper / Bulk Thickness (mm per single sheet)
export const PAPER_CALIPER_MAP: Record<string, number> = {
  'bond-70': 0.090,
  'bond-80': 0.105,
  'greenread-75': 0.125, // ถนอมสายตา 75g กระดาษฟู
  'greenread-80': 0.130,
  'art-105': 0.085,
  'art-128': 0.100,
  'art-157': 0.125,
  'artcard-190': 0.180,
};

// Cover Caliper (mm per sheet)
export const COVER_CALIPER_MAP: Record<string, number> = {
  'artcard-230': 0.240,
  'artcard-260': 0.280,
  'artcard-300': 0.350,
  'artcard-350': 0.420,
  'hardcover': 2.500, // ปกแข็งจั่วปัง
};

export const HOT_MELT_GLUE_ALLOWANCE_MM = 0.45; // ความหนาของชั้นกาวร้อนมาตรฐาน

/**
 * Calculates spine thickness for perfect binding (เข้าเล่มสันกาว)
 * @param pageCount จำนวนหน้าทั้งหมดของเนื้อใน
 * @param paperId รหัสกระดาษเนื้อใน (e.g. 'bond-80', 'greenread-75')
 * @param coverId รหัสกระดาษปก (e.g. 'artcard-260', 'artcard-300')
 * @param isDoubleSided พิมพ์หน้า-หลัง (ค่าเริ่มต้นคือ true)
 */
export function calculateSpineThickness(
  pageCount: number,
  paperId: string = 'bond-80',
  coverId: string = 'artcard-260',
  isDoubleSided: boolean = true
): SpineCalculationResult {
  const safePages = Math.max(1, pageCount || 1);
  const sheetCount = isDoubleSided ? Math.ceil(safePages / 2) : safePages;

  // Lookup or default
  const paperCaliper = PAPER_CALIPER_MAP[paperId] || 0.105;
  const coverCaliper = COVER_CALIPER_MAP[coverId] || 0.280;

  const innerThicknessMm = sheetCount * paperCaliper;
  const coverThicknessMm = coverCaliper * 2; // ปกหน้า + ปกหลัง

  // ความหนารวม = เนื้อใน + ปก + กาวร้อน
  const rawSpine = innerThicknessMm + coverThicknessMm + HOT_MELT_GLUE_ALLOWANCE_MM;
  const spineThicknessMm = Math.round(rawSpine * 10) / 10; // ปัดทศนิยม 1 ตำแหน่ง

  const canPrintSpineText = spineThicknessMm >= 3.0;

  let spineStatusText = '';
  if (spineThicknessMm < 3.0) {
    spineStatusText = 'ສັນບາງກວ່າ 3mm ບໍ່ແນະນຳໃຫ້ໃສ່ຂໍ້ຄວາມທີ່ສັນປົກ (สันบาง ไม่แนะนำให้พิมพ์ข้อความที่สัน)';
  } else if (spineThicknessMm >= 3.0 && spineThicknessMm < 15.0) {
    spineStatusText = 'ຄວາມໜາສັນມາດຕະຖານ ສາມາດໃສ່ຊື່ປຶ້ມທີ່ສັນໄດ້ (สันขนาดมาตรฐาน พิมพ์ข้อความได้สวยงาม)';
  } else {
    spineStatusText = 'ປຶ້ມຂະໜາດໜາພິເສດ ຄວນໃຊ້ກາວຮ້ອນຄຸນນະພາບສູງ (เล่มหนาพิเศษ แข็งแรง ทนทาน)';
  }

  return {
    sheetCount,
    innerThicknessMm: Math.round(innerThicknessMm * 10) / 10,
    coverThicknessMm: Math.round(coverThicknessMm * 10) / 10,
    spineThicknessMm,
    canPrintSpineText,
    spineStatusText,
  };
}
