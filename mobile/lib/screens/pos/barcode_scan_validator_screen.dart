import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/theme.dart';
import '../../models/models.dart';
import '../../services/services.dart';
import '../../utils/helpers.dart';
import '../stocks/stock_detail_screen.dart';
import '../transactions/transaction_detail_screen.dart';

enum ScanMode { all, product, transaction }

/// Universal Barcode Scanner
/// - Set [returnCodeOnly] = true untuk return barcode string (untuk POS)
/// - Set [returnCodeOnly] = false untuk validasi dan tampilkan info (cari produk DAN transaksi)
class UniversalBarcodeScanner extends StatefulWidget {
  final bool returnCodeOnly;
  final String? title;

  const UniversalBarcodeScanner({
    super.key,
    this.returnCodeOnly = false,
    this.title,
  });

  @override
  State<UniversalBarcodeScanner> createState() => _UniversalBarcodeScannerState();
}

// Alias for backward compatibility
typedef BarcodeScanValidatorScreen = UniversalBarcodeScanner;

class _UniversalBarcodeScannerState extends State<UniversalBarcodeScanner> {
  late MobileScannerController _cameraController;
  final TextEditingController _manualController = TextEditingController();
  bool _isProcessing = false;
  bool _flashEnabled = false;
  String? _lastScannedCode;

  // Result
  Stock? _foundStock;
  Transaction? _foundTransaction;
  String? _errorMessage;
  bool _showResult = false;

  @override
  void initState() {
    super.initState();
    _cameraController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _manualController.dispose();
    _cameraController.dispose();
    super.dispose();
  }

  void _clearResult() {
    setState(() {
      _foundStock = null;
      _foundTransaction = null;
      _errorMessage = null;
      _showResult = false;
      _lastScannedCode = null;
    });
  }

  Future<void> _processBarcode(String code) async {
    if (_isProcessing || _lastScannedCode == code) return;

    // If returnCodeOnly mode, just return the code immediately
    if (widget.returnCodeOnly) {
      Navigator.pop(context, code);
      return;
    }

    setState(() {
      _isProcessing = true;
      _lastScannedCode = code;
      _foundStock = null;
      _foundTransaction = null;
      _errorMessage = null;
      _showResult = false;
    });

    try {
      // Try to find stock first
      final stockFound = await _searchStock(code);
      
      // If not found as stock, try transaction
      if (!stockFound) {
        final txFound = await _searchTransaction(code);
        
        if (!txFound) {
          setState(() {
            _errorMessage = 'Barcode "$code" tidak ditemukan sebagai produk maupun transaksi';
            _showResult = true;
          });
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _showResult = true;
      });
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  Future<bool> _searchStock(String code) async {
    try {
      final stockService = StockService();
      
      // Try to get by serial number first
      try {
        final stock = await stockService.getStockBySerialNumber(code);
        setState(() {
          _foundStock = stock;
          _showResult = true;
        });
        return true;
      } catch (_) {
        // Not found by serial, try search
      }
      
      // Search stocks
      final stocks = await stockService.getStocks(search: code, page: 1, limit: 10);
      
      // Find exact or partial match
      final match = stocks.firstWhere(
        (s) => s.product?.barcode == code || s.serialNumber == code,
        orElse: () => stocks.firstWhere(
          (s) => (s.product?.barcode.contains(code) ?? false) || s.serialNumber.contains(code),
          orElse: () => Stock(id: 0, serialNumber: '', productId: 0, buyPrice: 0, sellPrice: 0, status: '', locationId: 0, storageBoxId: 0),
        ),
      );

      if (match.id != 0) {
        setState(() {
          _foundStock = match;
          _showResult = true;
        });
        return true;
      }
    } catch (e) {
      debugPrint('Stock search error: $e');
    }
    return false;
  }

  Future<bool> _searchTransaction(String code) async {
    try {
      final transactionService = TransactionService();
      
      // Try to get by transaction code directly
      try {
        final tx = await transactionService.getTransactionByCode(code);
        setState(() {
          _foundTransaction = tx;
          _showResult = true;
        });
        return true;
      } catch (_) {
        // Not found
      }
    } catch (e) {
      debugPrint('Transaction search error: $e');
    }
    return false;
  }

  void _toggleFlash() {
    setState(() {
      _flashEnabled = !_flashEnabled;
      _cameraController.toggleTorch();
    });
  }

  // ignore: unused_element - kept for manual input feature
  void _onManualSubmit() {
    final code = _manualController.text.trim();
    if (code.isNotEmpty) {
      _lastScannedCode = null; // Reset to allow same code
      _processBarcode(code);
      _manualController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black.withAlpha(128),
        elevation: 0,
        title: Text(widget.title ?? (widget.returnCodeOnly ? 'Scan Barcode' : 'Scan Universal')),
        actions: [
          IconButton(
            icon: Icon(_flashEnabled ? Icons.flash_on : Icons.flash_off),
            onPressed: _toggleFlash,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera preview
          MobileScanner(
            controller: _cameraController,
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  _processBarcode(barcode.rawValue!);
                  break;
                }
              }
            },
          ),

          // Scan overlay
          _buildScanOverlay(),

          // Manual input
          Positioned(
            left: 16,
            right: 16,
            bottom: MediaQuery.of(context).padding.bottom + 16,
            child: _buildManualInput(context),
          ),

          // Result panel
          if (_showResult)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: _buildResultPanel(),
            ),

          // Loading indicator
          if (_isProcessing)
            Container(
              color: Colors.black.withAlpha(128),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScanOverlay() {
    return Center(
      child: Container(
        width: 280,
        height: 280,
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.primaryColor, width: 3),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          children: [
            // Corner indicators
            Positioned(
              top: -3,
              left: -3,
              child: _buildCorner(Alignment.topLeft),
            ),
            Positioned(
              top: -3,
              right: -3,
              child: _buildCorner(Alignment.topRight),
            ),
            Positioned(
              bottom: -3,
              left: -3,
              child: _buildCorner(Alignment.bottomLeft),
            ),
            Positioned(
              bottom: -3,
              right: -3,
              child: _buildCorner(Alignment.bottomRight),
            ),
            // Center text
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Scan Barcode / Invoice',
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCorner(Alignment alignment) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        border: Border(
          top: alignment == Alignment.topLeft || alignment == Alignment.topRight
              ? const BorderSide(color: AppTheme.primaryColor, width: 5)
              : BorderSide.none,
          bottom:
              alignment == Alignment.bottomLeft ||
                  alignment == Alignment.bottomRight
              ? const BorderSide(color: AppTheme.primaryColor, width: 5)
              : BorderSide.none,
          left:
              alignment == Alignment.topLeft ||
                  alignment == Alignment.bottomLeft
              ? const BorderSide(color: AppTheme.primaryColor, width: 5)
              : BorderSide.none,
          right:
              alignment == Alignment.topRight ||
                  alignment == Alignment.bottomRight
              ? const BorderSide(color: AppTheme.primaryColor, width: 5)
              : BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildManualInput(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final controller = TextEditingController();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : AppTheme.backgroundColor ,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.elevatedShadow,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'Masukkan kode manual...',
                prefixIcon: const Icon(Icons.keyboard),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                isDense: true,
              ),
              onSubmitted: (value) {
                if (value.isNotEmpty) {
                  _processBarcode(value.trim());
                  controller.clear();
                }
              },
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () {
              if (controller.text.isNotEmpty) {
                _processBarcode(controller.text.trim());
                controller.clear();
              }
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: const Text('Cari'),
          ),
        ],
      ),
    );
  }

  Widget _buildResultPanel() {
    return GestureDetector(
      onVerticalDragEnd: (details) {
        if (details.primaryVelocity! > 0) {
          _clearResult();
        }
      },
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.5,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _buildResultContent(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultContent() {
    // Error
    if (_errorMessage != null) {
      return _buildErrorResult();
    }

    // Stock found
    if (_foundStock != null) {
      return _buildStockResult();
    }

    // Transaction found
    if (_foundTransaction != null) {
      return _buildTransactionResult();
    }

    return const SizedBox();
  }

  Widget _buildErrorResult() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.error_outline,
              color: Colors.red.shade400,
              size: 48,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'Tidak ditemukan',
            style: TextStyle(fontSize: 16, color: Colors.red.shade700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: _clearResult,
            icon: const Icon(Icons.refresh),
            label: const Text('Scan Ulang'),
          ),
        ],
      ),
    );
  }

  Widget _buildStockResult() {
    final stock = _foundStock!;
    final product = stock.product;
    final statusColor = stock.status == 'available'
        ? AppTheme.successColor
        : stock.status == 'sold'
        ? AppTheme.warningColor
        : AppTheme.infoColor;
    final statusLabel = stock.status == 'available'
        ? 'Tersedia'
        : stock.status == 'sold'
        ? 'Terjual'
        : 'Dipindahkan';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.diamond_rounded,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'STOK DITEMUKAN',
                    style: TextStyle(
                      color: AppTheme.successColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    product?.name ?? 'Unknown',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusLabel,
                style: TextStyle(
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildInfoChip(Icons.qr_code, 'Barcode', product?.barcode ?? '-'),
        _buildInfoChip(Icons.numbers, 'Serial', stock.serialNumber),
        _buildInfoChip(
          Icons.scale,
          'Berat',
          '${product?.weight.toStringAsFixed(2) ?? '-'} gr',
        ),
        _buildInfoChip(
          Icons.sell,
          'Harga Jual',
          Helpers.formatCurrency(stock.sellPrice),
        ),
        _buildInfoChip(
          Icons.location_on,
          'Lokasi',
          stock.location?.name ?? '-',
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _clearResult,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Lagi'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => StockDetailScreen(stock: stock),
                    ),
                  );
                },
                icon: const Icon(Icons.visibility),
                label: const Text('Detail'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTransactionResult() {
    final txn = _foundTransaction!;
    final statusColor = txn.status == 'completed'
        ? AppTheme.successColor
        : txn.status == 'pending'
        ? AppTheme.warningColor
        : Colors.red;
    final statusLabel = txn.status == 'completed'
        ? 'Selesai'
        : txn.status == 'pending'
        ? 'Pending'
        : txn.status;
    final typeLabel = txn.type == 'sale' ? 'Penjualan' : 'Setor Emas';
    final typeColor = txn.type == 'sale'
        ? AppTheme.primaryColor
        : AppTheme.successColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: txn.type == 'sale'
                    ? AppTheme.primaryGradient
                    : AppTheme.successGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                txn.type == 'sale' ? Icons.shopping_cart : Icons.savings,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        typeLabel.toUpperCase(),
                        style: TextStyle(
                          color: typeColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    txn.transactionCode,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildInfoChip(Icons.person, 'Customer', txn.customerName ?? '-'),
        _buildInfoChip(
          Icons.calendar_today,
          'Tanggal',
          Helpers.formatDate(txn.createdAt ?? DateTime.now()),
        ),
        _buildInfoChip(
          Icons.payment,
          'Pembayaran',
          txn.paymentMethod.toUpperCase(),
        ),
        _buildInfoChip(
          Icons.attach_money,
          'Total',
          Helpers.formatCurrency(txn.grandTotal),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _clearResult,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Lagi'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TransactionDetailScreen(transaction: txn),
                    ),
                  );
                },
                icon: const Icon(Icons.visibility),
                label: const Text('Detail'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoChip(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.textSecondary),
          const SizedBox(width: 8),
          Text(
            '$label:',
            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
