import React from 'react'
import { useShop } from '../context/ShopContext.tsx'
import { PrinterIcon, SparkleIcon, ZapIcon, ShieldIcon, TruckIcon } from './icons.tsx'

export default function PrintOnDemandBanner() {
  const { language } = useShop()
  const isLao = language === 'lo'

  const HIGHLIGHTS = [
    {
      icon: <PrinterIcon size={20} />,
      titleLo: 'ພິມຕາມສັ່ງ 1 ຊິ້ນ (No MOQ)',
      titleEn: 'Print from 1 Piece (No MOQ)',
      subLo: 'ບໍ່ມີຈຳນວນຂັ້ນຕ່ຳ 1 ເຫຼັ້ມກໍພິມໄດ້',
      subEn: 'Zero minimum order quantity'
    },
    {
      icon: <ZapIcon size={20} />,
      titleLo: 'ຜະລິດດ່ວນ 24–48 ຊມ.',
      titleEn: '24–48h Express Turnaround',
      subLo: 'ຮອງຮັບງານດ່ວນທຸກປະເພດ',
      subEn: 'Fast & reliable production'
    },
    {
      icon: <SparkleIcon size={20} />,
      titleLo: 'Ultra-HD 2400 DPI CMYK',
      titleEn: '2400 DPI Ultra-HD CMYK',
      subLo: 'ສີສັນສົດໃສ ມາດຕະຖານໂຮງພິມ',
      subEn: 'Calibrated color proofing'
    },
    {
      icon: <TruckIcon size={20} />,
      titleLo: 'ຈັດສົ່ງທົ່ວປະເທດລາວ',
      titleEn: 'Nationwide Delivery',
      subLo: 'Anousith & HAL Logistics',
      subEn: 'Fast express to your door'
    }
  ]

  return (
    <div className="w-full bg-slate-900 border-y border-amber-500/20 py-5 px-4 text-white relative z-10 shadow-lg">
      <div className="container max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {HIGHLIGHTS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <strong className="block text-xs sm:text-sm font-black text-slate-100 leading-tight">
                  {isLao ? item.titleLo : item.titleEn}
                </strong>
                <small className="block text-[11px] text-slate-400 mt-0.5">
                  {isLao ? item.subLo : item.subEn}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
