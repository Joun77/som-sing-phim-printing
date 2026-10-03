import { apiFetch, resolveBackendUrl, isTrustedOrigin } from './client';

export const uploadOriginal = async (file: File) => {
  const body = new FormData();
  body.append('file', file);
  const response = await apiFetch<Response>('/api/v1/upload/artwork', { method: 'POST', body });
  if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);
  const metadata: { fileUrl?: string; file_url?: string; url?: string } = await response.json();
  const url = metadata.fileUrl || metadata.file_url || metadata.url;
  if (!url || !isTrustedOrigin(resolveBackendUrl(url)) || !new URL(resolveBackendUrl(url)).pathname.startsWith('/uploads/artworks/')) {
    throw new Error('Upload succeeded but no valid original artwork URL returned from server');
  }
  return url;
};

