import React from 'react'
import { formatMoney } from '../utils/currency'
import { SparkleIcon, CheckIcon } from './icons'

export interface SpecBreakdownItem {
  id: string
  title: string
  label: string
  ratePerUnit: number
  hint?: string
  badge?: string
}

interface PriceBreakdownTableProps {
  quantity: number
  pageCount?: number
  isColor?: boolean
  coveragePercent?: number
  specItems?: SpecBreakdownItem[]
  baseUnit?: number
  sizeLabel?: string
  sizeAdd?: number
  materialLabel?: string
  materialAdd?: number
  finishingLabel?: string
  finishingAdd?: number
  discountPercent: number
  totalAmountTHB?: number
  currency: any
  convertTo: (thb: number) => number
  language: string
}

export const PriceBreakdownTable: React.FC<PriceBreakdownTableProps> = ({
  quantity,
  pageCount = 1,
  isColor = true,
  coveragePercent = 20,
  specItems,
  baseUnit = 0,
  sizeLabel = '',
  sizeAdd = 0,
  materialLabel = '',
  materialAdd = 0,
  finishingLabel = '',
  finishingAdd = 0,
  discountPercent,
  totalAmountTHB,
  currency,
  convertTo,
  language
}) => {
  const pagesPerItem = Math.max(1, pageCount)
  const totalPrintedPages = pagesPerItem * quantity

  // Format helper that handles LAK vs other currencies cleanly
  const formatAmount = (amt: number) => {
    if (currency === 'LAK' || !currency) {
      return formatMoney(amt, 'LAK')
    }
    const inTHB = amt / 630.5
    return formatMoney(convertTo(inTHB), currency)
  }

  // Calculate Unit Selling Price
  let unitSellingPrice = 0
  if (specItems && specItems.length > 0) {
    unitSellingPrice = specItems.reduce((sum, it) => sum + (it.ratePerUnit || 0), 0)
  } else {
    const optionsAddPerUnit = (sizeAdd || 0) + (materialAdd || 0) + (finishingAdd || 0)
    unitSellingPrice = (baseUnit || 0) + optionsAddPerUnit
  }

  const grossSubtotal = unitSellingPrice * quantity
  const discountSavings = Math.round(grossSubtotal * ((discountPercent || 0) / 100))
  const netTotal = totalAmountTHB !== undefined && totalAmountTHB > 0 ? totalAmountTHB : Math.max(0, grossSubtotal - discountSavings)
  const effectiveCoverage = Math.max(5, Math.min(100, coveragePercent))

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-slate-800 dark:text-slate-200 my-4 transition-all">
      {/* Header Bar */}
      <div className="bg-slate-50 dark:bg-slate-850/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 m-0 uppercase tracking-wider">
            {language === 'en' ? 'Quotation & Service Rate Breakdown' : 'ຕາຕະລາງສະຫຼຸບລາຄາຄ່າບໍລິການ (Quotation Breakdown)'}
          </h4>
        </div>
        {discountPercent > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <SparkleIcon size={13} />
            <span>{language === 'en' ? `Tier Discount -${discountPercent}%` : `ສ່ວນຫຼຸດ Tier -${discountPercent}%`}</span>
          </span>
        )}
      </div>

      {/* Table Content */}
      <div className="p-6">
        {/* Desktop View: Full 5-column Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10.5px]">
                <th className="pb-3 font-bold">{language === 'en' ? 'Service Item' : 'ລາຍການບໍລິການ'}</th>
                <th className="pb-3 font-bold text-center">{language === 'en' ? 'Specification' : 'ສເປັກທີ່ເລືອກ'}</th>
                <th className="pb-3 font-bold text-right">{language === 'en' ? 'Rate / Unit' : 'ອັດຕາຕໍ່ໜ່ວຍ'}</th>
                <th className="pb-3 font-bold text-right">{language === 'en' ? 'Quantity' : 'ຈຳນວນ'}</th>
                <th className="pb-3 font-bold text-right">{language === 'en' ? 'Subtotal' : 'ລວມມູນຄ່າ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {/* Render dynamic spec rows if specItems provided */}
              {specItems && specItems.length > 0 ? (
                specItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">{item.title}</span>
                        {item.hint && <span className="text-[10.5px] text-slate-500">({item.hint})</span>}
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-block px-3 py-1 rounded-full font-mono text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {item.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.ratePerUnit > 0 ? (
                        formatAmount(item.ratePerUnit)
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans inline-flex items-center gap-1">
                          <CheckIcon size={12} /> {language === 'en' ? 'Included' : 'ລວມໃນຊຸດ'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                      {quantity} ຊິ້ນ
                    </td>
                    <td className="py-3.5 text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                      {item.ratePerUnit > 0 ? (
                        formatAmount(item.ratePerUnit * quantity)
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans inline-flex items-center gap-1">
                          <CheckIcon size={12} /> {language === 'en' ? 'Free' : 'ຟຣີ'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                /* Fallback legacy rendering */
                <tr>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-black">
                        {language === 'en' ? 'Base Printing & Production Rate' : 'ຄ່າພິມ ແລະ ການຜະລິດພື້ນຖານ (Base Print Service)'}
                      </span>
                      <span className="text-[10.5px] text-slate-500">
                        (Coverage {effectiveCoverage}% · {isColor ? 'CMYK Full Color' : 'Monochrome Grayscale'})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-mono text-[11px] font-bold ${
                      isColor
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20'
                    }`}>
                      {isColor ? 'ພິມ 4 ສີ (CMYK)' : 'ພິມຂາວ-ດຳ (Mono K)'}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatAmount(baseUnit)}
                  </td>
                  <td className="py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {quantity} ຊິ້ນ
                  </td>
                  <td className="py-3.5 text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatAmount(baseUnit * quantity)}
                  </td>
                </tr>
              )}

              {/* Volume Discount */}
              {discountPercent > 0 && (
                <tr className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <td className="py-3.5">
                    {language === 'en' ? `Tier Volume Discount (${discountPercent}%)` : `ສ່ວນຫຼຸດພິເສດຕາມຈຳນວນ (${discountPercent}%)`}
                  </td>
                  <td className="py-3.5 text-center">≥ {quantity} ຊິ້ນ</td>
                  <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    -{discountPercent}%
                  </td>
                  <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{quantity} ຊິ້ນ</td>
                  <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    -{formatAmount(discountSavings)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Clean Responsive Stacked Cards */}
        <div className="block sm:hidden space-y-2.5">
          {specItems && specItems.length > 0 ? (
            specItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 bg-slate-50 dark:bg-slate-850/90 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                      {item.title}
                    </span>
                    {item.hint && (
                      <span className="text-[10px] text-slate-500 block">
                        ({item.hint})
                      </span>
                    )}
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">
                    {item.ratePerUnit > 0 ? `${formatAmount(item.ratePerUnit)} × ${quantity} ຊິ້ນ` : (language === 'en' ? 'Included' : 'ລວມໃນຊຸດ')}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {item.ratePerUnit > 0 ? formatAmount(item.ratePerUnit * quantity) : (language === 'en' ? 'Free' : 'ຟຣີ')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-850/90 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                  {language === 'en' ? 'Base Printing & Production' : 'ຄ່າພິມ ແລະ ການຜະລິດພື້ນຖານ'}
                </span>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {formatAmount(baseUnit * quantity)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {formatAmount(baseUnit)} × {quantity} ຊິ້ນ
              </span>
            </div>
          )}

          {discountPercent > 0 && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>{language === 'en' ? `Tier Discount (-${discountPercent}%)` : `ສ່ວນຫຼຸດ Tier (-${discountPercent}%)`}</span>
              <span className="font-mono">-{formatAmount(discountSavings)}</span>
            </div>
          )}
        </div>

        {/* Total Summary Footer Box */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckIcon size={16} color="#10B981" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {language === 'en'
                  ? `Unit Rate: ${formatAmount(netTotal / Math.max(1, quantity))} / Unit`
                  : `ລາຄາສະເລ່ຍ: ${formatAmount(netTotal / Math.max(1, quantity))} / ຊິ້ນ`}
              </span>
            </div>
            <p className="m-0 text-[11px] text-slate-400">
              {language === 'en'
                ? `Total ${totalPrintedPages} pages across ${quantity} piece(s)`
                : `ລວມທັງໝົດ ${totalPrintedPages} ໜ້າ (ຄິດໄລ່ຈາກຟາຍ ${pagesPerItem} ໜ້າ × ${quantity} ຊິ້ນ)`}
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'en' ? 'Net Quotation Total:' : 'ຍອດລວມສຸດທິ:'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatAmount(netTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceBreakdownTable
