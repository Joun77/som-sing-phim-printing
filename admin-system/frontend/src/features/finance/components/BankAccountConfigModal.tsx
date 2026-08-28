import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, User, Hash, QrCode, Save, CheckCircle2, Upload, Plus, Trash2, Edit3, Star, Eye, ShieldCheck } from 'lucide-react';
import { FormModalTemplate, FormSection } from '../../../components/common/FormModalTemplate';

export interface BankAccountItem {
  id: string;
  bank: string;
  branch: string;
  accountName: string;
  accountNumber: string;
  bcelOnePayQr: string;
  isDefault: boolean;
}

const DEFAULT_BANK_ACCOUNTS: BankAccountItem[] = [
  {
    id: 'bank-1',
    bank: 'BCEL (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ)',
    branch: 'Vientiane Head Office',
    accountName: 'Som-Sing Phim Printing Shop',
    accountNumber: '160-12-00-01234567-001',
    bcelOnePayQr: '',
    isDefault: true,
  },
  {
    id: 'bank-2',
    bank: 'LDB (ທະນາຄານພັດທະນາລາວ)',
    branch: 'Chanthabouly Branch',
    accountName: 'Som-Sing Phim Company Ltd.',
    accountNumber: '010-11-00-09876543-002',
    bcelOnePayQr: '',
    isDefault: false,
  },
];

interface BankAccountConfigModalProps {
  onClose: () => void;
  onSave?: (accounts: BankAccountItem[]) => void;
}

export const BankAccountConfigModal: React.FC<BankAccountConfigModalProps> = ({ onClose, onSave }) => {
  const [accounts, setAccounts] = useState<BankAccountItem[]>(DEFAULT_BANK_ACCOUNTS);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountItem | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ssp_bank_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved bank accounts:', e);
      }
    }
  }, []);

  const handleSaveAll = () => {
    localStorage.setItem('ssp_bank_accounts', JSON.stringify(accounts));
    // Also save default to ssp_bank_account_config for backward compatibility
    const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
    if (defaultAcc) {
      localStorage.setItem('ssp_bank_account_config', JSON.stringify(defaultAcc));
    }
    setSavedSuccess(true);
    if (onSave) onSave(accounts);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSetDefault = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    if (accounts.length <= 1) {
      alert('ຕ້ອງມີຢ່າງໜ້ອຍ 1 ບັນຊີໃນລະບົບ (Must have at least one account)');
      return;
    }
    setAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (!filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleStartAdd = () => {
    setEditingAccount({
      id: `bank-${Date.now()}`,
      bank: '',
      branch: '',
      accountName: '',
      accountNumber: '',
      bcelOnePayQr: '',
      isDefault: accounts.length === 0,
    });
    setIsEditing(true);
  };

  const handleStartEdit = (item: BankAccountItem) => {
    setEditingAccount({ ...item });
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editingAccount.bank.trim() || !editingAccount.accountNumber.trim()) {
      alert('ກະລຸນາກອກຊື່ທະນາຄານ ແລະ ເລກທີບັນຊີ (Please fill in bank name and account number)');
      return;
    }

    setAccounts((prev) => {
      const exists = prev.some((a) => a.id === editingAccount.id);
      if (exists) {
        return prev.map((a) => (a.id === editingAccount.id ? editingAccount : a));
      }
      return [...prev, editingAccount];
    });
    setIsEditing(false);
    setEditingAccount(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingAccount) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditingAccount((prev) => prev ? ({ ...prev, bcelOnePayQr: event.target!.result as string }) : null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
      >
        ຍົກເລີກ
      </button>
      <button
        type="button"
        onClick={handleSaveAll}
        disabled={savedSuccess}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
      >
        {savedSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-white" />
            ບັນທຶກທັງໝົດສຳເລັດ!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            ບັນທຶກການຕັ້ງຄ່າບັນຊີ
          </>
        )}
      </button>
    </>
  );

  return (
    <FormModalTemplate
      onClose={onClose}
      icon={<Building2 />}
      title="ຕາຕະລາງຈັດການບັນຊີທະນາຄານຮັບເງິນ (Bank Accounts Directory)"
      subtitle="ຈັດການບັນຊີທະນາຄານຫຼາຍຮູບແບບ (BCEL, LDB, ອື່ນໆ) ສຳລັບຮັບຊຳລະເງິນ"
      badgeText="Multi-Bank Setup"
      maxWidthClass="max-w-4xl"
      footerActions={footerButtons}
    >
      <div className="space-y-6">
        {/* Table & Management Toolbar */}
        {!isEditing ? (
          <FormSection
            icon={<Building2 />}
            title="1. ລາຍການບັນຊີທະນາຄານຮັບເງິນທັງໝົດ (Configured Bank Accounts)"
            subtitle="ທ່ານສາມາດເພີ່ມ, ແກ້ໄຂ, ລຶບ ຫຼື ຕັ້ງຄ່າບັນຊີຫຼັກ (Default) ສຳລັບສະແດງໃນ Checkout"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-600">
                  ບັນຊີທັງໝົດ: <span className="text-emerald-600">{accounts.length} ບັນຊີ</span>
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  + ເພີ່ມບັນຊີທະນາຄານໃໝ່
                </button>
              </div>

              {/* Bank Accounts Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                      <th className="p-3.5">ທະນາຄານ / ສາຂາ</th>
                      <th className="p-3.5">ຊື່ບັນຊີ</th>
                      <th className="p-3.5">ເລກທີບັນຊີ</th>
                      <th className="p-3.5 text-center">QR Code</th>
                      <th className="p-3.5 text-center">ສະຖານະຫຼັກ</th>
                      <th className="p-3.5 text-center">ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                    {accounts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900">{item.bank}</div>
                          <div className="text-[11px] font-medium text-slate-400">{item.branch || '—'}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{item.accountName}</td>
                        <td className="p-3.5 font-mono font-black text-blue-600">{item.accountNumber}</td>
                        <td className="p-3.5 text-center">
                          {item.bcelOnePayQr ? (
                            <button
                              type="button"
                              onClick={() => setPreviewQrUrl(item.bcelOnePayQr)}
                              className="px-2.5 py-1 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-[11px] font-extrabold transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              ເບິ່ງ QR
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">ບໍ່ມີ QR</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {item.isDefault ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                              <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                              ບັນຊີຫຼັກ
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(item.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition cursor-pointer"
                            >
                              ຕັ້ງເປັນຫຼັກ
                            </button>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="ແກ້ໄຂ"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="ລຶບ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </FormSection>
        ) : (
          /* Add / Edit Inline Form */
          <FormSection
            icon={<Edit3 />}
            title={editingAccount?.id ? '2. ແກ້ໄຂຂໍ້ມູນບັນຊີທະນາຄານ' : '2. ເພີ່ມບັນຊີທະນາຄານໃໝ່'}
            subtitle="ກອກລາຍລະອຽດບັນຊີທະນາຄານ ແລະ ອັບໂຫຼດ QR Code"
          >
            {editingAccount && (
              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase">
                    ຊື່ທະນາຄານ (Bank Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.bank}
                    onChange={(e) => setEditingAccount({ ...editingAccount, bank: e.target.value })}
                    placeholder="ເຊັ່ນ BCEL, LDB, JDB..."
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-bold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase">
                    ສາຂາທະນາຄານ (Branch)
                  </label>
                  <input
                    type="text"
                    value={editingAccount.branch}
                    onChange={(e) => setEditingAccount({ ...editingAccount, branch: e.target.value })}
                    placeholder="ເຊັ່ນ Vientiane Head Office"
                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">
                      ຊື່ບັນຊີ (Account Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAccount.accountName}
                      onChange={(e) => setEditingAccount({ ...editingAccount, accountName: e.target.value })}
                      placeholder="ຊື່ເຈົ້າຂອງບັນຊີ"
                      className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 uppercase">
                      ເລກທີບັນຊີ (Account Number) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAccount.accountNumber}
                      onChange={(e) => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                      placeholder="160-12-00-01234567-001"
                      className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl text-sm font-bold font-mono outline-none"
                    />
                  </div>
                </div>

                {/* QR Code Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase">
                    ຮູບ QR Code ຊຳລະເງິນ (ອັບໂຫຼດຮູບພາບ)
                  </label>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                    {editingAccount.bcelOnePayQr ? (
                      <img
                        src={editingAccount.bcelOnePayQr}
                        alt="QR Preview"
                        className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-white p-1"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                        <QrCode className="w-10 h-10" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition cursor-pointer inline-flex items-center gap-1.5 shadow-md">
                        <Upload className="w-4 h-4" />
                        ເລືອກຮູບ QR Code ໃໝ່
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md"
                  >
                    ບັນທຶກລາຍການນີ້
                  </button>
                </div>
              </form>
            )}
          </FormSection>
        )}
      </div>

      {/* QR Code Preview Modal */}
      {previewQrUrl && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white p-6 rounded-3xl shadow-2xl space-y-4 max-w-sm w-full text-center">
            <h4 className="font-black text-slate-900">QR Code Preview</h4>
            <div className="bg-slate-900 p-4 rounded-2xl flex items-center justify-center">
              <img src={previewQrUrl} alt="QR Code" className="max-h-64 object-contain" />
            </div>
            <button
              onClick={() => setPreviewQrUrl(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              ປິດ
            </button>
          </div>
        </div>
      )}
    </FormModalTemplate>
  );
};


