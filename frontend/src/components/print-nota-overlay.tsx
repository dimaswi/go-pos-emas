import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { NotaPrintOptionsModal } from './nota-print-options-modal';
import type { NotaPrintMode } from './nota-print-options-modal';

// Ukuran nota berdasarkan pengukuran:
// - Lebar: 16.5 cm
// - Tinggi: 10.5 cm
// - Padding kiri/kanan tabel: 1 cm
// - Tinggi list barang dari atas: 5.2 cm
// - QR Code: 1 cm dari bawah, 5 cm dari kanan
// - Maksimal 3 item per halaman

const MAX_ITEMS_PER_PAGE = 3;

export interface NotaItem {
  qty: number;
  name: string;
  karat: string; // e.g., "24K", "22K", "18K"
  karatCode?: string; // e.g., "999", "916", "750" - kode kemurnian
  purity?: number; // e.g., 0.999, 0.916, 0.750 - persentase kemurnian
  weight: number; // gram
  price: number;
}

export interface NotaData {
  transactionCode: string;
  date: Date;
  customerName?: string;
  customerAddress?: string;
  items: NotaItem[];
  validationUrl?: string; // URL untuk QR code validasi
  // Payment details
  subtotal?: number;
  discount?: number;
  discountPercent?: number;
  grandTotal?: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
}

interface PrintNotaOverlayProps {
  data: NotaData;
  onClose: () => void;
}

export function PrintNotaOverlay({ data, onClose }: PrintNotaOverlayProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  // Generate QR Code
  useEffect(() => {
    if (qrCanvasRef.current && data.validationUrl) {
      QRCode.toCanvas(qrCanvasRef.current, data.validationUrl, {
        width: 60, // ~1.5cm at 96dpi, akan di-scale saat print
        margin: 0,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [data.validationUrl]);

  // Helper untuk format item name dengan berat total dan kadar kemurnian
  const formatItemName = (item: NotaItem) => {
    const name = item.name;
    // Tambahkan total berat
    const weightText = `${item.weight.toFixed(2)}gr`;
    // Tambahkan kemurnian dalam persen (purity * 100)
    return `${name} ${weightText}`.trim();
  };

  const formatPurityPercent = (item: NotaItem) => {
    if (item.purity !== undefined && item.purity !== null) {
      return `${(item.purity * 100).toFixed(0)}%`;
    }
    return '';
  };

  // Generate HTML untuk satu halaman nota dengan item tertentu
  const generateNotaPageHtml = (
    notaData: NotaData, 
    pageItems: NotaItem[], 
    qrDataUrl: string, 
    pageNum: number, 
    totalPages: number,
    isLastPage: boolean
  ) => {
    const formattedDate = notaData.date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('id-ID').format(price);
    };

    // Generate items HTML dengan nama yang sudah di-format
    const itemsHtml = pageItems.map(item =>
      `<tr>
        <td class="col-qty">${item.qty}</td>
        <td class="col-name">${formatItemName(item)}</td>
        <td class="col-karat">${formatPurityPercent(item)}</td>
        <td class="col-weight">${item.weight.toFixed(2)}</td>
        <td class="col-price">${formatPrice(item.price)}</td>
      </tr>`
    ).join('');

    // Generate payment details HTML (hanya di halaman terakhir) - only Total
    let paymentHtml = '';
    if (isLastPage && notaData.grandTotal !== undefined) {
      paymentHtml = `<div class="payment-details">
        <div class="payment-row grand-total-row">
          <span class="payment-label">Total:</span>
          <span class="payment-value">Rp ${formatPrice(notaData.grandTotal)}</span>
        </div>
      </div>`;
    }

    // Page indicator (jika ada multiple pages)
    const pageIndicator = totalPages > 1 
      ? `<div class="page-indicator">Hal. ${pageNum}/${totalPages}</div>` 
      : '';

    const qrHtml = qrDataUrl ? `<div class="qr-code"><img src="${qrDataUrl}" alt="QR Validasi" /></div>` : '';

    return `<div class="nota-container">
      <div class="header-info tanggal">${formattedDate}</div>
      <div class="header-info nama-pembeli">${notaData.customerName || ''}</div>
      <div class="header-info alamat-pembeli">${notaData.customerAddress || ''}</div>
      <div class="items-table">
        <table>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      ${paymentHtml}
      ${pageIndicator}
      ${qrHtml}
    </div>`;
  };

  // Generate CSS styles untuk nota
  const getNotaStyles = (totalPages: number) => {
    return `
      @page {
        size: 16.5cm 10.5cm;
        margin: 0;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html, body {
        width: 16.5cm;
        height: ${10.5 * totalPages}cm;
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        font-size: 10pt;
        overflow: hidden;
      }

      .nota-container {
        width: 16.5cm;
        height: 10.5cm;
        position: relative;
        overflow: hidden;
      }

      /* Header - Tanggal, Nama, Alamat */
      .header-info {
        position: absolute;
        right: 2.5cm;
        text-align: left;
      }

      .tanggal {
        top: 1cm;
      }

      .nama-pembeli {
        top: 1.5cm;
      }

      .alamat-pembeli {
        top: 2cm;
      }

      /* Tabel Item */
      .items-table {
        position: absolute;
        top: 5.2cm;
        left: 1cm;
        right: 1cm;
        width: calc(16.5cm - 2cm);
      }

      .items-table table {
        width: 100%;
        border-collapse: collapse;
      }

      .items-table td {
        padding: 2px 4px;
        vertical-align: top;
        font-size: 9pt;
      }

      .col-qty { width: 1cm; text-align: center; }
      .col-name { width: 6cm; font-size: 8pt; }
      .col-karat { width: 1.5cm; text-align: center; }
      .col-weight { width: 2cm; text-align: right; }
      .col-price { width: 2.5cm; text-align: right; }

      /* Payment Details - positioned at bottom right */
      .payment-details {
        position: absolute;
        bottom: 2.8cm;
        right: 1cm;
        width: 5.5cm;
        font-size: 8pt;
      }

      .payment-row {
        display: flex;
        justify-content: space-between;
        padding: 1px 0;
      }

      .payment-label {
        font-weight: normal;
      }

      .payment-value {
        text-align: right;
        font-weight: normal;
      }

      .discount-row {
        color: #c00;
      }

      .grand-total-row {
        font-weight: bold;
        border-top: 1px solid #000;
        margin-top: 2px;
        padding-top: 2px;
      }

      /* Page Indicator */
      .page-indicator {
        position: absolute;
        bottom: 0.5cm;
        left: 1cm;
        font-size: 7pt;
        color: #666;
      }

      /* QR Code */
      .qr-code {
        position: absolute;
        bottom: 1cm;
        right: 5cm;
        width: 1.5cm;
        height: 1.5cm;
      }

      .qr-code img {
        width: 100%;
        height: 100%;
      }

      @media print {
        html, body {
          width: 16.5cm;
          height: auto;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
  };

  // Handle print dengan mode tertentu
  const handlePrintWithMode = async (mode: NotaPrintMode) => {
    setShowPrintOptions(false);

    // Generate QR code as data URL
    let qrDataUrl = '';
    if (qrCanvasRef.current) {
      qrDataUrl = qrCanvasRef.current.toDataURL('image/png');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir. Silakan izinkan popup untuk mencetak.');
      return;
    }

    let notasHtml = '';
    let totalPages = 1;

    if (mode === 'single') {
      // Cetak semua item dalam satu nota dengan pagination (max 3 item per halaman)
      totalPages = Math.ceil(data.items.length / MAX_ITEMS_PER_PAGE);
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const startIdx = (pageNum - 1) * MAX_ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + MAX_ITEMS_PER_PAGE, data.items.length);
        const pageItems = data.items.slice(startIdx, endIdx);
        const isLastPage = pageNum === totalPages;
        
        notasHtml += generateNotaPageHtml(data, pageItems, qrDataUrl, pageNum, totalPages, isLastPage);
      }
    } else {
      // Cetak satu nota per item
      totalPages = data.items.length;
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const itemNotaData: NotaData = {
          ...data,
          transactionCode: `${data.transactionCode}-${i + 1}`,
          items: [item],
          // Untuk mode per-item, harga di setiap nota adalah harga per item
          subtotal: item.price * item.qty,
          grandTotal: item.price * item.qty,
          discount: 0,
        };

        // Generate QR untuk setiap item (dengan kode unik)
        const canvas = document.createElement('canvas');
        const itemValidationUrl = `${data.validationUrl}-${i + 1}`;
        await QRCode.toCanvas(canvas, itemValidationUrl, {
          width: 60,
          margin: 0,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const itemQrDataUrl = canvas.toDataURL('image/png');

        notasHtml += generateNotaPageHtml(itemNotaData, [item], itemQrDataUrl, i + 1, totalPages, true);
      }
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Cetak Nota - ${data.transactionCode}</title>
<style>${getNotaStyles(totalPages)}</style>
</head>
<body>${notasHtml}</body>
</html>`);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Tutup window setelah print (baik selesai print maupun cancel)
      printWindow.close();
    };
  };

  // Tampilkan pilihan jika ada lebih dari 1 item
  const handlePrintClick = () => {
    if (data.items.length > 1) {
      setShowPrintOptions(true);
    } else {
      // Langsung cetak jika hanya 1 item
      handlePrintWithMode('single');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Preview Cetak Nota</h2>
            <p className="text-sm text-gray-500">Kode: {data.transactionCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-6 bg-gray-100">
          <div
            ref={printRef}
            className="mx-auto bg-white shadow-lg relative"
            style={{
              width: '16.5cm',
              height: '10.5cm',
              transform: 'scale(0.8)',
              transformOrigin: 'top center',
            }}
          >
            {/* Simulated nota background with dotted lines */}
            <div className="absolute inset-0 border-2 border-dashed border-gray-300 opacity-50" />

            {/* Tanggal - 1cm dari atas, 2.5cm dari kanan */}
            <div
              className="absolute text-sm"
              style={{ top: '1cm', right: '2.5cm' }}
            >
              {data.date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>

            {/* Nama Pembeli - 0.5cm di bawah tanggal */}
            <div
              className="absolute text-sm"
              style={{ top: '1.5cm', right: '2.5cm' }}
            >
              {data.customerName || '-'}
            </div>

            {/* Alamat - 0.5cm di bawah nama */}
            <div
              className="absolute text-sm max-w-[8cm] truncate"
              style={{ top: '2cm', right: '2.5cm' }}
            >
              {data.customerAddress || '-'}
            </div>

            {/* Table Area - full width */}
            <div
              className="absolute left-[1cm] right-[1cm]"
              style={{ top: '5.2cm' }}
            >
              <table className="w-full text-xs">
                <tbody>
                  {data.items.slice(0, MAX_ITEMS_PER_PAGE).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ width: '1cm' }} className="py-0.5 text-center">{item.qty}</td>
                      <td style={{ width: '6cm' }} className="py-0.5 text-left truncate max-w-[6cm]" title={formatItemName(item)}>
                        {formatItemName(item)}
                      </td>
                      <td style={{ width: '1.5cm' }} className="py-0.5 text-center">{formatPurityPercent(item)}</td>
                      <td style={{ width: '2cm' }} className="py-0.5 text-right">{item.weight.toFixed(2)}</td>
                      <td style={{ width: '2.5cm' }} className="py-0.5 text-right">
                        {new Intl.NumberFormat('id-ID').format(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.items.length > MAX_ITEMS_PER_PAGE && (
                <div className="text-xs text-gray-500 mt-1">
                  +{data.items.length - MAX_ITEMS_PER_PAGE} item lagi di halaman berikutnya
                </div>
              )}
            </div>

            {/* Payment Details - only Total */}
            {data.grandTotal !== undefined && (
              <div
                className="absolute text-xs"
                style={{ bottom: '2.8cm', right: '1cm', width: '5.5cm' }}
              >
                <div className="flex justify-between py-0.5 font-bold">
                  <span>Total:</span>
                  <span>Rp {new Intl.NumberFormat('id-ID').format(data.grandTotal)}</span>
                </div>
              </div>
            )}

            {/* Page indicator for preview */}
            {data.items.length > MAX_ITEMS_PER_PAGE && (
              <div
                className="absolute text-xs text-gray-500"
                style={{ bottom: '0.5cm', left: '1cm' }}
              >
                Hal. 1/{Math.ceil(data.items.length / MAX_ITEMS_PER_PAGE)}
              </div>
            )}

            {/* QR Code - 1cm dari bawah, 5cm dari kanan */}
            <div
              className="absolute"
              style={{ bottom: '1cm', right: '5cm' }}
            >
              <canvas
                ref={qrCanvasRef}
                className="border border-gray-200"
                style={{ width: '1.5cm', height: '1.5cm' }}
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
          <div className="flex items-start gap-2 text-sm text-yellow-800">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p>
                <strong>Penting:</strong> Pastikan nota pra-cetak sudah terpasang di printer sebelum mencetak.
                Posisi teks akan dicetak sesuai dengan ukuran yang telah dikalibrasi.
              </p>
              {data.items.length > MAX_ITEMS_PER_PAGE && (
                <p className="mt-1">
                  <strong>Info:</strong> Transaksi ini memiliki {data.items.length} item dan akan dicetak 
                  dalam {Math.ceil(data.items.length / MAX_ITEMS_PER_PAGE)} halaman (maks. {MAX_ITEMS_PER_PAGE} item/halaman).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handlePrintClick}
            className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Nota
          </button>
        </div>
      </div>

      {/* Modal Opsi Cetak */}
      <NotaPrintOptionsModal
        open={showPrintOptions}
        onOpenChange={setShowPrintOptions}
        itemCount={data.items.length}
        onConfirm={handlePrintWithMode}
      />
    </div>
  );
}

// Helper function to convert transaction data to NotaData format
export function transactionToNotaData(
  transaction: {
    transaction_code: string;
    transaction_date?: string;
    created_at: string;
    member?: { name?: string; address?: string };
    customer_name?: string;
    sub_total?: number;
    discount?: number;
    grand_total?: number;
    paid_amount?: number;
    change_amount?: number;
    payment_method?: string;
    items?: Array<{
      item_name?: string;
      product?: { name?: string };
      stock?: { product?: { name?: string; gold_category?: { name?: string; code?: string; purity?: number } } };
      gold_category?: { name?: string; code?: string; purity?: number };
      weight?: number;
      sub_total?: number;
      unit_price?: number;
      quantity?: number;
    }>;
  },
  baseUrl: string = window.location.origin
): NotaData {
  return {
    transactionCode: transaction.transaction_code,
    date: new Date(transaction.transaction_date || transaction.created_at),
    customerName: transaction.member?.name || transaction.customer_name,
    customerAddress: transaction.member?.address,
    items: (transaction.items || []).map(item => {
      const goldCategory = item.gold_category || item.stock?.product?.gold_category;
      return {
        qty: item.quantity || 1,
        name: item.item_name || item.product?.name || item.stock?.product?.name || 'Item',
        karat: goldCategory?.name || '-',
        karatCode: goldCategory?.code,
        purity: goldCategory?.purity,
        weight: item.weight || 0,
        price: item.sub_total || item.unit_price || 0,
      };
    }),
    validationUrl: `${baseUrl}/validate/${transaction.transaction_code}`,
    // Payment details
    subtotal: transaction.sub_total,
    discount: transaction.discount && transaction.discount > 0 ? transaction.discount : undefined,
    grandTotal: transaction.grand_total,
    paidAmount: transaction.paid_amount,
    changeAmount: transaction.change_amount && transaction.change_amount > 0 ? transaction.change_amount : undefined,
    paymentMethod: transaction.payment_method,
  };
}
