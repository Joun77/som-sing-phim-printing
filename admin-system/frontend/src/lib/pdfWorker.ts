// Local version-matched asset copied to public/ for clean web preview and dev serving.
// Also preserves file URL compatibility for Node regression runners.
export function getPdfWorkerSrc(): string {
  if (typeof window !== 'undefined' && window.location) {
    return '/pdf.worker.min.mjs';
  }
  return new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).href;
}

export function configurePdfWorker(targetLib: {
  GlobalWorkerOptions: { workerSrc: string };
}): void {
  if (typeof window !== 'undefined' && typeof window.Worker === 'function') {
    targetLib.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc();
  }
}
