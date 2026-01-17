import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setPageTitle } from '@/lib/page-title';

// Import report components
import TransactionReport from './transaction-report';
import CashierReport from './cashier-report';
import LocationReport from './location-report';
import StockLocationReport from './stock-location-report';
import StockCategoryReport from './stock-category-report';
import StockTransferReport from './stock-transfer-report';
import SoldStockReport from './sold-stock-report';
import RawMaterialReportPage from './raw-material-report';
import FinancialSummaryReport from './financial-summary-report';
import LocationRevenueReport from './location-revenue-report';
import PaymentMethodReport from './payment-method-report';
import MemberTransactionReport from './member-transaction-report';
import MemberPointsReport from './member-points-report';
import TopMembersReport from './top-members-report';
import PriceHistoryReport from './price-history-report';
import CurrentPriceReport from './current-price-report';

export default function ReportsPage() {
  useEffect(() => {
    setPageTitle('Laporan');
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      {/* Report Tabs */}
      <Card>
        <CardHeader className="border-b bg-muted/50 py-3 px-4">
          <CardTitle className="text-base font-semibold">Laporan</CardTitle>
          <CardDescription className="text-xs">
            Pilih kategori laporan untuk melihat detail dan ekspor data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="transactions" className="w-full">
            <div className="border-b px-4 overflow-x-auto">
              <TabsList className="h-auto p-0 bg-transparent flex-wrap">
                <TabsTrigger value="transactions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs py-3">
                  Transaksi
                </TabsTrigger>
                <TabsTrigger value="inventory" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs py-3">
                  Inventori
                </TabsTrigger>
                <TabsTrigger value="financial" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs py-3">
                  Keuangan
                </TabsTrigger>
                <TabsTrigger value="members" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs py-3">
                  Member
                </TabsTrigger>
                <TabsTrigger value="prices" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs py-3">
                  Harga Emas
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Transaction Reports */}
            <TabsContent value="transactions" className="p-4 space-y-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all" className="text-xs">Semua Transaksi</TabsTrigger>
                  <TabsTrigger value="cashier" className="text-xs">Per Kasir</TabsTrigger>
                  <TabsTrigger value="location" className="text-xs">Per Lokasi</TabsTrigger>
                </TabsList>
                <TabsContent value="all"><TransactionReport /></TabsContent>
                <TabsContent value="cashier"><CashierReport /></TabsContent>
                <TabsContent value="location"><LocationReport /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Inventory Reports */}
            <TabsContent value="inventory" className="p-4 space-y-4">
              <Tabs defaultValue="by-location" className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto">
                  <TabsTrigger value="by-location" className="text-xs">Per Lokasi</TabsTrigger>
                  <TabsTrigger value="by-category" className="text-xs">Per Kategori</TabsTrigger>
                  <TabsTrigger value="transfers" className="text-xs">Transfer Stok</TabsTrigger>
                  <TabsTrigger value="sold" className="text-xs">Stok Terjual</TabsTrigger>
                  <TabsTrigger value="raw-materials" className="text-xs">Bahan Baku</TabsTrigger>
                </TabsList>
                <TabsContent value="by-location"><StockLocationReport /></TabsContent>
                <TabsContent value="by-category"><StockCategoryReport /></TabsContent>
                <TabsContent value="transfers"><StockTransferReport /></TabsContent>
                <TabsContent value="sold"><SoldStockReport /></TabsContent>
                <TabsContent value="raw-materials"><RawMaterialReportPage /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Financial Reports */}
            <TabsContent value="financial" className="p-4 space-y-4">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary" className="text-xs">Ringkasan</TabsTrigger>
                  <TabsTrigger value="revenue" className="text-xs">Omzet per Lokasi</TabsTrigger>
                  <TabsTrigger value="payment" className="text-xs">Metode Pembayaran</TabsTrigger>
                </TabsList>
                <TabsContent value="summary"><FinancialSummaryReport /></TabsContent>
                <TabsContent value="revenue"><LocationRevenueReport /></TabsContent>
                <TabsContent value="payment"><PaymentMethodReport /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Member Reports */}
            <TabsContent value="members" className="p-4 space-y-4">
              <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="transactions" className="text-xs">Transaksi Member</TabsTrigger>
                  <TabsTrigger value="points" className="text-xs">Poin Member</TabsTrigger>
                  <TabsTrigger value="top" className="text-xs">Top Member</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions"><MemberTransactionReport /></TabsContent>
                <TabsContent value="points"><MemberPointsReport /></TabsContent>
                <TabsContent value="top"><TopMembersReport /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Price Reports */}
            <TabsContent value="prices" className="p-4 space-y-4">
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="current" className="text-xs">Harga Saat Ini</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">Riwayat Perubahan</TabsTrigger>
                </TabsList>
                <TabsContent value="current"><CurrentPriceReport /></TabsContent>
                <TabsContent value="history"><PriceHistoryReport /></TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
