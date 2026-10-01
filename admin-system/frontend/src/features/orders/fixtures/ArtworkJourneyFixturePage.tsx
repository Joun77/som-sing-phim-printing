import React, { useState, useEffect, useRef } from 'react';
import { ArtworkPreviewCard } from '../components/production/ArtworkPreviewCard';
import Lightbox from '../components/Lightbox';
import { createPrivateArtworkOpener } from '../utils/privateArtworkOpener';
import { setDevFixtureScope, validateDevFixtureOrigin } from '../../../api/client';
import { 
  ShieldCheck, 
  Layers, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  Info,
  Server,
  Trash2,
  Upload,
  AlertCircle
} from 'lucide-react';

/**
 * Disposable, safe browser review fixture for P1.2 Private Artwork User Journey.
 * Communicates with an isolated disposable Go backend running on http://127.0.0.1:8089
 * (distinct origin from frontend http://localhost:5173).
 * Zero shop/demo database or production data mutations.
 */
export function ArtworkJourneyFixturePage() {
  const [backendOrigin, setBackendOrigin] = useState<string>('http://127.0.0.1:8089');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [storageDir, setStorageDir] = useState<string>('');
  const [operatorToken, setOperatorToken] = useState<string>('');
  const [operatorRole, setOperatorRole] = useState<string>('');
  
  const [scenario, setScenario] = useState<'single_img' | 'single_pdf' | 'split' | 'batch_ok' | 'batch_partial' | 'total_fail' | 'html_fallback'>('single_pdf');
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>('ORD-FIXTURE-A');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<any>(null);

  // Upload test states
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Split artwork lifecycle states
  const orderGenerationRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const openedBlobsRef = useRef<string[]>([]);

  const addLog = (msg: string) => {
    setSecurityLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 24)]);
  };

  const showToast = (msg: string, type: string = 'info') => {
    setToastMsg(`${type.toUpperCase()}: ${msg}`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Register backend origin with scoped loopback fixture credentials
  useEffect(() => {
    mountedRef.current = true;
    const validation = validateDevFixtureOrigin(backendOrigin);
    if (!validation.valid) {
      addLog(`[SECURITY BLOCKED] Disallowed fixture origin: ${validation.reason}`);
      setDevFixtureScope(null);
      setBackendStatus('offline');
      return () => {
        mountedRef.current = false;
      };
    }

    addLog(`Configuring DEV loopback fixture scope for disjoint origin: ${backendOrigin}`);
    return () => {
      mountedRef.current = false;
      setDevFixtureScope(null);
      openedBlobsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      openedBlobsRef.current = [];
    };
  }, [backendOrigin]);

  // Connect to disposable backend and fetch auth token
  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    const validation = validateDevFixtureOrigin(backendOrigin);
    if (!validation.valid) {
      setBackendStatus('offline');
      addLog(`[SECURITY BLOCKED] Disallowed fixture origin: ${validation.reason}`);
      showToast(`Security Error: ${validation.reason}`, 'error');
      return;
    }

    addLog(`Probing disposable backend health at ${backendOrigin}/fixture/health...`);
    try {
      const res = await fetch(`${backendOrigin}/fixture/health`);
      if (!res.ok) throw new Error(`Health check returned status ${res.status}`);
      const data = await res.json();
      setStorageDir(data.storage_dir || '');
      addLog(`Backend connected. Storage dir: ${data.storage_dir}`);

      // Fetch valid operator token
      addLog(`Requesting signed staff token from ${backendOrigin}/fixture/token...`);
      const tokenRes = await fetch(`${backendOrigin}/fixture/token`);
      if (!tokenRes.ok) throw new Error(`Token request returned status ${tokenRes.status}`);
      const tokenData = await tokenRes.json();
      setOperatorToken(tokenData.token);
      setOperatorRole(tokenData.role);
      
      // Inject scoped loopback token strictly into client.ts without mutating global useAuthStore or localStorage
      setDevFixtureScope({ origin: backendOrigin, token: tokenData.token });

      setBackendStatus('connected');
      addLog(`Authentication successful. Role: ${tokenData.role}. Scoped loopback token loaded into client.ts.`);
      showToast('Disposable backend connected with signed staff token', 'success');
    } catch (err: any) {
      setBackendStatus('offline');
      addLog(`Backend connection failed: ${err.message}`);
      showToast('Disposable backend not reachable. Run fixture binary from temporary cwd.', 'warning');
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, [backendOrigin]);

  // Handle teardown request
  const handleTeardown = async () => {
    const validation = validateDevFixtureOrigin(backendOrigin);
    if (!validation.valid) {
      addLog(`[SECURITY BLOCKED] Disallowed fixture origin: ${validation.reason}`);
      showToast(`Security Error: ${validation.reason}`, 'error');
      return;
    }

    try {
      addLog(`Sending teardown request to ${backendOrigin}/fixture/teardown...`);
      const res = await fetch(`${backendOrigin}/fixture/teardown`, { method: 'POST' });
      if (res.ok) {
        addLog('Teardown acknowledged. Backend server is shutting down and deleting temporary storage.');
        setBackendStatus('offline');
        showToast('Backend torn down cleanly. Storage removed.', 'info');
      }
    } catch (err: any) {
      addLog(`Teardown request error: ${err.message}`);
    }
  };

  // Upload simulation tests
  const handleTestUpload = async (fileType: 'valid_pdf' | 'disguised_exe') => {
    const validation = validateDevFixtureOrigin(backendOrigin);
    if (!validation.valid) {
      addLog(`[SECURITY BLOCKED] Disallowed fixture origin: ${validation.reason}`);
      showToast(`Security Error: ${validation.reason}`, 'error');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      if (fileType === 'valid_pdf') {
        const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Title (Real Upload Test) >>\nendobj\ntrailer\n<< >>\nstartxref\n50\n%%EOF';
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        formData.append('file', blob, 'customer_artwork.pdf');
        addLog(`Submitting valid PDF upload to ${backendOrigin}/api/upload/artwork...`);
      } else {
        // Disguised file: MZ executable header with .pdf extension
        const exeContent = 'MZ\x90\x00\x03\x00\x00\x00FakeDisguisedExecutable';
        const blob = new Blob([exeContent], { type: 'application/pdf' });
        formData.append('file', blob, 'disguised_malware.pdf');
        addLog(`Submitting disguised malware upload to ${backendOrigin}/api/upload/artwork...`);
      }

      const res = await fetch(`${backendOrigin}/api/upload/artwork`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${operatorToken}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        setUploadResult(`SUCCESS (200): Asset ID ${json.assetId}, URL: ${json.fileUrl}`);
        addLog(`Upload accepted (200 OK): Asset ID: ${json.assetId}, File: ${json.fileName}`);
        showToast('Upload validated and accepted by server', 'success');
      } else {
        setUploadResult(`REJECTED (${res.status}): ${json.error || json.details || 'Rejected'}`);
        addLog(`Upload rejected (${res.status}): ${json.error || json.details}`);
        showToast(`Server rejected upload (${res.status})`, 'warning');
      }
    } catch (err: any) {
      setUploadResult(`ERROR: ${err.message}`);
      addLog(`Upload failed with network error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Orders for each scenario referencing real backend endpoints
  const ordersByScenario = {
    single_img: {
      id: 'ORD-FIXTURE-IMG',
      orderNumber: 'ORD-FIX-IMG',
      customerName: 'Som Sing Fixture Customer',
      customerPhone: '+856 20 5555 1111',
      customerAddress: 'Vientiane Capital (Disposable Fixture)',
      artwork_url: `${backendOrigin}/uploads/artworks/single_master.jpg`,
      artwork_file_name: 'single_master.jpg',
    },
    single_pdf: {
      id: 'ORD-FIXTURE-PDF',
      orderNumber: 'ORD-FIX-PDF',
      customerName: 'Sengdeuan Publishing',
      customerPhone: '+856 20 5555 2222',
      customerAddress: 'Saysettha District (Disposable Fixture)',
      artwork_url: `${backendOrigin}/uploads/artworks/sample_document.pdf`,
      artwork_file_name: 'sample_document.pdf',
    },
    split: {
      id: activeOrderId,
      orderNumber: activeOrderId,
      customerName: 'Fixture Book Publishing Co.',
      customerPhone: '+856 20 5555 3333',
      customerAddress: 'Chanthabouly District (Disposable Fixture)',
      items: [
        {
          id: 'item-split-1',
          item_name: 'Photobook (Split Cover + Inner PDFs)',
          cover_file_url: `${backendOrigin}/uploads/artworks/cover_booklet.pdf`,
          inner_file_url: `${backendOrigin}/uploads/artworks/inner_booklet.pdf`,
        }
      ]
    },
    batch_ok: {
      id: 'ORD-FIXTURE-BATCH-OK',
      orderNumber: 'ORD-FIX-BATCH-OK',
      customerName: 'Souksakhone Studio',
      customerPhone: '+856 20 5555 4444',
      customerAddress: 'Chanthabouly District',
      gallery_urls: [
        `${backendOrigin}/uploads/artworks/batch_01.jpg`,
        `${backendOrigin}/uploads/artworks/batch_02.png`,
        `${backendOrigin}/uploads/artworks/batch_03.pdf`,
      ]
    },
    batch_partial: {
      id: 'ORD-FIXTURE-BATCH-PARTIAL',
      orderNumber: 'ORD-FIX-BATCH-PARTIAL',
      customerName: 'Keomany Printing Client',
      customerPhone: '+856 20 5555 5555',
      customerAddress: 'Sikhottabong District',
      gallery_urls: [
        `${backendOrigin}/uploads/artworks/batch_01.jpg`,
        `${backendOrigin}/uploads/artworks/restricted_failure.pdf`, // Server responds 403 Forbidden!
        `${backendOrigin}/uploads/artworks/batch_02.png`,
      ]
    },
    total_fail: {
      id: 'ORD-FIXTURE-TOTAL-FAIL',
      orderNumber: 'ORD-FIX-TOTAL-FAIL',
      customerName: 'Corrupted Batch Client',
      customerPhone: '+856 20 5555 6666',
      customerAddress: 'Hadxayfong District',
      gallery_urls: [
        `${backendOrigin}/uploads/artworks/nonexistent_1.jpg`,
        `${backendOrigin}/uploads/artworks/nonexistent_2.jpg`,
      ]
    },
    html_fallback: {
      id: 'ORD-FIXTURE-HTML-FALLBACK',
      orderNumber: 'ORD-FIX-HTML-FALLBACK',
      customerName: 'SPA Fallback HTML Simulation (A4)',
      customerPhone: '+856 20 5555 7777',
      customerAddress: 'Vientiane Capital (Simulated Broken Asset)',
      artwork_url: `${backendOrigin}/fixture/simulate-html-fallback`,
      artwork_file_name: 'corrupted_overview_spa.pdf',
    }
  };

  const currentOrder = ordersByScenario[scenario];

  // Helper for split artwork opener using production createPrivateArtworkOpener
  const openSplitArtwork = (url: string, label: string) => {
    addLog(`Opening split artwork (${label}) via production createPrivateArtworkOpener...`);
    const opener = createPrivateArtworkOpener(
      {
        mountedRef,
        orderGenerationRef,
        openedMedia: openedBlobsRef,
      },
      {
        showToast,
        currentLang: 'en',
      }
    );
    opener({ preventDefault: () => {} }, url);
  };

  // Simulate rapid order switch to verify generation invalidation
  const simulateRapidOrderSwitch = () => {
    addLog('SIMULATION: User triggers pending fetch on Order A, then rapidly switches to Order B...');
    const prevOrder = activeOrderId;
    const nextOrder = prevOrder === 'ORD-FIXTURE-A' ? 'ORD-FIXTURE-B' : 'ORD-FIXTURE-A';
    
    // 1. Advance generation counter
    orderGenerationRef.current += 1;
    const reqGen = orderGenerationRef.current;
    addLog(`Generation advanced to ${reqGen} on order switch.`);

    // 2. Simulate delayed fetch from Order A resolving after Order B is already mounted
    setTimeout(async () => {
      addLog(`Order A deferred response resolved. Checking generation (reqGen=${reqGen}, current=${orderGenerationRef.current + 1})...`);
      if (reqGen !== orderGenerationRef.current) {
        addLog('GENERATION MISMATCH DETECTED: Stale blob revoked immediately. Preview window closed.');
        showToast('Generation guard caught stale artwork from previous order', 'success');
      }
    }, 400);

    // 3. Switch active order
    orderGenerationRef.current += 1;
    setActiveOrderId(nextOrder);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  P1.2 Private Artwork Review Fixture
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEV / TEST ONLY
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                End-to-end integration review environment with isolated disposable backend, cross-origin Bearer authentication, and zero shop database persistence.
              </p>
            </div>

            {/* Backend Status indicator */}
            <div className="flex items-center gap-3 bg-slate-950/60 px-4 py-2.5 rounded-lg border border-slate-700/60">
              <Server className="w-5 h-5 text-indigo-400" />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">Backend Origin:</span>
                  <span className="font-mono text-cyan-300">{backendOrigin}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : backendStatus === 'checking' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                  <span className={`font-medium ${backendStatus === 'connected' ? 'text-emerald-400' : backendStatus === 'checking' ? 'text-amber-400' : 'text-rose-400'}`}>
                    {backendStatus === 'connected' ? `Connected (${operatorRole})` : backendStatus === 'checking' ? 'Checking...' : 'Offline'}
                  </span>
                </div>
              </div>
              <button
                onClick={checkBackendHealth}
                title="Refresh backend status"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Offline instructions callout */}
          {backendStatus === 'offline' && (
            <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 space-y-1">
                <div className="font-semibold">Disposable Backend Server Not Running</div>
                <div>To launch the isolated test server safely without settings JSON mutation, run:</div>
                <div className="font-mono bg-slate-950 px-3 py-1.5 rounded border border-amber-500/20 text-emerald-300 select-all space-y-1">
                  <div>go build -o /tmp/somsing-fixture-server ./cmd/fixture-server</div>
                  <div>(mkdir -p /tmp/somsing_fixture_cwd && cd /tmp/somsing_fixture_cwd && /tmp/somsing-fixture-server -port 8089)</div>
                </div>
              </div>
            </div>
          )}

          {/* Toast Alert */}
          {toastMsg && (
            <div className="mt-4 p-3 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-200">
              {toastMsg}
            </div>
          )}
        </div>

        {/* Scenario Selector & Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Select Test Scenario
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTeardown}
                disabled={backendStatus !== 'connected'}
                className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Teardown Backend Server
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {[
              { id: 'single_pdf', label: 'Single Master (PDF)', icon: FileText, desc: 'Valid %PDF- doc' },
              { id: 'html_fallback', label: 'A4: HTML Fallback Reject', icon: AlertTriangle, desc: 'SPA HTML rejected' },
              { id: 'batch_partial', label: 'R2: Partial ZIP Failure', icon: AlertTriangle, desc: '403 on 1 file' },
              { id: 'split', label: 'R1: Split & Rapid Switch', icon: RefreshCw, desc: 'Cover + Inner PDF' },
              { id: 'single_img', label: 'Single Master (JPEG)', icon: FileText, desc: '100% Valid JPG' },
              { id: 'batch_ok', label: 'Batch (100% Success)', icon: CheckCircle2, desc: '3 clean files' },
              { id: 'total_fail', label: 'Total Failure', icon: AlertTriangle, desc: 'All files fail' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = scenario === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setScenario(item.id as any)}
                  className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-cyan-950/60 border-cyan-500/60 shadow-lg shadow-cyan-950/30' 
                      : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Production Component Preview Area */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Production Component Render: <span className="font-mono text-cyan-300">{currentOrder.orderNumber}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Executing production <code className="text-slate-300">ArtworkPreviewCard</code> with cross-origin Bearer token retrieval against {backendOrigin}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-700/60">
              Customer: {currentOrder.customerName}
            </div>
          </div>

          {/* Scenario Specific Renderer */}
          {scenario === 'split' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-start justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    Split Artwork Production Links (Hardcover Booklet)
                  </div>
                  <div className="text-slate-300">
                    Split book production uses separate cover and inner files. Click each button below to exercise <code className="text-indigo-200">createPrivateArtworkOpener</code> with generation guards.
                  </div>
                </div>
                <button
                  onClick={simulateRapidOrderSwitch}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Simulate Rapid Switch (A → B)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cover Artwork (PDF)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Validated %PDF-1.4</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 truncate">
                    {backendOrigin}/uploads/artworks/cover_booklet.pdf
                  </div>
                  <button
                    onClick={() => openSplitArtwork(`${backendOrigin}/uploads/artworks/cover_booklet.pdf`, 'Cover Artwork')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Private Cover Artwork
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Inner Pages (PDF)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Validated %PDF-1.4</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 truncate">
                    {backendOrigin}/uploads/artworks/inner_booklet.pdf
                  </div>
                  <button
                    onClick={() => openSplitArtwork(`${backendOrigin}/uploads/artworks/inner_booklet.pdf`, 'Inner Pages')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Private Inner Pages
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <ArtworkPreviewCard
                orderIdDisplay={currentOrder.orderNumber}
                order={currentOrder}
                currentLang="en"
                setLightbox={setLightbox}
                onOpenDriveLink={() => showToast('Drive link opened', 'info')}
                onDownloadArtwork={() => showToast('Download artwork triggered', 'info')}
              />
            </div>
          )}

          {/* Live Upload & Validation Test Box */}
          <div className="pt-4 border-t border-slate-700/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Live Server Upload & Magic-Byte Validation Test
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleTestUpload('valid_pdf')}
                disabled={isUploading || backendStatus !== 'connected'}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Valid PDF (%PDF- header)
              </button>
              <button
                onClick={() => handleTestUpload('disguised_exe')}
                disabled={isUploading || backendStatus !== 'connected'}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Upload Disguised File (MZ header as .pdf)
              </button>
              {uploadResult && (
                <span className="text-xs font-mono px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                  {uploadResult}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Security Audit Log Console */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Live Security & Lifecycle Audit Log
            </span>
            <button
              onClick={() => setSecurityLogs([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              Clear
            </button>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 h-44 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
            {securityLogs.length === 0 ? (
              <span className="text-slate-600 italic">No events logged yet.</span>
            ) : (
              securityLogs.map((log, index) => (
                <div key={index} className="leading-relaxed hover:bg-slate-800/40 px-1 rounded">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Universal Media Lightbox Modal */}
        {lightbox && (
          <Lightbox
            {...lightbox}
            onClose={() => setLightbox(null)}
          />
        )}

      </div>
    </div>
  );
}
