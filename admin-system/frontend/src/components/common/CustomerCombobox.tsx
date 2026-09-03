import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, Check, Plus, Search, ChevronDown, UserCheck, Home, Building2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CustomerOption {
  id?: string;
  name: string;
  phone?: string;
  address?: string;
  company?: string;
  village?: string;
  district?: string;
  province?: string;
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
    village?: string;
    district?: string;
    province?: string;
    isNew: boolean;
    saveToCrm: boolean;
    customerId?: string;
  }) => void;
  currentLang?: string;
  hideSaveToCrmCheckbox?: boolean;
}

const LAO_PROVINCES = [
  'ນະຄອນຫຼວງວຽງຈັນ',
  'ວຽງຈັນ',
  'ຫຼວງພະບາງ',
  'ຈຳປາສັກ',
  'ສະຫວັນນະເຂດ',
  'ຄຳມ່ວນ',
  'ບໍລິຄຳໄຊ',
  'ໄຊຍະບູລີ',
  'ຊຽງຂວາງ',
  'ຫົວພັນ',
  'ອຸດົມໄຊ',
  'ຫຼວງນ້ຳທາ',
  'ບໍ່ແກ້ວ',
  'ຜົ້ງສາລີ',
  'ສາລະວັນ',
  'ເຊກອງ',
  'ອັດຕະປື',
  'ໄຊສົມບູນ',
];

const parseAddressParts = (addr: string) => {
  if (!addr || !addr.trim()) {
    return { village: '', district: '', province: 'ນະຄອນຫຼວງວຽງຈັນ', detail: '' };
  }

  let village = '';
  let district = '';
  let province = '';
  let detail = '';

  const parts = addr.split(/[,/|]/).map((p) => p.trim()).filter(Boolean);

  parts.forEach((p) => {
    if (p.startsWith('ບ້ານ') || p.toLowerCase().startsWith('ban') || p.toLowerCase().startsWith('village')) {
      village = p.replace(/^(ບ້ານ|ban|village)\s*/i, '').trim();
    } else if (p.startsWith('ເມືອງ') || p.toLowerCase().startsWith('muang') || p.toLowerCase().startsWith('district')) {
      district = p.replace(/^(ເມືອງ|muang|district)\s*/i, '').trim();
    } else if (
      p.startsWith('ແຂວງ') ||
      p.includes('ວຽງຈັນ') ||
      p.includes('ຫຼວງພະບາງ') ||
      p.includes('ຈຳປາສັກ') ||
      p.includes('ສະຫວັນນະເຂດ')
    ) {
      province = p.replace(/^ແຂວງ\s*/, '').trim();
    } else {
      if (!detail) detail = p;
      else detail += `, ${p}`;
    }
  });

  if (!village && !district && !province) {
    if (parts.length >= 3) {
      village = parts[0];
      district = parts[1];
      province = parts[2];
    } else if (parts.length === 2) {
      village = parts[0];
      district = parts[1];
    } else {
      village = addr;
    }
  }

  return {
    village: village.trim(),
    district: district.trim(),
    province: province.trim() || 'ນະຄອນຫຼວງວຽງຈັນ',
    detail: detail.trim(),
  };
};

export default function CustomerCombobox({
  customers = [],
  valueName = '',
  valuePhone = '',
  valueAddress = '',
  onChange,
  currentLang = 'lo',
  hideSaveToCrmCheckbox = false,
}: CustomerComboboxProps) {
  const { t } = useTranslation();
  const isLao = currentLang === 'lo';

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(valueName);
  const [phone, setPhone] = useState(valuePhone);

  const initialParts = parseAddressParts(valueAddress);
  const [village, setVillage] = useState(initialParts.village);
  const [district, setDistrict] = useState(initialParts.district);
  const [province, setProvince] = useState(initialParts.province);
  const [addressDetail, setAddressDetail] = useState(initialParts.detail);

  const [saveToCrm, setSaveToCrm] = useState(true);
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const buildFullAddress = (v = village, d = district, p = province, det = addressDetail) => {
    const segments = [
      v.trim() ? (v.trim().startsWith('ບ້ານ') ? v.trim() : `ບ້ານ ${v.trim()}`) : '',
      d.trim() ? (d.trim().startsWith('ເມືອງ') ? d.trim() : `ເມືອງ ${d.trim()}`) : '',
      p.trim() ? (p.trim().startsWith('ແຂວງ') || p.trim().includes('ນະຄອນຫຼວງ') ? p.trim() : `ແຂວງ ${p.trim()}`) : '',
      det.trim(),
    ].filter(Boolean);

    return segments.join(', ');
  };

  // Sync state if external props change
  useEffect(() => {
    setSearchTerm(valueName);
  }, [valueName]);

  useEffect(() => {
    setPhone(valuePhone || '');
  }, [valuePhone]);

  useEffect(() => {
    if (valueAddress !== undefined) {
      const parsed = parseAddressParts(valueAddress);
      setVillage(parsed.village);
      setDistrict(parsed.district);
      setProvince(parsed.province);
      setAddressDetail(parsed.detail);
    }
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
    const parsed = parseAddressParts(c.address || '');
    setSelectedCustId(c.id || c.name);
    setSearchTerm(c.name);
    setPhone(c.phone || '');
    setVillage(c.village || parsed.village);
    setDistrict(c.district || parsed.district);
    setProvince(c.province || parsed.province);
    setAddressDetail(parsed.detail);
    setIsOpen(false);

    const fullAddr = c.address || buildFullAddress(c.village || parsed.village, c.district || parsed.district, c.province || parsed.province, parsed.detail);

    onChange({
      name: c.name,
      phone: c.phone || '',
      address: fullAddr,
      village: c.village || parsed.village,
      district: c.district || parsed.district,
      province: c.province || parsed.province,
      isNew: false,
      saveToCrm: false,
      customerId: c.id || c.name,
    });
  };

  const handleSelectNewName = () => {
    setSelectedCustId(null);
    setIsOpen(false);

    const fullAddr = buildFullAddress();

    onChange({
      name: searchTerm.trim(),
      phone: phone,
      address: fullAddr,
      village,
      district,
      province,
      isNew: true,
      saveToCrm: saveToCrm,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setSelectedCustId(null);
    setIsOpen(true);

    const fullAddr = buildFullAddress();

    onChange({
      name: val,
      phone: phone,
      address: fullAddr,
      village,
      district,
      province,
      isNew: true,
      saveToCrm: saveToCrm,
    });
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const fullAddr = buildFullAddress();
    onChange({
      name: searchTerm,
      phone: val,
      address: fullAddr,
      village,
      district,
      province,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleVillageChange = (val: string) => {
    setVillage(val);
    const fullAddr = buildFullAddress(val, district, province, addressDetail);
    onChange({
      name: searchTerm,
      phone: phone,
      address: fullAddr,
      village: val,
      district,
      province,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    const fullAddr = buildFullAddress(village, val, province, addressDetail);
    onChange({
      name: searchTerm,
      phone: phone,
      address: fullAddr,
      village,
      district: val,
      province,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    const fullAddr = buildFullAddress(village, district, val, addressDetail);
    onChange({
      name: searchTerm,
      phone: phone,
      address: fullAddr,
      village,
      district,
      province: val,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleDetailChange = (val: string) => {
    setAddressDetail(val);
    const fullAddr = buildFullAddress(village, district, province, val);
    onChange({
      name: searchTerm,
      phone: phone,
      address: fullAddr,
      village,
      district,
      province,
      isNew: !selectedCustId,
      saveToCrm: saveToCrm,
      customerId: selectedCustId || undefined,
    });
  };

  const handleToggleSaveToCrm = (checked: boolean) => {
    setSaveToCrm(checked);
    const fullAddr = buildFullAddress();
    onChange({
      name: searchTerm,
      phone: phone,
      address: fullAddr,
      village,
      district,
      province,
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
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        {cust.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone}
                          </span>
                        )}
                        {cust.address && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {cust.address}
                          </span>
                        )}
                      </div>
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

      {/* Phone Number Field */}
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

      {/* Delivery Address — ไม่มีกรอบซ้อน เป็นเนื้อเดียวกับฟิลด์อื่น */}
      <div className="space-y-2">
        <label className="text-slate-600 font-bold text-xs flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-accent-sky" />
          <span>{isLao ? 'ສະຖານທີ່ຈັດສົ່ງ (Delivery Address):' : 'Delivery Address:'}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* 1. ບ້ານ (Village) */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Home className="w-3 h-3 text-slate-300" />
              <span>{isLao ? 'ບ້ານ:' : 'Village:'}</span>
            </label>
            <input
              type="text"
              placeholder={isLao ? 'ດົງປ່າລານ...' : 'Village name...'}
              value={village}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>

          {/* 2. ເມືອງ (District) */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-300" />
              <span>{isLao ? 'ເມືອງ:' : 'District:'}</span>
            </label>
            <input
              type="text"
              placeholder={isLao ? 'ສີສັດຕະນາກ...' : 'District...'}
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>

          {/* 3. ແຂວງ (Province) */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-300" />
              <span>{isLao ? 'ແຂວງ:' : 'Province:'}</span>
            </label>
            <select
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:outline-none focus:border-sky-500"
            >
              {LAO_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>

        <input
          type="text"
          placeholder={isLao ? 'ລາຍລະອຽດເພີ່ມເຕີມ (ຮ່ອມ, ຖະໜົນ...)' : 'Street / Alley / Extra directions...'}
          value={addressDetail}
          onChange={(e) => handleDetailChange(e.target.value)}
          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[11px] font-medium text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
        />
      </div>

      {/* CRM checkbox removed — toggle is handled by parent QuotationManager */}
    </div>
  );
}
