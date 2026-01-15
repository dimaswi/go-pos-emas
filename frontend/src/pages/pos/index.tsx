import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TransactionConfirmationModal } from "@/components/transaction-confirmation-modal";
import { PrintNotaOverlay, type NotaData } from "@/components/print-nota-overlay";
import { printReceipt, type ReceiptData } from "@/lib/print-receipt";
import {
  LayoutDashboard,
  Trash2,
  ShoppingCart,
  Banknote,
  CreditCard,
  Wallet,
  Barcode,
  Search,
  Scale,
  Loader2,
  Clock,
  User,
  X,
  Store,
  Package,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  stocksApi,
  locationsApi,
  transactionsApi,
  type Stock,
  type Member,
  type Location,
} from "@/lib/api";
import { generateUUID } from "@/lib/utils";

interface CartItem {
  id: string;
  stock_id: number;
  product_name: string;
  barcode: string;
  serial_number: string;
  weight: number;
  price: number;
}

type PaymentMethod = "cash" | "transfer" | "card";

export default function POSPage() {
  const navigate = useNavigate();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchBarcode, setSearchBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNotaOverlay, setShowNotaOverlay] = useState(false);
  const [notaData, setNotaData] = useState<NotaData | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Load stocks when location changes
  useEffect(() => {
    if (selectedLocationId) {
      fetchStocksByLocation(parseInt(selectedLocationId));
    }
  }, [selectedLocationId]);

  // Check for selected member from sessionStorage
  useEffect(() => {
    const storedMember = sessionStorage.getItem("selectedMember");
    if (storedMember) {
      try {
        setSelectedMember(JSON.parse(storedMember));
      } catch {
        // ignore
      }
      sessionStorage.removeItem("selectedMember");
    }
  }, []);

  // Restore cart state from sessionStorage (after locations are loaded)
  useEffect(() => {
    if (locations.length === 0) return; // Wait for locations to load

    const storedCart = sessionStorage.getItem("pos_cart");
    if (storedCart) {
      try {
        const savedState = JSON.parse(storedCart);
        if (savedState.cart) setCart(savedState.cart);
        // locationId is restored in fetchLocations, no need to set here
        if (savedState.paymentMethod) setPaymentMethod(savedState.paymentMethod);
        if (savedState.discount) setDiscount(savedState.discount);
        if (savedState.notes) setNotes(savedState.notes);
        if (savedState.paidAmount) setPaidAmount(savedState.paidAmount);
      } catch {
        // ignore
      }
      sessionStorage.removeItem("pos_cart");
    }
  }, [locations]); // Run after locations are loaded

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cart]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      // Read sessionStorage BEFORE any async operation
      const storedCart = sessionStorage.getItem("pos_cart");
      const savedLocationId = storedCart ? JSON.parse(storedCart).locationId : null;

      const locationsRes = await locationsApi.getAll({ type: "toko", page_size: 1000 });
      const locs = locationsRes.data.data || [];
      setLocations(locs);

      // Set location based on saved value or default
      if (savedLocationId) {
        // Use saved location from sessionStorage
        setSelectedLocationId(savedLocationId);
      } else if (locs.length > 0) {
        // Only set default if no saved location
        setSelectedLocationId(locs[0].id.toString());
      }
    } catch {
      toast.error("Gagal memuat data lokasi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStocksByLocation = async (locationId: number) => {
    try {
      const stocksRes = await stocksApi.getAll({ 
        status: "available", 
        location_id: locationId,
        page_size: 1000 
      });
      setStocks(stocksRes.data.data || []);
    } catch {
      toast.error("Gagal memuat data stok");
      setStocks([]);
    }
  };

  // Filter stocks that are not in cart and match search
  const availableStocks = useMemo(() => {
    return stocks.filter(stock => {
      const inCart = cart.some(item => item.stock_id === stock.id);
      if (inCart) return false;
      
      if (searchProduct.trim()) {
        const search = searchProduct.toLowerCase();
        return (
          stock.product?.name.toLowerCase().includes(search) ||
          stock.product?.barcode.toLowerCase().includes(search) ||
          stock.serial_number?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [stocks, cart, searchProduct]);

  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc.id.toString(),
      label: loc.name,
      icon: <Store className="h-4 w-4" />,
    }));
  }, [locations]);

  const handleSearchBarcode = () => {
    if (!searchBarcode.trim()) return;
    
    // Find available stock that's not already in cart
    const stock = stocks.find(
      (s) =>
        !cart.some(item => item.stock_id === s.id) && // Not already in cart
        (s.product?.barcode.toLowerCase() === searchBarcode.toLowerCase() ||
        s.serial_number?.toLowerCase() === searchBarcode.toLowerCase())
    );
    
    if (stock && stock.product) {
      addToCart(stock);
      setSearchBarcode("");
    } else {
      // Check if item exists but already in cart
      const existingStock = stocks.find(
        (s) =>
          s.product?.barcode.toLowerCase() === searchBarcode.toLowerCase() ||
          s.serial_number?.toLowerCase() === searchBarcode.toLowerCase()
      );
      
      if (existingStock && cart.some(item => item.stock_id === existingStock.id)) {
        toast.error("Item sudah ada di keranjang");
      } else {
        toast.error("Produk tidak ditemukan di toko ini");
      }
    }
    barcodeInputRef.current?.focus();
  };

  const addToCart = (stock: Stock) => {
    // Check if this specific stock item is already in cart
    const existingItem = cart.find((item) => item.stock_id === stock.id);
    
    if (existingItem) {
      toast.error("Item ini sudah ada di keranjang");
      return;
    }
    
    const price = stock.product?.gold_category
      ? stock.product.gold_category.sell_price * stock.product.weight
      : stock.sell_price || 0;

    setCart([
      ...cart,
      {
        id: generateUUID(),
        stock_id: stock.id,
        product_name: stock.product?.name || "Unknown",
        barcode: stock.product?.barcode || "",
        serial_number: stock.serial_number || "",
        weight: stock.product?.weight || 0,
        price,
      },
    ]);
  };

  const removeItem = (itemId: string) => setCart(cart.filter((item) => item.id !== itemId));

  const clearAll = () => {
    setCart([]);
    setSelectedMember(null);
    setPaidAmount("");
    setNotes("");
    setDiscount("");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const paidAmountNum = parseFloat(paidAmount) || 0;
  const changeAmount = paymentMethod === "cash" ? Math.max(0, paidAmountNum - grandTotal) : 0;

  const handlePaymentClick = () => {
    if (cart.length === 0) return toast.error("Keranjang kosong");
    if (!selectedLocationId) return toast.error("Pilih lokasi");
    if (paymentMethod === "cash" && paidAmountNum < grandTotal) return toast.error("Jumlah bayar kurang");
    setShowConfirmModal(true);
  };

  const submitTransaction = async (withPrint: boolean = false, withNotaPrint: boolean = false) => {
    setIsSubmitting(true);
    try {
      const response = await transactionsApi.createSale({
        location_id: parseInt(selectedLocationId),
        member_id: selectedMember?.id || undefined,
        payment_method: paymentMethod,
        paid_amount: paymentMethod === "cash" ? paidAmountNum : grandTotal,
        notes,
        discount: discountAmount,
        items: cart.map((item) => ({ stock_id: item.stock_id })),
      });

      if (response.data.data) {
        toast.success(`Transaksi berhasil! No: ${response.data.data.transaction_code}`);

        if (withNotaPrint) {
          // Prepare nota data for pre-printed form overlay
          const notaDataToShow: NotaData = {
            transactionCode: response.data.data.transaction_code,
            date: new Date(),
            customerName: selectedMember?.name,
            customerAddress: (selectedMember as any)?.address,
            items: cart.map(item => {
              // Find the stock to get gold category info
              const stock = stocks.find(s => s.id === item.stock_id);
              return {
                qty: 1,
                name: item.product_name,
                karat: stock?.product?.gold_category?.name || '-',
                weight: item.weight,
                price: item.price,
              };
            }),
            validationUrl: `${window.location.origin}/validate/${response.data.data.transaction_code}`,
          };
          setNotaData(notaDataToShow);
          setShowNotaOverlay(true);
        } else if (withPrint) {
          // Print receipt with 80mm layout
          const receiptData: ReceiptData = {
            type: 'sale',
            storeName: selectedLocationName || 'TOKO EMAS',
            storeAddress: 'Alamat Toko',
            storePhone: '',
            transactionCode: response.data.data.transaction_code,
            date: new Date(),
            locationName: selectedLocationName,
            cashierName: undefined,
            customerName: selectedMember?.name || undefined,
            memberCode: selectedMember?.code || selectedMember?.member_code || undefined,
            items: cart.map(item => ({
              name: item.product_name,
              weight: item.weight,
              price: item.price,
              barcode: item.serial_number,
            })),
            subtotal: subtotal,
            discount: discountAmount > 0 ? discountAmount : undefined,
            grandTotal: grandTotal,
            paidAmount: paidAmountNum,
            changeAmount: changeAmount,
            paymentMethod: paymentMethod,
          };
          printReceipt(receiptData);
        }

        setShowConfirmModal(false);
        clearAll();
        // Reload stocks for current location
        if (selectedLocationId) {
          fetchStocksByLocation(parseInt(selectedLocationId));
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Gagal menyimpan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLocationName = useMemo(() => {
    return locations.find(l => l.id.toString() === selectedLocationId)?.name || "";
  }, [locations, selectedLocationId]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="h-auto min-h-12 border-b bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-4 py-2 sm:py-0 gap-2 sm:gap-0 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded bg-primary flex items-center justify-center">
              <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm sm:text-base">Kasir POS</span>
          </div>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex gap-1 bg-muted p-0.5 rounded">
            <Button size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3">
              <ShoppingCart className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Penjualan</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3" onClick={() => navigate("/setor-emas")}>
              <Scale className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Setor</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none">
            <SearchableSelect
              options={locationOptions}
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              placeholder="Pilih Toko"
              searchPlaceholder="Cari toko..."
              emptyMessage="Toko tidak ditemukan"
              triggerClassName="w-full sm:w-[200px] lg:w-[300px] h-7 sm:h-8 text-xs sm:text-sm"
              size="sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3" onClick={() => navigate("/pos/history?return=/pos&type=sale")}>
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline ml-1.5">Riwayat</span>
          </Button>
          <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3" onClick={() => navigate("/dashboard")}>
            <LayoutDashboard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline ml-1.5">Dashboard</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-auto lg:overflow-hidden">
        {/* Left - Products & Cart */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 gap-2 sm:gap-3 min-w-0">
          {/* Barcode Search */}
          <div className="bg-background rounded-lg border p-2 sm:p-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Barcode className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode/SN..."
                  value={searchBarcode}
                  onChange={(e) => setSearchBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchBarcode()}
                  className="pl-7 sm:pl-9 h-8 sm:h-10 text-sm"
                  autoFocus
                />
              </div>
              <Button onClick={handleSearchBarcode} className="h-8 sm:h-10 px-3 sm:px-4">
                <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1.5">Cari</span>
              </Button>
            </div>
          </div>

          {/* Products List & Cart Container */}
          <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 min-h-0">
            {/* Products List */}
            <div className="flex-1 bg-background rounded-lg border flex flex-col min-h-[200px] lg:min-h-0">
              <div className="h-9 sm:h-10 px-2 sm:px-3 border-b flex items-center justify-between shrink-0">
                <span className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  Stok ({availableStocks.length})
                </span>
                <div className="relative w-32 sm:w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="h-6 sm:h-7 text-[10px] sm:text-xs pl-6 sm:pl-7"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 max-h-[250px] lg:max-h-none">
                {availableStocks.length === 0 ? (
                  <div className="p-4 sm:p-8 text-center text-muted-foreground">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs sm:text-sm">
                      {stocks.length === 0 ? "Tidak ada stok di toko ini" : "Semua stok sudah di keranjang"}
                    </p>
                  </div>
                ) : (
                  <div className="p-1.5 sm:p-2 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2">
                    {availableStocks.map((stock) => {
                      const price = stock.product?.gold_category
                        ? stock.product.gold_category.sell_price * stock.product.weight
                        : stock.sell_price || 0;
                      return (
                        <button
                          key={stock.id}
                          onClick={() => addToCart(stock)}
                          className="p-2 sm:p-3 rounded-lg border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs sm:text-sm font-medium line-clamp-2">{stock.product?.name}</p>
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            {stock.product?.weight}g • {stock.product?.gold_category?.name}
                          </p>
                          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground truncate" title={stock.serial_number}>
                            SN: {stock.serial_number}
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-primary mt-1 sm:mt-2">
                            {formatCurrency(price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Cart */}
            <div className="w-full lg:w-72 xl:w-80 bg-background rounded-lg border flex flex-col min-h-[200px] lg:min-h-0 shrink-0">
              <div className="h-9 sm:h-10 px-2 sm:px-3 border-b flex items-center justify-between shrink-0">
                <span className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                  Keranjang ({cart.length})
                </span>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs text-destructive hover:text-destructive px-2" onClick={clearAll}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Kosongkan
                  </Button>
                )}
              </div>
              <ScrollArea className="flex-1 max-h-[200px] lg:max-h-none">
                {cart.length === 0 ? (
                  <div className="p-4 sm:p-8 text-center text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs sm:text-sm">Keranjang kosong</p>
                    <p className="text-[10px] sm:text-xs mt-1">Klik produk atau scan barcode</p>
                  </div>
                ) : (
                  <div className="p-1.5 sm:p-2 space-y-1">
                    {cart.map((item) => (
                      <div key={item.id} className="p-1.5 sm:p-2 rounded hover:bg-muted/50 group">
                        <div className="flex items-start justify-between gap-1 sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{item.product_name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {item.weight.toFixed(2)}g
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate max-w-[100px] sm:max-w-[140px]" title={item.serial_number}>
                            {item.serial_number}
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {/* Cart Total */}
              {cart.length > 0 && (
                <div className="p-2 sm:p-3 border-t bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-base sm:text-lg font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right - Payment Panel */}
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l bg-background flex flex-col shrink-0">
          {/* Member */}
          <div className="p-2 sm:p-3 border-b">
            <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 block">Pelanggan</Label>
            {selectedMember ? (
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded border bg-muted/30">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{selectedMember.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{selectedMember.code || selectedMember.member_code}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" onClick={() => setSelectedMember(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-[10px] sm:text-xs flex items-center justify-between px-1">
                  <span className="text-muted-foreground">Poin: <span className="font-medium text-yellow-600">{selectedMember.points?.toLocaleString() || 0}</span></span>
                  <span className="text-muted-foreground">+{Math.floor(grandTotal / 100000)} poin</span>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm" onClick={() => {
                // Save cart state before navigating
                sessionStorage.setItem("pos_cart", JSON.stringify({
                  cart,
                  locationId: selectedLocationId,
                  paymentMethod,
                  discount,
                  notes,
                  paidAmount
                }));
                navigate("/members/select?return=/pos");
              }}>
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Pilih Member
              </Button>
            )}
          </div>

          {/* Payment Method */}
          <div className="p-2 sm:p-3 border-b">
            <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 block">Pembayaran</Label>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {[
                { value: "cash", label: "Tunai", icon: Banknote },
                { value: "transfer", label: "Transfer", icon: Wallet },
                { value: "card", label: "Kartu", icon: CreditCard },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value as PaymentMethod)}
                  className={`flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded border text-[10px] sm:text-xs transition-colors ${paymentMethod === m.value ? "border-primary bg-primary/5 text-primary" : "hover:border-primary/50"}`}
                >
                  <m.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === "cash" && (
            <div className="p-2 sm:p-3 border-b">
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 block">Jumlah Bayar</Label>
              <Input type="number" placeholder="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="h-8 sm:h-9 text-right font-medium text-sm" />
              <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
                {quickAmounts.map((amt) => (
                  <Button key={amt} variant="outline" size="sm" className="h-5 sm:h-6 text-[10px] sm:text-xs px-1.5 sm:px-2" onClick={() => setPaidAmount(amt.toString())}>
                    {amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-5 sm:h-6 text-[10px] sm:text-xs px-1.5 sm:px-2" onClick={() => setPaidAmount(grandTotal.toString())}>Pas</Button>
              </div>
            </div>
          )}

          {/* Discount & Notes */}
          <div className="p-2 sm:p-3 border-b grid grid-cols-2 gap-1.5 sm:gap-2">
            <div>
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">Diskon</Label>
              <Input type="number" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-7 sm:h-8 text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">Catatan</Label>
              <Input placeholder="Opsional" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-7 sm:h-8 text-xs sm:text-sm" />
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 p-2 sm:p-3 flex flex-col">
            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {paymentMethod === "cash" && paidAmountNum > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dibayar</span>
                    <span>{formatCurrency(paidAmountNum)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kembalian</span>
                    <span className="text-green-600">{formatCurrency(changeAmount)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="border-t my-1.5 sm:my-2" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs sm:text-sm">Total</span>
              <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 sm:p-3 border-t space-y-1.5 sm:space-y-2">
            <Button
              className="w-full h-10 sm:h-11 bg-green-600 hover:bg-green-700 text-sm"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handlePaymentClick}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Proses Pembayaran
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <TransactionConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        type="sale"
        locationName={selectedLocationName}
        member={selectedMember}
        paymentMethod={paymentMethod}
        notes={notes}
        cartItems={cart}
        subtotal={subtotal}
        discount={discountAmount}
        grandTotal={grandTotal}
        paidAmount={paidAmountNum}
        changeAmount={changeAmount}
        isSubmitting={isSubmitting}
        onConfirm={submitTransaction}
      />

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
