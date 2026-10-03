import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, LoaderCircle } from 'lucide-react';
import { downloadAuthenticatedFile } from '../../../api/client';
import { downloadPhotosAsZip, type DownloadablePhoto } from '../../../utils/zipDownloader';
import { artworkActionClass } from '../utils/artworkParts';

/** Canonical source identity also guards late download feedback after navigation. */
export default function ArtworkFileActions({ url, name, onPreview, role, files }: { url: string; name: string; onPreview: () => void; role?: string; files?: DownloadablePhoto[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const sourceKey = JSON.stringify([url, name, files]);
  useEffect(() => { generation.current++; setPending(false); setError(''); return () => { generation.current++; }; }, [sourceKey]);
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <button type="button" data-artwork-action="preview" data-artwork-role={role} disabled={!url && !files?.length} className={artworkActionClass} onClick={event => { event.stopPropagation(); onPreview(); }}><Eye aria-hidden="true" className="h-4 w-4 shrink-0" />ເບິ່ງຕົວຢ່າງ</button>
      <button type="button" data-artwork-action="download" data-artwork-role={role} disabled={(!url && !files?.length) || pending} aria-busy={pending} className={artworkActionClass} onClick={async event => {
        event.stopPropagation(); const active = generation.current; setError(''); setPending(true);
        try {
          if (files?.length) {
            const result = await downloadPhotosAsZip(files, `${name || 'artwork'}.zip`);
            if (active === generation.current && result.failedCount) setError(`ດາວໂຫຼດສຳເລັດ ${result.successCount} ໄຟລ໌ ແຕ່ບໍ່ສຳເລັດ ${result.failedCount} ໄຟລ໌: ${result.failedFiles.join(', ')}`);
          } else await downloadAuthenticatedFile(url, name, undefined, name);
        }
        catch { if (active === generation.current) setError('ດາວໂຫຼດຕົ້ນສະບັບບໍ່ສຳເລັດ ກະລຸນາລອງອີກຄັ້ງ'); }
        finally { if (active === generation.current) setPending(false); }
      }}>{pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4 shrink-0" />}{pending ? 'ກຳລັງດາວໂຫຼດ…' : files?.length ? 'ດາວໂຫຼດ ZIP' : 'ດາວໂຫຼດຕົ້ນສະບັບ'}</button>
    </div>
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
  </div>;
}
