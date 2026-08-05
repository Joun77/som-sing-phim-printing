import React, { useState } from 'react';
import { User, Phone, MapPin, CreditCard, Search, Plus, X, ClipboardList, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export default function CustomerManagement() {
  const { customers, orders, addCustomer, showToast } = useApp();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer for history logs
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Modal open state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(2000000);

  const formatLAK = (num) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(num).replace('LAK', '₭');
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!name) {
      showToast('Please enter a customer name!', 'warning');
      return;
    }

    addCustomer({
      name,
      phone,
      address,
      creditLimit: Number(creditLimit)
    });

    showToast(currentLang === 'lo' ? 'ເພີ່ມຂໍ້ມູນລູກຄ້າສຳເລັດ!' : 'Customer registered successfully!', 'success');
    
    // Reset Form
    setName('');
    setPhone('');
    setAddress('');
    setCreditLimit(2000000);
    setIsAddModalOpen(false);
  };

  // Get statistics for each customer
  const getCustomerStats = (custName) => {
    const custOrders = orders.filter(o => o.customerName === custName);
    const totalOrders = custOrders.length;
    const totalSpent = custOrders.reduce((sum, o) => sum + o.totalPriceCharged, 0);
    return { totalOrders, totalSpent, custOrders };
  };

  const filteredCustomers = customers.filter(c => {
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           c.phone.includes(searchQuery);
  });

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const activeStats = selectedCustomerObj ? getCustomerStats(selectedCustomerObj.name) : { totalOrders: 0, totalSpent: 0, custOrders: [] };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 👥 TOP HEADING AND ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-accent-sky" />
            <span>{currentLang === 'lo' ? 'ຈັດການຂໍ້ມູນລູກຄ້າ & CRM' : 'Customer Directory & CRM'}</span>
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            {currentLang === 'lo' ? 'ລົງທະບຽນລູກຄ້າໃໝ່, ກວດສອບທີ່ຢູ່, ແລະ ປະຫວັດການສັ່ງຊື້ທັງໝົດ' : 'Register clients, store shipping addresses, and review billing logs'}
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

      {/* Directory Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main List */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-4 px-6">{currentLang === 'lo' ? 'ຊື່ລູກຄ້າ' : 'Customer Name'}</th>
                  <th className="py-4 px-6">{currentLang === 'lo' ? 'ເບີໂທ' : 'Phone'}</th>
                  <th className="py-4 px-6">{currentLang === 'lo' ? 'ທີ່ຢູ່ຈັດສົ່ງ' : 'Shipping Address'}</th>
                  <th className="py-4 px-6 text-center">{currentLang === 'lo' ? 'ຈຳນວນອໍເດີ' : 'Total Orders'}</th>
                  <th className="py-4 px-6 text-right">{currentLang === 'lo' ? 'ຍອດຊື້ສະສົມ' : 'Total Spent'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-bold">
                      No customer records found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => {
                    const stats = getCustomerStats(c.name);
                    const isSelected = selectedCustomerId === c.id;

                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`hover:bg-slate-50/50 transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <td className="py-4.5 px-6 font-extrabold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-4.5 px-6 font-sans">
                          {c.phone}
                        </td>
                        <td className="py-4.5 px-6 truncate max-w-[200px]" title={c.address}>
                          {c.address}
                        </td>
                        <td className="py-4.5 px-6 font-sans text-center text-slate-800">
                          {stats.totalOrders}
                        </td>
                        <td className="py-4.5 px-6 font-sans font-black text-slate-900 text-right">
                          {formatLAK(stats.totalSpent)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed history drawer card */}
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          {selectedCustomerObj ? (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="border-b pb-4">
                <h4 className="font-extrabold text-lg text-slate-900 leading-tight">{selectedCustomerObj.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono block mt-1 uppercase">ID: {selectedCustomerObj.id}</span>
              </div>

              {/* Profile Fields */}
              <div className="space-y-3.5 text-xs">
                
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Phone Number</span>
                    <span className="font-sans font-bold text-slate-700">{selectedCustomerObj.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Shipping Address</span>
                    <span className="font-bold text-slate-700 leading-relaxed block">{selectedCustomerObj.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Credit Limit</span>
                    <span className="font-sans font-extrabold text-indigo-600">{formatLAK(selectedCustomerObj.creditLimit)}</span>
                  </div>
                </div>

              </div>

              {/* Order logs breakdown */}
              <div className="space-y-3 pt-4 border-t">
                <h5 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  <span>Order Log History ({activeStats.totalOrders})</span>
                </h5>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeStats.custOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-semibold">No order logs found for this customer.</p>
                  ) : (
                    activeStats.custOrders.map(o => (
                      <div key={o.id} className="p-3 bg-slate-50 border rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between font-extrabold text-slate-800">
                          <span className="font-mono">#{o.id}</span>
                          <span className="font-sans">{o.date}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-slate-500">
                          <span className="truncate max-w-[150px]">
                            {o.items.map(item => item.name).join(', ')}
                          </span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase border ${
                            o.status === 'Delivered' 
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5 font-bold">
                          <span className="text-slate-400">Total Price:</span>
                          <span className="font-sans text-slate-900 font-extrabold">{formatLAK(o.totalPriceCharged)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-400">
                {currentLang === 'lo' ? 'ເລືອກລາຍຊື່ລູກຄ້າເພື່ອເບິ່ງປະຫວັດການສັ່ງຊື້' : 'Select a customer to view order logs'}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 👥 REGISTER NEW CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scale-up relative">
            
            {/* Modal Header */}
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
                <label className="text-slate-500 uppercase block">Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. สมใจ พิมพ์งาม"
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

              <div className="space-y-1">
                <label className="text-slate-500 uppercase block">Shipping Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. ບ້ານໂພນພະເນົາ, ເມືອງໄຊເສດຖາ"
                  rows="3"
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

    </div>
  );
}
