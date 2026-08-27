import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Eye, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Phone
} from 'lucide-react';

interface ProofData {
  order_id: string;
  order_no: string;
  customer_name: string;
  proof_url: string;
  status: string;
  item_name: string;
  quantity: number;
  expires_at: string;
}

export default function ProofReviewPage() {
  const { orderId, token } = useParams<{ orderId: string; token: string }>();
  const [data, setData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProof = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/proof/${orderId}/${token}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'ລິ້ງກວດສອບ Proof ໝົດອາຍຸ ຫຼື ບໍ່ຖືກຕ້ອງ');
        }
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && token) {
      fetchProof();
    }
  }, [orderId, token]);

  const handleApprove = async () => {
    if (!window.confirm('ຢືນຢັນການອະນຸມັດໄຟລ໌ຕົວຢ່າງພິມນີ້ເພື່ອເຂົ້າສູ່ຂັ້ນຕອນການພິມຈິງ?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/proof/${orderId}/${token}/approve`, { method: 'POST' });
      if (res.ok) {
        setActionDone('APPROVED');
      } else {
        const json = await res.json();
        alert(json.message || 'Approval failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('ກະລຸນາລະບຸເຫດຜົນ ຫຼື ຈຸດທີ່ຕ້ອງການໃຫ້ແກ້ໄຂ');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/proof/${orderId}/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      if (res.ok) {
        setActionDone('REJECTED');
      } else {
        const json = await res.json();
        alert(json.message || 'Rejection failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting rejection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="font-extrabold text-slate-800 text-lg">ກຳລັງໂຫຼດໄຟລ໌ຕົວຢ່າງ Digital Proof...</h3>
        <p className="text-sm text-slate-400 mt-1">ກະລຸນາລໍຖ້າຈັກໜ່ອຍ</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">ບໍ່ສາມາດກວດສອບ Proof ໄດ້</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {error || 'ລິ້ງນີ້ອາດຈະໝົດອາຍຸການໃຊ້ງານແລ້ວ (ມີອາຍຸ 48 ຊົ່ວໂມງ) ຫຼື ຖືກນຳໃຊ້ໄປແລ້ວ. ກະລຸນາຕິດຕໍ່ຝ່າຍບໍລິການລູກຄ້າ ສົມສິ່ງພິມ.'}
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-xs font-semibold text-slate-700 flex items-center justify-center gap-3">
          <Phone className="w-4 h-4 text-indigo-600" />
          <span>Hotline: +856 20 5555 8888 | WhatsApp: +856 20 5555 8888</span>
        </div>
        <Link to="/" className="mt-6 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
          ກັບຄືນໜ້າຫຼັກ
        </Link>
      </div>
    );
  }

  if (actionDone === 'APPROVED') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">ອະນຸມັດໄຟລ໌ພິມຮຽບຮ້ອຍແລ້ວ!</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          ຂອບໃຈທີ່ຢືນຢັນຄວາມຖືກຕ້ອງຂອງໄຟລ໌. ອໍເດີເລກທີ <strong className="text-slate-900">{data.order_no}</strong> ໄດ້ຖືກສົ່ງເຂົ້າຄິວຜະລິດ (Production Queue) ຮຽບຮ້ອຍແລ້ວ.
        </p>
        <Link to={`/track?orderId=${data.order_no}`} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 text-xs transition">
          ຕິດຕາມສະຖານະການຜະລິດ (Track Order)
        </Link>
      </div>
    );
  }

  if (actionDone === 'REJECTED') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">ບັນທຶກການຂໍແກ້ໄຂໄຟລ໌ແລ້ວ</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          ທີມງານ Pre-press ຂອງ ສົມສິ່ງພິມ ໄດ້ຮັບການແຈ້ງເຕືອນແລ້ວ ແລະ ຈະດຳເນີນການແກ້ໄຂຕາມທີ່ທ່ານລະບຸພ້ອມສົ່ງ Proof ໃໝ່ໃຫ້ທ່ານກວດສອບອີກຄັ້ງ.
        </p>
        <Link to="/" className="px-6 py-3 bg-slate-900 text-white font-extrabold rounded-2xl text-xs hover:bg-slate-800 transition">
          ກັບຄືນໜ້າຫຼັກ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Som Sing Phim • Digital Proof Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">ກວດສອບຕົວຢ່າງໄຟລ໌ພິມ (Proof Review)</h1>
          <p className="text-xs text-slate-300 mt-1">
            ອໍເດີ: <span className="font-bold text-white font-mono">{data.order_no}</span> • ລູກຄ້າ: <span className="font-bold text-white">{data.customer_name}</span>
          </p>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-right">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">ຈຳນວນພິມ</span>
          <span className="text-lg font-black text-emerald-400">{data.quantity.toLocaleString()} ຊຸດ</span>
        </div>
      </div>

      {/* Proof Preview Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>ຕົວຢ່າງອາດເວິກ (Artwork Proof): {data.item_name}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> ລິ້ງມີອາຍຸ 48 ຊົ່ວໂມງ
          </span>
        </div>

        <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[350px] relative group">
          {data.proof_url ? (
            <img 
              src={data.proof_url} 
              alt="Artwork Proof Preview" 
              className="max-h-[600px] w-auto object-contain shadow-md rounded-xl"
            />
          ) : (
            <div className="text-center p-8 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">ກຳລັງປະມວນຜົນໄຟລ໌ Proof Preview</p>
            </div>
          )}
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed font-medium space-y-1">
          <div className="font-extrabold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>ຂໍ້ຄວນກວດສອບກ່ອນອະນຸມັດ:</span>
          </div>
          <p>• ກວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ຄວາມ, ເບີໂທລະສັບ, ລາຄາ ແລະ ຕົວສະກົດ</p>
          <p>• ສີທີ່ສະແດງເທິງໜ້າຈໍອາດແຕກຕ່າງຈາກງານພິມຈິງເລັກນ້ອຍເນື່ອງຈາກລະບົບສີ RGB ແລະ CMYK</p>
        </div>
      </div>

      {/* Action Buttons */}
      {!showRejectBox ? (
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => setShowRejectBox(true)}
            className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl transition cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5 text-rose-500" />
            ຂໍແກ້ໄຂໄຟລ໌ / ປະຕິເສດ Proof
          </button>
          <button
            disabled={submitting}
            onClick={handleApprove}
            className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/30 transition cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {submitting ? 'ກຳລັງອະນຸມັດ...' : 'ອະນຸມັດໄຟລ໌ ແລະ ສັ່ງພິມຈິງ (Approve)'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleReject} className="bg-white p-6 rounded-3xl border border-rose-100 shadow-lg space-y-4 animate-fadeIn">
          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span>ລະບຸລາຍລະອຽດທີ່ຕ້ອງການໃຫ້ທີມງານແກ້ໄຂ</span>
          </div>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="ເຊັ່ນ: ຂໍແກ້ໄຂເບີໂທຈາກ 020 5555 ເປັນ 020 7777, ຮູບພາບໂລໂກ້ດ້ານເທິງມົວເລັກນ້ອຍ..."
            className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-rose-500"
            required
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowRejectBox(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition"
            >
              {submitting ? 'ກຳລັງສົ່ງ...' : 'ຢືນຢັນການຂໍແກ້ໄຂ (Submit Rejection)'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
