import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  Key, 
  Layers, 
  Save,
  MessageSquare,
  Bot
} from 'lucide-react';

interface NotificationConfig {
  id: string;
  channel: string;
  event_type: string;
  recipient_type: string;
  is_enabled: boolean;
  template_id?: string;
}

export const NotificationSettingsTab: React.FC = () => {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('2055558888');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // WhatsApp Form Config
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');

  // Telegram Form Config
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/notification-config');
      if (res.ok) {
        const json = await res.json();
        setConfigs(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load notification configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleToggle = (channel: string, eventType: string, recipientType: string) => {
    setConfigs(prev =>
      prev.map(c =>
        c.channel === channel && c.event_type === eventType && c.recipient_type === recipientType
          ? { ...c, is_enabled: !c.is_enabled }
          : c
      )
    );
  };

  const handleSaveConfigs = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/v1/admin/notification-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'ບັນທຶກການຕັ້ງຄ່າການແຈ້ງເຕືອນສຳເລັດແລ້ວ!' });
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async (channel: 'whatsapp' | 'telegram') => {
    setTestingChannel(channel);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/v1/admin/notification-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient: testPhone })
      });
      const json = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Dispatched test message via ${channel.toUpperCase()} successfully!` });
      } else {
        throw new Error(json.message || 'Test failed');
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Test send failed' });
    } finally {
      setTestingChannel(null);
    }
  };

  const eventLabels: Record<string, string> = {
    ORDER_CREATED: 'ສ້າງອໍເດີໃໝ່ (New Order Created)',
    PAYMENT_VERIFIED: 'ກວດສອບການຊຳຣະເງິນແລ້ວ (Payment Verified)',
    FILE_CONFIRMED: 'ຢືນຢັນໄຟລ໌ພິມ/Proof ແລ້ວ (File/Proof Confirmed)',
    IN_PRODUCTION: 'ເລີ່ມຕົ້ນພິມຈິງ (In Production)',
    ORDER_COMPLETED: 'ພິມສຳເລັດພ້ອມຈັດສົ່ງ (Order Completed/Ready)',
    PROOF_READY: 'ໄຟລ໌ Proof ພ້ອມກວດສອບ (Proof Ready for Client)',
    STOCK_LOW: 'ແຈ້ງເຕືອນວັດຖຸດິບໃກ້ໝົດ (Low Stock Alert)',
    MAINTENANCE_DUE: 'ແຈ້ງເຕືອນຮອບບຳລຸງຮັກສາເຄື່ອງ (Maintenance Due)',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              ລະບົບແຈ້ງເຕືອນອັດຕະໂນມັດ (WhatsApp & Telegram Notifications)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              ຕັ້ງຄ່າ API Gateway ແລະ Event Triggers ສຳລັບລູກຄ້າ ແລະ ທີມງານ Admin
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveConfigs}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-navy hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2 text-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການຕັ້ງຄ່າ (Save All)'}
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: 2 Cards (WhatsApp & Telegram) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: WhatsApp Business */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">WhatsApp Business Cloud API</h4>
                <span className="text-[11px] font-semibold text-slate-400">ສົ່ງ Template Messages ຫາລູກຄ້າ</span>
              </div>
            </div>
            <button
              disabled={testingChannel === 'whatsapp'}
              onClick={() => handleTestSend('whatsapp')}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {testingChannel === 'whatsapp' ? 'Testing...' : 'Test Send'}
            </button>
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
              Event Triggers ສຳລັບລູກຄ້າ (Customer Events)
            </div>
            <div className="space-y-2">
              {configs
                .filter(c => c.channel === 'whatsapp')
                .map(cfg => (
                  <label
                    key={`${cfg.channel}-${cfg.event_type}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition border border-slate-100"
                  >
                    <div>
                      <div className="text-slate-800 font-bold">
                        {eventLabels[cfg.event_type] || cfg.event_type}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Template: {cfg.template_id || 'order_update'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfg.is_enabled}
                      onChange={() => handleToggle(cfg.channel, cfg.event_type, cfg.recipient_type)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                  </label>
                ))}
            </div>
          </div>
        </div>

        {/* Card 2: Telegram Bot */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Telegram Bot Admin Alerts</h4>
                <span className="text-[11px] font-semibold text-slate-400">ແຈ້ງເຕືອນທີມງານ Admin & Workshop Group</span>
              </div>
            </div>
            <button
              disabled={testingChannel === 'telegram'}
              onClick={() => handleTestSend('telegram')}
              className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl border border-sky-200 transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {testingChannel === 'telegram' ? 'Testing...' : 'Test Send'}
            </button>
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
              Event Triggers ສຳລັບ Admin (Internal Alerts)
            </div>
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {configs
                .filter(c => c.channel === 'telegram')
                .map(cfg => (
                  <label
                    key={`${cfg.channel}-${cfg.event_type}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition border border-slate-100"
                  >
                    <div>
                      <div className="text-slate-800 font-bold">
                        {eventLabels[cfg.event_type] || cfg.event_type}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Channel: Telegram Admin Chat
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cfg.is_enabled}
                      onChange={() => handleToggle(cfg.channel, cfg.event_type, cfg.recipient_type)}
                      className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
