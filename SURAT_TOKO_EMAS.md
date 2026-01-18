# NOTA TOKO EMAS - Spesifikasi Cetak Pre-printed Form

## Dimensi Nota
- **TINGGI**: 10.5 cm
- **LEBAR**: 16.5 cm

## Layout Header (Area Informasi Pembeli)
| Elemen | Posisi dari Atas | Posisi Horizontal |
|--------|------------------|-------------------|
| TANGGAL | 1 cm | 2.5 cm dari ujung kanan |
| NAMA PEMBELI | 1.5 cm (0.5 cm dibawah tanggal) | 2.5 cm dari ujung kanan |
| ALAMAT PEMBELI | 2 cm (0.5 cm dibawah nama) | 2.5 cm dari ujung kanan |

## Layout Tabel Item
- **Tinggi list barang dari atas**: 5.2 cm
- **Padding kiri kanan tabel**: 1 cm
- **Total lebar area tabel**: 14.5 cm (16.5cm - 2cm padding)

### Kolom Tabel (dari kiri ke kanan)
| Kolom | Lebar | Posisi dari Padding Kiri | Alignment |
|-------|-------|--------------------------|-----------|
| JUMLAH | 1 cm | 0 - 1 cm | Center |
| NAMA BARANG | 6 cm | 1 - 7 cm | Left |
| MAS (KARAT) | 1.5 cm | 7 - 8.5 cm | Center |
| BERAT | 2 cm | 8.5 - 10.5 cm | Right |
| JUMLAH/HARGA | 2.5 cm | 10.5 - 13 cm | Right |

**Total lebar kolom**: 13 cm (sisanya ~0.5cm untuk spacing antar kolom)

## QR Code Validasi
- **Posisi**: 1 cm dari bawah, 5 cm dari kanan
- **Ukuran**: ~1.5 cm x 1.5 cm
- **Fungsi**: Scan untuk melihat detail transaksi online

## Visualisasi Layout (ASCII)

```
+---------------------------------------------------------------------+
|                                                                     | <- 1 cm dari atas
|                                          [TANGGAL: dd/mm/yyyy]      |
|                                          [NAMA PEMBELI________]     | <- 1.5 cm
|                                          [ALAMAT______________]     | <- 2 cm
|                                                                     |
|                                                                     |
+---------------------------------------------------------------------+ <- 5.2 cm dari atas
|<1cm>| JML |   NAMA BARANG    | MAS | BERAT |    HARGA    |<1cm>|
|     | 1cm |      6 cm        |1.5cm|  2cm  |    2.5cm    |     |
+-----+-----+------------------+-----+-------+-------------+-----+
|     |  1  | Cincin Emas      | 24K | 5.00  | 5.000.000   |     |
|     |  1  | Gelang Anak      | 22K | 3.50  | 2.800.000   |     |
|     |     |                  |     |       |             |     |
|     |     |                  |     |       |             |     |
+-----+-----+------------------+-----+-------+-------------+-----+
|                                                    +-------+      |
|                                                    |  QR   |      | <- 1cm dari bawah
|                                                    +-------+      | <- 5cm dari kanan
+---------------------------------------------------------------------+
```

## Catatan Kolom MAS/KARAT

Kolom **MAS** berisi kadar kemurnian emas:
- **24K** = Emas murni (99.9%) - Code: 999
- **23K** = 95.8% - Code: 958
- **22K** = 91.6% - Code: 916
- **18K** = 75% - Code: 750
- **16K** = 66.6% - Code: 666
- **9K** = 37.5% - Code: 375

Data karat diambil dari `gold_category.name` dan `gold_category.code` di database.

## Fitur Nota

### Pagination
- Maksimal 3 item per halaman
- Jika lebih dari 3 item, akan otomatis dipaginate ke halaman berikutnya
- Indikator halaman ditampilkan di pojok kiri bawah (contoh: "Hal. 1/2")
- Rincian pembayaran hanya ditampilkan di halaman terakhir

### Nama Item
Format nama item sekarang mencakup:
- Nama produk
- Total berat (contoh: "2.50gr")
- Kode kadar jika tersedia (contoh: "(916)" atau "(75.0%)")

Contoh: "Cincin Emas 2.50gr (916)"

### Rincian Pembayaran
Ditampilkan di bagian kanan bawah nota (di atas QR code):
- Total Berat keseluruhan
- Subtotal
- Diskon (jika ada, dengan persentase jika tersedia)
- Grand Total
- Jumlah Bayar (dengan metode: Tunai/Transfer/Kartu)
- Kembalian (hanya untuk pembayaran tunai)

## Implementasi

### Komponen React
File: `frontend/src/components/print-nota-overlay.tsx`

### Penggunaan di POS
- Halaman POS: `frontend/src/pages/pos/index.tsx`
- Halaman Riwayat: `frontend/src/pages/pos/history.tsx`

### Tombol Cetak Nota
- Di modal konfirmasi pembayaran: "Bayar & Cetak Nota (Pre-printed)"
- Di detail transaksi riwayat: "Cetak Nota (Pre-printed)"

## Kalibrasi Printer

Jika posisi cetakan tidak tepat, sesuaikan nilai CSS berikut di `print-nota-overlay.tsx`:

```css
/* Header info positions */
.tanggal { top: 1cm; }
.nama-pembeli { top: 1.5cm; }
.alamat-pembeli { top: 2cm; }

/* Table position */
.items-table { top: 5.2cm; left: 1cm; right: 1cm; }

/* Payment details position */
.payment-details { bottom: 2.8cm; right: 1cm; }

/* Page indicator */
.page-indicator { bottom: 0.5cm; left: 1cm; }

/* QR Code position */
.qr-code { bottom: 1cm; right: 5cm; }
```

## QR Code Validasi

QR Code berisi URL validasi transaksi:
```
{BASE_URL}/validate/{TRANSACTION_CODE}
```

Contoh: `https://pos.tokoemas.com/validate/TRX-20240113-001`

Ketika di-scan, akan menampilkan halaman detail transaksi untuk verifikasi keaslian nota.
