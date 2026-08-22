import React from 'react';
import { CreditCard, Sparkles, CheckCircle2, X, DollarSign, AlertCircle } from 'lucide-react';

interface PaymentSlipCardProps {
  orderIdDisplay: string;
  paymentSlipUrl?: string | null;
  totalAmountLAK: number;
  paymentStatus?: string;
  depositAmountPaid?: number;
  remainingUnpaidBalance?: number;
  isPaymentConfirmed: boolean;
  currentLang: string;
  formatLAK: (n: number) => string;
  onConfirmFullPayment: () => void;
  onConfirmDepositPayment: (amount: number) => void;
  onRevertPayment: () => void;
  onRejectSlip: () => void;
  setLightbox?: (v: { src: string; title: string } | null) => void;
}

export const PaymentSlipCard: React.FC<PaymentSlipCardProps> = ({
  orderIdDisplay,
  paymentSlipUrl,
  totalAmountLAK,
  paymentStatus = 'Unpaid',
  depositAmountPaid,
  remainingUnpaidBalance,
  isPaymentConfirmed,
  currentLang,
  formatLAK,
  onConfirmFullPayment,
  onConfirmDepositPayment,
  onRevertPayment,
  onRejectSlip,
  setLightbox,
}) => {
  const isDeposit = paymentStatus === 'Deposit' || (depositAmountPaid && depositAmountPaid > 0 && depositAmountPaid < totalAmountLAK);
  const isPaidFull = paymentStatus === 'Paid' || paymentStatus === 'PAID' || paymentStatus === 'Fully Paid';
  const effectiveDepositPaid = depositAmountPaid || Math.round(totalAmountLAK / 2);
  const effectiveRemaining = remainingUnpaidBalance !== undefined ? remainingUnpaidBalance : (isDeposit ? totalAmountLAK - effectiveDepositPaid : 0);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
      <div>
        {/* Card Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">Step 1</span>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'lo' ? '1. ກວດສອບສະລິບໂອນເງິນ (BCEL OnePay)' : '1. Payment Slip Inspection'}
              </h3>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
            isPaidFull
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isDeposit
              ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {isPaidFull 
              ? (currentLang === 'lo' ? '✓ ຊຳລະເຕັມ 100%' : 'Paid 100%') 
              : isDeposit 
              ? (currentLang === 'lo' ? '⏳ ມັດຈຳແລ້ວ' : 'Deposit Paid') 
              : (currentLang === 'lo' ? '⏳ ລໍຖ້າກວດສອບ' : 'Pending Check')}
          </span>
        </div>

        {/* Interactive Slip Box Preview */}
        <div 
          onClick={() => {
            if (paymentSlipUrl && setLightbox) {
              setLightbox({ src: paymentSlipUrl, title: `Payment Slip - Order #${orderIdDisplay}` });
            }
          }}
          className="w-full min-h-[200px] max-h-[240px] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-3 overflow-hidden cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition relative group shadow-inner"
          title={currentLang === 'lo' ? 'ຄລິກເພື່ອເບິ່ງຮູບສະລິບເຕັມຈໍ' : 'Click to view full slip image'}
        >
          {paymentSlipUrl ? (
            <>
              <img 
                src={paymentSlipUrl} 
                alt="Payment Slip" 
                className="max-h-[200px] max-w-full object-contain rounded-xl shadow-md border border-slate-200"
              />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{currentLang === 'lo' ? 'ຄລິກເພື່ອຂະຫຍາຍຮູບສະລິບ' : 'Click to Zoom'}</span>
              </div>
            </>
          ) : (
            <div className="text-center p-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-slate-800">
                {currentLang === 'lo' ? 'ໄດ້ຮັບການແຈ້ງຊຳລະຜ່ານ BCEL OnePay QR' : 'BCEL OnePay QR Transfer'}
              </p>
              <p className="text-[11px] font-mono text-slate-400 font-bold">
                Ref: SSP-TXN-{Math.floor(100000 + Math.random() * 900000)}
              </p>
            </div>
          )}
        </div>

        {/* Amount Breakdown Summary */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500 font-semibold">
            <span>{currentLang === 'lo' ? 'ມູນຄ່າສັ່ງຜະລິດທັງໝົດ:' : 'Total Order Price:'}</span>
            <span className="font-bold text-slate-800 font-mono">{formatLAK(totalAmountLAK)}</span>
          </div>

          {isDeposit && (
            <>
              <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200/80 pt-1">
                <span>{currentLang === 'lo' ? 'ຍອດມັດຈຳທີ່ຮັບແລ້ວ:' : 'Deposit Received:'}</span>
                <span className="font-mono">{formatLAK(effectiveDepositPaid)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-black border-t border-slate-200/80 pt-1">
                <span>{currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະ (ປິດຍອດຕອນສົ່ງ):' : 'Remaining to Settle:'}</span>
                <span className="font-mono">{formatLAK(effectiveRemaining)}</span>
              </div>
            </>
          )}

          {!isDeposit && (
            <div className="flex justify-between text-slate-900 font-black border-t border-slate-200 pt-1.5">
              <span className="text-amber-600">{currentLang === 'lo' ? 'ຍອດທີ່ຕ້ອງຊຳລະ (LAK):' : 'Total Amount (LAK):'}</span>
              <span className="text-base font-mono text-amber-600">{formatLAK(totalAmountLAK)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons for Dual Payment Confirmation */}
      <div className="pt-2">
        {isPaymentConfirmed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`flex-1 py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 shadow-xs ${
                isPaidFull 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <CheckCircle2 className={`w-4 h-4 ${isPaidFull ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>
                  {isPaidFull 
                    ? (currentLang === 'lo' ? '✓ ຊຳລະເຕັມ 100% ສຳເລັດແລ້ວ' : 'Fully Paid 100%') 
                    : (currentLang === 'lo' ? `✓ ຮັບມັດຈຳ ${formatLAK(effectiveDepositPaid)} ແລ້ວ` : `Deposit ${formatLAK(effectiveDepositPaid)} Verified`)}
                </span>
              </div>
              <button
                type="button"
                onClick={onRevertPayment}
                className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-amber-700 border border-slate-200 text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Revert payment status"
              >
                <span>↺ ຍົກເລີກ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option 1: Full Payment */}
              <button
                type="button"
                onClick={onConfirmFullPayment}
                className="py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border-none"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '✓ ຈ່າຍເຕັມ 100%' : '1. Pay Full 100%'}</span>
              </button>

              {/* Option 2: Deposit Payment (50%) */}
              <button
                type="button"
                onClick={() => onConfirmDepositPayment(Math.round(totalAmountLAK / 2))}
                className="py-3.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border-none"
              >
                <DollarSign className="w-4 h-4" />
                <span>{currentLang === 'lo' ? '💵 ຈ່າຍມັດຈຳ (50%)' : '2. Pay Deposit (50%)'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onRejectSlip}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 text-[11px] font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>{currentLang === 'lo' ? 'ປະຕິເສດສະລິບ (ແຈ້ງລູກຄ້າສົ່ງໃໝ່)' : 'Reject Slip'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSlipCard;
