// Vite emits this installed package's worker as a local, version-matched asset.
// A static URL also remains importable by the existing Node regression runner.
export function getPdfWorkerSrc(): string {
  return new URL('../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
}

export function configurePdfWorker(targetLib: {
  GlobalWorkerOptions: { workerSrc: string };
}): void {
  if (typeof window !== 'undefined' && typeof window.Worker === 'function') {
    targetLib.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc();
  }
}
