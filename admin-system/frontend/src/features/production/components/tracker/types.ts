import React from 'react';
import type { ProductionStep } from '../../../orders/types';

export interface StepConfig {
  step: ProductionStep;
  stepNumber: number;
  labelLao: string;
  labelEn: string;
}

export interface RCAOption {
  id: string;
  labelLao: string;
  labelEn: string;
}

export const PRODUCTION_STEPS_CONFIG: StepConfig[] = [
  {
    step: 'INNER_PRINTED',
    stepNumber: 1,
    labelLao: '1. ພິມເນື້ອໃນ',
    labelEn: 'Inner Print',
  },
  {
    step: 'COVER_PRINTED',
    stepNumber: 2,
    labelLao: '2. ພິມປົກ',
    labelEn: 'Cover Print',
  },
  {
    step: 'COVER_LAMINATED',
    stepNumber: 3,
    labelLao: '3. ເຄືອບປົກ',
    labelEn: 'Lamination',
  },
  {
    step: 'PAPER_TRIMMED',
    stepNumber: 4,
    labelLao: '4. ຕັດເຈ້ຍ',
    labelEn: 'Paper Cut',
  },
  {
    step: 'BOUND',
    stepNumber: 5,
    labelLao: '5. ເຂົ້າເຫຼັ້ມ',
    labelEn: 'Binding',
  },
  {
    step: 'READY_FOR_PICKUP',
    stepNumber: 6,
    labelLao: '6. QC ພ້ອມມອບ',
    labelEn: 'Ready QC',
  },
];

export const STEP_ORDER_MAP: Record<ProductionStep, number> = {
  PENDING: 0,
  INNER_PRINTED: 1,
  COVER_PRINTED: 2,
  COVER_LAMINATED: 3,
  PAPER_TRIMMED: 4,
  BOUND: 5,
  READY_FOR_PICKUP: 6,
  COMPLETED: 7,
};

export const RCA_CAUSES: RCAOption[] = [
  { id: 'PAPER_JAM', labelLao: 'ເຈ້ຍຕິດ / ປ້ອນບ່ຽວ', labelEn: 'Paper Jam' },
  { id: 'COLOR_MISMATCH', labelLao: 'ສີບໍ່ຕົງ / ໝຶກພ້ຽน', labelEn: 'Color Mismatch' },
  { id: 'PLATE_DAMAGED', labelLao: 'ເພລດເສຍ / ມີຮອຍຂີດ', labelEn: 'Plate Scratch' },
  { id: 'INK_SMUDGE', labelLao: 'ໝຶກເລິ / ເປິເປື້ອນ', labelEn: 'Ink Smudge' },
  { id: 'DIECUT_MISALIGNED', labelLao: 'ຕັດບ່ຽວ / ໃບມີດບໍ່ຄົມ', labelEn: 'Diecut Misaligned' },
  { id: 'OTHER_FAULT', labelLao: 'ອື່ນໆ / ຂັດຂ້ອງທົ່ວໄປ', labelEn: 'Other Cause' },
];

export interface MachineChangeLog {
  id: string;
  category: 'Printer' | 'Cutter' | 'Binder' | 'Laminator' | string;
  previousMachineId: string;
  previousMachineName: string;
  newMachineId: string;
  newMachineName: string;
  reason: string;
  changedBy: string;
  timestamp: string;
}

