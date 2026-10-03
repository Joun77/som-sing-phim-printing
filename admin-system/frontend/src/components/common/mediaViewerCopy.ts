const en = {
  preview: 'Artwork Preview', close: 'Close (Esc)', zoomOut: 'Zoom Out', zoomIn: 'Zoom In', reset: 'Reset Zoom & Rotation', rotate: 'Rotate Image 90° Clockwise',
  fitPage: 'Fit page', fitWidth: 'Fit width', fitPageTitle: 'Fit Whole Page', fitWidthTitle: 'Fit Width', page: 'Page', pageNumber: 'PDF page number', previousPage: 'Previous Page', nextPage: 'Next Page', previousItem: 'Previous Item (Arrow Left)', nextItem: 'Next Item (Arrow Right)',
  download: 'Download original', downloadTitle: 'Download exact original binary file', loading: 'Loading original…', unavailable: 'Original unavailable', pdf: 'PDF Document', image: 'Image Asset', binary: 'Binary File', subtitle: 'Preview and download original files', retry: 'Retry',
  loadError: 'Unable to load the original file. Try again.', temporaryError: 'This temporary original is unavailable. It may have expired after closing the page. Select and upload the original again.', missingError: 'No original file URL available.', pdfError: 'Unable to display this PDF. Try again.', imageError: 'Unable to display this image. Try again.', downloadError: 'Original download failed. Try again.', rendering: 'Rendering PDF', loadingPdf: 'Loading PDF', thumbnails: 'PDF page thumbnails', goToPage: 'Go to PDF page', thumbnail: 'Thumbnail page', pdfPage: 'PDF page', unsupported: 'Preview unsupported. Download the original file.', unknownSize: 'Unknown file size'
};
const lo: typeof en = {
  preview: 'ເບິ່ງຕົວຢ່າງໄຟລ໌', close: 'ປິດ (Esc)', zoomOut: 'ຫຍໍ້', zoomIn: 'ຂະຫຍາຍ', reset: 'ຄືນຄ່າຂະໜາດ ແລະ ການໝຸນ', rotate: 'ໝຸນຮູບ 90°',
  fitPage: 'ພໍດີໜ້າ', fitWidth: 'ພໍດີຄວາມກວ້າງ', fitPageTitle: 'ເບິ່ງເຕັມໜ້າ', fitWidthTitle: 'ເບິ່ງພໍດີຄວາມກວ້າງ', page: 'ໜ້າ', pageNumber: 'ເລກໜ້າ PDF', previousPage: 'ໜ້າກ່ອນ', nextPage: 'ໜ້າຖັດໄປ', previousItem: 'ໄຟລ໌ກ່ອນ (←)', nextItem: 'ໄຟລ໌ຖັດໄປ (→)',
  download: 'ດາວໂຫຼດຕົ້ນສະບັບ', downloadTitle: 'ດາວໂຫຼດຕົ້ນສະບັບ', loading: 'ກຳລັງໂຫຼດຕົ້ນສະບັບ…', unavailable: 'ຕົ້ນສະບັບເປີດບໍ່ໄດ້', pdf: 'ເອກະສານ PDF', image: 'ຮູບພາບ', binary: 'ໄຟລ໌', subtitle: 'ເບິ່ງຕົວຢ່າງ ແລະ ດາວໂຫຼດຕົ້ນສະບັບ', retry: 'ລອງໃໝ່',
  loadError: 'ບໍ່ສາມາດໂຫຼດຕົ້ນສະບັບໄດ້ ກະລຸນາລອງໃໝ່', temporaryError: 'ໄຟລ໌ຊົ່ວຄາວນີ້ເປີດບໍ່ໄດ້ ອາດໝົດອາຍຸຫຼັງປິດໜ້າເວັບ ກະລຸນາເລືອກຕົ້ນສະບັບແລະອັບໂຫຼດໃໝ່', missingError: 'ບໍ່ພົບ URL ຂອງຕົ້ນສະບັບ', pdfError: 'ບໍ່ສາມາດສະແດງ PDF ໄດ້ ກະລຸນາລອງໃໝ່', imageError: 'ບໍ່ສາມາດສະແດງຮູບໄດ້ ກະລຸນາລອງໃໝ່', downloadError: 'ດາວໂຫຼດຕົ້ນສະບັບບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່', rendering: 'ກຳລັງສະແດງ PDF', loadingPdf: 'ກຳລັງໂຫຼດ PDF', thumbnails: 'ຮູບຍໍ້ຂອງໜ້າ PDF', goToPage: 'ໄປໜ້າ PDF', thumbnail: 'ຮູບຍໍ້ໜ້າ', pdfPage: 'ໜ້າ PDF', unsupported: 'ບໍ່ຮອງຮັບຕົວຢ່າງ ດາວໂຫຼດຕົ້ນສະບັບໄດ້', unknownSize: 'ບໍ່ຮູ້ຂະໜາດໄຟລ໌'
};
export const getMediaViewerCopy = (language = 'lo') => language.startsWith('lo') ? lo : en;
export function formatMediaSize(size: number | undefined, language = 'lo') {
  if (!size || !Number.isFinite(size) || size < 0) return getMediaViewerCopy(language).unknownSize;
  return size < 10486 ? `${size.toLocaleString(language)} bytes` : `${(size / 1048576).toFixed(2)} MB`;
}
