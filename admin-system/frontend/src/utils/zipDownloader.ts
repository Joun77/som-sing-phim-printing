import JSZip from 'jszip';

export interface DownloadablePhoto {
  name: string;
  url: string;
  size?: number;
}

/**
 * Downloads a batch of photos or files as a single compressed .zip file.
 * Safely handles data URLs, remote URLs, and blob URLs.
 */
export async function downloadPhotosAsZip(
  photos: DownloadablePhoto[],
  zipFilename: string,
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  if (!photos || photos.length === 0) {
    throw new Error('No photos provided to download');
  }

  const zip = new JSZip();
  const folderName = zipFilename.replace(/\.zip$/i, '').trim() || 'artworks_package';
  const folder = zip.folder(folderName) || zip;

  let loadedCount = 0;
  const total = photos.length;

  await Promise.all(
    photos.map(async (photo, idx) => {
      try {
        const rawName = photo.name || `photo_${String(idx + 1).padStart(2, '0')}.jpg`;
        // Ensure extension
        const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(rawName);
        const fileName = hasExt ? rawName : `${rawName}.jpg`;

        if (photo.url.startsWith('data:')) {
          // Extract base64 data
          const base64Index = photo.url.indexOf(';base64,');
          if (base64Index !== -1) {
            const base64Data = photo.url.substring(base64Index + 8);
            folder.file(fileName, base64Data, { base64: true });
          } else {
            // Text or SVG data URL
            const textData = decodeURIComponent(photo.url.split(',')[1] || '');
            folder.file(fileName, textData);
          }
        } else {
          // Fetch remote or local image file
          const response = await fetch(photo.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} fetching ${photo.url}`);
          }
          const blob = await response.blob();
          folder.file(fileName, blob);
        }
      } catch (err) {
        console.warn(`Failed to package photo #${idx + 1} (${photo.name}):`, err);
        // Add fallback placeholder text file so the user knows what failed
        folder.file(`${photo.name || `photo_${idx + 1}`}_error_note.txt`, `Could not package remote image: ${photo.url}`);
      } finally {
        loadedCount++;
        if (onProgress) {
          onProgress(Math.round((loadedCount / total) * 100));
        }
      }
    })
  );

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const finalName = zipFilename.toLowerCase().endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;

  // Trigger browser download
  const blobUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = finalName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up blob URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

/**
 * Downloads a single file or a zip package depending on file count.
 */
export async function downloadSingleOrZip(
  files: DownloadablePhoto[],
  bundleName: string,
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  if (!files || files.length === 0) return;

  if (files.length === 1) {
    const single = files[0];
    const link = document.createElement('a');
    link.href = single.url;
    link.download = single.name || 'artwork.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  await downloadPhotosAsZip(files, bundleName, onProgress);
}
