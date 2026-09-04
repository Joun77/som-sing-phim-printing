import React from 'react';
import { Crown, Sparkles, ShoppingBag, MapPin, ArrowRight, Check } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';

interface MemberPrivilegeStripProps {
  onOpenHub: (tab?: 'card' | 'reorder' | 'address') => void;
}

export const MemberPrivilegeStrip: React.FC<MemberPrivilegeStripProps> = ({ onOpenHub }) => {
  const { customerProfile, isLoggedIn } = useShop();

  if (!isLoggedIn || !customerProfile) return null;

  const tier = customerProfile.tier || 'VIP GOLD';
  const discount = customerProfile.discountPercent || 10;
  const name = customerProfile.name || 'ລູກຄ້າ ສົມສິ່ງພິມ';

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-amber-500/10 border-y border-amber-500/30 py-3.5 px-4 sm:px-8 text-slate-100 backdrop-blur-md animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Left side: Avatar & Greeting */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/30 shrink-0">
            {name.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white">
                ຍິນດີຕ້ອນຮັບ, {name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center gap-1 shadow-xs">
                <Crown className="w-3 h-3" />
                <span>{tier}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ສ່ວນຫຼຸດ {discount}% ທຸກງານພິມ
              </span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>ຍອດສະສົມ: <strong className="text-amber-400 font-mono">₭ {Math.round(customerProfile.totalSpentLAK || 0).toLocaleString()}</strong></span>
              <span>•</span>
              <span>{customerProfile.totalOrdersCount || 0} ອໍເດີ້</span>
            </span>
          </div>
        </div>

        {/* Right side: Quick Action Shortcuts */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => onOpenHub('reorder')}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs shadow-amber-500/20"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>ສັ່ງພິມຊ້ຳ 1 ຄລິກ (Re-order)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenHub('card')}
            className="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ສິດທິ VIP ຂອງທ່ານ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenHub('address')}
            className="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="ທີ່ຢູ່ຈັດສົ່ງ"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>ສາຂາຂົນສົ່ງ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
