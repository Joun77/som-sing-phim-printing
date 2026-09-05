import jsPDF from 'jspdf';

export interface ImposedItem {
  id?: string;
  url: string;
  name?: string;
}

export interface ImpositionPdfOptions {
  orderNo: string;
  jobName: string;
  itemWidthMM: number;
  itemHeightMM: number;
  parentSheet?: 'A4' | 'A3' | 'A3+' | string;
  bleedMM?: number;
  gutterMM?: number;
  showCropMarks?: boolean;
}

/**
 * Draws standard printer hairline crop marks at the 4 corners of an item
 */
function drawCropMarks(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  markLen = 5,
  offset = 2
) {
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.15); // hairline 0.15mm

  // Top-Left corner
  pdf.line(x - offset - markLen, y, x - offset, y); // horizontal
  pdf.line(x, y - offset - markLen, x, y - offset); // vertical

  // Top-Right corner
  pdf.line(x + width + offset, y, x + width + offset + markLen, y); // horizontal
  pdf.line(x + width, y - offset - markLen, x + width, y - offset); // vertical

  // Bottom-Left corner
  pdf.line(x - offset - markLen, y + height, x - offset, y + height); // horizontal
  pdf.line(x, y + height + offset, x, y + height + offset + markLen); // vertical

  // Bottom-Right corner
  pdf.line(x + width + offset, y + height, x + width + offset + markLen, y + height); // horizontal
  pdf.line(x + width, y + height + offset, x + width, y + height + offset + markLen); // vertical
}

/**
 * Loads an image from URL or data URL and converts to HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Generates and triggers download of a Print-Ready Imposed PDF with crop marks
 */
export async function generateAndDownloadImposedPdf(
  items: ImposedItem[],
  options: ImpositionPdfOptions
): Promise<void> {
  if (!items || items.length === 0) {
    throw new Error('No items provided for imposition PDF');
  }

  const sheet = options.parentSheet?.toUpperCase() || 'A4';
  let sheetW = 210;
  let sheetH = 297;

  if (sheet === 'A3') {
    sheetW = 297;
    sheetH = 420;
  } else if (sheet === 'A3+' || sheet === 'SUPER_A3') {
    sheetW = 329;
    sheetH = 483;
  }

  const pdf = new jsPDF({
    orientation: sheetW > sheetH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [sheetW, sheetH],
  });

  const itemW = options.itemWidthMM || 102;
  const itemH = options.itemHeightMM || 152;
  const gutter = options.gutterMM || 3;
  const showCropMarks = options.showCropMarks !== false;

  // Margin for crop marks
  const marginX = 10;
  const marginY = 15;
  const usableW = sheetW - marginX * 2;
  const usableH = sheetH - marginY * 2;

  // Calculate cols and rows
  const cols = Math.max(1, Math.floor((usableW + gutter) / (itemW + gutter)));
  const rows = Math.max(1, Math.floor((usableH + gutter) / (itemH + gutter)));
  const itemsPerPage = cols * rows;

  const totalPages = Math.ceil(items.length / itemsPerPage);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage([sheetW, sheetH], sheetW > sheetH ? 'landscape' : 'portrait');
    }

    // Header Slug (Metadata line at the top)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    const slug = `SOM SING PHIM • Order: ${options.orderNo} | Job: ${options.jobName} | Sheet ${pageIdx + 1}/${totalPages} | Size: ${itemW}x${itemH}mm (${cols}x${rows} Up on ${sheet})`;
    pdf.text(slug, marginX, marginY - 6);

    // Render items for this sheet
    const pageItems = items.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage);

    for (let i = 0; i < pageItems.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = marginX + col * (itemW + gutter);
      const y = marginY + row * (itemH + gutter);

      const it = pageItems[i];

      try {
        const img = await loadImage(it.url);
        pdf.addImage(img, 'JPEG', x, y, itemW, itemH);
      } catch {
        // Fallback placeholder box
        pdf.setFillColor(241, 245, 249);
        pdf.rect(x, y, itemW, itemH, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(x, y, itemW, itemH, 'S');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        const label = it.name || `Photo #${pageIdx * itemsPerPage + i + 1}`;
        pdf.text(label, x + itemW / 2, y + itemH / 2, { align: 'center' });
      }

      if (showCropMarks) {
        drawCropMarks(pdf, x, y, itemW, itemH);
      }
    }
  }

  const safeFileName = `${options.orderNo || 'ORDER'}_${options.jobName || 'PHOTOS'}_Imposed_PrintReady.pdf`
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  pdf.save(safeFileName);
}
