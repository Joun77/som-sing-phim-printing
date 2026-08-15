import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, Check, Plus, Search, ChevronDown, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CustomerOption {
  id?: string;
  name: string;
  phone?: string;
  address?: string;
  company?: string;
}

export interface CustomerComboboxProps {
  customers: CustomerOption[];
  valueName: string;
  valuePhone?: string;
  valueAddress?: string;
  onChange: (data: {
    name: string;
    phone: string;
    address: string;
    isNew: boolean;
    saveToCrm: boolean;
    customerId?: string;
  }) => void;
  currentLang?: string;
}

export default function CustomerCombobox({
  customers = [],
  valueName = '',
  valuePhone = '',
  valueAddress = '',
  onChange,
  currentLang = 'lo',
}: CustomerComboboxProps) {
  const { t } = useTranslation();
  const isLao = currentLang === 'lo';

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(valueName);
  const [phone, setPhone] = useState(valuePhone);
  const [address, setAddress] = useState(valueAddress);
  const [saveToCrm, setSaveToCrm] = useState(true);
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if external props change
  useEffect(() => {
    setSearchTerm(valueName);
  }, [valueName]);

  useEffect(() => {
    setPhone(valuePhone || '');
  }, [valuePhone]);

  useEffect(() => {
    setAddress(valueAddress || '');
  }, [valueAddress]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const handleSelectCustomer = (c: CustomerOption) => {
    setSelectedCustId(c.id || c.name);
    setSearchTerm(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setIsOpen(false);

    onChange({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      isNew: false,
      saveToCrm: false,
      customerId: c.id || c.name,
    });
  };

  const handleSelectNewName = () => {
    setSelectedCustId(null);
    setIsOpen(false);

    onChange({
      name: searchTerm.trim(),
      phone: phone,
      address: address,
      isNew: true,
      saveToCrm: saveToCrm,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSelectedCustId(null);
    setIsOpen(true);

    onChange({
      name: val,
      phone: phone,
      address: address,
      isNew: true,
      saveToCrm: saveToCrm,
    });
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    onChange({
      name: searchTerm,
      phone: val,
      address: address,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    onChange({
      name: searchTerm,
      phone: phone,
      address: val,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleToggleSaveToCrm = (checked: boolean) => {
    setSaveToCrm(checked);
    onChange({
      name: searchTerm,
      phone: phone,
      address: address,
      isNew: !selectedCustId,
      saveToCrm: checked,
      customerId: selectedCustId || undefined,
    });
  };

  return (
    <div ref={containerRef} className="space-y-4 w-full text-xs font-semibold text-slate-700">
      {/* Customer Name Search / Combobox */}
      <div className="relative">
        <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            <span>{isLao ? 'ຊື່ລູກຄ້າ / ບໍລິສັດ (Customer Name):' : 'Customer Name / Business:'} *</span>
          </span>
          {selectedCustId ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>{isLao ? 'ລູກຄ້າໃນລະບົບ' : 'Existing CRM'}</span>
            </span>
          ) : (
            <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-200">
              {isLao ? 'ລູກຄ້າໃໝ່' : 'New Customer'}
            </span>
          )}
        </label>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={isLao ? 'ພິມຄົ້ນຫາຊື່ ຫຼື ພິມຊື່ລູກຄ້າໃໝ່...' : 'Search existing customer or type new name...'}
            className="w-full pl-9 pr-10 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 shadow-2xs transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Combobox Dropdown Results Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-fade-in">
            {filteredCustomers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {isLao ? 'ລາຍຊື່ລູກຄ້າໃນລະບົບ CRM' : 'Existing Customers'}
                </div>
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust.id || cust.name}
                    onClick={() => handleSelectCustomer(cust)}
                    className={`p-3 hover:bg-sky-50/70 transition cursor-pointer flex justify-between items-center ${
                      selectedCustId === (cust.id || cust.name) ? 'bg-sky-50 border-l-4 border-sky-600' : ''
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{cust.name}</span>
                      {cust.phone && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cust.phone}
                        </span>
                      )}
                    </div>
                    {selectedCustId === (cust.id || cust.name) && (
                      <Check className="w-4 h-4 text-sky-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Always offer New Customer selection if text is typed */}
            {searchTerm.trim() && (
              <div
                onClick={handleSelectNewName}
                className="p-3 bg-sky-50/50 hover:bg-sky-100/70 border-t border-sky-100 text-sky-800 font-bold transition cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  {isLao ? 'ໃຊ້ຊື່ນີ້:' : 'Use new customer:'}{' '}
                  <strong className="text-sky-950">"{searchTerm.trim()}"</strong> ({isLao ? 'ລູກຄ້າໃໝ່' : 'New Client'})
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phone & Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{isLao ? 'ເບີໂທຕິດຕໍ່ (Phone Number):' : 'Phone Number:'}</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 020 5555 1234"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{isLao ? 'ທີ່ຢູ່ / ສາຂາ (Address):' : 'Address / Branch:'}</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Vientiane, Laos"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Auto Save to CRM Checkbox */}
      {!selectedCustId && (
        <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-600 font-bold text-xs">
          <input
            type="checkbox"
            checked={saveToCrm}
            onChange={(e) => handleToggleSaveToCrm(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <span>{isLao ? 'ບັນທຶກເຂົ້າຖານຂໍ້ມູນ CRM ອັດຕະໂນມັດ' : 'Save customer to CRM database automatically'}</span>
        </label>
      )}
    </div>
  );
}
