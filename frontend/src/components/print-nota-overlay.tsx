import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

// Ukuran nota berdasarkan pengukuran:
// - Lebar: 16.5 cm
// - Tinggi: 10.5 cm
// - Padding kiri/kanan tabel: 1 cm
// - Tinggi list barang dari atas: 5.2 cm
// - QR Code: 1 cm dari bawah, 5 cm dari kanan

export interface NotaItem {
  qty: number;
  name: string;
  karat: string; // e.g., "24K", "22K", "18K"
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
}

interface PrintNotaOverlayProps {
  data: NotaData;
  onClose: () => void;
}

export function PrintNotaOverlay({ data, onClose }: PrintNotaOverlayProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir. Silakan izinkan popup untuk mencetak.');
      return;
    }

    // Format tanggal
    const formattedDate = data.date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Format harga
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('id-ID').format(price);
    };

    // Generate QR code as data URL
    let qrDataUrl = '';
    if (qrCanvasRef.current) {
      qrDataUrl = qrCanvasRef.current.toDataURL('image/png');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Nota - ${data.transactionCode}</title>
        <style>
          @page {
            size: 16.5cm 10.5cm;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: 16.5cm;
            height: 10.5cm;
            position: relative;
            font-family: Arial, sans-serif;
            font-size: 10pt;
          }

          .nota-container {
            width: 16.5cm;
            height: 10.5cm;
            position: relative;
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
            width: calc(16.5cm - 2cm); /* 14.5cm */
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

          /* Kolom widths berdasarkan ukuran:
             - Jumlah: 1cm
             - Nama Barang: 6cm
             - Mas/Karat: 1.5cm
             - Berat: 2cm
             - Jumlah/Harga: 2.5cm
             Total: 13cm (sisanya untuk spacing)
          */
          .col-qty { width: 1cm; text-align: center; }
          .col-name { width: 6cm; }
          .col-karat { width: 1.5cm; text-align: center; }
          .col-weight { width: 2cm; text-align: right; }
          .col-price { width: 2.5cm; text-align: right; }

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
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="nota-container">
          <!-- Tanggal -->
          <div class="header-info tanggal">
            ${formattedDate}
          </div>

          <!-- Nama Pembeli -->
          <div class="header-info nama-pembeli">
            ${data.customerName || ''}
          </div>

          <!-- Alamat -->
          <div class="header-info alamat-pembeli">
            ${data.customerAddress || ''}
          </div>

          <!-- Tabel Item -->
          <div class="items-table">
            <table>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td class="col-qty">${item.qty}</td>
                    <td class="col-name">${item.name}</td>
                    <td class="col-karat">${item.karat}</td>
                    <td class="col-weight">${item.weight.toFixed(2)}</td>
                    <td class="col-price">${formatPrice(item.price)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- QR Code Validasi -->
          ${qrDataUrl ? `
            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Validasi" />
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
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
                day: '2-digit',
                month: '2-digit',
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

            {/* Table Area - Langsung list barang tanpa header (header sudah ada di nota pre-printed) */}
            <div
              className="absolute left-[1cm] right-[1cm]"
              style={{ top: '5.2cm' }}
            >
              <table className="w-full text-xs">
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ width: '1cm' }} className="py-0.5 text-center">{item.qty}</td>
                      <td style={{ width: '6cm' }} className="py-0.5 text-left truncate max-w-[6cm]">{item.name}</td>
                      <td style={{ width: '1.5cm' }} className="py-0.5 text-center">{item.karat}</td>
                      <td style={{ width: '2cm' }} className="py-0.5 text-right">{item.weight.toFixed(2)}</td>
                      <td style={{ width: '2.5cm' }} className="py-0.5 text-right">
                        {new Intl.NumberFormat('id-ID').format(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
            <p>
              <strong>Penting:</strong> Pastikan nota pra-cetak sudah terpasang di printer sebelum mencetak.
              Posisi teks akan dicetak sesuai dengan ukuran yang telah dikalibrasi.
            </p>
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
            onClick={handlePrint}
            className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Nota
          </button>
        </div>
      </div>
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
    items?: Array<{
      item_name?: string;
      product?: { name?: string };
      stock?: { product?: { name?: string } };
      gold_category?: { name?: string };
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
    items: (transaction.items || []).map(item => ({
      qty: item.quantity || 1,
      name: item.item_name || item.product?.name || item.stock?.product?.name || 'Item',
      karat: item.gold_category?.name || '-',
      weight: item.weight || 0,
      price: item.sub_total || item.unit_price || 0,
    })),
    validationUrl: `${baseUrl}/validate/${transaction.transaction_code}`,
  };
}
