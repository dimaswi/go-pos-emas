import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Format currency
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format datetime
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format number with thousand separator
export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// PDF Export Configuration
interface PDFExportConfig {
  title: string;
  subtitle?: string;
  headers: string[];
  data: (string | number)[][];
  filename: string;
  orientation?: 'portrait' | 'landscape';
  summaryData?: { label: string; value: string }[];
}

// Export to PDF
export const exportToPDF = (config: PDFExportConfig): void => {
  const {
    title,
    subtitle,
    headers,
    data,
    filename,
    orientation = 'portrait',
    summaryData,
  } = config;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, 22, { align: 'center' });
  }

  // Print date
  doc.setFontSize(8);
  doc.text(`Dicetak: ${formatDateTime(new Date())}`, pageWidth - 15, 10, { align: 'right' });

  // Summary section if provided
  let startY = subtitle ? 30 : 25;
  if (summaryData && summaryData.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan:', 14, startY);
    startY += 5;
    
    doc.setFont('helvetica', 'normal');
    summaryData.forEach((item, index) => {
      doc.text(`${item.label}: ${item.value}`, 14, startY + (index * 5));
    });
    startY += (summaryData.length * 5) + 5;
  }

  // Table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: startY,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [212, 175, 55], // Gold color
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  });

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
};

// Excel Export Configuration
interface ExcelExportConfig {
  title: string;
  headers: string[];
  data: (string | number)[][];
  filename: string;
  sheetName?: string;
  summaryData?: { label: string; value: string | number }[];
}

// Export to Excel
export const exportToExcel = (config: ExcelExportConfig): void => {
  const {
    title,
    headers,
    data,
    filename,
    sheetName = 'Laporan',
    summaryData,
  } = config;

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Build data array with title and summary
  const wsData: (string | number)[][] = [];
  
  // Title row
  wsData.push([title]);
  wsData.push([`Dicetak: ${formatDateTime(new Date())}`]);
  wsData.push([]); // Empty row

  // Summary section
  if (summaryData && summaryData.length > 0) {
    wsData.push(['Ringkasan:']);
    summaryData.forEach((item) => {
      wsData.push([item.label, String(item.value)]);
    });
    wsData.push([]); // Empty row
  }

  // Headers
  wsData.push(headers);
  
  // Data rows
  data.forEach((row) => wsData.push(row));

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = headers.map((header, index) => {
    const headerWidth = header.length;
    const maxDataWidth = Math.max(...data.map((row) => String(row[index] || '').length));
    return { wch: Math.max(headerWidth, maxDataWidth, 10) + 2 };
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(blob, `${filename}.xlsx`);
};

// Helper to prepare transaction report data for export
export const prepareTransactionReportData = (transactions: any[]) => {
  const headers = ['No', 'Kode', 'Tanggal', 'Tipe', 'Lokasi', 'Kasir', 'Customer', 'Total', 'Pembayaran', 'Status'];
  const data = transactions.map((tx, index) => [
    index + 1,
    tx.transaction_code,
    formatDateTime(tx.transaction_date),
    tx.type === 'sale' ? 'Penjualan' : 'Setor Emas',
    tx.location_name,
    tx.cashier_name,
    tx.member_name || tx.customer_name || '-',
    formatCurrency(tx.grand_total),
    tx.payment_method.toUpperCase(),
    tx.status,
  ]);
  return { headers, data };
};

// Helper to prepare stock report data for export
export const prepareStockLocationReportData = (stocks: any[]) => {
  const headers = ['No', 'Lokasi', 'Tipe', 'Total Stok', 'Tersedia', 'Terjual', 'Total Berat (g)', 'Nilai Beli', 'Nilai Jual'];
  const data = stocks.map((s, index) => [
    index + 1,
    s.location_name,
    s.location_type === 'toko' ? 'Toko' : 'Gudang',
    formatNumber(s.total_stock),
    formatNumber(s.available_stock),
    formatNumber(s.sold_stock),
    formatNumber(s.total_weight, 2),
    formatCurrency(s.total_buy_value),
    formatCurrency(s.total_sell_value),
  ]);
  return { headers, data };
};

// Helper to prepare financial summary for export
export const prepareFinancialSummaryData = (summary: any) => {
  const headers = ['Kategori', 'Nilai'];
  const data = [
    ['Periode', summary.period || '-'],
    ['Total Pendapatan (Penjualan)', formatCurrency(summary.total_income)],
    ['Total Pengeluaran (Pembelian)', formatCurrency(summary.total_expenses)],
    ['Laba Bersih', formatCurrency(summary.net_profit)],
    ['Pembayaran Cash', formatCurrency(summary.cash_payments)],
    ['Pembayaran Transfer', formatCurrency(summary.transfer_payments)],
    ['Pembayaran Kartu', formatCurrency(summary.card_payments)],
    ['Pembayaran Campuran', formatCurrency(summary.mixed_payments)],
  ];
  return { headers, data };
};

// Helper to prepare member report data for export
export const prepareMemberReportData = (members: any[]) => {
  const headers = ['No', 'Kode', 'Nama', 'Tipe', 'Telepon', 'Jml Transaksi', 'Total Beli', 'Total Jual', 'Poin'];
  const data = members.map((m, index) => [
    index + 1,
    m.member_code,
    m.member_name,
    m.member_type,
    m.phone || '-',
    formatNumber(m.transaction_count),
    formatCurrency(m.total_purchase),
    formatCurrency(m.total_sell),
    formatNumber(m.points || 0),
  ]);
  return { headers, data };
};

// Helper to prepare price history for export
export const preparePriceHistoryData = (logs: any[]) => {
  const headers = ['No', 'Tanggal', 'Diupdate Oleh', 'Kategori', 'Harga Beli Lama', 'Harga Beli Baru', 'Perubahan Beli', 'Harga Jual Lama', 'Harga Jual Baru', 'Perubahan Jual'];
  const data: (string | number)[][] = [];
  
  logs.forEach((log, logIndex) => {
    log.details?.forEach((detail: any, detailIndex: number) => {
      data.push([
        detailIndex === 0 ? logIndex + 1 : '',
        detailIndex === 0 ? formatDateTime(log.update_date) : '',
        detailIndex === 0 ? log.updated_by_name : '',
        detail.category_name,
        formatCurrency(detail.old_buy_price),
        formatCurrency(detail.new_buy_price),
        formatCurrency(detail.buy_price_change),
        formatCurrency(detail.old_sell_price),
        formatCurrency(detail.new_sell_price),
        formatCurrency(detail.sell_price_change),
      ]);
    });
  });
  
  return { headers, data };
};

// Helper to prepare cashier report for export
export const prepareCashierReportData = (cashiers: any[]) => {
  const headers = ['No', 'Nama Kasir', 'Total Transaksi', 'Penjualan', 'Jumlah Penjualan', 'Pembelian', 'Jumlah Pembelian'];
  const data = cashiers.map((c, index) => [
    index + 1,
    c.cashier_name,
    formatNumber(c.total_transactions),
    formatCurrency(c.total_sales),
    formatNumber(c.sale_count),
    formatCurrency(c.total_purchases),
    formatNumber(c.purchase_count),
  ]);
  return { headers, data };
};

// Helper to prepare location revenue for export
export const prepareLocationRevenueData = (locations: any[]) => {
  const headers = ['No', 'Lokasi', 'Tipe', 'Total Penjualan', 'Jml Penjualan', 'Total Pembelian', 'Jml Pembelian', 'Pendapatan Bersih'];
  const data = locations.map((l, index) => [
    index + 1,
    l.location_name,
    l.location_type === 'toko' ? 'Toko' : 'Gudang',
    formatCurrency(l.total_sales),
    formatNumber(l.sale_count),
    formatCurrency(l.total_purchases),
    formatNumber(l.purchase_count),
    formatCurrency(l.net_revenue),
  ]);
  return { headers, data };
};

// Helper to prepare stock category report for export
export const prepareStockCategoryReportData = (categories: any[]) => {
  const headers = ['No', 'Kode', 'Kategori', 'Total Stok', 'Tersedia', 'Terjual', 'Total Berat (g)', 'Rata-rata Beli', 'Rata-rata Jual', 'Total Nilai'];
  const data = categories.map((c, index) => [
    index + 1,
    c.category_code,
    c.category_name,
    formatNumber(c.total_stock),
    formatNumber(c.available_stock),
    formatNumber(c.sold_stock),
    formatNumber(c.total_weight, 2),
    formatCurrency(c.avg_buy_price),
    formatCurrency(c.avg_sell_price),
    formatCurrency(c.total_sell_value),
  ]);
  return { headers, data };
};

// Helper to prepare sold stock report for export
export const prepareSoldStockReportData = (stocks: any[]) => {
  const headers = ['No', 'Serial', 'Produk', 'Kategori', 'Berat (g)', 'Harga Beli', 'Harga Jual', 'Profit', 'Lokasi', 'Kode Transaksi', 'Tanggal', 'Customer'];
  const data = stocks.map((s, index) => [
    index + 1,
    s.serial_number,
    s.product_name,
    s.category_name,
    formatNumber(s.weight, 2),
    formatCurrency(s.buy_price),
    formatCurrency(s.sell_price),
    formatCurrency(s.profit),
    s.location_name,
    s.transaction_code || '-',
    formatDateTime(s.sold_at),
    s.customer_name || '-',
  ]);
  return { headers, data };
};

// Helper to prepare stock transfer report for export
export const prepareStockTransferReportData = (transfers: any[]) => {
  const headers = ['No', 'No. Transfer', 'Serial Stok', 'Produk', 'Dari Lokasi', 'Ke Lokasi', 'Ditransfer Oleh', 'Tanggal', 'Status'];
  const data = transfers.map((t, index) => [
    index + 1,
    t.transfer_number,
    t.stock_serial,
    t.product_name,
    t.from_location_name,
    t.to_location_name,
    t.transferred_by_name,
    formatDateTime(t.transferred_at),
    t.status,
  ]);
  return { headers, data };
};

// Helper to prepare raw material report for export
export const prepareRawMaterialReportData = (materials: any[]) => {
  const headers = ['No', 'Kode', 'Kategori', 'Lokasi', 'Berat Kotor (g)', 'Susut (%)', 'Berat Bersih (g)', 'Harga/gram', 'Total Harga', 'Kondisi', 'Status', 'Supplier/Member'];
  const data = materials.map((m, index) => [
    index + 1,
    m.code,
    m.category_name || '-',
    m.location_name,
    formatNumber(m.weight_gross, 2),
    formatNumber(m.shrinkage_percent, 1),
    formatNumber(m.weight_grams, 2),
    formatCurrency(m.buy_price_per_gram),
    formatCurrency(m.total_buy_price),
    m.condition,
    m.status,
    m.member_name || m.supplier_name || '-',
  ]);
  return { headers, data };
};

// Helper to prepare payment method report for export
export const preparePaymentMethodReportData = (payments: any[]) => {
  const headers = ['No', 'Metode Pembayaran', 'Jumlah Transaksi', 'Total Nilai', 'Persentase (%)'];
  const data = payments.map((p, index) => [
    index + 1,
    p.payment_method.toUpperCase(),
    formatNumber(p.transaction_count),
    formatCurrency(p.total_amount),
    formatNumber(p.percentage, 2) + '%',
  ]);
  return { headers, data };
};

// Helper to prepare top members for export
export const prepareTopMembersReportData = (members: any[]) => {
  const headers = ['Peringkat', 'Kode', 'Nama', 'Tipe', 'Telepon', 'Total Nilai', 'Jumlah Transaksi'];
  const data = members.map((m) => [
    m.rank,
    m.member_code,
    m.member_name,
    m.member_type,
    m.phone || '-',
    formatCurrency(m.total_amount),
    formatNumber(m.transaction_count),
  ]);
  return { headers, data };
};

// Helper to prepare current price for export
export const prepareCurrentPriceReportData = (prices: any[]) => {
  const headers = ['No', 'Kode', 'Nama Kategori', 'Kemurnian', 'Harga Beli/gram', 'Harga Jual/gram', 'Terakhir Update'];
  const data = prices.map((p, index) => [
    index + 1,
    p.category_code,
    p.category_name,
    p.purity ? formatNumber(p.purity * 100, 2) + '%' : '-',
    formatCurrency(p.buy_price),
    formatCurrency(p.sell_price),
    formatDateTime(p.last_updated),
  ]);
  return { headers, data };
};

// Helper to prepare member points report for export
export const prepareMemberPointsReportData = (members: any[]) => {
  const headers = ['No', 'Kode', 'Nama', 'Tipe', 'Telepon', 'Poin Saat Ini', 'Total Pembelian', 'Tgl Bergabung'];
  const data = members.map((m, index) => [
    index + 1,
    m.member_code,
    m.member_name,
    m.member_type,
    m.phone || '-',
    formatNumber(m.current_points),
    formatCurrency(m.total_purchase),
    formatDate(m.join_date),
  ]);
  return { headers, data };
};

// Helper to prepare member transaction detail for export
export const prepareMemberTransactionDetailData = (transactions: any[]) => {
  const headers = ['No', 'Kode Transaksi', 'Tanggal', 'Tipe', 'Total', 'Poin Didapat', 'Pembayaran'];
  const data = transactions.map((t, index) => [
    index + 1,
    t.transaction_code,
    formatDateTime(t.transaction_date),
    t.type === 'sale' ? 'Penjualan' : 'Setor Emas',
    formatCurrency(t.grand_total),
    formatNumber(t.points_earned || 0),
    t.payment_method?.toUpperCase() || '-',
  ]);
  return { headers, data };
};
