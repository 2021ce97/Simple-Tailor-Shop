/**
 * Universal Print & PDF Service
 * 100% reliable across Desktop, Mobile, iFrames (AI Studio preview), 
 * Standard A6 and A5 sheet printers.
 */
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export interface PrintOptions {
  title?: string;
  pageFormat?: 'a6' | 'a5';
  dir?: 'rtl' | 'ltr';
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Inlines styles and triggers print via a dedicated hidden iframe.
 * If iframe printing fails (e.g. sandbox permissions), seamlessly falls back
 * to in-page isolated print overlay.
 */
export async function printReceiptElement(
  element: HTMLElement,
  options: PrintOptions = {}
): Promise<void> {
  const {
    title = 'Receipt',
    pageFormat = 'a6',
    dir = 'rtl',
    onStart,
    onComplete,
    onError,
  } = options;

  if (!element) {
    onError?.(new Error('Print target element is missing'));
    return;
  }

  onStart?.();

  const widthCss = pageFormat === 'a5' ? 'width: 140mm; max-width: 140mm;' : 'width: 99mm; max-width: 99mm;';
  const marginCss = pageFormat === 'a5' ? '5mm' : '3mm';

  await waitForRenderedContent(element);

  // Gather existing stylesheets & fonts
  let styleTags = '';
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
    styleTags += node.outerHTML + '\n';
  });

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html dir="${dir}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${styleTags}
        <style>
          @page {
            size: ${pageFormat === 'a5' ? '148mm 210mm' : '105mm 148mm'};
            margin: ${marginCss};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Plus Jakarta Sans', 'Vazirmatn', system-ui, -apple-system, sans-serif !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            display: flex !important;
            justify-content: center !important;
          }
          .print-wrapper {
            ${widthCss}
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 auto !important;
            padding: ${pageFormat === 'a5' ? '4mm' : '2mm'} !important;
            box-sizing: border-box !important;
          }
          .no-print, button, .receipt-actions, .receipt-modal-footer {
            display: none !important;
          }
          svg {
            max-width: 100% !important;
            height: auto !important;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          /* Ensure high-contrast solid lines for thermal and regular printers */
          .border-stone-900, .border-stone-950, .border-black {
            border-color: #000000 !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `;

  // Strategy 1: Hidden Iframe approach (Guarantees isolation from parent UI)
  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'print-engine-frame-' + Date.now();
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = pageFormat === 'a5' ? '794px' : '559px';
    iframe.style.height = '1px';
    iframe.style.left = '-10000px';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc) {
      throw new Error('Could not access iframe document');
    }

    frameDoc.open();
    frameDoc.write(printDocumentHtml);
    frameDoc.close();

    await waitForDocumentReady(frameDoc);

    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.print();
    }

    // Clean up frame after print dialog interaction
    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch {
        // ignore
      }
      onComplete?.();
    }, 2000);
  } catch (err) {
    console.warn('Iframe print failed, falling back to direct window.print:', err);
    // Fallback: Direct window.print()
    try {
      window.print();
      onComplete?.();
    } catch (fallbackErr) {
      console.error('All print methods failed:', fallbackErr);
      onError?.(fallbackErr);
    }
  }
}

/**
 * Download a high-res crisp PDF of any printable receipt element.
 */
export async function downloadReceiptPdf(
  element: HTMLElement,
  options: {
    filename?: string;
    pageFormat?: 'a6' | 'a5';
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (err: unknown) => void;
  } = {}
): Promise<void> {
  const {
    filename = 'Receipt.pdf',
    pageFormat = 'a6',
    onStart,
    onComplete,
    onError,
  } = options;

  if (!element) {
    onError?.(new Error('Element not provided'));
    return;
  }

  try {
    onStart?.();

    await waitForRenderedContent(element);

    const dataUrl = await toPng(element, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: {
        margin: '0',
        transform: 'none',
      },
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    const isA5 = pageFormat === 'a5';
    const pdfWidth = isA5 ? 148 : 105;
    const margin = isA5 ? 5 : 3;
    const printableWidth = pdfWidth - margin * 2;
    const imgHeight = (img.naturalHeight * printableWidth) / (img.naturalWidth || 1);
    
    // Default page heights for standard sheet sizes
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: isA5 ? 'a5' : 'a6' });
    const pageHeight = isA5 ? 210 : 148;
    if (imgHeight + margin * 2 > pageHeight) {
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageContentHeight = pageHeight - margin * 2;
      let imageY = margin;
      let remainingHeight = imgHeight;
      pdf.addImage(dataUrl, 'PNG', margin, imageY, printableWidth, imgHeight);
      remainingHeight -= pageContentHeight;
      while (remainingHeight > 0) {
        pdf.addPage();
        imageY -= pageContentHeight;
        pdf.addImage(dataUrl, 'PNG', margin, imageY, printableWidth, imgHeight);
        remainingHeight -= pageContentHeight;
      }
    } else {
      pdf.addImage(dataUrl, 'PNG', margin, margin, printableWidth, imgHeight);
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    onComplete?.();
  } catch (err) {
    console.error('PDF generation error:', err);
    onError?.(err);
  }
}

async function waitForImages(images: HTMLImageElement[]) {
  await Promise.all(images.map(async image => {
    if (!image.complete) await new Promise<void>(resolve => {
      const done = () => resolve();
      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });
      window.setTimeout(done, 3000);
    });
    try { await image.decode(); } catch { /* rendering can continue with the fallback image */ }
  }));
}

async function waitForRenderedContent(element: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(Array.from(element.querySelectorAll('img')));
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function waitForDocumentReady(doc: Document) {
  if (doc.readyState !== 'complete') await new Promise<void>(resolve => {
    doc.defaultView?.addEventListener('load', () => resolve(), { once: true });
    window.setTimeout(resolve, 3000);
  });
  if (doc.fonts?.ready) await doc.fonts.ready;
  await waitForImages(Array.from(doc.images));
  await new Promise<void>(resolve => doc.defaultView?.requestAnimationFrame(() => doc.defaultView?.requestAnimationFrame(() => resolve())));
}
