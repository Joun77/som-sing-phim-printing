import React, { useState, useRef } from 'react';
import { 
  CreditCard, 
  Upload, 
  Trash2, 
  Edit3, 
  Check, 
  Plus, 
  QrCode
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { FormModalTemplate, FormSection } from '../../../components/common/FormModalTemplate';
import type { PaymentMethod } from '../../../types';

interface BankManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: string;
}

export const BankManagementModal: React.FC<BankManagementModalProps> = ({
  isOpen,
  onClose,
  currentLang = 'lo',
}) => {
  const { bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, showToast } = useApp();
  const qrInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [shopName, setShopName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [promptpayName, setPromptpayName] = useState('');
  const [isUploadingQR, setIsUploadingQR] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(null);
    setBankName('');
    setAccountName('');
    setShopName('');
    setAccountNumber('');
    setBranch('');
    setQrCodeUrl('');
    setLogoUrl('');
    setPromptpayName('');
  };

  const handleEdit = (b: PaymentMethod) => {
    setIsEditing(b.id);
    setBankName(b.bankName);
    setAccountName(b.accountName);
    setShopName(b.shopName || b.promptpayName || '');
    setAccountNumber(b.accountNumber);
    setBranch(b.branch || '');
    setQrCodeUrl(b.qrCodeUrl || '');
    setLogoUrl(b.logoUrl || '');
    setPromptpayName(b.promptpayName || '');
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQR(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/admin/couriers/upload-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success' && data.fileUrl) {
        setQrCodeUrl(data.fileUrl);
        showToast(
          currentLang === 'lo' ? '✓ ອັບໂຫລດຮູບ QR Code ສຳເລັດ!' : 'QR Code uploaded successfully!',
          'success'
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => setQrCodeUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => setQrCodeUrl(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingQR(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/admin/couriers/upload-logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success' && data.fileUrl) {
        setLogoUrl(data.fileUrl);
        showToast(
          currentLang === 'lo' ? '✓ ອັບໂຫລດໂລໂກ້ທະນາຄານສຳເລັດ!' : 'Bank logo uploaded successfully!',
          'success'
        );
      } else {
        const reader = new FileReader();
        reader.onload = () => setLogoUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາໃສ່ຊື່ທະນາຄານ ແລະ ເລກບັນຊີ' : 'Please enter bank name and account number', 'warning');
      return;
    }

    if (isEditing) {
      await updateBankAccount(isEditing, {
        bankName: bankName.trim(),
        accountName: accountName.trim() || 'Som-Sing Phim Printing Shop',
        shopName: shopName.trim() || 'Som-Sing Phim Printing',
        accountNumber: accountNumber.trim(),
        branch: branch.trim(),
        qrCodeUrl,
        logoUrl,
        promptpayName: shopName.trim() || promptpayName.trim() || 'Som-Sing Phim',
      });
      showToast(
        currentLang === 'lo' ? '✓ ອັບເດດຂໍ້ມູນບັນຊີທະນາຄານສຳເລັດ!' : 'Bank account updated successfully!',
        'success'
      );
    } else {
      const newId = `bank_${Date.now()}`;
      await addBankAccount({
        id: newId,
        bankName: bankName.trim(),
        accountName: accountName.trim() || 'Som-Sing Phim Printing Shop',
        shopName: shopName.trim() || 'Som-Sing Phim Printing',
        accountNumber: accountNumber.trim(),
        branch: branch.trim() || 'Vientiane Head Office',
        qrCodeUrl: qrCodeUrl || '/assets/images/bcel-qr-placeholder.png',
        logoUrl,
        promptpayName: shopName.trim() || promptpayName.trim() || 'Som-Sing Phim',
        isActive: true,
      });
      showToast(
        currentLang === 'lo' ? '✓ ເພີ່ມບັນຊີທະນາຄານໃໝ່ຮຽບຮ້ອຍ!' : 'New bank account added successfully!',
        'success'
      );
    }

    resetForm();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(currentLang === 'lo' ? `ຕ້ອງການລຶບບັນຊີ "${name}" ແທ້ບໍ່?` : `Delete bank account "${name}"?`)) {
      await deleteBankAccount(id);
      showToast(
        currentLang === 'lo' ? 'ລຶບບັນຊີທະນາຄານຮຽບຮ້ອຍ' : 'Bank account deleted',
        'info'
      );
      if (isEditing === id) resetForm();
    }
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<CreditCard className="w-5.5 h-5.5 text-white" />}
      title={currentLang === 'lo' ? 'ຈັດການບັນຊີທະນາຄານ & QR Code' : 'Bank Accounts & QR Payment'}
      subtitle={currentLang === 'lo' ? 'ເພີ່ມ, ແກ້ໄຂ ໂລໂກ້ທະນາຄານ, ຊື່ບັນຊີ, ເລກບັນຊີ ແລະ QR Code ໂອນເງິນ' : 'Add or edit bank logo, account details, and payment QR code'}
      badgeText="FINANCE"
      maxWidthClass="max-w-4xl"
      footerActions={
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition cursor-pointer"
        >
          {currentLang === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close'}
        </button>
      }
    >
      <div className="space-y-6">
        {/* Form Section */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
              {isEditing ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
              <span>{isEditing ? (currentLang === 'lo' ? 'ແກ້ໄຂບັນຊີທະນາຄານ' : 'Edit Bank Account') : (currentLang === 'lo' ? 'ເພີ່ມບັນຊີທະນາຄານໃໝ່' : 'Add Bank Account')}</span>
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-700 underline font-bold cursor-pointer"
              >
                {currentLang === 'lo' ? 'ຍົກເລີກການແກ້ໄຂ' : 'Cancel Edit'}
              </button>
            )}
          </div>

          {/* Media Uploads: Bank Logo & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank Logo */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-700 uppercase">
                {currentLang === 'lo' ? '1. ໂລໂກ້ທະນາຄານ (Bank Logo):' : '1. Bank Logo:'}
              </label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition relative group overflow-hidden"
              >
                {logoUrl ? (
                  <>
                    <img 
                      src={logoUrl} 
                      alt="Bank Logo" 
                      className="max-h-20 max-w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Upload className="w-4 h-4" />
                      <span>ປ່ຽນໂລໂກ້</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <CreditCard className="w-6 h-6 mx-auto text-slate-400" />
                    <span className="text-[11px] font-bold block text-slate-500">
                      {isUploadingLogo ? 'ກຳລັງອັບໂຫລດ...' : 'ອັບໂຫລດໂລໂກ້ທະນາຄານ'}
                    </span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={logoInputRef} 
                onChange={handleLogoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* QR Code Upload */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-700 uppercase">
                {currentLang === 'lo' ? '2. ຮູບ QR Code ໂອນເງິນ:' : '2. Payment QR Code:'}
              </label>
              <div 
                onClick={() => qrInputRef.current?.click()}
                className="w-full h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition relative group overflow-hidden"
              >
                {qrCodeUrl ? (
                  <>
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="max-h-20 max-w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Upload className="w-4 h-4" />
                      <span>ປ່ຽນຮູບ QR</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <QrCode className="w-6 h-6 mx-auto text-slate-400" />
                    <span className="text-[11px] font-bold block text-slate-500">
                      {isUploadingQR ? 'ກຳລັງອັບໂຫລດ...' : 'ອັບໂຫລດຮູບ QR Code'}
                    </span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={qrInputRef} 
                onChange={handleQRUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Bank Fields */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                {currentLang === 'lo' ? 'ຊື່ທະນາຄານ (Bank Name) *:' : 'Bank Name *:'}
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ex: BCEL, LDB, JDB, Kasikornbank"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  {currentLang === 'lo' ? 'ເລກບັນຊີ (Account No.) *:' : 'Account Number *:'}
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="160-12-00-01234567-001"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  {currentLang === 'lo' ? 'ຊື່ເຈົ້າຂອງບັນຊີ (Account Holder Name):' : 'Account Holder Name:'}
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="ເຊັ່ນ: ທ້າວ ສົມໃຈ ດີເລີດ"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Shop / Merchant Name on QR */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                {currentLang === 'lo' ? 'ຊື່ຮ້ານຄ້າ / ຊື່ສະແດງເທິງ QR Code (Shop / Merchant Name):' : 'Shop / Merchant Name for QR Code:'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="ເຊັ່ນ: ຮ້ານ ສົມສິ່ງພິມ (SOM-SING PHIM PRINTING)"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10.5px] text-slate-400 mt-1 block">
                {currentLang === 'lo' ? '* ຊື່ຮ້ານຄ້າຈະສະແດງເທິງ QR Code ເພື່ອໃຫ້ລູກຄ້າກວດສອບເວລາສະແກນຈ່າຍ' : '* Displayed on customer checkout QR code for payment verification.'}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? (currentLang === 'lo' ? 'ບັນທຶກການແກ້ໄຂ' : 'Save Changes') : (currentLang === 'lo' ? 'ເພີ່ມບັນຊີທະນາຄານ' : 'Add Bank Account')}</span>
              </button>
            </div>
          </div>
        </form>

        {/* List of Existing Bank Accounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase">
            <span>{currentLang === 'lo' ? `ລາຍຊື່ບັນຊີທະນາຄານ (${bankAccounts?.length || 0})` : `All Bank Accounts (${bankAccounts?.length || 0})`}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(bankAccounts || []).map((b: PaymentMethod) => (
              <div
                key={b.id}
                className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.bankName} className="w-full h-full object-contain" />
                    ) : b.qrCodeUrl ? (
                      <img src={b.qrCodeUrl} alt={b.bankName} className="w-full h-full object-contain" />
                    ) : (
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                      <span>{b.bankName}</span>
                      {b.qrCodeUrl && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">QR</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-mono font-bold mt-0.5">{b.accountNumber}</div>
                    <div className="text-[11px] text-slate-400 truncate">{b.accountName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(b)}
                    className="p-2.5 rounded-xl hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id, b.bankName)}
                    className="p-2.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormModalTemplate>
  );
};
