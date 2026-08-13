import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { X, Coins, Save, AlertCircle, CalendarClock, ArrowDownUp } from 'lucide-react';

const RATE_CODES = ['THB', 'USD'];

export default function CurrencyRatesModal() {
  const {
    currency,
    setCurrency,
    exchangeRates,
    ratesUpdatedAt,
    updateExchangeRate,
    rateMode,
    setRateMode,
    isRatesOpen,
    setIsRatesOpen,
    showToast
  } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  const [draft, setDraft] = useState({ THB: { buy: 680, sell: 700 }, USD: { buy: 21000, sell: 21800 } });

  useEffect(() => {
    if (isRatesOpen) {
      setDraft({
        THB: { buy: exchangeRates.THB?.buy ?? 680, sell: exchangeRates.THB?.sell ?? 700 },
        USD: { buy: exchangeRates.USD?.buy ?? 21000, sell: exchangeRates.USD?.sell ?? 21800 },
      });
    }
  }, [isRatesOpen, exchangeRates]);

  if (!isRatesOpen) return null;

  const T = (lo, en) => (currentLang === 'lo' ? lo : en);

  const setSide = (code, side, value) => {
    setDraft(prev => ({
      ...prev,
      [code]: { ...prev[code], [side]: Number(value) || 0 },
    }));
  };

  const handleSave = () => {
    RATE_CODES.forEach(code => {
      const cur = draft[code] || {};
      if (Number(cur.buy) > 0) updateExchangeRate(code, 'buy', cur.buy);
      if (Number(cur.sell) > 0) updateExchangeRate(code, 'sell', cur.sell);
    });
    showToast(T('ບັນທຶກອັດຕາແລກປ່ຽນສຳເລັດ!', 'Exchange rates saved!'), 'success');
    setIsRatesOpen(false);
  };

  const currencies = [
    { code: 'LAK', name: 'Lao Kip (ກີບລາວ)', symbol: '₭', locked: true },
    { code: 'THB', name: 'Thai Baht (ບາດໄທ)', symbol: '฿', locked: false },
    { code: 'USD', name: 'US Dollar (ໂດລາສະຫະລັດ)', symbol: '$', locked: false },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md animate-fade-in print:hidden">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col justify-between max-h-[90vh]">
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-2.5">
              <Coins className="w-6 h-6 text-accent-sky" />
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-wide">
                  {T('ຈັດການອັດຕາແລກປ່ຽນ', 'Exchange Rates')}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">
                  {T('ສະກຸນເງິນພື້ນຖານ: ກີບ (₭)', 'Base currency: Lao Kip (₭)')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRatesOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Base currency note */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-900 font-semibold leading-relaxed flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              {T(
                'ລາຄາທັງໝົດໃນລະບົບເກັບເປັນກີບ (LAK). ອັດຕາຮັບຊື້ (Buy) ແມ່ນກີບທີ່ຮ້ານຈ່າຍເມື່ອລູກຄ້າຊຳລະເປັນເງິນຕ່າງປະເທດ; ອັດຕາຂາຍ (Sell) ແມ່ນກີບທີ່ຮ້ານຄິດເມື່ອຂາຍເງິນຕ່າງປະເທດໃຫ້ລູກຄ້າ. ປ້ອນເຣດດ້ວຍຕົນເອງໄດ້ຕະຫຼອດ.',
                'All amounts are stored internally in LAK. Buy = Kip the shop pays when the customer pays in foreign currency; Sell = Kip the shop charges when selling foreign currency to the customer. Rates are entered manually.'
              )}
            </span>
          </div>

          {/* Currency display selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {T('ສະກຸນເງິນທີ່ໃຊ້ແສດງ', 'Display Currency')}
            </span>
            <div className="flex gap-2">
              {['LAK', 'THB', 'USD'].map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black border transition ${
                    currency === code
                      ? 'bg-accent-sky border-accent-sky text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {code === 'LAK' ? '₭ LAK' : code === 'THB' ? '฿ THB' : '$ USD'}
                </button>
              ))}
            </div>
          </div>

          {/* Which side of the rate is used for price conversion */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {T('ເຣດທີ່ໃຊ້ຄິດໄລ່ລາຄາ', 'Rate Used For Price Conversion')}
            </span>
            <div className="flex gap-2">
              {['sell', 'buy'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRateMode(mode)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                    rateMode === mode
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5 shrink-0" />
                  {mode === 'sell'
                    ? T('ອັດຕາຂາຍ (Sell)', 'Sell Rate')
                    : T('ອັດຕາຮັບຊື້ (Buy)', 'Buy Rate')}
                </button>
              ))}
            </div>
          </div>

          {/* Rate editing table (Buy / Sell per currency) */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              {T('ອັດຕາແລກປ່ຽນ (ກີບຕໍ່ 1 ຫົວໜ່ວຍ)', 'Rates (Kip per 1 unit)')}
            </span>

            {/* Column headers */}
            <div className="flex items-center gap-3 px-3.5">
              <div className="flex-1" />
              <div className="w-[110px] text-center text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                {T('ຮັບຊື້ Buy', 'Buy')}
              </div>
              <div className="w-[110px] text-center text-[10px] font-black uppercase text-rose-600 tracking-wider">
                {T('ຂາຍ Sell', 'Sell')}
              </div>
            </div>

            {currencies.map(({ code, name, symbol, locked }) => {
              const val = code === 'LAK' ? { buy: 1, sell: 1 } : draft[code] || { buy: 0, sell: 0 };
              return (
                <div key={code} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg font-black text-slate-800 shadow-xs">
                      {symbol}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{code}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{name}</p>
                    </div>
                  </div>
                  {locked ? (
                    <div className="flex items-center gap-3">
                      <div className="w-[110px] h-[38px] flex items-center justify-center bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-400">1 ₭</div>
                      <div className="w-[110px] h-[38px] flex items-center justify-center bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-400">1 ₭</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={val.buy}
                        onChange={(e) => setSide(code, 'buy', e.target.value)}
                        className="w-[110px] min-h-[38px] px-3 text-right border-2 border-emerald-200 focus:border-emerald-500 rounded-xl text-sm font-black font-sans"
                      />
                      <input
                        type="number"
                        min="1"
                        value={val.sell}
                        onChange={(e) => setSide(code, 'sell', e.target.value)}
                        className="w-[110px] min-h-[38px] px-3 text-right border-2 border-rose-200 focus:border-rose-500 rounded-xl text-sm font-black font-sans"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Last updated */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>
                {ratesUpdatedAt
                  ? T(`ອັບເດດຫຼ້າສຸດ: ${new Date(ratesUpdatedAt).toLocaleString()}`, `Last updated: ${new Date(ratesUpdatedAt).toLocaleString()}`)
                  : T('ຍັງບໍ່ທັນອັບເດດ', 'Not updated yet')}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-4 mt-4 border-t border-slate-100">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setIsRatesOpen(false)}
              className="flex-1 min-h-[44px] border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-extrabold transition"
            >
              {T('ຍົກເລີກ', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-extrabold shadow-md transition active:scale-95"
            >
              <Save className="w-4 h-4 shrink-0" />
              {T('ບັນທຶກ', 'Save Rates')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
