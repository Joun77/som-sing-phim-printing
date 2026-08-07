import React, { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, CreditCard, Search, Plus, X,
  ClipboardList, TrendingUp, AtSign, ExternalLink,
  Eye, Download, Image as ImageIcon, Receipt,
  Banknote, CreditCard as CardIcon, AlertTriangle,
  CheckCircle2, Clock, ArrowRight, Edit3, Save, XCircle,
  Wallet, ArrowLeft, Trash2, Globe, MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

// ─── Lightbox for Artwork/Payment Slips ───────────────────────────────────────────
function Lightbox({ src, title, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isImage = src && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(src);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
          <span className="text-sm font-black text-slate-700 truncate">{title}</span>
          <div className="flex items-center gap-2">
            {src && (
              <a
                href={src}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-sky text-white rounded-xl text-xs font-black hover:bg-sky-600 transition animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center bg-slate-900 min-h-[300px] max-h-[70vh]">
          {isImage ? (
            <img
              src={src}
              alt={title}
              className="max-h-[70vh] max-w-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-300 text-sm font-semibold leading-relaxed">
                ໄຟລ໌ນີ້ບໍ່ສາມາດສະແດງໃນ Preview ໄດ້<br />
                <span className="text-slate-400 text-xs">(ເຊັ່ນ: Google Drive, PDF)</span>
              </p>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-slate-100 transition shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                ເປີດໃນ Browser ໃໝ່
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Modal Component ───────────────────────────────────────────────────────
function ReceiptModal({ order, onClose, formatLAK, currentLang, t }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 relative border border-slate-100 print:p-0 print:border-none print:shadow-none animate-scale-up">
        {/* Actions - Hidden on print */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 print:hidden">
          <h3 className="font-extrabold text-slate-900 text-base">
            {currentLang === 'lo' ? 'ໃບບິນຮັບເງິນ' : 'Receipt / Invoice'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-sm"
            >
              {currentLang === 'lo' ? 'ພິມໃບບິນ' : 'Print Receipt'}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Container for Print */}
        <div className="space-y-6 text-xs text-slate-700">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{t('common.app_name')}</h1>
              <p className="text-[10px] text-slate-400 mt-1">Phone Savan village, Sisattanak district, Vientiane</p>
              <p className="text-[10px] text-slate-400">Tel: 020 5566-7788 | Email: somsingphim@gmail.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black text-slate-800">
                {currentLang === 'lo' ? 'ໃບບິນຮັບເງິນ' : 'RECEIPT'}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">ORDER ID: {order.id}</p>
              <p className="text-[10px] text-slate-400 font-sans">Date: {order.date}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Customer profile:</p>
              <p className="font-extrabold text-slate-800 mt-1 text-xs">{order.customerName}</p>
              <p className="text-slate-500 font-sans mt-0.5">{order.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Payment info:</p>
              <p className="font-black text-indigo-600 mt-1 text-xs">{t(`payment.${order.paymentStatus}`)}</p>
              <p className="text-slate-500 font-mono mt-0.5 text-[10px]">
                {order.paymentMethod} {order.bankName ? `(${order.bankName})` : ''}
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-100 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Item Description</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="text-slate-600">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3 text-center font-sans font-bold">{item.quantity}</td>
                  <td className="p-3 text-right font-sans">{formatLAK(item.unitCost)}</td>
                  <td className="p-3 text-right font-sans font-black text-slate-900">{formatLAK(item.quantity * item.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-sans text-slate-900 font-bold">{formatLAK(order.totalPriceCharged)}</span>
              </div>
              <div className="flex justify-between text-indigo-600 font-bold">
                <span>Deposit Paid:</span>
                <span className="font-sans">{formatLAK(order.depositAmountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-red-600 text-sm font-black">
                <span>Remaining Balance:</span>
                <span className="font-sans text-base">{formatLAK(order.remainingUnpaidBalance)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-[10px]">
            <div>
              <div className="w-36 border-b mx-auto h-8" />
              <p className="mt-2 font-black text-slate-400 uppercase tracking-wide">Customer Signature</p>
            </div>
            <div>
              <div className="w-36 border-b mx-auto h-8" />
              <p className="mt-2 font-black text-slate-400 uppercase tracking-wide">Authorized Representative</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Icon Render Helpers ──────────────────────────────────────────────────
function SocialLink({ type, value, name }) {
  if (!value) return null;

  let url = '';
  let icon = null;
  let label = '';
  let themeClass = '';

  switch (type) {
    case 'instagram':
      url = `https://instagram.com/${value}`;
      icon = <AtSign className="w-4 h-4" />;
      label = `IG: @${value}`;
      themeClass = 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-100';
      break;
    case 'line':
      url = `https://line.me/ti/p/~${value}`;
      icon = <MessageSquare className="w-4 h-4" />;
      label = `Line ID: ${value}`;
      themeClass = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100';
      break;
    case 'facebook':
      url = value.startsWith('http') ? value : `https://www.facebook.com/search/people/?q=${encodeURIComponent(value)}`;
      icon = <Globe className="w-4 h-4" />;
      label = `Facebook: ${value}`;
      themeClass = 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100';
      break;
    default:
      return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-sm ${themeClass}`}
    >
      {icon}
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 opacity-60" />
    </a>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerManagement() {
  const {
    customers,
    orders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    showToast,
    setActiveTab,
    setPreselectedCustomerName,
    askConfirmation
  } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailCustomerId, setSelectedDetailCustomerId] = useState(null);
  
  // Modals Open
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // stores customer object being edited
  const [lightbox, setLightbox] = useState(null); // { src, title }
  const [receiptOrder, setReceiptOrder] = useState(null); // stores order object for receipt popup

  // Form states (Add Modal)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [line, setLine] = useState('');
  const [facebook, setFacebook] = useState('');
  const [creditLimit, setCreditLimit] = useState(2000000);

  // Form states (Edit Modal)
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editLine, setEditLine] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editCreditLimit, setEditCreditLimit] = useState(2000000);

  const formatLAK = (num) =>
    new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' })
      .format(num).replace('LAK', '₭');

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!name) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາປ້ອນຊື່ລູກຄ້າ!' : 'Please enter a customer name!', 'warning');
      return;
    }
    addCustomer({
      name,
      phone,
      address,
      instagram,
      line,
      facebook,
      creditLimit: Number(creditLimit)
    });
    showToast(currentLang === 'lo' ? 'ເພີ່ມຂໍ້ມູນລູກຄ້າສຳເລັດ!' : 'Customer registered successfully!', 'success');
    
    // Reset Form
    setName(''); setPhone(''); setAddress(''); setInstagram(''); setLine(''); setFacebook(''); setCreditLimit(2000000);
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone || '');
    setEditAddress(c.address || '');
    setEditInstagram(c.instagram || '');
    setEditLine(c.line || '');
    setEditFacebook(c.facebook || '');
    setEditCreditLimit(c.creditLimit || 2000000);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName) {
      showToast('Please enter a customer name!', 'warning');
      return;
    }
    updateCustomer(editingCustomer.id, {
      name: editName,
      phone: editPhone,
      address: editAddress,
      instagram: editInstagram,
      line: editLine,
      facebook: editFacebook,
      creditLimit: Number(editCreditLimit)
    });
    showToast(currentLang === 'lo' ? 'ອັບເດດຂໍ້ມູນລູກຄ້າສຳເລັດ!' : 'Customer updated successfully!', 'success');
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (customerId, customerName) => {
    const confirmMessage = currentLang === 'lo'
      ? `ທ່ານຕ້ອງການລຶບລູກຄ້າ "${customerName}" ແທ້ຫຼືບໍ່?`
      : `Are you sure you want to delete customer "${customerName}"?`;

    askConfirmation(confirmMessage, () => {
      deleteCustomer(customerId);
      if (selectedDetailCustomerId === customerId) {
        setSelectedDetailCustomerId(null);
      }
      showToast(currentLang === 'lo' ? 'ລຶບຂໍ້ມູນລູກຄ້າສຳເລັດ!' : 'Customer deleted successfully!', 'success');
    });
  };

  const handleCreateOrderRedirect = (customerName) => {
    setPreselectedCustomerName(customerName);
    setActiveTab('calculator');
  };

  const getCustomerStats = (custName) => {
    const custOrders = orders.filter(o => o.customerName === custName);
    const totalOrders = custOrders.length;
    const totalSpent = custOrders.reduce((sum, o) => sum + o.totalPriceCharged, 0);
    const outstanding = custOrders.reduce((sum, o) => sum + o.remainingUnpaidBalance, 0);
    return { totalOrders, totalSpent, outstanding, custOrders };
  };

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  const selectedCustomerObj = customers.find(c => c.id === selectedDetailCustomerId);
  const activeStats = selectedCustomerObj
    ? getCustomerStats(selectedCustomerObj.name)
    : { totalOrders: 0, totalSpent: 0, outstanding: 0, custOrders: [] };

  const getInitials = (n) =>
    n?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Lightbox Modal */}
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
          formatLAK={formatLAK}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* 1. MAIN DIRECTORY PAGE (Full-width list view) */}
      {!selectedDetailCustomerId ? (
        <div className="space-y-6">
          {/* Top heading */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-6 h-6 text-accent-sky" />
                <span>{currentLang === 'lo' ? 'ຈັດການຂໍ້ມູນລູກຄ້າ & CRM' : 'Customer Directory & CRM'}</span>
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {currentLang === 'lo'
                  ? 'ລົງທະບຽນລູກຄ້າໃໝ່, ກວດສອບທີ່ຢູ່, ແລະ ປະຫວັດການສັ່ງຊື້ທັງໝົດ'
                  : 'Register clients, store shipping addresses, and review billing logs'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາລູກຄ້າ...' : 'Search customers...'}
                  className="w-full sm:w-64 min-h-[44px] pl-10 pr-3.5 border-2 rounded-xl focus:outline-none text-xs font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="min-h-[44px] px-5 bg-accent-sky hover:bg-sky-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLang === 'lo' ? 'ເພີ່ມລູກຄ້າໃໝ່' : 'Register Customer'}</span>
              </button>
            </div>
          </div>

          {/* Full Width Table */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-4.5 px-6">ID</th>
                    <th className="py-4.5 px-6">{currentLang === 'lo' ? 'ຊື່ລູກຄ້າ' : 'Customer Name'}</th>
                    <th className="py-4.5 px-6">{currentLang === 'lo' ? 'ເບີໂທ' : 'Phone'}</th>
                    <th className="py-4.5 px-6">{currentLang === 'lo' ? 'ທີ່ຢູ່ຈັດສົ່ງ' : 'Shipping Address'}</th>
                    <th className="py-4.5 px-6 text-center">{currentLang === 'lo' ? 'ຈຳນວນອໍເດີ' : 'Total Orders'}</th>
                    <th className="py-4.5 px-6 text-right">{currentLang === 'lo' ? 'ຍອດຊື້ສະສົມ' : 'Total Spent'}</th>
                    <th className="py-4.5 px-6 text-center">{currentLang === 'lo' ? 'ຈັດການ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">
                        No customer records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => {
                      const stats = getCustomerStats(c.name);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4.5 px-6 font-mono text-xs text-slate-400 uppercase">
                            {c.id}
                          </td>
                          <td className="py-4.5 px-6 font-extrabold text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">
                                {getInitials(c.name)}
                              </div>
                              <div>
                                <span className="block">{c.name}</span>
                                {c.instagram && (
                                  <span className="block text-[10px] text-pink-500 font-bold">@{c.instagram}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4.5 px-6 font-sans">
                            {c.phone}
                          </td>
                          <td className="py-4.5 px-6 truncate max-w-[240px] text-slate-500 text-xs" title={c.address}>
                            {c.address}
                          </td>
                          <td className="py-4.5 px-6 font-sans text-center text-slate-800">
                            {stats.totalOrders}
                          </td>
                          <td className="py-4.5 px-6 font-sans font-black text-slate-900 text-right">
                            {formatLAK(stats.totalSpent)}
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedDetailCustomerId(c.id)}
                                title="ເບິ່ງລາຍລະອຽດ"
                                className="p-2 bg-slate-50 hover:bg-accent-sky hover:text-white rounded-xl text-slate-500 transition shadow-sm"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                title="ແກ້ໄຂ"
                                className="p-2 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-xl text-slate-500 transition shadow-sm"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(c.id, c.name)}
                                title="ລຶບ"
                                className="p-2 bg-slate-50 hover:bg-red-500 hover:text-white rounded-xl text-slate-500 transition shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 2. DEDICATED CUSTOMER DETAIL SUB-VIEW */
        <div className="space-y-8">
          {/* Back Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 sm:px-8 sm:py-6 rounded-3xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setSelectedDetailCustomerId(null)}
              className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-600 hover:text-slate-900 transition py-2.5 px-4 sm:py-3 sm:px-6 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl w-fit"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{currentLang === 'lo' ? 'ກັບຄືນ' : 'Back to Directory'}</span>
            </button>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleOpenEditModal(selectedCustomerObj)}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm sm:text-base font-black text-slate-600 transition"
              >
                <Edit3 className="w-5 h-5 text-accent-sky" />
                <span>{currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນ' : 'Edit Profile'}</span>
              </button>
              <button
                onClick={() => handleDeleteCustomer(selectedCustomerObj.id, selectedCustomerObj.name)}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl text-sm sm:text-base font-black transition"
              >
                <Trash2 className="w-5 h-5" />
                <span>{currentLang === 'lo' ? 'ລຶບລູກຄ້າ' : 'Delete Customer'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Part A: Profile Info Card (Bright/Light Theme Redesign) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 sm:p-8 text-center border-b border-slate-100 relative">
                  {/* Large User Avatar Icon instead of initials */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-sky-50 text-accent-sky rounded-full flex items-center justify-center mx-auto border-2 border-sky-100 shadow-inner">
                    <User className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <h4 className="font-black text-2xl sm:text-3xl text-slate-900 mt-5 leading-tight">{selectedCustomerObj.name}</h4>
                  <span className="text-xs text-slate-400 font-mono tracking-wider block mt-1.5 uppercase font-bold">
                    ID: {selectedCustomerObj.id}
                  </span>

                  {/* Financial Statistics (Clean Light Highlight) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 sm:p-4 text-center">
                      <span className="text-xs text-slate-400 block font-black uppercase tracking-wider">{currentLang === 'lo' ? 'ຍອດຊື້ສະສົມ' : 'Total Spent'}</span>
                      <span className="text-sm sm:text-base font-black font-sans text-slate-900 mt-1 block">{formatLAK(activeStats.totalSpent)}</span>
                    </div>
                    <div className={`border rounded-2xl p-3.5 sm:p-4 text-center transition ${activeStats.outstanding > 0 ? 'bg-red-50/50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                      <span className="text-xs text-slate-400 block font-black uppercase tracking-wider">{currentLang === 'lo' ? 'ຍອດຄ້າງຊຳລະ' : 'Outstanding'}</span>
                      <span className="text-sm sm:text-base font-black font-sans mt-1 block">{formatLAK(activeStats.outstanding)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                  {/* Phone */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ເບີໂທລະສັບ</span>
                      <span className="font-sans font-bold text-slate-700 text-base">{selectedCustomerObj.phone || '-'}</span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ທີ່ຢູ່ຈັດສົ່ງ</span>
                      <span className="font-bold text-slate-700 leading-relaxed text-sm lg:text-base block break-words">{selectedCustomerObj.address || '-'}</span>
                    </div>
                  </div>

                  {/* Credit Limit */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">Credit Limit (LAK)</span>
                      <span className="font-sans font-black text-indigo-600 text-sm lg:text-base block break-all">{formatLAK(selectedCustomerObj.creditLimit)}</span>
                    </div>
                  </div>

                  {/* Contact Channels */}
                  <div className="border-t border-slate-100 pt-5 sm:pt-6 space-y-2 sm:space-y-3">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">ຊ່ອງທາງການຕິດຕໍ່ອື່ນໆ</span>
                    <div className="flex flex-wrap gap-3">
                      <SocialLink type="instagram" value={selectedCustomerObj.instagram} />
                      <SocialLink type="line" value={selectedCustomerObj.line} />
                      <SocialLink type="facebook" value={selectedCustomerObj.facebook} />
                      {!selectedCustomerObj.instagram && !selectedCustomerObj.line && !selectedCustomerObj.facebook && (
                        <span className="text-sm text-slate-400 italic font-semibold">ບໍ່ມີຂໍ້ມູນຊ່ອງທາງຕິດຕໍ່ອື່ນໆ</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Place Order */}
              <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => handleCreateOrderRedirect(selectedCustomerObj.name)}
                  className="w-full min-h-[50px] sm:min-h-[56px] bg-accent-sky hover:bg-sky-600 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-sky-600/10 hover:shadow-sky-600/20 transition active:scale-95 py-3 px-4 sm:py-3.5 sm:px-6"
                >
                  <Plus className="w-5 h-5" />
                  <span>{currentLang === 'lo' ? 'ສ້າງອໍເດີໃໝ່ໃຫ້ລູກຄ່ານີ້' : 'Create New Order'}</span>
                </button>
              </div>
            </div>

            {/* Part B: History & Orders Section (Spacious Redesign) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 flex flex-col justify-between min-h-[500px] lg:min-h-[750px] w-full">
              <div className="space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                  <ClipboardList className="w-6 h-6 text-slate-400" />
                  <h5 className="text-sm font-black uppercase text-slate-600 tracking-wider">
                    {currentLang === 'lo' ? 'ປະຫວັດການສັ່ງຊື້ທັງໝົດ' : 'Billing & Order History Log'} ({activeStats.totalOrders})
                  </h5>
                </div>

                {activeStats.custOrders.length === 0 ? (
                  <div className="py-36 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Receipt className="w-7 h-7" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold italic">ຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້ສຳລັບລູກຄ່ານີ້</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-xs lg:text-sm font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
                          <th className="px-4 py-4">Order ID / Date</th>
                          <th className="px-4 py-4">ລາຍການສັ່ງພິມ</th>
                          <th className="px-4 py-4">ການຊຳລະເງິນ</th>
                          <th className="px-4 py-4">ຫຼັກຖານ / ຟາຍ</th>
                          <th className="px-4 py-4 text-right">ຍອດລວມ (LAK)</th>
                          <th className="px-4 py-4 text-center">ບິນ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-base text-slate-700">
                        {activeStats.custOrders.map((o, idx) => {
                          const hasSlip = !!o.paymentSlipUrl;
                          return (
                            <tr key={o.id || idx} className="hover:bg-slate-50/30 transition">
                              {/* Order ID & Date */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="font-mono font-black text-slate-900 block text-sm lg:text-base">#{o.id}</span>
                                <span className="text-xs lg:text-sm text-slate-400 block font-sans mt-1">{o.date}</span>
                              </td>
                              {/* Items list */}
                              <td className="px-4 py-4 min-w-[200px] break-words">
                                <p className="font-bold text-slate-800 text-sm lg:text-base leading-snug break-words">
                                  {o.items.map(item => item.name).join(', ')}
                                </p>
                                {o.notes && (
                                  <p className="text-xs text-slate-400 font-semibold italic mt-1 break-words" title={o.notes}>
                                    {o.notes}
                                  </p>
                                )}
                              </td>
                              {/* Payment details */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-[8px] text-[10px] sm:text-xs lg:text-sm font-extrabold uppercase border ${
                                  o.paymentStatus === 'Fully Paid'
                                    ? 'bg-green-50 text-green-700 border-green-100'
                                    : o.paymentStatus === 'Deposit Paid'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                    : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                  {o.paymentStatus === 'Fully Paid' ? 'ຊຳລະແລ້ວ' : o.paymentStatus === 'Deposit Paid' ? 'ມັດຈຳ' : 'ລໍຖ້າຈ່າຍ'}
                                </span>
                                <span className="block text-xs text-slate-400 font-sans font-bold mt-2">
                                  {o.paymentMethod} {o.bankName ? `(${o.bankName})` : ''}
                                </span>
                              </td>
                              {/* Document & Slip thumbnails */}
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1.5">
                                  {o.artworkLink && (
                                    <button
                                      onClick={() => setLightbox({ src: o.artworkLink, title: `Artwork File: #${o.id}` })}
                                      className="flex items-center justify-center gap-2 text-xs lg:text-sm font-black text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-100 px-3 py-1.5 rounded-lg transition w-fit"
                                    >
                                      <ImageIcon className="w-4 h-4 shrink-0" />
                                      <span>Artwork</span>
                                    </button>
                                  )}
                                  {hasSlip ? (
                                    <button
                                      onClick={() => setLightbox({ src: o.paymentSlipUrl, title: `Payment Slip: #${o.id}` })}
                                      className="flex items-center justify-center gap-2 text-xs lg:text-sm font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-3 py-1.5 rounded-lg transition w-fit"
                                    >
                                      <Receipt className="w-4 h-4 shrink-0" />
                                      <span>Slip View</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-300 italic block pl-1">ບໍ່ມີສລິບ</span>
                                  )}
                                </div>
                              </td>
                              {/* Price charged */}
                              <td className="px-4 py-4 text-right font-sans font-black text-slate-900 whitespace-nowrap">
                                <span className="block text-base lg:text-lg">{formatLAK(o.totalPriceCharged)}</span>
                                {o.remainingUnpaidBalance > 0 && (
                                  <span className="text-xs font-sans font-bold text-red-500 block mt-1.5">
                                    ຄ້າງ: {formatLAK(o.remainingUnpaidBalance)}
                                  </span>
                                )}
                              </td>
                              {/* View Invoice Receipt */}
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => setReceiptOrder(o)}
                                  className="p-3 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 text-slate-400 rounded-xl transition border border-slate-100 shadow-sm"
                                  title="ເບິ່ງໃບບິນ"
                                >
                                  <Receipt className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👤 REGISTER NEW CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <User className="w-6 h-6 text-accent-sky" />
                  <span>{currentLang === 'lo' ? 'ລົງທະບຽນລູກຄ້າໃໝ່' : 'Register New Client'}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">Add client contact and shipping profile</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded-xl transition text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ສົມໃຈ ພິມງາມ"
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 020 55554444"
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              {/* Instagram Handle */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-pink-400" /> Instagram Handle
                </label>
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <span className="px-3 py-2 bg-slate-50 text-slate-400 font-semibold border-r text-xs">@</span>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="username"
                    className="flex-1 px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Line ID */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Line ID
                </label>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder="line_id"
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              {/* Facebook Profile */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Facebook Profile Link / Name
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="Facebook Name or URL"
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Shipping Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. ບ້ານໂພນພະເນົາ, ເມືອງໄຊເສດຖາ"
                  rows="2"
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Credit Limit (LAK)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent-sky text-white rounded-2xl hover:bg-sky-600 transition font-black text-sm tracking-wide shadow-sm"
              >
                Create Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ✏️ EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  <Edit3 className="w-6 h-6 text-amber-555" style={{ color: '#d97706' }} />
                  <span>{currentLang === 'lo' ? 'ແກ້ໄຂຂໍ້ມູນລູກຄ້າ' : 'Edit Customer Profile'}</span>
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">Update client coordinates and limits</p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border rounded-xl transition text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Phone Contact</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              {/* Edit Instagram Handle */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-pink-400" /> Instagram Handle
                </label>
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <span className="px-3 py-2 bg-slate-50 text-slate-400 font-semibold border-r text-xs">@</span>
                  <input
                    type="text"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="flex-1 px-3 py-2 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Edit Line ID */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Line ID
                </label>
                <input
                  type="text"
                  value={editLine}
                  onChange={(e) => setEditLine(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              {/* Edit Facebook Profile */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Facebook Profile Link / Name
                </label>
                <input
                  type="text"
                  value={editFacebook}
                  onChange={(e) => setEditFacebook(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Shipping Address</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows="2"
                  className="w-full px-3.5 py-2 border rounded-xl font-semibold focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Credit Limit (LAK)</label>
                <input
                  type="number"
                  value={editCreditLimit}
                  onChange={(e) => setEditCreditLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border rounded-xl font-sans focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition font-black text-sm tracking-wide shadow-sm"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
