import React from 'react';
import PrinterInkComparisonCard from './PrinterInkComparisonCard';
import { 
  FileText, 
  Droplet, 
  Printer, 
  Film, 
  BookOpen, 
  Scissors, 
  Maximize2, 
  Package, 
  Wrench,
  Layers,
  Sparkles,
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Cpu,
  RotateCw,
  Activity,
  ArrowRightLeft,
  Thermometer,
  Boxes,
  Compass,
  Palette
} from 'lucide-react';

export interface DynamicSpecDetailProps {
  item: any;
  currentLang?: string;
  categoryType?: string;
  hideInkComparisonCard?: boolean;
}

/**
 * Consolidated Dynamic Component for Rendering Inventory & Inbound Technical Specifications
 * Perfectly aligned with Inbound Procurement Forms (Forms 1–9) and Data Material & Machines Spec.
 */
export default function DynamicSpecDetail({
  item,
  currentLang = 'lo',
  categoryType,
  hideInkComparisonCard = false,
}: DynamicSpecDetailProps) {
  if (!item) return null;

  const isLao = currentLang === 'lo';
  const resolvedCategory = (
    categoryType ||
    item.category ||
    item.categoryType ||
    item.importType ||
    ''
  ).toLowerCase();

  const specs = item.specs || item.technical_specs || item || {};

  // 1. PAPER SPEC DETAIL (Cut Sheet, Roll, or Parent Sheet 31x43")
  if (
    resolvedCategory.includes('paper') || 
    resolvedCategory.includes('ເຈ້ຍ') || 
    resolvedCategory.includes('material')
  ) {
    const paperFormat = (specs.paperFormat || specs.paper_format || 'cut_sheet').toLowerCase();
    const isRoll = paperFormat === 'roll';
    const isParentSheet = !isRoll && (paperFormat === 'parent_sheet' || 
      Boolean(specs.standardSize?.includes('31x43')) || 
      Boolean(specs.standardSize?.includes('787')) || 
      Boolean(specs.isParentSheet));

    const paperType = specs.paperType || item.paperType || 'Plain Paper';
    const compatList = Array.isArray(specs.compatibilities) 
      ? specs.compatibilities 
      : typeof specs.compatibilities === 'string' 
      ? [specs.compatibilities] 
      : [];

    return (
      <div className="space-y-3.5 text-xs font-medium">
        {/* Primary Classification Bento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ປະເພດເນື້ອເຈ້ຍ' : 'Paper Type'}
            </span>
            <span className="text-sky-700 font-extrabold mt-0.5 inline-flex items-center gap-1 text-xs">
              <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              {paperType}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ຮູບແບບເຈ້ຍ' : 'Paper Format'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">
              {isParentSheet 
                ? (isLao ? 'ແຜ່ນໃຫຍ່ໂຮງງານ (31x43")' : 'Parent Sheet (31x43")')
                : isRoll 
                  ? (isLao ? 'ມ້ວນ (Roll Media)' : 'Roll Media')
                  : (isLao ? 'ແຜ່ນຕັດສຳເລັດ (Cut Sheet)' : 'Cut Sheet')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ຂະໜາດ / ໜ້າກວ້າງ' : 'Size / Dimensions'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block font-mono">
              {isParentSheet 
                ? '31" x 43" (787 x 1092 mm)'
                : isRoll 
                  ? `${specs.rollWidthM || 0.61}m x ${specs.rollLengthM || 30}m`
                  : specs.standardSize === 'Custom Sheet' && specs.customWidthMm && specs.customLengthMm
                  ? `${specs.customWidthMm} x ${specs.customLengthMm} mm`
                  : (specs.standardSize || specs.paperSize || 'A4')}
            </span>
          </div>

          {(specs.grammageGsm || specs.grammage) && (
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                {isLao ? 'ຄວາມໜາ / ນ້ຳໜັກ' : 'Grammage'}
              </span>
              <span className="text-slate-900 font-black mt-0.5 block font-mono text-xs">
                {specs.grammageGsm || specs.grammage} GSM
              </span>
            </div>
          )}
        </div>

        {/* Technical Attributes Bento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {isLao ? 'ຜິວສຳພັດ' : 'Surface'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">
              {(() => {
                if (paperType === 'Plain Paper' && specs.paperSurface === 'Glossy') {
                  return 'Plain Paper / Uncoated';
                }
                return specs.paperSurface || specs.surfaceFinish || 'Uncoated (ບໍ່ເຄືອບ)';
              })()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {isLao ? 'ການພິມໜ້າ-ຫຼັງ' : 'Printable Sides'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">
              {specs.printableSides === 'Single-sided' || specs.printableSides === 'Single'
                ? (isLao ? 'ພິມໜ້າດຽວ' : 'Single-sided')
                : (isLao ? 'ພິມສອງໜ້າ (Double-side)' : 'Double-sided')}
            </span>
          </div>

          {(specs.sheets_per_pack || specs.sheetsPerPack || specs.sheets_per_ream) && (
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                {isLao ? 'ຈຳນວນແຜ່ນ/ແພັກ' : 'Sheets/Pack'}
              </span>
              <span className="text-sky-700 font-black mt-0.5 block font-mono">
                {specs.sheets_per_pack || specs.sheetsPerPack || specs.sheets_per_ream} {isLao ? 'ແຜ່ນ' : 'sheets'}
              </span>
            </div>
          )}

          {specs.brand && (
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                {isLao ? 'ແບຣນ / ຍີ່ຫໍ້' : 'Brand'}
              </span>
              <span className="text-slate-900 font-bold mt-0.5 block">
                {specs.brand}
              </span>
            </div>
          )}

          {specs.grainDirection && (
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                {isLao ? 'ທິດທາງເກຣນເຈ້ຍ' : 'Grain Direction'}
              </span>
              <span className="text-slate-900 font-bold mt-0.5 block">
                {specs.grainDirection === 'LG' ? 'Long Grain (LG)' : 'Short Grain (SG)'}
              </span>
            </div>
          )}

          {specs.cutWastePct !== undefined && specs.cutWastePct !== null && (
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                {isLao ? 'ເຜື່ອເສດຕັດ (Waste Factor)' : 'Waste Allowance'}
              </span>
              <span className="text-amber-700 font-bold mt-0.5 block">
                {specs.cutWastePct}%
              </span>
            </div>
          )}

          {specs.boardThicknessMm && (
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                {isLao ? 'ຄວາມໜາຈົ່ວປັງ' : 'Board Thickness'}
              </span>
              <span className="text-slate-900 font-bold mt-0.5 block font-mono">
                {specs.boardThicknessMm} mm
              </span>
            </div>
          )}
        </div>

        {/* Ink Compatibilities Tag Bar */}
        {compatList.length > 0 && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-500 font-bold text-xs flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-sky-600" />
              <span>{isLao ? 'ຄວາມເຂົ້າກັນໄດ້ກັບໝຶກ (Ink Compatibility):' : 'Ink Compatibility:'}</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {compatList.map((comp: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-lg border border-sky-200"
                >
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. INK & TONER SPEC DETAIL
  if (resolvedCategory.includes('ink') || resolvedCategory.includes('toner') || resolvedCategory.includes('ໝຶກ')) {
    const inkCode = specs.inkCode || item.sku || item.id;
    const colorName = specs.colorName || item.name;
    const colorGroup = specs.colorGroup || item.colorGroup;
    const volume = specs.volume || specs.inkVolume || item.volume;
    const inkBaseType = specs.inkBaseType || item.inkBaseType;
    const isCompatible = specs.isCompatible !== undefined ? specs.isCompatible : item.isCompatible;
    const targetPrinter = specs.targetPrinterId || item.targetPrinterId;

    return (
      <div className="space-y-3 text-xs font-medium">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {isLao ? 'ລະຫັດໝຶກ / SKU' : 'Ink Code / SKU'}
            </span>
            <span className="text-slate-900 font-mono font-bold mt-0.5 block">{inkCode || '-'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {isLao ? 'ຊື່ສີ & ກຸ່ມສີ' : 'Color & Channel'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">
              {colorName} {colorGroup ? `(${colorGroup})` : ''}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {isLao ? 'ບໍລິມາດ / ນ້ຳໜັກ' : 'Volume / Net Qty'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block font-mono">
              {volume ? `${volume} ml` : (specs.inkWeightGrams ? `${specs.inkWeightGrams} g` : '-')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {isLao ? 'ມາດຕະຖານໝຶກ' : 'Ink Standard'}
            </span>
            <span className={`font-black mt-0.5 block ${isCompatible ? 'text-blue-600' : 'text-emerald-600'}`}>
              {isCompatible 
                ? (isLao ? 'Compatible (ໝຶກທຽບ)' : 'Compatible')
                : (isLao ? 'OEM (ໝຶກແທ້ສູນ)' : 'Genuine OEM')}
            </span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">
              {isLao ? 'ຊະນິດເນື້ອໝຶກ (Ink Chemistry):' : 'Ink Chemistry:'}
            </span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 font-bold rounded-lg border border-sky-200">
              {inkBaseType || 'Dye / Pigment'}
            </span>
          </div>
          {targetPrinter && (
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isLao ? 'ຜູກກັບເຄື່ອງພິມ:' : 'Assigned Printer:'}</span>
              <strong className="text-slate-800 font-mono">{targetPrinter}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. MACHINERY & PRINTERS SPEC DETAIL
  if (
    resolvedCategory.includes('printer') ||
    resolvedCategory.includes('equipment') ||
    resolvedCategory.includes('machinery') ||
    resolvedCategory.includes('machine') ||
    resolvedCategory.includes('cutter') ||
    resolvedCategory.includes('laminator') ||
    resolvedCategory.includes('binder')
  ) {
    const rawName = item.name || item.itemName || '';
    const nameParts = rawName.trim().split(' ');
    const fallbackBrand = nameParts[0] || 'Machine';
    const fallbackModel = nameParts.slice(1).join(' ') || rawName;

    const brand = specs.brand || specs.machineBrand || item.brand || fallbackBrand;
    const model = specs.model || specs.machineModel || item.model || fallbackModel;
    const serialNumber = item.serialNumber || specs.serialNumber || item.sn || '-';
    const assetId = item.id || specs.id || item.sku || item.skuCode || 'EQ-ASSET';
    const components = item.components || specs.components || [];

    const categoryStr = (item.category || item.categoryType || item.machineryTypeCategory || specs.printerCategory || '').toLowerCase();
    const subtypeStr = (item.postPressSubtype || specs.postPressSubtype || '').toLowerCase();

    const isCutter = categoryStr.includes('cutter') || subtypeStr.includes('cutter') || subtypeStr.includes('guillotine') || subtypeStr.includes('plotter');
    const isLaminator = categoryStr.includes('laminator') || subtypeStr.includes('laminator');
    const isBinder = categoryStr.includes('binder') || subtypeStr.includes('binder');
    const isInkjet = categoryStr.includes('inkjet') || subtypeStr.includes('inkjet');
    const isLaser = !isCutter && !isLaminator && !isBinder && !isInkjet;

    const printerCategory = isCutter ? 'Cutter & Finishing' :
      isLaminator ? 'Laminator & Coating' :
      isBinder ? 'Book Binder' :
      isInkjet ? 'Inkjet Production' :
      'Laser Production Press';

    // Laser Specs
    const speedMonoPpm = Number(specs.speedMonoPpm || specs.speedPpmBlack || specs.speedPpm || 0);
    const speedColorPpm = Number(specs.speedColorPpm || specs.speedPpmColor || specs.speedPpm || 0);
    const isDuplex = specs.duplexMode === 'Auto-Duplex' || specs.duplexSupport === true || specs.duplexSupport === 'YES';
    const minGsm = Number(specs.supportedGsmMin || specs.minPaperGsm || 64);
    const maxGsm = Number(specs.supportedGsmMax || specs.maxPaperGsm || 300);
    const maxPaperSize = specs.maxPaperSize || (specs.maxPaperWidthMm ? `${specs.maxPaperWidthMm}x${specs.maxPaperLengthMm || 450} mm` : 'SRA3');
    const feedType = specs.feedType || 'Cut-sheet';

    // Cutter Specs
    const cutterMaxWidthMm = Number(specs.cutterMaxWidthMm || 920);
    const cutterMaxSpeedMms = Number(specs.cutterMaxSpeedMms || 500);
    const cutterDownforceG = Number(specs.cutterDownforceG || 600);
    const cutterSubtypeLabel = subtypeStr.includes('plotter') 
      ? 'Roll Plotter (ພລັອດເຕີສະຕິກເກີມ້ວນ)' 
      : subtypeStr.includes('flatbed') 
      ? 'Flatbed Cutter (ໂຕະຮາບຕັດກ່ອງ/ໂຟມ)' 
      : 'Guillotine Cutter (ຕັດເຈ້ຍເປັນຕັ້ງ)';

    // Laminator Specs
    const laminatorMaxWidthMm = Number(specs.laminatorMaxWidthMm || 650);
    const laminatorMaxSpeedMmin = Number(specs.laminatorMaxSpeedMmin || 5);
    const laminatorMaxTempC = Number(specs.laminatorMaxTempC || 140);

    // Binder Specs
    const binderMaxThicknessMm = Number(specs.binderMaxThicknessMm || 40);
    const binderSpeedBooksHr = Number(specs.binderSpeedBooksHr || 200);

    // Power & Warmup (Warm-up is ONLY for Laser, Laminator, Binder)
    const operatingWatts = Number(specs.operatingWatts || specs.machineOperatingWatts || specs.operatingPowerWatts || (isCutter ? 1200 : isLaminator ? 1500 : isBinder ? 1200 : isInkjet ? 350 : 2200));
    const warmUpTimeMins = Number(specs.warmUpTimeMins || 0);
    const warmupSeconds = Number(specs.warmupSeconds || warmUpTimeMins * 60 || 0);
    const hasWarmup = isLaser || isLaminator || isBinder;

    // Structured Wear Parts Definition aligned 100% with Inbound Form
    interface WearPartItem {
      nameLo: string;
      nameEn: string;
      cost: number;
      life: number;
      unitEn: string;
      badgeColor: 'indigo' | 'sky' | 'amber' | 'purple' | 'rose';
      isWasteRate?: boolean;
    }

    let wearParts: WearPartItem[] = [];

    if (isCutter) {
      wearParts = [
        {
          nameLo: '1. ຄ່າຈ້າງລັບຄົມໃບມີດ (Sharpening)',
          nameEn: 'Sharpening Blade Service',
          cost: Number(specs.wearSharpeningCost || 150000),
          life: Number(specs.wearSharpeningIntervalCuts || 10000),
          unitEn: 'cuts',
          badgeColor: 'amber'
        },
        {
          nameLo: '2. ໄມ້ຮອງໃບມີດຕັດ (Cutting Stick)',
          nameEn: 'Cutting Stick Pad',
          cost: Number(specs.wearCuttingStickCost || 100000),
          life: Number(specs.wearCuttingStickLifeCuts || 20000),
          unitEn: 'cuts',
          badgeColor: 'amber'
        },
        {
          nameLo: '3. ໃບມີດພລັອດເຕີ (Plotter Blade)',
          nameEn: 'Plotter Blade Replacement',
          cost: Number(specs.wearBladeCost || 250000),
          life: Number(specs.wearBladeLifeMeters || 5000),
          unitEn: 'm',
          badgeColor: 'amber'
        }
      ];
    } else if (isLaminator) {
      wearParts = [
        {
          nameLo: '1. ລູກກິ້ງຢາງຄວາມຮ້ອນ (Silicone Rollers)',
          nameEn: 'Silicone Heat Rollers',
          cost: Number(specs.wearSiliconeRollerCost || 1200000),
          life: Number(specs.wearSiliconeRollerLifeMeters || 20000),
          unitEn: 'm',
          badgeColor: 'purple'
        },
        {
          nameLo: '2. ແທ່ງຄວາມຮ້ອນ (Heating Element)',
          nameEn: 'Heating Element Core',
          cost: Number(specs.wearHeatingElementCost || 800000),
          life: Number(specs.wearHeatingElementHours || 5000),
          unitEn: 'hours',
          badgeColor: 'purple'
        }
      ];
    } else if (isBinder) {
      wearParts = [
        {
          nameLo: '1. ໃບມີດປາດສັນປຶ້ມ (Milling Cutter)',
          nameEn: 'Spine Milling Cutter',
          cost: Number(specs.wearMillingCutterCost || 800000),
          life: Number(specs.wearMillingCutterLifeBooks || 10000),
          unitEn: 'books',
          badgeColor: 'rose'
        },
        {
          nameLo: '2. ຊຸດເຂັມເຈາະຮູສັນລວດ (Punching Pins)',
          nameEn: 'Wire Punching Pins Set',
          cost: Number(specs.wearPunchingPinsCost || 600000),
          life: Number(specs.wearPunchingPinsLifePunches || 20000),
          unitEn: 'punches',
          badgeColor: 'rose'
        }
      ];
    } else if (isInkjet) {
      wearParts = [
        {
          nameLo: '1. ຊຸດຊັບໝຶກ (Maintenance Box)',
          nameEn: 'Maintenance Waste Box',
          cost: Number(specs.wearMaintBoxCost || 450000),
          life: Number(specs.wearMaintBoxLife || 25000),
          unitEn: 'pages',
          badgeColor: 'sky'
        },
        {
          nameLo: '2. ຫົວພິມຄວາມລະອຽດສູງ (Printhead)',
          nameEn: 'Precision Inkjet Printhead',
          cost: Number(specs.wearPrintheadCost || 4500000),
          life: Number(specs.wearPrintheadLife || 100000),
          unitEn: 'pages',
          badgeColor: 'sky'
        },
        {
          nameLo: '3. ຢາງດຶງເຈ້ຍ (Pickup Roller)',
          nameEn: 'Feed Pickup Roller',
          cost: Number(specs.wearPickupRollerCost || 150000),
          life: Number(specs.wearPickupRollerLife || 30000),
          unitEn: 'pages',
          badgeColor: 'sky'
        },
        {
          nameLo: '4. ສາຍພານຫົວພິມ (Carriage Belt)',
          nameEn: 'Carriage Drive Belt',
          cost: Number(specs.wearCarriageBeltCost || 500000),
          life: Number(specs.wearCarriageBeltLife || 50000),
          unitEn: 'pages',
          badgeColor: 'sky'
        },
        {
          nameLo: '5. ລ້າງຫົວພິມ (% Waste Loss)',
          nameEn: 'Head Cleaning Ink Waste Loss',
          cost: Number(specs.wasteLossCleaningPct || 5),
          life: 100,
          unitEn: '% loss',
          badgeColor: 'sky',
          isWasteRate: true
        }
      ];
    } else {
      // Laser Production Press
      wearParts = [
        {
          nameLo: '1. ຊຸດດຣັມສ້າງພາບ (Drum Unit)',
          nameEn: 'OPC Drum Unit',
          cost: Number(specs.wearDrumUnitCost || 1500000),
          life: Number(specs.wearDrumUnitLife || 50000),
          unitEn: 'pages',
          badgeColor: 'indigo'
        },
        {
          nameLo: '2. ຊຸດຄວາມຮ້ອນ (Fuser Unit)',
          nameEn: 'Fuser Fixing Assembly',
          cost: Number(specs.wearFuserUnitCost || 2000000),
          life: Number(specs.wearFuserUnitLife || 100000),
          unitEn: 'pages',
          badgeColor: 'indigo'
        },
        {
          nameLo: '3. ສາຍພານຖ່າຍທອດພາບ (Transfer Belt)',
          nameEn: 'Intermediate Transfer Belt (ITB)',
          cost: Number(specs.wearTransferBeltCost || 1800000),
          life: Number(specs.wearTransferBeltLife || 100000),
          unitEn: 'pages',
          badgeColor: 'indigo'
        },
        {
          nameLo: '4. ຊຸດລູກກິ້ງດຶງເຈ້ຍ (Pickup Roller)',
          nameEn: 'Paper Feed Pickup Roller',
          cost: Number(specs.wearPickupRollerCost || 150000),
          life: Number(specs.wearPickupRollerLife || 30000),
          unitEn: 'pages',
          badgeColor: 'indigo'
        },
        {
          nameLo: '5. ກ່ອງເກັບຜົງໝຶກເສຍ (Waste Toner Box)',
          nameEn: 'Waste Toner Collection Box',
          cost: Number(specs.wearWasteTonerBoxCost || 350000),
          life: Number(specs.wearWasteTonerBoxLife || 30000),
          unitEn: 'pages',
          badgeColor: 'indigo'
        }
      ];
    }

    const badgeStyles: Record<string, string> = {
      indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      sky: 'text-sky-700 bg-sky-50 border-sky-200',
      amber: 'text-amber-700 bg-amber-50 border-amber-200',
      purple: 'text-purple-700 bg-purple-50 border-purple-200',
      rose: 'text-rose-700 bg-rose-50 border-rose-200',
    };

    const oemInks = Array.isArray(specs.oemBaselineInks) 
      ? specs.oemBaselineInks 
      : Array.isArray(specs.printerInkSlots) 
      ? specs.printerInkSlots 
      : [];

    return (
      <div className="space-y-4 text-xs font-medium">
        {/* 1. Identity Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Asset ID</span>
            <span className="text-slate-900 font-mono font-bold mt-0.5 block">{assetId}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Serial Number</span>
            <span className="text-slate-900 font-mono font-bold mt-0.5 block">{serialNumber}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ແບຣນ & ຮຸ່ນ' : 'Brand & Model'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">{brand} {model}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ໝວດເຄື່ອງຈັກ' : 'Category'}
            </span>
            <span className="text-indigo-700 font-bold mt-0.5 block">{printerCategory}</span>
          </div>
        </div>

        {/* 2. Technical Capabilities Bento */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>{isLao ? 'ສະເປັກທາງເຕັກນິກ & ປະສິດທິພາບ' : 'Technical Capabilities'}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              {isCutter ? 'Cutting Engine' : isLaminator ? 'Thermal Roller' : isBinder ? 'Spine Binding' : isInkjet ? 'Piezo Inkjet' : 'Laser Electro-photographic'}
            </span>
          </div>

          {/* Laser Capabilities */}
          {isLaser && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-sky-600" />
                  <span>{isLao ? 'ຄວາມໄວພິມ (PPM)' : 'Print Speed'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {speedMonoPpm || 70} Mono / {speedColorPpm || 65} Color
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                  <span>{isLao ? 'ພິມ 2 ໜ້າ (Duplex)' : 'Duplex Mode'}</span>
                </span>
                <span className="inline-flex items-center gap-1 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isDuplex 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isDuplex ? 'Auto-Duplex' : 'Manual / 1-Sided'}
                  </span>
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span>{isLao ? 'ຊ່ວງແກຣມເຈ້ຍ (GSM)' : 'Grammage Range'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {minGsm} - {maxGsm} GSM
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-purple-600" />
                  <span>{isLao ? 'ຂະໜາດເຈ້ຍສູງສຸດ' : 'Max Paper Size'}</span>
                </span>
                <span className="text-slate-900 font-bold text-xs block font-mono">
                  {maxPaperSize}
                </span>
              </div>
            </div>
          )}

          {/* Inkjet Capabilities */}
          {isInkjet && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-sky-600" />
                  <span>{isLao ? 'ຄວາມໄວພິມ (PPM)' : 'Print Speed'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {speedMonoPpm || 30} Mono / {speedColorPpm || 20} Color
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>{isLao ? 'ຮູບແບບການປ້ອນ (Feed)' : 'Feed Type'}</span>
                </span>
                <span className="text-slate-900 font-bold text-xs block">
                  {feedType}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-600" />
                  <span>{isLao ? 'ຊ່ວງແກຣມເຈ້ຍ (GSM)' : 'Grammage Range'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {minGsm} - {maxGsm} GSM
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-purple-600" />
                  <span>{isLao ? 'ຂະໜາດສື່ສູງສຸດ' : 'Max Media Size'}</span>
                </span>
                <span className="text-slate-900 font-bold text-xs block font-mono">
                  {maxPaperSize}
                </span>
              </div>
            </div>
          )}

          {/* Cutter Capabilities */}
          {isCutter && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-amber-600" />
                  <span>{isLao ? 'ປະເພດເຄື່ອງຕັດ' : 'Cutter Type'}</span>
                </span>
                <span className="text-amber-800 font-bold text-xs block truncate" title={cutterSubtypeLabel}>
                  {cutterSubtypeLabel}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-sky-600" />
                  <span>{isLao ? 'ໜ້າກວ້າງຕັດສູງສຸດ' : 'Max Width'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {cutterMaxWidthMm} mm
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-purple-600" />
                  <span>{isLao ? 'ຄວາມໄວການຕັດ' : 'Max Speed'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {cutterMaxSpeedMms} mm/s
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-600" />
                  <span>{isLao ? 'ແຮງກົດຕັດສູງສຸດ' : 'Downforce'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {cutterDownforceG} g
                </span>
              </div>
            </div>
          )}

          {/* Laminator Capabilities */}
          {isLaminator && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-purple-600" />
                  <span>{isLao ? 'ໜ້າກວ້າງເຄືອບ' : 'Max Width'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {laminatorMaxWidthMm} mm
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-sky-600" />
                  <span>{isLao ? 'ຄວາມໄວເຄືອບສູງສຸດ' : 'Max Speed'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {laminatorMaxSpeedMmin} m/min
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-600" />
                  <span>{isLao ? 'ອຸນຫະພູມສູງສຸດ' : 'Max Temp'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {laminatorMaxTempC} °C
                </span>
              </div>
            </div>
          )}

          {/* Binder Capabilities */}
          {isBinder && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Layers className="w-3 h-3 text-rose-600" />
                  <span>{isLao ? 'ຄວາມໜາສູງສຸດ' : 'Max Thickness'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {binderMaxThicknessMm} mm
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-sky-600" />
                  <span>{isLao ? 'ຄວາມໄວເຂົ້າເຫຼັ້ມ' : 'Binding Speed'}</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-xs block">
                  {binderSpeedBooksHr} {isLao ? 'ເຫຼັ້ມ/ຊມ' : 'books/hr'}
                </span>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-600" />
                  <span>{isLao ? 'ປະເພດເຂົ້າເຫຼັ້ມ' : 'Binding Type'}</span>
                </span>
                <span className="text-slate-900 font-bold text-xs block">
                  {subtypeStr.includes('wire') ? 'Wire-O / Comb' : 'Thermal Hot Melt'}
                </span>
              </div>
            </div>
          )}

          {/* Operating Power & Warmup Info */}
          <div className="flex items-center justify-between text-[11px] pt-1 px-1 text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isLao ? 'ກຳລັງໄຟຟ້າຂະນະແລ່ນ:' : 'Operating Power:'}</span>
              <strong className="text-slate-800 font-mono">{operatingWatts} W</strong>
            </span>
            {hasWarmup ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>{isLao ? 'ເວລາອຸ່ນເຄື່ອງ/ຕົ້ມກາວ:' : 'Warm-up Time:'}</span>
                <strong className="text-slate-800 font-mono">
                  {warmupSeconds > 0 ? `${warmupSeconds} ${isLao ? 'ວິນາທີ' : 'sec'}` : `${warmUpTimeMins || 2} ${isLao ? 'ນາທີ' : 'min'}`}
                </strong>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium italic">
                {isLao ? 'ບໍ່ຕ້ອງອຸ່ນເຄື່ອງ (Instant Run)' : 'No warm-up required (Instant Run)'}
              </span>
            )}
          </div>
        </div>

        {/* 3. Embedded Wear Parts Bento Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>
                {isLao ? 'ອະໄຫຼ່ສິ້ນເປືອງປະຈຳເຄື່ອງ (Built-in Wear Parts & Cost)' : 'Built-in Wear Parts & Baseline Cost'}
              </span>
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
              {wearParts.length} Wear Parts
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isLao
              ? 'ສະເປັກລາຄາຊື້ປ່ຽນ ແລະ ອາຍຸການໃຊ້ງານຂອງອະໄຫຼ່ສິ້ນເປືອງ ທີ່ກຳນົດມາຈາກຟອມນຳເຂົ້າ ເພື່ອຄຳນວນຕົ້ນທຶນຫຼຸ້ຍຫ້ຽນຕໍ່ໜ່ວຍ'
              : 'Replacement costs and lifespans configured during Inbound receipt to calculate depreciation rates.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {wearParts.map((wp, idx) => {
              if (wp.isWasteRate) {
                return (
                  <div
                    key={idx}
                    className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/90 space-y-2 flex flex-col justify-between hover:bg-white hover:border-slate-300 transition sm:col-span-2"
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-slate-800 line-clamp-2 leading-snug">
                        {isLao ? wp.nameLo : wp.nameEn}
                      </span>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border inline-block ${badgeStyles[wp.badgeColor]}`}>
                        {wp.cost}% Waste Loss
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                      <span>{isLao ? 'ອັດຕາສູນເສຍລ້າງຫົວພິມ' : 'Cleaning Ink Loss Factor'}</span>
                    </div>
                  </div>
                );
              }

              const rate = wp.life > 0 ? wp.cost / wp.life : 0;
              const formattedRate = rate > 0 && rate < 1 ? rate.toFixed(2) : Math.round(rate).toLocaleString();
              const badgeStyle = badgeStyles[wp.badgeColor] || badgeStyles.indigo;

              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/90 space-y-2 flex flex-col justify-between hover:bg-white hover:border-slate-300 transition"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-800 line-clamp-2 leading-snug">
                      {isLao ? wp.nameLo : wp.nameEn}
                    </span>
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border inline-block ${badgeStyle}`}>
                      {formattedRate} LAK/{wp.unitEn}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-500">
                      <span>{isLao ? 'ລາຄາຊື້:' : 'Cost:'}</span>
                      <strong className="text-slate-800 font-mono">{Math.round(wp.cost).toLocaleString()} ₭</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{isLao ? 'ອາຍຸງານ:' : 'Life:'}</span>
                      <strong className="text-slate-800 font-mono">
                        {wp.life.toLocaleString()} {wp.unitEn}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. OEM Baseline Color Slots (Printers only) */}
        {Array.isArray(oemInks) && oemInks.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>{isLao ? 'ຊ່ອງສີມາດຕະຖານ OEM Baseline (Color Slots)' : 'OEM Color Slots Baseline'}</span>
              </span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                {oemInks.length} Slots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {oemInks.map((slot: any, sIdx: number) => {
                const vol = Number(slot.oemStandardVolumeMl || 0);
                const yld = Number(slot.oemStandardIsoYieldA4 || 0);
                const rate = yld > 0 ? (vol / yld).toFixed(5) : '0.00000';
                const unitRateLabel = isLaser ? 'g/p' : 'ml/p';

                return (
                  <div key={sIdx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 truncate">
                        {slot.slotPosition || `Slot ${sIdx + 1}`}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {rate} {unitRateLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ref: <span className="font-bold text-slate-700">{slot.oemInkCode || '-'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Vol: {vol}{isLaser ? 'g' : 'ml'}</span>
                      <span>Yield: {yld.toLocaleString()} p</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Wear Parts Health Monitor (If components array exists) */}
        {Array.isArray(components) && components.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <span className="text-slate-700 block text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>{isLao ? 'ສຸຂະພາບອະໄຫຼ່ສວມໃສ່ປັດຈຸບັນ (Wear Parts Health Monitor):' : 'Wear Parts Health Monitor:'}</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {components.map((comp: any, idx: number) => {
                const usage = Number(comp.usage || 0);
                const threshold = Number(comp.threshold || 90);
                const isRed = usage >= threshold;
                const isOrange = usage >= 70 && !isRed;

                return (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 truncate">{comp.name}</span>
                      <span className={isRed ? 'text-red-600 font-black' : isOrange ? 'text-amber-600 font-black' : 'text-slate-800 font-mono'}>
                        {usage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isRed ? 'bg-red-500' : isOrange ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, usage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hideInkComparisonCard && (
          <div className="pt-1">
            <PrinterInkComparisonCard printerItem={item} currentLang={currentLang} />
          </div>
        )}
      </div>
    );
  }

  // 4. LAMINATION SPEC DETAIL
  if (resolvedCategory.includes('lamination') || resolvedCategory.includes('film') || resolvedCategory.includes('ເຄືອບ')) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຮູບແບບຟີມ' : 'Format'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block">
            {specs.laminationFormat || 'Roll (ມ້ວນ)'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ວິທີການເຄືອບ' : 'Method'}
          </span>
          <span className="text-purple-700 font-bold mt-0.5 block">
            {specs.laminationMethod || 'Thermal (ເຄືອບຮ້ອນ)'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຄວາມໜາຟີມ' : 'Thickness (Micron)'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {specs.laminationThickness ? `${specs.laminationThickness} mic` : '25-32 mic'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຜິວເຄືອບ' : 'Surface Finish'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block">
            {specs.laminationFinish || 'Gloss / Matte'}
          </span>
        </div>
      </div>
    );
  }

  // 5. BINDING SPEC DETAIL
  if (resolvedCategory.includes('binding') || resolvedCategory.includes('ເຂົ້າເຫຼັ້ມ')) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ປະເພດເຂົ້າເຫຼັ້ມ' : 'Binding Type'}
          </span>
          <span className="text-rose-700 font-bold mt-0.5 block">
            {specs.bindingType || 'Wire-O (ສັນຂົດລວດ)'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຂະໜາດເສັ້ນຜ່າສູນກາງ' : 'Diameter'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {specs.bindingDiameter || '1/2" (12.7mm)'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ໄລຍະຫ່າງຮູ (Pitch)' : 'Pitch'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {specs.bindingPitch || '3:1'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຄວາມຈຸແຜ່ນ' : 'Sheet Capacity'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {specs.bindingPageCapacity ? `${specs.bindingPageCapacity} sheets` : '80-100 sheets'}
          </span>
        </div>
      </div>
    );
  }

  // 6. CUTTING SUPPLIES SPEC DETAIL
  if (resolvedCategory.includes('cuttingsupplies') || resolvedCategory.includes('cutting') || resolvedCategory.includes('ຊ່ວຍຕັດ')) {
    const supplyType = specs.supplyType || specs.cuttingSupplyType || 'transfer_tape';
    const isMat = supplyType === 'cutting_mat';

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ປະເພດວັດສະດຸ' : 'Supply Type'}
          </span>
          <span className="text-amber-700 font-bold mt-0.5 block">
            {isMat ? (isLao ? 'ແຜ່ນຮອງຕັດກາວ (Cutting Mat)' : 'Cutting Mat') : (isLao ? 'ເທບຍົກລາຍ (Transfer Tape)' : 'Transfer Tape')}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isMat ? (isLao ? 'ແຮງກາວ (Grip Level)' : 'Grip Level') : (isLao ? 'ແຮງກາວ (Tack Level)' : 'Tack Level')}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block">
            {isMat ? (specs.cuttingMatGrip || 'Standard Grip') : (specs.transferTapeTack || 'Medium Tack')}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຂະໜາດ (Dimensions)' : 'Dimensions'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {isMat 
              ? (specs.cuttingMatSize || 'A3')
              : `${specs.widthMm || specs.transferTapeWidthMm || 300}mm x ${specs.lengthM || specs.transferTapeLengthM || 50}m`}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ອາຍຸ / ຄວາມທົນທານ' : 'Lifespan'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {isMat ? `${specs.cuttingMatCycles || 100} cuts` : (isLao ? 'ມ້ວນຍາວ 100%' : 'Full Roll')}
          </span>
        </div>
      </div>
    );
  }

  // 7. RIGID SUBSTRATES SPEC DETAIL
  if (resolvedCategory.includes('rigid') || resolvedCategory.includes('ແຜ່ນບອດ')) {
    const substrateType = specs.substrateType || specs.rigidSubstrateType || 'Foam Board';
    const thicknessMm = specs.thicknessMm || specs.rigidBoardThicknessMm || 5;
    const colorSurface = specs.colorSurface || specs.rigidColorSurface || 'White (ຂາວ)';
    const sheetWidthMm = specs.sheetWidthMm || specs.rigidSheetWidthMm || 1220;
    const sheetHeightMm = specs.sheetHeightMm || specs.rigidSheetHeightMm || 2440;
    const wasteFactorPct = specs.wasteFactorPct || specs.rigidWasteFactorPct || 15;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຊະນິດແຜ່ນບອດ' : 'Substrate Type'}
          </span>
          <span className="text-emerald-700 font-bold mt-0.5 block">
            {substrateType}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຄວາມໜາ & ສີຜິວ' : 'Thickness & Surface'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {thicknessMm} mm ({colorSurface})
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຂະໜາດແຜ່ນເຕັມ' : 'Sheet Dimensions'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {sheetWidthMm} x {sheetHeightMm} mm
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ອັດຕາເຜື່ອເສຍ' : 'Waste Factor'}
          </span>
          <span className="text-amber-700 font-bold mt-0.5 block font-mono">
            {wasteFactorPct}%
          </span>
        </div>
      </div>
    );
  }

  // 8. PACKAGING CONSUMABLES SPEC DETAIL
  if (resolvedCategory.includes('packaging') || resolvedCategory.includes('ບັນຈຸພັນ')) {
    const pkgCat = specs.packagingCategory || 'box';
    const dimensions = specs.dimensions || specs.packagingDimensions || 'Standard Package';

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs font-medium">
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ໝວດບັນຈຸພັນ' : 'Packaging Type'}
          </span>
          <span className="text-teal-700 font-bold mt-0.5 block">
            {pkgCat}
          </span>
        </div>
        <div className="md:col-span-2">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ຂະໜາດ / ມິຕິ' : 'Dimensions'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block">
            {dimensions}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-bold uppercase">
            {isLao ? 'ມ້ວນ / ຄວາມຍາວ' : 'Roll Specs'}
          </span>
          <span className="text-slate-900 font-bold mt-0.5 block font-mono">
            {specs.bubbleRollLengthM ? `${specs.bubbleRollLengthM} m` : (specs.tapeLengthM ? `${specs.tapeLengthM} m` : 'Standard')}
          </span>
        </div>
      </div>
    );
  }

  // 9. SPARE PARTS SPEC DETAIL
  if (resolvedCategory.includes('spare') || resolvedCategory.includes('part') || resolvedCategory.includes('ອະໄຫຼ່')) {
    const partCat = specs.partCategory || specs.partSubCategory || item.partCategory || 'Consumable Spare Part';
    const assignedMachine = item.assignedPrinterId || item.assignedMachineName || specs.assignedPrinterId || specs.assignedMachineName || (isLao ? 'ສາງກາງ (ທຸກເຄື່ອງຈັກ)' : 'General / Central Stock');
    const lifespanUnits = Number(specs.expectedLifespanUnits || specs.partYield || item.partYield || 50000);
    const unitType = specs.unitType || item.consumptionUnit || (isLao ? 'ແຜ່ນ' : 'pages');
    const modelRef = specs.modelRef || specs.partModelRef || item.modelRef || '-';

    const unitPrice = Number(
      item.costPerPurchaseUnit || 
      item.cost_per_purchase_unit || 
      item.unitPrice || 
      item.purchaseCost || 
      item.price || 
      specs.unitCost || 
      0
    );

    const costPerLifeUnit = lifespanUnits > 0 && unitPrice > 0 ? unitPrice / lifespanUnits : 0;
    const formattedCostPerLife = costPerLifeUnit > 0 && costPerLifeUnit < 1 
      ? costPerLifeUnit.toFixed(2) 
      : Math.round(costPerLifeUnit).toLocaleString();

    const currentStock = Number(item.stockQty ?? item.stock_qty ?? item.currentStock ?? item.quantity ?? 0);
    const reorderPoint = Number(item.reorderThreshold ?? item.min_stock_alert ?? specs.reorderThreshold ?? 2);
    const isLowStock = currentStock <= reorderPoint;

    return (
      <div className="space-y-3.5 text-xs font-medium">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ໝວດໝູ່ຊິ້ນສ່ວນ' : 'Part Category'}
            </span>
            <span className="text-violet-700 font-bold mt-0.5 block">
              {partCat}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-3 h-3 text-indigo-600" />
              <span>{isLao ? 'ຜູກກັບເຄື່ອງຈັກ' : 'Assigned Machine'}</span>
            </span>
            <span className="text-indigo-900 font-bold mt-0.5 block truncate">
              {assignedMachine}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-600" />
              <span>{isLao ? 'ອາຍຸການໃຊ້ງານ (Yield)' : 'Part Lifespan'}</span>
            </span>
            <span className="text-slate-900 font-bold font-mono mt-0.5 block">
              {lifespanUnits.toLocaleString()} {unitType}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              {isLao ? 'ລະຫັດ OEM Ref' : 'OEM Ref / Model'}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block font-mono">
              {modelRef}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isLao ? 'ຕົ້ນທຶນຊື້ ແລະ ອັດຕາການສວມໃສ່' : 'Purchase Cost & Wear Rate'}</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {formattedCostPerLife} LAK/{unitType}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">{isLao ? 'ລາຄາຊື້ຕໍ່ໜ່ວຍ:' : 'Unit Purchase Cost:'}</span>
                <span className="text-slate-900 font-bold font-mono text-xs">
                  {Math.round(unitPrice).toLocaleString()} ₭
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isLao ? 'ຄ່າຫຼຸ້ຍຫ້ຽນຕໍ່ໜ່ວຍໃຊ້:' : 'Depreciation / Unit:'}</span>
                <span className="text-indigo-700 font-bold font-mono text-xs">
                  {formattedCostPerLife} ₭ / {unitType}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isLao ? 'ສະຖານະສະຕ໋ອກ ແລະ ເກນເຕືອນ' : 'Stock Level & Reorder Alert'}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                isLowStock 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isLowStock 
                  ? (isLao ? 'ໃກ້ໝົດສະຕ໋ອກ' : 'Low Stock Warning')
                  : (isLao ? 'ສະຕ໋ອກພ້ອມໃຊ້' : 'Stock Ready')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">{isLao ? 'ຈຳນວນຄົງເຫຼືອປັດຈຸບັນ:' : 'Current Stock:'}</span>
                <span className="text-slate-900 font-bold font-mono text-xs">
                  {currentStock.toLocaleString()} {item.purchaseUnit || item.purchase_unit || 'ອັນ'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">{isLao ? 'ເກນເຕືອນສັ່ງຊື້ຊ້ຳ:' : 'Reorder Threshold:'}</span>
                <span className="text-slate-600 font-bold font-mono text-xs">
                  {reorderPoint} {item.purchaseUnit || item.purchase_unit || 'ອັນ'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. GENERIC SPEC DETAIL (Fallback)
  const genericSpecs = {
    ...(item.technical_specs || {}),
    ...(item.specs || {}),
    ...(item.inkCode ? { inkCode: item.inkCode } : {}),
    ...(item.colorName ? { colorName: item.colorName } : {}),
    ...(item.consumptionUnit ? { consumptionUnit: item.consumptionUnit } : {}),
    ...(item.purchaseUnit ? { purchaseUnit: item.purchaseUnit } : {}),
    ...(item.reorderThreshold ? { reorderThreshold: item.reorderThreshold } : {})
  };
  const entries = Object.entries(genericSpecs);

  if (entries.length === 0) {
    return (
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-semibold">
        {isLao ? 'ບໍ່ມີຂໍ້ມູນສະເປັກທາງເຕັກນິກເພີ່ມເຕີມ' : 'No additional technical specs recorded.'}
      </div>
    );
  }

  const labelMap: Record<string, string> = {
    paperFormat: isLao ? 'ຮູບແບບເຈ້ຍ' : 'Paper Format',
    paperType: isLao ? 'ປະເພດເຈ້ຍ' : 'Paper Type',
    standardSize: isLao ? 'ຂະໜາດມາດຕະຖານ' : 'Standard Size',
    grammageGsm: isLao ? 'ຄວາມໜາ (GSM)' : 'Grammage (GSM)',
    sheetsPerPack: isLao ? 'ຈຳນວນແຜ່ນ/ແພັກ' : 'Sheets/Pack',
    rollWidthM: isLao ? 'ໜ້າກວ້າງມ້ວນ (m)' : 'Roll Width (m)',
    rollLengthM: isLao ? 'ຄວາມຍາວມ້ວນ (m)' : 'Roll Length (m)',
    paperSurface: isLao ? 'ຜິວສຳພັດ' : 'Surface Finish',
    brand: isLao ? 'ແບຣນ' : 'Brand',
    machineryDrive: isLao ? 'ລະບົບຂັບເຄື່ອນ' : 'Drive System',
    partYield: isLao ? 'ອາຍຸການໃຊ້ງານອາໄຫຼ່' : 'Part Yield',
    inkCode: isLao ? 'ລະຫັດໝຶກ' : 'Ink Code',
    colorName: isLao ? 'ຊື່ສີ' : 'Color Name',
    consumptionUnit: isLao ? 'ໜ່ວຍເບີກ' : 'Consumption Unit',
    purchaseUnit: isLao ? 'ໜ່ວຍຊື້' : 'Purchase Unit',
    reorderThreshold: isLao ? 'ຈຸດເຕືອນສັ່ງຊື້' : 'Reorder Threshold'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
      {entries.map(([key, val]) => {
        if (val === null || val === undefined || val === '' || key === 'tariffRate' || key === 'origin' || key === 'freightCharge') return null;
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
        return (
          <div key={key}>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              {labelMap[key] || key.replace(/([A-Z])/g, ' $1')}
            </span>
            <span className="text-slate-900 font-bold mt-0.5 block">{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}
