import 'package:flutter/material.dart';
import '../../config/theme.dart';
import 'pos_screen.dart';
import '../setor-emas/setor_emas_screen.dart';
import 'barcode_scan_validator_screen.dart';

class POSTabScreen extends StatefulWidget {
  const POSTabScreen({super.key});

  @override
  State<POSTabScreen> createState() => _POSTabScreenState();
}

class _POSTabScreenState extends State<POSTabScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isPOS = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _isPOS = _tabController.index == 0;
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _openValidatorScanner() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BarcodeScanValidatorScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isPOS ? 'Point of Sale' : 'Setor Emas'),
        actions: [
          // Scan Validator Button
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: 'Scan & Validasi',
            onPressed: _openValidatorScanner,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              dividerColor: Colors.transparent,
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: AppTheme.primaryColor,
              unselectedLabelColor: Colors.white.withOpacity(0.7),
              labelStyle: const TextStyle(fontWeight: FontWeight.bold),
              tabs: const [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.point_of_sale_rounded, size: 20),
                      SizedBox(width: 8),
                      Text('POS'),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.savings_rounded, size: 20),
                      SizedBox(width: 8),
                      Text('Setor Emas'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: _isPOS
                ? AppTheme.primaryGradient
                : AppTheme.successGradient,
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        physics: const NeverScrollableScrollPhysics(),
        children: const [POSScreenBody(), SetorEmasScreenBody()],
      ),
    );
  }
}
