import React from 'react';
import { Crown, Sparkles, ShoppingBag, MapPin, Check, ShieldCheck } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';

interface MemberPrivilegeStripProps {
  onOpenHub: (tab?: 'card' | 'reorder' | 'address') => void;
}

export const MemberPrivilegeStrip: React.FC<MemberPrivilegeStripProps> = ({ onOpenHub }) => {
  const { customerProfile, isLoggedIn } = useShop();

  if (!isLoggedIn || !customerProfile) return null;

  const tier = (customerProfile.tier || 'STANDARD').toUpperCase();
  const discount = customerProfile.discountPercent || customerProfile.discount_percent || 0;
  const name = customerProfile.name || 'ລູກຄ້າ ສົມສິ່ງພິມ';
  const spentLAK = Math.round(customerProfile.totalSpentLAK || customerProfile.total_spent_lak || 0);
  const ordersCount = customerProfile.totalOrdersCount || customerProfile.total_orders_count || 0;

  // Royal Blue & Luxury Gold Tier Styling
  const getTierBadge = () => {
    switch (tier) {
      case 'PLATINUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-200 text-slate-950 flex items-center gap-1 shadow-xs border border-white/40">
            <Crown className="w-3 h-3 text-slate-950" />
            <span>PLATINUM VIP</span>
          </span>
        );
      case 'GOLD':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 text-slate-950 flex items-center gap-1 shadow-xs border border-yellow-200/60">
            <Crown className="w-3 h-3 text-slate-950" />
            <span>GOLD VIP</span>
          </span>
        );
      case 'SILVER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-950 flex items-center gap-1 shadow-xs border border-white/50">
            <ShieldCheck className="w-3 h-3 text-slate-950" />
            <span>SILVER VIP</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-200 border border-blue-700/50 flex items-center gap-1">
            <Crown className="w-3 h-3 text-blue-400" />
            <span>STANDARD MEMBER</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-blue-950/40 via-slate-900/95 to-amber-950/25 border-y border-blue-900/30 py-3 px-4 sm:px-8 text-slate-100 backdrop-blur-md animate-fade-in shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Left side: Luxury Avatar & Greeting */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-amber-300 font-black flex items-center justify-center text-sm shadow-md shadow-blue-950/50 border border-amber-400/40 shrink-0">
            {name.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white tracking-wide">
                ຍິນດີຕ້ອນຮັບ, {name}
              </span>
              {getTierBadge()}
              {discount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  ສ່ວນຫຼຸດ {discount}% ທຸກງານພິມ
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>
                ຍອດສະສົມ: <strong className="text-amber-300 font-mono">₭ {spentLAK.toLocaleString()}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>{ordersCount} ອໍເດີ້</span>
            </div>
          </div>
        </div>

        {/* Right side: Elegant Action Shortcuts */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => onOpenHub('reorder')}
            className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs shadow-blue-900/30 border border-blue-400/30"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
            <span>ສັ່ງພິມຊ້ຳ 1 ຄລິກ (Re-order)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenHub('card')}
            className="py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-amber-500/30 hover:border-amber-400/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ສິດທິ VIP ຂອງທ່ານ</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenHub('address')}
            className="py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-slate-600 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="ທີ່ຢູ່ຈັດສົ່ງ"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>ສາຂາຂົນສົ່ງ</span>
          </button>
        </div>

      </div>
    </div>
  );
};
