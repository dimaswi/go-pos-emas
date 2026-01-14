/**
 * RECEIPT PRINT UTILITY
 * Layout: 80mm Thermal Printer (302px content width)
 * 
 * Features:
 * - Professional receipt design
 * - Support for sale and deposit transactions
 * - QR Code for verification (optional)
 * - Responsive to thermal printer width
 */

interface ReceiptItem {
  name: string;
  weight?: number;
  price: number;
  quantity?: number;
  barcode?: string;
  gold_category?: string;
}

interface ReceiptData {
  type: 'sale' | 'deposit';
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  transactionCode: string;
  date: Date;
  locationName?: string;
  cashierName?: string;
  customerName?: string;
  memberCode?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  grandTotal: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  notes?: string;
  // For deposit specific
  totalWeightGross?: number;
  totalWeightNet?: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const generateReceiptHTML = (data: ReceiptData): string => {
  const isDeposit = data.type === 'deposit';
  
  const itemsHTML = data.items.map((item, idx) => `
    <tr>
      <td style="padding: 4px 0; vertical-align: top; font-size: 11px;">
        <div style="font-weight: 500;">${idx + 1}. ${item.name}</div>
        <div style="font-size: 10px; color: #666; margin-top: 2px;">
          ${item.weight ? `${item.weight.toFixed(2)}g` : ''}
          ${item.gold_category ? ` • ${item.gold_category}` : ''}
          ${item.barcode ? ` • ${item.barcode}` : ''}
        </div>
      </td>
      <td style="padding: 4px 0; text-align: right; vertical-align: top; font-size: 11px; white-space: nowrap;">
        ${formatCurrency(item.price)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Struk ${isDeposit ? 'Setor Emas' : 'Penjualan'} - ${data.transactionCode}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', 'Lucida Console', monospace;
      width: 80mm;
      max-width: 80mm;
      padding: 8px 10px;
      background: #fff;
      color: #000;
      font-size: 11px;
      line-height: 1.3;
    }
    
    .receipt {
      width: 100%;
    }
    
    /* Header */
    .header {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
      margin-bottom: 8px;
    }
    
    .store-name {
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    
    .store-info {
      font-size: 9px;
      color: #333;
      line-height: 1.4;
    }
    
    /* Transaction Type Badge */
    .tx-type {
      text-align: center;
      padding: 6px 0;
      margin-bottom: 8px;
    }
    
    .tx-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 1px;
      border: 2px solid #000;
      border-radius: 4px;
    }
    
    .tx-badge.sale {
      background: #000;
      color: #fff;
    }
    
    .tx-badge.deposit {
      background: #fff;
      color: #000;
    }
    
    /* Info Section */
    .info-section {
      padding: 8px 0;
      border-bottom: 1px dashed #666;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 10px;
    }
    
    .info-label {
      color: #666;
    }
    
    .info-value {
      font-weight: 500;
      text-align: right;
      max-width: 60%;
    }
    
    .tx-code {
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    
    /* Items Section */
    .items-section {
      padding: 8px 0;
      border-bottom: 1px dashed #666;
    }
    
    .section-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      color: #333;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    /* Summary Section */
    .summary-section {
      padding: 8px 0;
      border-bottom: 1px dashed #666;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
    }
    
    .summary-row.total {
      font-size: 14px;
      font-weight: bold;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #333;
    }
    
    .summary-row.discount {
      color: #c00;
    }
    
    /* Payment Section */
    .payment-section {
      padding: 8px 0;
      border-bottom: 1px dashed #666;
    }
    
    .payment-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }
    
    .payment-method {
      display: inline-block;
      padding: 2px 6px;
      background: #eee;
      border-radius: 2px;
      font-size: 10px;
      margin-left: 4px;
    }
    
    .change-amount {
      font-size: 13px;
      font-weight: bold;
      color: #060;
    }
    
    /* Weight Summary (for deposit) */
    .weight-section {
      padding: 8px 0;
      border-bottom: 1px dashed #666;
      background: #f9f9f9;
      margin: 0 -10px;
      padding-left: 10px;
      padding-right: 10px;
    }
    
    .weight-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
    }
    
    /* Notes */
    .notes-section {
      padding: 8px 0;
      border-bottom: 1px dashed #666;
    }
    
    .notes-text {
      font-size: 10px;
      font-style: italic;
      color: #333;
      background: #f5f5f5;
      padding: 6px;
      border-radius: 2px;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 10px;
    }
    
    .thank-you {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .footer-note {
      font-size: 9px;
      color: #666;
      line-height: 1.4;
    }
    
    .divider-deco {
      margin: 6px 0;
      text-align: center;
      font-size: 8px;
      letter-spacing: 2px;
      color: #999;
    }
    
    /* Barcode/QR placeholder */
    .barcode-section {
      text-align: center;
      padding: 8px 0;
      margin-top: 6px;
    }
    
    .barcode-text {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    
    @media print {
      body {
        width: 80mm;
        padding: 4px 6px;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <!-- Header -->
    <div class="header">
      <div class="store-name">${data.storeName || 'TOKO EMAS'}</div>
      <div class="store-info">
        ${data.storeAddress || 'Alamat Toko'}<br>
        ${data.storePhone ? `Telp: ${data.storePhone}` : ''}
      </div>
    </div>
    
    <!-- Transaction Type Badge -->
    <div class="tx-type">
      <span class="tx-badge ${isDeposit ? 'deposit' : 'sale'}">
        ${isDeposit ? '⬇ SETOR EMAS' : '🛒 PENJUALAN'}
      </span>
    </div>
    
    <!-- Transaction Info -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">No. Transaksi</span>
        <span class="info-value tx-code">${data.transactionCode}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tanggal</span>
        <span class="info-value">${formatDate(data.date)}</span>
      </div>
      ${data.locationName ? `
      <div class="info-row">
        <span class="info-label">Lokasi</span>
        <span class="info-value">${data.locationName}</span>
      </div>
      ` : ''}
      ${data.cashierName ? `
      <div class="info-row">
        <span class="info-label">Kasir</span>
        <span class="info-value">${data.cashierName}</span>
      </div>
      ` : ''}
      ${data.customerName ? `
      <div class="info-row">
        <span class="info-label">${isDeposit ? 'Penyetor' : 'Pelanggan'}</span>
        <span class="info-value">${data.customerName}${data.memberCode ? ` (${data.memberCode})` : ''}</span>
      </div>
      ` : ''}
    </div>
    
    <!-- Items -->
    <div class="items-section">
      <div class="section-title">📦 Daftar ${isDeposit ? 'Item' : 'Produk'}</div>
      <table class="items-table">
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>
    
    ${isDeposit && (data.totalWeightGross || data.totalWeightNet) ? `
    <!-- Weight Summary for Deposit -->
    <div class="weight-section">
      <div class="section-title">⚖ Ringkasan Berat</div>
      ${data.totalWeightGross ? `
      <div class="weight-row">
        <span>Berat Kotor</span>
        <span><strong>${data.totalWeightGross.toFixed(2)} g</strong></span>
      </div>
      ` : ''}
      ${data.totalWeightNet ? `
      <div class="weight-row">
        <span>Berat Bersih</span>
        <span><strong>${data.totalWeightNet.toFixed(2)} g</strong></span>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.discount && data.discount > 0 ? `
      <div class="summary-row discount">
        <span>Diskon</span>
        <span>-${formatCurrency(data.discount)}</span>
      </div>
      ` : ''}
      ${data.tax && data.tax > 0 ? `
      <div class="summary-row">
        <span>Pajak</span>
        <span>${formatCurrency(data.tax)}</span>
      </div>
      ` : ''}
      <div class="summary-row total">
        <span>${isDeposit ? 'TOTAL BAYAR' : 'GRAND TOTAL'}</span>
        <span>${formatCurrency(data.grandTotal)}</span>
      </div>
    </div>
    
    ${!isDeposit && data.paidAmount !== undefined ? `
    <!-- Payment Info -->
    <div class="payment-section">
      <div class="payment-row">
        <span>Metode Bayar<span class="payment-method">${getPaymentMethodLabel(data.paymentMethod || 'cash')}</span></span>
      </div>
      ${data.paymentMethod === 'cash' ? `
      <div class="payment-row">
        <span>Dibayar</span>
        <span>${formatCurrency(data.paidAmount)}</span>
      </div>
      <div class="payment-row change-amount">
        <span>Kembalian</span>
        <span>${formatCurrency(data.changeAmount || 0)}</span>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${data.notes ? `
    <!-- Notes -->
    <div class="notes-section">
      <div class="section-title">📝 Catatan</div>
      <div class="notes-text">${data.notes}</div>
    </div>
    ` : ''}
    
    <!-- Barcode Section -->
    <div class="barcode-section">
      <div class="divider-deco">★ ★ ★ ★ ★</div>
      <div class="barcode-text">${data.transactionCode}</div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="thank-you">✨ Terima Kasih ✨</div>
      <div class="footer-note">
        Simpan struk ini sebagai bukti transaksi<br>
        Barang yang sudah dibeli tidak dapat dikembalikan
      </div>
      <div class="divider-deco">════════════════════════════════</div>
    </div>
  </div>
</body>
</html>
  `;
};

function getPaymentMethodLabel(method: string): string {
  const methods: Record<string, string> = {
    cash: 'TUNAI',
    transfer: 'TRANSFER',
    qris: 'QRIS',
    debit: 'DEBIT',
    credit: 'KREDIT',
  };
  return methods[method] || method.toUpperCase();
}

export const printReceipt = (data: ReceiptData): void => {
  const html = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Fallback for browsers that don't trigger onload
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

export type { ReceiptData, ReceiptItem };
