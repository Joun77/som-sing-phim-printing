import React from 'react'
import { formatMoney } from '../utils/currency'
import { SparkleIcon, CheckIcon } from './icons'

interface PriceBreakdownTableProps {
  quantity: number
  pageCount?: number
  isColor?: boolean
  coveragePercent?: number
  baseUnit: number
  sizeLabel: string
  sizeAdd: number
  materialLabel: string
  materialAdd: number
  finishingLabel: string
  finishingAdd: number
  discountPercent: number
  totalAmountTHB: number
  currency: any
  convertTo: (thb: number) => number
  language: string
}

export const PriceBreakdownTable: React.FC<PriceBreakdownTableProps> = ({
  quantity,
  pageCount = 1,
  isColor = true,
  coveragePercent = 20,
  baseUnit,
  sizeLabel,
  sizeAdd,
  materialLabel,
  materialAdd,
  finishingLabel,
  finishingAdd,
  discountPercent,
  totalAmountTHB,
  currency,
  convertTo,
  language,
}) => {
  const pagesPerItem = Math.max(1, pageCount)
  const totalPrintedPages = pagesPerItem * quantity
  const totalSheets = pagesPerItem * quantity // 1 Page = 1 Sheet direct match

  // Dynamic Ink Calculation based on actual Coverage % + 35% Margin
  // Baseline: 5% standard ink coverage -> scaled by actual detected coverage %
  const effectiveCoverage = isColor ? Math.max(5, coveragePercent || 20) : 5
  const inkCoverageRatePerSheetTHB = isColor
    ? (0.22 * (effectiveCoverage / 5)) * 1.35
    : (0.08 * (effectiveCoverage / 5)) * 1.35

  const paperBaseRateTHB = Math.max(0.60, 0.45 + materialAdd + sizeAdd)
  const combinedRatePerSheetTHB = inkCoverageRatePerSheetTHB + paperBaseRateTHB
  const totalPrintAndPaperTHB = totalSheets * combinedRatePerSheetTHB

  // Finishing & Binding Rate per book/item
  const finishingServiceRateTHB = Math.max(0, finishingAdd || (pagesPerItem > 1 ? 8 : 0))
  const totalFinishingServiceTHB = finishingServiceRateTHB * quantity

  const grossCalculatedTHB = totalPrintAndPaperTHB + totalFinishingServiceTHB
  const finalTotalTHB = totalAmountTHB > 0 ? totalAmountTHB : grossCalculatedTHB
  const discountSavingsTHB = (finalTotalTHB * discountPercent) / (100 - discountPercent || 100)

  return (
    <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 m-0 uppercase tracking-wider">
            {language === 'en' ? 'Quotation & Service Rate Breakdown' : 'ຕາຕະລາງສະຫຼຸບລາຄາຄ່າບໍລິການ (Quotation Breakdown)'}
          </h4>
        </div>
        {discountPercent > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <SparkleIcon size={13} />
            <span>{language === 'en' ? `Tier Discount -${discountPercent}%` : `ສ່ວນຫຼຸດພິເ      {/* Table Content */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px]">
                <th className="pb-3 font-bold">{language === 'en' ? 'Service Item' : 'ລາຍການບໍລິການ'}</th>
                <th className="pb-3 font-bold text-center">{language === 'en' ? 'Specification' : 'ສເປັກທີ່ເລືອກ'}</th>
                <th className="pb-3 font-bold text-right">{language === 'en' ? 'Rate / Page' : 'ອັດຕາຕໍ່ໜ້າ'}</th>
                <th className="pb-3 font-bold text-right">{language === 'en' ? 'Page Count' : 'ຈຳນວນໜ້າ'}</th>
                <th className="pb-3 font-bold text-right">{language === 'en' ? 'Subtotal' : 'ລວມມູນຄ່າ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {/* 1. Combined Print & Paper Rate per Page */}
              <tr>
                <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black">
                      {language === 'en' ? 'Printing & Paper Material Rate' : 'ຄ່າພິມ + ເນື້ອເຈ້ຍຕໍ່ໜ້າ (Print & Paper Rate)'}
                    </span>
                    <span className="text-[10.5px] text-slate-500">
                      (ລວມຄ່ານ້ຳໝຶກຕາມ Coverage {effectiveCoverage}% + ເນື້ອເຈ້ຍ {materialLabel})
                    </span>
                  </div>
                </td>
                <td className="py-3.5 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full font-mono text-[11px] font-bold ${
                    isColor
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20'
                  }`}>
                    {isColor ? '🌈 ພິມ 4 ສີ (CMYK)' : '⚫ ພິມຂາວ-ດຳ'} · {sizeLabel} · {materialLabel}
                  </span>
                </td>
                <td className="py-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatMoney(convertTo(combinedRatePerSheetTHB), currency)} / ໜ້າ
                </td>
                <td className="py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                  {quantity > 1 ? (
                    <span>{totalPrintedPages} ໜ້າ ({pagesPerItem} ໜ້າໃນຟາຍ × {quantity} ຊຸດ)</span>
                  ) : (
                    <span>{pagesPerItem} ໜ້າ (ຕາມຟາຍ PDF)</span>
                  )}
                </td>
                <td className="py-3.5 text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                  {formatMoney(convertTo(totalPrintAndPaperTHB), currency)}
                </td>
              </tr>

              {/* 2. Finishing & Binding */}
              <tr>
                <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                  {language === 'en' ? 'Finishing & Binding Craft' : 'ຄ່າເຂົ້າເລັ້ມ & ຕັດແຕ່ງພິເສດ (Binding & Finishing)'}
                </td>
                <td className="py-3.5 text-center text-slate-600 dark:text-slate-300 font-bold">
                  {finishingLabel}
                </td>
                <td className="py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                  {formatMoney(convertTo(finishingServiceRateTHB), currency)} / ເຫຼັ້ມ
                </td>
                <td className="py-3.5 text-right font-mono text-slate-500">
                  {quantity} ເຫຼັ້ມ (Units)
                </td>
                <td className="py-3.5 text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                  {formatMoney(convertTo(totalFinishingServiceTHB), currency)}
                </td>
              </tr>

              {/* 3. Volume Discount */}
              {discountPercent > 0 && (
                <tr className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <td className="py-3.5">
                    {language === 'en' ? `Tier Volume Discount (${discountPercent}%)` : `ສ່ວນຫຼຸດພິເສດຕາມຈຳນວນ (${discountPercent}%)`}
                  </td>
                  <td className="py-3.5 text-center">≥ {quantity} ເຫຼັ້ມ</td>
                  <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    -{discountPercent}%
                  </td>
                  <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{quantity} ເຫຼັ້ມ</td>
                  <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    -{formatMoney(convertTo(discountSavingsTHB), currency)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Summary Footer Box */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckIcon size={16} color="#10B981" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'en'
                  ? `Unit Rate: ${formatMoney(convertTo(grossCalculatedTHB / quantity), currency)} / Set`
                  : `ລາຄາສະເລ່ຍ: ${formatMoney(convertTo(grossCalculatedTHB / quantity), currency)} / ເຫຼັ້ມ (ຊຸດ)`}
              </span>
            </div>
            <p className="m-0 text-[11px] text-slate-400">
              {language === 'en'
                ? `Total ${totalPrintedPages} pages across ${quantity} set(s)`
                : `ລວມທັງໝົດ ${totalPrintedPages} ໜ້າ (ຄິດໄລ່ຈາກຟາຍ ${pagesPerItem} ໜ້າ × ${quantity} ຊຸດ/ເຫຼັ້ມ)`}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'en' ? 'Net Quotation Total:' : 'ຍອດລວມສຸດທິ:'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatMoney(convertTo(finalTotalTHB), currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceBreakdownTable
� ${pagesPerItem} ໜ້າ × ${quantity} ຊຸດ/ເຫຼັ້ມ)`}
            </p>
          </div>
ulatedTHB / quantity), currency)} / Set`
                  : `ລາຄາສະເລ່ຍ: ${formatMoney(convertTo(grossCalculatedTHB / quantity), currency)} / ເຫຼັ້ມ (ຊຸດ)`}
              </span>
            </div>
            <p className="m-0 text-[11px] text-slate-400">
              {language === 'en'
                ? `Total ${totalSheets} sheets across ${quantity} set(s)`
                : `ລວມທັງໝົດ ${totalSheets} ແຜ່ນ (ຄິດໄລ່ ${pagesPerItem} ແຜ່ນ/ເຫຼັ້ມ × ${quantity} ເຫຼັ້ມ)`}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'en' ? 'Net Quotation Total:' : 'ຍອດລວມສຸດທິ:'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatMoney(convertTo(finalTotalTHB), currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceBreakdownTable
