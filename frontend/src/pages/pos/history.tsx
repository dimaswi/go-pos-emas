import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { printReceipt, type ReceiptData } from "@/lib/print-receipt";
import { PrintNotaOverlay, transactionToNotaData, type NotaData } from "@/components/print-nota-overlay";
import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  Scale,
  Loader2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  User,
  MapPin,
  Banknote,
  Wallet,
  CreditCard,
  Package,
  Printer,
  ChevronLeft,
  Receipt,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { transactionsApi, type Transaction } from "@/lib/api";
import { cn } from "@/lib/utils";
import { setPageTitle } from "@/lib/page-title";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const PAYMENT_METHODS: Record<string, { label: string; icon: typeof Banknote; color: string }> = {
  cash: { label: "Tunai", icon: Banknote, color: "text-green-600" },
  transfer: { label: "Transfer", icon: Wallet, color: "text-blue-600" },
  card: { label: "Kartu", icon: CreditCard, color: "text-purple-600" },
  mixed: { label: "Campuran", icon: Wallet, color: "text-orange-600" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bgColor: string }> = {
  completed: { label: "Selesai", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  pending: { label: "Pending", icon: AlertCircle, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  cancelled: { label: "Dibatalkan", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

export default function POSHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();

  const returnUrl = searchParams.get("return") || "/pos";
  const defaultType = searchParams.get("type") as "sale" | "purchase" | null;

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sale" | "purchase">(defaultType || "all");
  const [isPrinting, setIsPrinting] = useState(false);
  const [showNotaOverlay, setShowNotaOverlay] = useState(false);
  const [notaData, setNotaData] = useState<NotaData | null>(null);

  useEffect(() => {
    setPageTitle("Riwayat Transaksi");
    fetchTransactions();
  }, []);

  // Load specific transaction if ID is provided in URL
  useEffect(() => {
    if (id && transactions.length > 0) {
      const found = transactions.find((t) => t.id.toString() === id);
      if (found) {
        setSelectedTransaction(found);
        setShowDetail(true);
      } else {
        loadTransactionById(parseInt(id));
      }
    }
  }, [id, transactions]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.getAll({ page_size: 100 });
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Gagal memuat data transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionById = async (transactionId: number) => {
    try {
      const res = await transactionsApi.getById(transactionId);
      if (res.data.data) {
        setSelectedTransaction(res.data.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error("Failed to load transaction:", error);
      toast.error("Transaksi tidak ditemukan");
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          t.transaction_code?.toLowerCase().includes(query) ||
          t.customer_name?.toLowerCase().includes(query) ||
          t.member?.name?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [transactions, filterType, searchQuery]);

  // Summary calculations
  const totalSales = useMemo(() =>
    transactions
      .filter((t) => t.type === "sale" && t.status === "completed")
      .reduce((sum, t) => sum + (t.grand_total || 0), 0),
    [transactions]
  );

  const totalPurchases = useMemo(() =>
    transactions
      .filter((t) => t.type === "purchase" && t.status === "completed")
      .reduce((sum, t) => sum + (t.grand_total || 0), 0),
    [transactions]
  );

  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetail(true);
    window.history.pushState({}, "", `/pos/history/${transaction.id}${window.location.search}`);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedTransaction(null);
    window.history.pushState({}, "", `/pos/history${window.location.search}`);
  };

  const handlePrint = async () => {
    if (!selectedTransaction) return;
    setIsPrinting(true);

    try {
      const isDeposit = selectedTransaction.type === 'deposit' || selectedTransaction.type === 'gold_deposit';

      // Calculate totals for deposit transactions
      let totalWeightGross = 0;
      let totalWeightNet = 0;

      if (isDeposit && selectedTransaction.items) {
        selectedTransaction.items.forEach(item => {
          totalWeightGross += item.weight || 0;
          totalWeightNet += item.weight || 0;
        });
      }

      const receiptData: ReceiptData = {
        type: isDeposit ? 'deposit' : 'sale',
        storeName: selectedTransaction.location?.name || 'TOKO EMAS',
        storeAddress: selectedTransaction.location?.address || 'Alamat Toko',
        storePhone: '',
        transactionCode: selectedTransaction.transaction_code,
        date: new Date(selectedTransaction.transaction_date || selectedTransaction.created_at),
        locationName: selectedTransaction.location?.name,
        cashierName: selectedTransaction.cashier?.full_name,
        customerName: selectedTransaction.member?.name || selectedTransaction.customer_name || undefined,
        memberCode: selectedTransaction.member?.code || selectedTransaction.member?.member_code || undefined,
        items: (selectedTransaction.items || []).map(item => ({
          name: item.item_name || item.product?.name || item.stock?.product?.name || 'Item',
          weight: item.weight,
          price: item.sub_total || item.unit_price || 0,
          barcode: item.barcode,
          gold_category: item.gold_category?.name,
        })),
        subtotal: selectedTransaction.sub_total || 0,
        discount: selectedTransaction.discount > 0 ? selectedTransaction.discount : undefined,
        tax: selectedTransaction.tax > 0 ? selectedTransaction.tax : undefined,
        grandTotal: selectedTransaction.grand_total || 0,
        paidAmount: selectedTransaction.paid_amount,
        changeAmount: selectedTransaction.change_amount,
        paymentMethod: selectedTransaction.payment_method,
        notes: selectedTransaction.notes,
        totalWeightGross: isDeposit ? totalWeightGross : undefined,
        totalWeightNet: isDeposit ? totalWeightNet : undefined,
      };

      printReceipt(receiptData);
      toast.success("Struk berhasil dicetak");
    } catch (error) {
      toast.error("Gagal mencetak struk");
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle print nota (pre-printed form overlay)
  const handlePrintNota = () => {
    if (!selectedTransaction) return;

    const notaDataToShow: NotaData = {
      transactionCode: selectedTransaction.transaction_code,
      date: new Date(selectedTransaction.transaction_date || selectedTransaction.created_at),
      customerName: selectedTransaction.member?.name || selectedTransaction.customer_name,
      customerAddress: (selectedTransaction.member as any)?.address,
      items: (selectedTransaction.items || []).map(item => ({
        qty: item.quantity || 1,
        name: item.item_name || item.product?.name || item.stock?.product?.name || 'Item',
        karat: item.gold_category?.name || item.stock?.product?.gold_category?.name || '-',
        weight: item.weight || 0,
        price: item.sub_total || item.unit_price || 0,
      })),
      validationUrl: `${window.location.origin}/validate/${selectedTransaction.transaction_code}`,
    };

    // Tutup modal detail dulu agar tidak menutupi
    setShowDetail(false);
    setNotaData(notaDataToShow);
    setShowNotaOverlay(true);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    return (
      <Badge className={cn(config.bgColor, config.color, "gap-1")}>
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="h-12 border-b bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate(returnUrl)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold">Riwayat Transaksi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => navigate("/pos")}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            POS
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => navigate("/setor-emas")}>
            <Scale className="h-3.5 w-3.5 mr-1.5" />
            Setor Emas
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => navigate("/dashboard")}>
            <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
            Dashboard
          </Button>
        </div>
      </header>

      {/* Summary Bar */}
      <div className="h-12 border-b bg-background/80 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total:</span>
            <Badge variant="secondary">{transactions.length} transaksi</Badge>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">Penjualan:</span>
            <span className="font-semibold text-green-600">{formatCurrency(totalSales)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-blue-600" />
            <span className="text-muted-foreground">Setor Emas:</span>
            <span className="font-semibold text-blue-600">{formatCurrency(totalPurchases)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Profit:</span>
            <span className={cn("font-semibold", totalSales - totalPurchases >= 0 ? "text-amber-600" : "text-red-600")}>
              {totalSales - totalPurchases >= 0 ? "+" : ""}{formatCurrency(totalSales - totalPurchases)}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode transaksi, nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="sale" className="gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Penjualan
              </TabsTrigger>
              <TabsTrigger value="purchase" className="gap-1">
                <ArrowDownRight className="h-3 w-3" />
                Setor Emas
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={fetchTransactions}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Transaction Grid */}
        <ScrollArea className="flex-1">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada transaksi</p>
              <p className="text-sm">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTransactions.map((transaction) => {
                const isSale = transaction.type === "sale";
                const PaymentIcon = PAYMENT_METHODS[transaction.payment_method]?.icon || Banknote;

                return (
                  <Card
                    key={transaction.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                      selectedTransaction?.id === transaction.id && "ring-2 ring-primary"
                    )}
                    onClick={() => handleViewDetail(transaction)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSale ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                          )}>
                            {isSale ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-mono font-bold">{transaction.transaction_code}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.transaction_date || transaction.created_at).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">
                            {transaction.customer_name || transaction.member?.name || "Umum"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">{transaction.location?.name || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <PaymentIcon className={cn("h-3.5 w-3.5", PAYMENT_METHODS[transaction.payment_method]?.color)} />
                          <span>{PAYMENT_METHODS[transaction.payment_method]?.label || transaction.payment_method}</span>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className={cn(
                          "text-lg font-bold",
                          isSale ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                        )}>
                          {isSale ? "+" : "-"}{formatCurrency(transaction.grand_total || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          {selectedTransaction && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-full",
                      selectedTransaction.type === "sale"
                        ? "bg-green-100 dark:bg-green-900/50"
                        : "bg-blue-100 dark:bg-blue-900/50"
                    )}>
                      {selectedTransaction.type === "sale" ? (
                        <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {selectedTransaction.transaction_code}
                        {getStatusBadge(selectedTransaction.status)}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedTransaction.type === "sale" ? "Transaksi Penjualan" : "Transaksi Setor Emas"}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 px-6">
                <div id="receipt-content" className="py-4 space-y-4">
                  {/* Transaction Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tanggal</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedTransaction.transaction_date || selectedTransaction.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lokasi</p>
                        <p className="text-sm font-medium">{selectedTransaction.location?.name || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {selectedTransaction.type === "sale" ? "Pelanggan" : "Penyetor"}
                        </p>
                        <p className="text-sm font-medium">
                          {selectedTransaction.member ? (
                            <span className="flex items-center gap-1">
                              {selectedTransaction.member.name}
                              <Badge variant="outline" className="text-[10px] ml-1">
                                {selectedTransaction.member.code || selectedTransaction.member.member_code}
                              </Badge>
                            </span>
                          ) : (
                            selectedTransaction.customer_name || "Umum"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      {(() => {
                        const PaymentIcon = PAYMENT_METHODS[selectedTransaction.payment_method]?.icon || Banknote;
                        return <PaymentIcon className={cn("h-4 w-4", PAYMENT_METHODS[selectedTransaction.payment_method]?.color)} />;
                      })()}
                      <div>
                        <p className="text-xs text-muted-foreground">Pembayaran</p>
                        <p className="text-sm font-medium">
                          {PAYMENT_METHODS[selectedTransaction.payment_method]?.label || selectedTransaction.payment_method}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className={cn(
                        "px-4 py-2 flex items-center gap-2",
                        selectedTransaction.type === "sale"
                          ? "bg-green-50 dark:bg-green-950/50"
                          : "bg-blue-50 dark:bg-blue-950/50"
                      )}>
                        <Package className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {selectedTransaction.type === "sale" ? "Daftar Produk" : "Daftar Item"}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          {selectedTransaction.items.length} item
                        </Badge>
                      </div>
                      <div className="divide-y max-h-[200px] overflow-y-auto">
                        {selectedTransaction.items.map((item, idx) => (
                          <div key={item.id || idx} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                              <div>
                                <p className="text-sm font-medium">
                                  {item.item_name || item.product?.name || item.stock?.product?.name || "Item"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{item.weight?.toFixed(2) || "0.00"}g</span>
                                  {item.barcode && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">{item.barcode}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className={cn(
                              "text-sm font-semibold",
                              selectedTransaction.type === "sale"
                                ? "text-green-600 dark:text-green-400"
                                : "text-blue-600 dark:text-blue-400"
                            )}>
                              {formatCurrency(item.sub_total || item.unit_price || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(selectedTransaction.sub_total || 0)}</span>
                    </div>
                    {selectedTransaction.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Diskon</span>
                        <span>-{formatCurrency(selectedTransaction.discount)}</span>
                      </div>
                    )}
                    {selectedTransaction.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pajak</span>
                        <span>{formatCurrency(selectedTransaction.tax)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Grand Total</span>
                      <span className={cn(
                        selectedTransaction.type === "sale"
                          ? "text-green-600 dark:text-green-400"
                          : "text-blue-600 dark:text-blue-400"
                      )}>
                        {formatCurrency(selectedTransaction.grand_total || 0)}
                      </span>
                    </div>
                    {selectedTransaction.type === "sale" && selectedTransaction.payment_method === "cash" && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dibayar</span>
                          <span>{formatCurrency(selectedTransaction.paid_amount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-muted-foreground">Kembalian</span>
                          <span className="text-green-600">
                            {formatCurrency(selectedTransaction.change_amount || 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedTransaction.notes && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                      <p className="text-sm">{selectedTransaction.notes}</p>
                    </div>
                  )}

                  {/* Cashier Info */}
                  {selectedTransaction.cashier && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">Kasir:</p>
                      <p className="text-sm font-medium">{selectedTransaction.cashier.full_name}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="px-6 py-4 border-t bg-muted/30 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleCloseDetail}>
                    <X className="h-4 w-4 mr-2" />
                    Tutup
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handlePrint}
                    disabled={isPrinting}
                  >
                    {isPrinting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Cetak Ulang Struk
                  </Button>
                </div>
                {/* Cetak Nota button - only for sale transactions */}
                {selectedTransaction.type === "sale" && (
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                    onClick={handlePrintNota}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Cetak Nota (Pre-printed)
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Nota Overlay for Pre-printed Form */}
      {showNotaOverlay && notaData && (
        <PrintNotaOverlay
          data={notaData}
          onClose={() => {
            setShowNotaOverlay(false);
            setNotaData(null);
          }}
        />
      )}
    </div>
  );
}
