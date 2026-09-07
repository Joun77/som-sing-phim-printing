import React from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  FileText,
  CreditCard,
  Truck,
  Layers,
  Sparkles,
  Scissors,
  Wrench,
  Package
} from 'lucide-react';

export interface CustomerQuotationTemplateProps {
  quotationRefId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quotationExpiry: string;
  paymentTerms: string;
  shippingMethod: string;
  shippingFee: number;
  quotationNote: string;
  items: any[];
  calculatedItems: any[];
  inventory: any[];
  equipment: any[];
  grandBaseSellingPrice?: number;
  grandDiscountAmount?: number;
  quotationDiscountPercent?: number;
  grandSubtotal: number;
  taxEnabled: boolean;
  taxMode: string;
  taxRate: number;
  taxAmount: number;
  finalGrandTotal: number;
  currentLang?: string;
  formatCurrency: (n: number) => string;
  showBankQR?: boolean;
}

export const CustomerQuotationTemplate: React.FC<CustomerQuotationTemplateProps> = ({
  quotationRefId,
  customerName,
  customerPhone,
  customerAddress,
  quotationExpiry,
  paymentTerms,
  shippingMethod,
  shippingFee,
  quotationNote,
  items,
  calculatedItems,
  inventory,
  equipment,
  grandBaseSellingPrice,
  grandDiscountAmount,
  quotationDiscountPercent,
  grandSubtotal,
  taxEnabled,
  taxMode,
  taxRate,
  taxAmount,
  finalGrandTotal,
  currentLang = 'lo',
  formatCurrency,
  showBankQR = true,
}) => {
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto border border-slate-200 shadow-xs rounded-2xl print:border-none print:shadow-none print:p-6 print:max-w-none space-y-6">
      
      {/* 1. Header: Shop Letterhead & Quotation Meta */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
              SSP
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                ສົມສິງ ພິມ • SOM SING PRINTING
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Industrial Printing & Packaging Solutions
              </p>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500 space-y-0.5">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ບ້ານ ໜອງທາເໜືອ, ເມືອງ ຈັນທະບູລີ, ນະຄອນຫຼວງວຽງຈັນ (Vientiane, Lao PDR)</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Tel: +856 20 5566 7788 | WhatsApp: +856 20 5886 6339</span>
            </p>
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block text-xs bg-slate-900 text-white font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider shadow-2xs">
            {currentLang === 'lo' ? 'ໃບສະເໜີລາຄາ (QUOTATION)' : 'OFFICIAL QUOTATION'}
          </span>
          <p className="text-sm font-sans font-black text-slate-900 mt-2">
            #{quotationRefId}
          </p>
          <p className="text-xs text-slate-500 font-sans">
            {currentLang === 'lo' ? 'ວັນທີສະເໜີ:' : 'Date:'} {currentDate}
          </p>
          <p className="text-xs text-amber-800 font-sans font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block">
            {currentLang === 'lo' ? 'ກຳນົດໃຊ້ໄດ້ເຖິງ:' : 'Valid Until:'} {quotationExpiry || '30 ວັນ'}
          </p>
        </div>
      </div>

      {/* 2. Bill To & Quotation Terms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-xs">
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            {currentLang === 'lo' ? 'ສະເໜີເຖິງລູກຄ້າ (QUOTATION TO):' : 'QUOTATION TO:'}
          </span>
          <p className="text-slate-900 font-black text-base">
            {customerName || (currentLang === 'lo' ? 'ລູກຄ້າທົ່ວໄປ' : 'General Customer')}
          </p>
          <p className="font-sans text-slate-600 flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{customerPhone || '-'}</span>
          </p>
          <p className="text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{customerAddress || 'ນະຄອນຫຼວງວຽງຈັນ (Vientiane)'}</span>
          </p>
        </div>

        <div className="space-y-1.5 sm:border-l sm:pl-5 border-slate-200">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            {currentLang === 'lo' ? 'ເງື່ອນໄຂການຊຳລະ & ຈັດສົ່ງ:' : 'TERMS & DELIVERY:'}
          </span>
          <p className="text-slate-800 font-bold">
            {currentLang === 'lo' ? 'ເງື່ອນໄຂຊຳລະ:' : 'Payment:'} <span className="font-normal text-slate-600">{paymentTerms || 'ມັດຈຳ 50% ເມື່ອສັ່ງຜະລິດ, ສ່ວນທີ່ເຫຼືອຊຳລະກ່ອນສົ່ງມອບ'}</span>
          </p>
          <p className="text-slate-800 font-bold">
            {currentLang === 'lo' ? 'ການຈັດສົ່ງ:' : 'Delivery:'} <span className="font-normal text-slate-600">{shippingMethod || 'ຮັບເອງທີ່ໂຮງພິມ'} {shippingFee > 0 ? `(${formatCurrency(shippingFee)})` : ''}</span>
          </p>
          {quotationNote && (
            <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200">
              "{quotationNote}"
            </p>
          )}
        </div>
      </div>

      {/* 3. Itemized Products Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-800 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3">ລາຍລະອຽດສິນຄ້າ & ສະເປັກ (Item & Specs)</th>
              <th className="p-3 text-center">ຂະໜາດ / ເຈ້ຍ</th>
              <th className="p-3 text-center">ຈຳນວນ</th>
              <th className="p-3 text-right">ລາຄາ/ຊຸດ</th>
              <th className="p-3 text-right">ລວມເງິນ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const calc = calculatedItems[idx] || {};
              const volume = Number(item.printVolume || 1);
              const totalLine = calc.sellingPrice || ((calc.unitPrice || calc.effectiveSellingPrice || 0) * volume) || 0;
              const unitPrice = calc.unitPrice || (volume > 0 ? Math.round(totalLine / volume) : totalLine);

              const paperItem = inventory.find(p => p.id === item.paperId);
              const coverPaperItem = item.includeCover && item.coverPaperId ? inventory.find(p => p.id === item.coverPaperId) : null;
              const printerItem = equipment.find(e => e.id === item.selectedPrinterId);
              const postPressNames = (item.selectedPostPressIds || [])
                .map(mId => equipment.find(e => e.id === mId)?.name)
                .filter(Boolean);
              const matNames = (item.finishingMaterials || [])
                .map(m => m.name)
                .filter(Boolean);

              // Sub-item calculations with margin multiplier
              const netCost = Number(calc.netCost || 0);
              const marginMultiplier = (netCost > 0 && totalLine > 0) ? (totalLine / netCost) : 1;

              const cutsPerSheet = Number(calc.cutsPerSheet || item.cutsPerSheetOverride || 1);
              const isBatchPhoto = Boolean(calc.isBatchPhoto || item.isBatchPhoto);
              const totalSheets = Number(calc.totalParentSheets || calc.totalInnerParentSheets || calc.parentSheetsNeeded) ||
                (volume * Math.ceil((Number(item.pagesPerBook) || 1) / (item.isDoubleSided ? 2 : 1)));

              const rawFinishingMatCost = Number(calc.finishingMaterialsCost || 0);
              const rawLaborCost = Number(calc.laborCost || 0);
              const rawPkgCost = Number(calc.packagingDeliveryCost || 0);
              const rawPostPressCost = Number(calc.postPressCost || 0);

              const postPressMachs = (item.selectedPostPressIds || []).map((mId: string) => {
                const mach = equipment.find(e => e.id === mId);
                const rate = Number((mach as any)?.costPerPage) || Number((mach as any)?.calculatedCostPerPage) || 300;
                const isCut = mach?.name ? (/ตัด|ຕັດ|cut|guillotine|trim/i.test(mach.name)) : false;
                return {
                  id: mId,
                  name: mach?.name || '',
                  cost: Math.round(rate * volume),
                  isCut
                };
              });

              const cuttingMachCost = postPressMachs.filter(m => m.isCut).reduce((sum, m) => sum + m.cost, 0);
              const otherPostPressCost = postPressMachs.filter(m => !m.isCut).reduce((sum, m) => sum + m.cost, 0);

              // 1. Finishing Services List (only explicit finishing/binding/lamination, excluding cutting)
              const cleanFinishingList = [
                (item.bindingOption && item.bindingOption !== 'none' && item.bindingOption !== 'NONE') ? item.bindingOption : null,
                ...(postPressNames || []).filter(n => !/ตัด|ຕັດ|cut|guillotine|trim/i.test(n)),
                ...(matNames || [])
              ].filter(Boolean);

              // 2. Cost calculations
              // Labor, setup, cutting, paper, ink, overhead, and packaging are bundled into Base Print & Production
              const rawFinishingCost = otherPostPressCost + rawFinishingMatCost;
              const finishingCostSelling = Math.round(rawFinishingCost * marginMultiplier);

              // Only show sub-items when there is actual add-on finishing/binding service
              const hasFinishingAddon = cleanFinishingList.length > 0 && finishingCostSelling > 0;
              const printingCostSelling = Math.max(0, totalLine - (hasFinishingAddon ? finishingCostSelling : 0));
              const printingUnitSelling = volume > 0 ? Math.round(printingCostSelling / volume) : printingCostSelling;
              const finishingUnitSelling = volume > 0 ? Math.round(finishingCostSelling / volume) : finishingCostSelling;

              // Finished Product Size vs Production Parent Paper Sheet
              const finishedSizeLabel = (() => {
                if (item.jobSizePreset && item.jobSizePreset !== 'CUSTOM' && item.jobSizePreset !== 'Custom') {
                  return item.jobSizePreset;
                }
                if (item.jobWidth && item.jobHeight) {
                  return `${Math.round(item.jobWidth)}×${Math.round(item.jobHeight)} mm`;
                }
                return item.jobSizePreset || 'A4';
              })();

              const finishedDimensionMM = (item.jobWidth && item.jobHeight && item.jobSizePreset && !item.jobSizePreset.includes('×') && !item.jobSizePreset.toLowerCase().includes('mm'))
                ? `${Math.round(item.jobWidth)}×${Math.round(item.jobHeight)} mm`
                : null;

              const parentPaperName = paperItem?.name || item.paperId || 'ມາດຕະຖານ A4';

              return (
                <React.Fragment key={item.id || idx}>
                  {/* Main Product Row */}
                  <tr className="hover:bg-slate-50/50 bg-white">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">
                          {item.name || (isBatchPhoto ? (currentLang === 'lo' ? `ຊຸດຮູບພາບ ${finishedSizeLabel}` : `Photo Set ${finishedSizeLabel}`) : `ລາຍການທີ ${idx + 1}`)}
                        </span>
                        {isBatchPhoto && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {currentLang === 'lo' ? 'ຊຸດຮູບພາບ' : 'Photo Batch'}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                        <div>
                          • ໜ້າພິມ: <span className="font-semibold text-slate-800">{item.pagesPerBook ? `${item.pagesPerBook} ໜ້າ` : '1 ໜ້າ'}</span> ({item.isDoubleSided ? 'ພິມ 2 ໜ້າ' : 'ພິມໜ້າດຽວ'})
                        </div>
                        <div>
                          • ປະເພດເຈ້ຍ: <span className="font-semibold text-slate-800">{parentPaperName}</span>
                        </div>
                        {item.jobSizePreset && item.jobSizePreset !== 'A4' && (
                          <div>
                            • ຂະໜາດ: <span className="font-semibold text-slate-800">{finishedSizeLabel}</span> {finishedDimensionMM ? `(${finishedDimensionMM})` : ''}
                          </div>
                        )}
                        {item.includeCover && (
                          <div className="text-amber-800">
                            • ປົກ: <span className="font-semibold">{coverPaperItem?.name || 'ເຈ້ຍປົກ'}</span> ({item.coverPagesCount || 4} ໜ້າ)
                          </div>
                        )}
                        <div>
                          • ລະບົບສີ: <span className="font-semibold text-slate-800">{item.colorPrintMode === 'MONO_K' ? (currentLang === 'lo' ? 'ພິມຂາວດຳ (Mono)' : 'Black & White') : (currentLang === 'lo' ? 'ພິມ 4 ສີ (Color)' : 'Full Color')}</span>
                        </div>
                        {cleanFinishingList.length > 0 && (
                          <div>
                            • ຫຼັງພິມ/ເຂົ້າຮູບ: <span className="font-semibold text-slate-800">{cleanFinishingList.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-black inline-block">
                        {finishedSizeLabel}
                      </span>
                      {finishedDimensionMM && (
                        <span className="text-[10px] text-slate-400 block font-normal font-mono mt-0.5">
                          {finishedDimensionMM}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-black text-slate-900 font-sans">
                      {volume.toLocaleString()} {item.unitName || 'ຊຸດ'}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 font-mono text-sm">
                      {formatCurrency(totalLine)}
                    </td>
                  </tr>

                  {/* Sub-items: Only rendered if there is an explicit finishing/binding add-on */}
                  {hasFinishingAddon && (
                    <>
                      {/* Sub-item 1: Base Printing & Production (รวมกระดาษ, หมึก, ค่าตัด, ค่าแรง, ค่าจักร) */}
                      <tr className="bg-slate-50/60 text-[11px] text-slate-600 border-t border-dashed border-slate-200/80">
                        <td className="p-2 text-center text-slate-300 select-none"></td>
                        <td className="p-2 pl-6">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <span className="text-slate-400 font-mono select-none">└─</span>
                            <Printer className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>
                              {currentLang === 'lo'
                                ? 'ຄ່າບໍລິການພິມ & ຜະລິດ (Printing & Production)'
                                : 'Print & Production Service'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center font-medium text-slate-500">
                          {finishedSizeLabel}
                        </td>
                        <td className="p-2 text-center font-medium text-slate-700 font-sans">
                          {volume.toLocaleString()} {item.unitName || 'ຊຸດ'}
                        </td>
                        <td className="p-2 text-right font-medium text-slate-600 font-mono">
                          {formatCurrency(printingUnitSelling)}/{item.unitName || 'ຊຸດ'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-800 font-mono">
                          {formatCurrency(printingCostSelling)}
                        </td>
                      </tr>

                      {/* Sub-item 2: Finishing / Binding Add-on (งานหลังพิมพ์ / เข้าเล่ม / เคลือบ) */}
                      <tr className="bg-slate-50/60 text-[11px] text-slate-600 border-t border-dashed border-slate-200/80">
                        <td className="p-2 text-center text-slate-300 select-none"></td>
                        <td className="p-2 pl-6">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <span className="text-slate-400 font-mono select-none">└─</span>
                            <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>
                              {currentLang === 'lo'
                                ? `ຄ່າງານຫຼັງພິມ / ເຂົ້າຮູບ (${cleanFinishingList.join(', ')})`
                                : `Finishing & Binding (${cleanFinishingList.join(', ')})`}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center text-slate-400 font-sans">-</td>
                        <td className="p-2 text-center font-medium text-slate-700 font-sans">
                          {volume.toLocaleString()} {item.unitName || 'ຊຸດ'}
                        </td>
                        <td className="p-2 text-right font-medium text-slate-500 font-mono">
                          {formatCurrency(finishingUnitSelling)}/{item.unitName || 'ຊຸດ'}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-800 font-mono">
                          {formatCurrency(finishingCostSelling)}
                        </td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Financial Summary & Bank QR Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* Left: Bank QR & Payment Methods */}
        <div className="space-y-3">
          {showBankQR && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
              <div className="w-24 h-24 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BCELONE_SOM_SING_PHIM" 
                  alt="BCEL One QR" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black text-red-600">
                  <CreditCard className="w-4 h-4" />
                  <span>BCEL One / ບັນຊີທະນາຄານການຄ້າ</span>
                </div>
                <p className="font-bold text-slate-800">ຊື່ບັນຊີ: SOM SING PHIM SOLE CO., LTD</p>
                <p className="font-mono text-slate-600">ເລກບັນຊີ: 010-12-00-01234567-001 (LAK)</p>
                <p className="text-[11px] text-slate-400">* ກະລຸນາແຈ້ງສະລິບການໂອນເງິນຫຼັງຈາກຊຳລະ</p>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>• ລາຄາທີ່ສະເໜີຂ້າງເທິງລວມຄ່າກຽມເຄື່ອງ ແລະ ວັດສະດຸທັງໝົດແລ້ວ</p>
            <p>• ການຢືນຢັນສັ່ງຜະລິດຈະເລີ່ມດຳເນີນງານຫຼັງຈາກໄດ້ຮັບການຢືນຢັນໄຟລ໌ ແລະ ເງິນມັດຈຳ</p>
          </div>
        </div>

        {/* Right: Grand Totals Breakdown */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600 font-bold">
            <span>ຍອດລວມສິນຄ້າ (Subtotal):</span>
            <span className="font-mono text-slate-800">{formatCurrency(grandBaseSellingPrice || grandSubtotal)}</span>
          </div>

          {(grandDiscountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-rose-600 font-bold">
              <span>ສ່ວນຫຼຸດພິເສດ ({quotationDiscountPercent || 0}%):</span>
              <span className="font-mono">-{formatCurrency(grandDiscountAmount || 0)}</span>
            </div>
          )}

          {shippingFee > 0 && (
            <div className="flex justify-between text-slate-600 font-bold">
              <span>ຄ່າຈັດສົ່ງ ({shippingMethod}):</span>
              <span className="font-mono text-slate-800">{formatCurrency(shippingFee)}</span>
            </div>
          )}

          {taxEnabled && taxAmount > 0 && (
            <div className="flex justify-between text-slate-600 font-bold">
              <span>ພາສີມູນຄ່າເພີ່ມ (VAT {taxRate}%):</span>
              <span className="font-mono text-slate-800">+{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-baseline">
            <div>
              <span className="font-black text-slate-900 text-sm block">ຍອດລວມສຸດທິ (Grand Total):</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Net Payable Amount</span>
            </div>
            <span className="font-mono font-black text-2xl text-primary-navy">
              {formatCurrency(finalGrandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Signature Acceptance Strip */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-600 print:pt-6">
        <div className="space-y-12">
          <p className="font-bold">ຜູ້ສະເໜີລາຄາ (Prepared By)</p>
          <div className="border-t border-dashed border-slate-400 pt-1 w-48 mx-auto">
            <p className="font-bold text-slate-800">ສົມສິງ ພິມ (Som Sing Printing)</p>
            <p className="text-[10px] text-slate-400">ວັນທີ: ____ / ____ / ________</p>
          </div>
        </div>

        <div className="space-y-12">
          <p className="font-bold">ລູກຄ້າຢືນຢັນສັ່ງຊື້ (Customer Acceptance)</p>
          <div className="border-t border-dashed border-slate-400 pt-1 w-48 mx-auto">
            <p className="font-bold text-slate-800">{customerName || 'ລາຍເຊັນລູກຄ້າ'}</p>
            <p className="text-[10px] text-slate-400">ວັນທີ: ____ / ____ / ________</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuotationTemplate;
