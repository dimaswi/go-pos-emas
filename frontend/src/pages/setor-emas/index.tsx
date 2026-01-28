import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { TransactionConfirmationModal } from "@/components/transaction-confirmation-modal";
import { printReceipt, type ReceiptData } from "@/lib/print-receipt";
import { BarcodeScannerModal } from "@/components/barcode-scanner-modal";
import { PriceUpdateModal } from "@/components/price-update-modal";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Scale,
  Banknote,
  CreditCard,
  Wallet,
  ShoppingCart,
  Loader2,
  Clock,
  User,
  X,
  Store,
  Coins,
  Package,
  CheckCircle2,
  Camera,
  Barcode,
  Search,
  Usb,
} from "lucide-react";
import { toast } from "sonner";
import {
  goldCategoriesApi,
  locationsApi,
  userLocationsApi,
  membersApi,
  api,
  type Member,
  type GoldCategory,
  type Location,
} from "@/lib/api";
import { generateUUID } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

interface DepositItem {
  id: string;
  gold_category_id?: number;
  gold_category_name?: string;
  purity?: number;
  weight_gross: number; // Berat kotor (asli)
  shrinkage_percent: number; // Persentase susut
  weight_grams: number; // Berat bersih (setelah susut)
  original_price_per_gram: number; // Harga asli sesuai surat
  price_per_gram: number; // Harga beli kita sesuai kondisi
  condition: GoldCondition;
  subtotal: number;
  notes: string;
  item_type: "standard" | "custom";
}

type PaymentMethod = "cash" | "transfer" | "card";
type DepositMode = "standard" | "custom";
type GoldCondition = "new" | "like_new" | "scratched" | "dented" | "damaged";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function SetorEmasPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const memberSearchRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  const isAdmin = user?.role?.name === "admin";

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [goldCategories, setGoldCategories] = useState<GoldCategory[]>([]);
  const [depositItems, setDepositItems] = useState<DepositItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState<string>("");
  const [depositMode, setDepositMode] = useState<DepositMode>("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveAsRawMaterial, setSaveAsRawMaterial] = useState(true); // Hybrid: Simpan sebagai bahan baku (default: true)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [memberSearchCode, setMemberSearchCode] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const lastInputTimeRef = useRef<number>(0);

  // Form fields
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [standardWeight, setStandardWeight] = useState<string>(""); // Berat kotor
  const [standardBuyPrice, setStandardBuyPrice] = useState<string>(""); // Harga beli kita ke penjual
  const [standardNotes, setStandardNotes] = useState<string>("");
  const [customWeight, setCustomWeight] = useState<string>(""); // Berat kotor
  const [customPurity, setCustomPurity] = useState<string>("");
  const [customPricePerGram, setCustomPricePerGram] = useState<string>("");
  const [customBuyPrice, setCustomBuyPrice] = useState<string>(""); // Harga beli kita ke penjual
  const [customNotes, setCustomNotes] = useState<string>("");

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Check for selected member from member selection page
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

  // Restore cart state from sessionStorage (after locations are loaded to avoid race condition)
  useEffect(() => {
    if (locations.length === 0) return; // Wait for locations to load first

    const storedCart = sessionStorage.getItem("setor_emas_cart");
    if (storedCart) {
      try {
        const savedState = JSON.parse(storedCart);
        if (savedState.depositItems) setDepositItems(savedState.depositItems);
        // locationId is restored in fetchData, no need to set here
        if (savedState.paymentMethod)
          setPaymentMethod(savedState.paymentMethod);
        if (savedState.notes) setNotes(savedState.notes);
        if (savedState.depositMode) setDepositMode(savedState.depositMode);
        if (savedState.saveAsRawMaterial !== undefined)
          setSaveAsRawMaterial(savedState.saveAsRawMaterial);
      } catch {
        // ignore
      }
      sessionStorage.removeItem("setor_emas_cart");
    }
  }, [locations]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Read sessionStorage BEFORE any async operation
      const storedCart = sessionStorage.getItem("setor_emas_cart");
      const savedLocationId = storedCart
        ? JSON.parse(storedCart).locationId
        : null;

      // Fetch gold categories
      const catRes = await goldCategoriesApi.getAll({ page_size: 100 });
      const categories = catRes.data.data || [];
      setGoldCategories(categories.filter((c: GoldCategory) => c.is_active));

      // Fetch locations based on user role
      let locs: Location[] = [];
      if (isAdmin) {
        // Admin can see all locations
        const locRes = await locationsApi.getAll({ page_size: 100 });
        locs = (locRes.data.data || []).filter((l: Location) => l.is_active);
      } else {
        // Non-admin can only see assigned locations
        const myLocsRes = await userLocationsApi.getMyLocations();
        locs = (myLocsRes.data.data || []).filter((l: Location) => l.is_active);
      }

      setLocations(locs);

      // Set location based on saved value or default
      if (savedLocationId && locs.some(l => l.id.toString() === savedLocationId)) {
        // Use saved location from sessionStorage if still available
        setSelectedLocationId(savedLocationId);
      } else if (locs.length > 0) {
        // Only set default if no saved location
        setSelectedLocationId(locs[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = useMemo(() => {
    return goldCategories.find((c) => c.id.toString() === selectedCategoryId);
  }, [goldCategories, selectedCategoryId]);

  const totals = useMemo(() => {
    const totalWeightGross = depositItems.reduce(
      (s, i) => s + i.weight_gross,
      0
    );
    const totalWeight = depositItems.reduce((s, i) => s + i.weight_grams, 0);
    const totalAmount = depositItems.reduce((s, i) => s + i.subtotal, 0);
    return { totalWeightGross, totalWeight, totalAmount };
  }, [depositItems]);

  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc.id.toString(),
      label: loc.name,
      icon: <Store className="h-4 w-4" />,
    }));
  }, [locations]);

  const goldCategoryOptions = useMemo(() => {
    return goldCategories.map((c) => ({
      value: c.id.toString(),
      label: `${c.name} (${c.purity}%)`,
      description: `${formatCurrency(c.buy_price)}/g`,
      icon: <Coins className="h-4 w-4" />,
    }));
  }, [goldCategories]);

  // Auto-fill buy price when category is selected
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = goldCategories.find((c) => c.id.toString() === categoryId);
    if (category) {
      setStandardBuyPrice(category.buy_price.toString());
    }
  };

  // Search member by code (barcode/QR)
  const handleSearchMember = async (codeValue?: string) => {
    const code = codeValue || memberSearchCode;
    if (!code.trim()) return;

    try {
      const res = await membersApi.getAll({ search: code, page_size: 10 });
      const members = res.data.data || [];

      // Find exact match by member_code or code
      const member = members.find(
        (m: Member) =>
          m.member_code?.toLowerCase() === code.toLowerCase() ||
          m.code?.toLowerCase() === code.toLowerCase()
      );

      if (member) {
        setSelectedMember(member);
        setMemberSearchCode("");
        toast.success(`Member ${member.name} dipilih`);
      } else {
        toast.error("Member tidak ditemukan");
      }
    } catch {
      toast.error("Gagal mencari member");
    }
  };

  // Handle barcode scan from camera
  const handleCameraScan = (barcode: string) => {
    setMemberSearchCode(barcode);
    handleSearchMember(barcode);
  };

  // USB Scanner detection for desktop
  useEffect(() => {
    if (isMobile || selectedMember) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      const isMemberInput = activeElement === memberSearchRef.current;

      if (isInputFocused && !isMemberInput) return;

      if (!isMemberInput && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        memberSearchRef.current?.focus();
        setScannerReady(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, selectedMember]);

  // Track scanner activity
  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeSinceLastInput = now - lastInputTimeRef.current;
    lastInputTimeRef.current = now;

    if (timeSinceLastInput < 50 && e.target.value.length > 1) {
      setScannerReady(true);
    }

    setMemberSearchCode(e.target.value);
  };

  const handleMemberInputFocus = () => {
    if (!isMobile) {
      setScannerReady(true);
    }
  };

  const handleMemberInputBlur = () => {
    setTimeout(() => {
      if (document.activeElement !== memberSearchRef.current) {
        setScannerReady(false);
      }
    }, 100);
  };

  const addStandardItem = () => {
    if (!selectedCategory) {
      toast.error("Pilih kategori emas");
      return;
    }
    const weightGross = parseFloat(standardWeight);
    if (isNaN(weightGross) || weightGross <= 0) {
      toast.error("Berat harus lebih dari 0");
      return;
    }
    const buyPrice = parseFloat(standardBuyPrice);
    if (isNaN(buyPrice) || buyPrice <= 0) {
      toast.error("Harga beli kita harus lebih dari 0");
      return;
    }
    // Default susut 0% - akan diatur di keranjang
    const shrinkage = 0;
    const weightNet = weightGross;
    const originalPrice = selectedCategory.buy_price; // Harga surat/referensi

    setDepositItems([
      ...depositItems,
      {
        id: generateUUID(),
        gold_category_id: selectedCategory.id,
        gold_category_name: selectedCategory.name,
        purity: selectedCategory.purity,
        weight_gross: weightGross,
        shrinkage_percent: shrinkage,
        weight_grams: Math.round(weightNet * 100) / 100, // Berat bersih
        original_price_per_gram: originalPrice,
        price_per_gram: buyPrice, // Harga beli kita yang diinput manual
        condition: "like_new",
        subtotal: (Math.round(weightNet * 100) / 100) * buyPrice,
        notes: standardNotes,
        item_type: "standard",
      },
    ]);
    setStandardWeight("");
    setStandardBuyPrice("");
    setStandardNotes("");
    toast.success("Item ditambahkan - atur susut di keranjang");
  };

  const addCustomItem = () => {
    const weightGross = parseFloat(customWeight);
    const purity = parseFloat(customPurity);
    const price = parseFloat(customPricePerGram); // Harga surat
    const buyPrice = parseFloat(customBuyPrice); // Harga beli kita
    if (isNaN(weightGross) || weightGross <= 0) {
      toast.error("Berat harus lebih dari 0");
      return;
    }
    if (isNaN(purity) || purity <= 0 || purity > 100) {
      toast.error("Kadar harus 1-100%");
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error("Harga surat harus lebih dari 0");
      return;
    }
    if (isNaN(buyPrice) || buyPrice <= 0) {
      toast.error("Harga beli kita harus lebih dari 0");
      return;
    }
    // Default susut 0% - akan diatur di keranjang
    const shrinkage = 0;
    const weightNet = weightGross;

    setDepositItems([
      ...depositItems,
      {
        id: generateUUID(),
        purity,
        weight_gross: weightGross,
        shrinkage_percent: shrinkage,
        weight_grams: Math.round(weightNet * 100) / 100, // Berat bersih
        original_price_per_gram: price, // Harga surat
        price_per_gram: buyPrice, // Harga beli kita yang diinput manual
        condition: "like_new",
        subtotal: (Math.round(weightNet * 100) / 100) * buyPrice,
        notes: customNotes || `Emas ${purity}%`,
        item_type: "custom",
      },
    ]);
    setCustomWeight("");
    setCustomPurity("");
    setCustomPricePerGram("");
    setCustomBuyPrice("");
    setCustomNotes("");
    toast.success("Item ditambahkan - atur susut di keranjang");
  };

  const updateWeightDirect = (id: string, weightValue: string) => {
    const wGross = parseFloat(weightValue) || 0;
    // Min weight 0.001g
    const clampedWeight = Math.max(0, Math.round(wGross * 1000) / 1000);

    setDepositItems(
      depositItems.map((i) => {
        if (i.id === id) {
          const wNet = Math.round(clampedWeight * (1 - i.shrinkage_percent / 100) * 1000) / 1000;
          return {
            ...i,
            weight_gross: clampedWeight,
            weight_grams: wNet,
            subtotal: wNet * i.price_per_gram,
          };
        }
        return i;
      })
    );
  };

  const updateShrinkage = (id: string, shrinkageValue: string) => {
    const shrinkage = parseFloat(shrinkageValue) || 0;
    // Clamp shrinkage between 0 and 100
    const clampedShrinkage = Math.min(100, Math.max(0, shrinkage));

    setDepositItems(
      depositItems.map((i) => {
        if (i.id === id) {
          const wNet = Math.round(i.weight_gross * (1 - clampedShrinkage / 100) * 1000) / 1000;
          return {
            ...i,
            shrinkage_percent: clampedShrinkage,
            weight_grams: wNet,
            subtotal: wNet * i.price_per_gram,
          };
        }
        return i;
      })
    );
  };

  const removeItem = (id: string) =>
    setDepositItems(depositItems.filter((i) => i.id !== id));

  const clearAll = () => {
    setDepositItems([]);
    setSelectedMember(null);
    setNotes("");
    setSaveAsRawMaterial(false);
  };

  const handlePaymentClick = () => {
    if (depositItems.length === 0) {
      toast.error("Tambahkan item");
      return;
    }
    if (!selectedLocationId) {
      toast.error("Pilih lokasi");
      return;
    }
    setShowConfirmModal(true);
  };

  const submit = async (withPrint: boolean = false) => {
    setIsSubmitting(true);
    try {
      // SELALU simpan sebagai transaksi pembelian untuk laporan
      // Backend akan otomatis membuat raw material jika save_as_raw_material = true
      const res = await api.post("/transactions/purchase", {
        location_id: parseInt(selectedLocationId),
        member_id: selectedMember?.id || null,
        items: depositItems.map((i) => ({
          gold_category_id: i.gold_category_id || null,
          weight_gross: i.weight_gross,
          shrinkage_percent: i.shrinkage_percent,
          weight: i.weight_grams, // Backend expects 'weight' not 'weight_grams'
          price_per_gram: i.price_per_gram,
          purity: i.purity?.toString() || "", // Convert to string for backend
          condition: i.condition,
          notes: i.notes,
        })),
        payment_method: paymentMethod,
        notes,
        save_as_raw_material: saveAsRawMaterial, // Backend akan handle raw material creation
      });

      if (res.data.success || res.data.data) {
        if (saveAsRawMaterial) {
          toast.success("Transaksi & bahan baku berhasil disimpan!");
        } else {
          toast.success("Setor emas berhasil!");
        }

        if (withPrint) {
          // Print receipt with 80mm layout
          const receiptData: ReceiptData = {
            type: "deposit",
            storeName: selectedLocationName || "TOKO EMAS",
            storeAddress: "Alamat Toko",
            storePhone: "",
            transactionCode: res.data.data?.transaction_code || "",
            date: new Date(),
            locationName: selectedLocationName,
            customerName: selectedMember?.name || undefined,
            memberCode:
              selectedMember?.code || selectedMember?.member_code || undefined,
            items: depositItems.map((item) => ({
              name: item.gold_category_name || `Emas ${item.purity}%`,
              weight: item.weight_grams,
              price: item.subtotal,
              gold_category: item.gold_category_name,
            })),
            subtotal: totals.totalAmount,
            grandTotal: totals.totalAmount,
            totalWeightGross: totals.totalWeightGross,
            totalWeightNet: totals.totalWeight,
            paymentMethod: paymentMethod,
          };
          printReceipt(receiptData);
        }
      }

      setShowConfirmModal(false);
      clearAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLocationName = useMemo(() => {
    return (
      locations.find((l) => l.id.toString() === selectedLocationId)?.name || ""
    );
  }, [locations, selectedLocationId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show message if non-admin user has no assigned locations
  if (!isAdmin && locations.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tidak Ada Akses Lokasi</h2>
          <p className="text-muted-foreground max-w-md">
            Anda belum ditugaskan ke lokasi manapun. Silakan hubungi admin untuk mendapatkan akses.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="h-auto min-h-12 border-b bg-background flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-4 py-2 sm:py-0 gap-2 sm:gap-0 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded bg-amber-500 flex items-center justify-center">
              <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base">Setor Emas</span>
          </div>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex gap-1 bg-muted p-0.5 rounded">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
              onClick={() => navigate("/pos")}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Penjualan</span>
            </Button>
            <Button
              size="sm"
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              <Scale className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Setor</span>
            </Button>
          </div>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <Tabs
            value={depositMode}
            onValueChange={(v) => setDepositMode(v as DepositMode)}
          >
            <TabsList className="h-6 sm:h-7">
              <TabsTrigger
                value="standard"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 h-4 sm:h-5"
              >
                Standar
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 h-4 sm:h-5"
              >
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <SearchableSelect
            options={locationOptions}
            value={selectedLocationId}
            onValueChange={setSelectedLocationId}
            placeholder="Lokasi"
            searchPlaceholder="Cari lokasi..."
            emptyMessage="Lokasi tidak ditemukan"
            triggerClassName="flex-1 sm:w-[200px] lg:w-[300px] h-7 sm:h-8 text-xs sm:text-sm"
            size="sm"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 px-2 sm:px-3 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-950 dark:hover:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-400"
            onClick={() => setShowPriceUpdateModal(true)}
          >
            <Coins className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline ml-1.5">Harga</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 px-2 sm:px-3"
            onClick={() =>
              navigate("/pos/history?return=/setor-emas&type=purchase")
            }
          >
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline ml-1.5">Riwayat</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 px-2 sm:px-3"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline ml-1.5">Dashboard</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-auto lg:overflow-hidden">
        {/* Left */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 gap-2 sm:gap-3 min-w-0">
          {/* Form */}
          <div className="bg-background rounded-lg border p-2 sm:p-3">
            {depositMode === "standard" ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-1.5 sm:gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[120px] sm:min-w-[180px]">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Kategori Emas
                    </Label>
                    <SearchableSelect
                      options={goldCategoryOptions}
                      value={selectedCategoryId}
                      onValueChange={handleCategoryChange}
                      placeholder="Pilih kategori"
                      searchPlaceholder="Cari kategori..."
                      emptyMessage="Kategori tidak ditemukan"
                    />
                  </div>
                  <div className="w-20 sm:w-28">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Berat (g)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={standardWeight}
                      onChange={(e) => setStandardWeight(e.target.value)}
                      placeholder="0.00"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="w-24 sm:w-32">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Harga Beli/g <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={standardBuyPrice}
                      onChange={(e) => setStandardBuyPrice(e.target.value)}
                      placeholder="0"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px] sm:min-w-[120px]">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Catatan
                    </Label>
                    <Input
                      value={standardNotes}
                      onChange={(e) => setStandardNotes(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addStandardItem()}
                      placeholder="Opsional"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <Button
                    onClick={addStandardItem}
                    className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  * Susut akan diatur setelah item masuk keranjang
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-1.5 sm:gap-2 items-end flex-wrap">
                  <div className="w-20 sm:w-28">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Berat (g)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(e.target.value)}
                      placeholder="0.00"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="w-16 sm:w-20">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Kadar (%)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={customPurity}
                      onChange={(e) => setCustomPurity(e.target.value)}
                      placeholder="99.9"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="w-24 sm:w-28">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Harga Surat/g
                    </Label>
                    <Input
                      type="number"
                      value={customPricePerGram}
                      onChange={(e) => setCustomPricePerGram(e.target.value)}
                      placeholder="0"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="w-24 sm:w-28">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Harga Beli/g <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={customBuyPrice}
                      onChange={(e) => setCustomBuyPrice(e.target.value)}
                      placeholder="0"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[80px] sm:min-w-[100px]">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Catatan
                    </Label>
                    <Input
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
                      placeholder="Opsional"
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <Button
                    onClick={addCustomItem}
                    className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  * Susut akan diatur setelah item masuk keranjang
                </p>
              </div>
            )}

            {selectedCategory && depositMode === "standard" && (
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-muted-foreground">Ref:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedCategory.buy_price)}/g
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {selectedCategory.purity}%
                  </Badge>
                  {standardWeight && parseFloat(standardWeight) > 0 && (
                    <>
                      <span className="text-muted-foreground hidden sm:inline">|</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Berat:</span>
                        <span className="font-medium">
                          {parseFloat(standardWeight).toFixed(2)}g
                        </span>
                      </div>
                    </>
                  )}
                  {standardBuyPrice &&
                    parseFloat(standardBuyPrice) > 0 &&
                    standardWeight &&
                    parseFloat(standardWeight) > 0 && (
                      <>
                        <span className="text-muted-foreground hidden sm:inline">|</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-muted-foreground">Est. Total:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(
                              parseFloat(standardWeight) * parseFloat(standardBuyPrice)
                            )}
                          </span>
                        </div>
                      </>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 bg-background rounded-lg border flex flex-col shrink-0">
            <div className="h-9 sm:h-10 px-2 sm:px-3 border-b flex items-center justify-between shrink-0">
              <span className="text-xs sm:text-sm font-medium">
                Item Setor ({depositItems.length})
              </span>
              {depositItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 sm:h-7 text-[10px] sm:text-xs text-destructive hover:text-destructive px-2"
                  onClick={clearAll}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Hapus
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1 h-[180px] sm:h-[220px] lg:h-auto lg:max-h-[calc(100vh-400px)]">
              {depositItems.length === 0 ? (
                <div className="p-4 sm:p-8 text-center text-muted-foreground">
                  <Scale className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs sm:text-sm">Belum ada item</p>
                </div>
              ) : (
                <div className="p-1.5 sm:p-2 space-y-1.5">
                  {depositItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 sm:p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                    >
                      {/* Row 1: Name & Delete */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <span className="text-xs sm:text-sm font-medium truncate">
                            {item.gold_category_name || `Emas ${item.purity}%`}
                          </span>
                          {item.item_type === "custom" && (
                            <Badge
                              variant="secondary"
                              className="text-[8px] sm:text-[10px]"
                            >
                              Custom
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </div>

                      {/* Row 2: Weight Input, Shrinkage Input, Net Weight */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Berat Kotor - Input Field */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Berat:</span>
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={item.weight_gross || ""}
                            onChange={(e) => updateWeightDirect(item.id, e.target.value)}
                            placeholder="0.000"
                            className="h-6 sm:h-7 w-20 sm:w-24 text-xs sm:text-sm text-center px-1"
                          />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">g</span>
                        </div>

                        {/* Susut Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-xs text-orange-500">Susut:</span>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={item.shrinkage_percent || ""}
                            onChange={(e) => updateShrinkage(item.id, e.target.value)}
                            placeholder="0"
                            className="h-6 sm:h-7 w-14 sm:w-16 text-xs sm:text-sm text-center px-1"
                          />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">%</span>
                        </div>

                        {/* Arrow & Net Weight */}
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">→</span>
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            {item.weight_grams.toFixed(3)}g
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">×</span>
                          <span className="text-xs sm:text-sm text-green-600">
                            {formatCurrency(item.price_per_gram)}/g
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Subtotal */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {item.shrinkage_percent > 0 && (
                            <span className="text-orange-500">
                              Susut: -{(item.weight_gross * item.shrinkage_percent / 100).toFixed(3)}g
                            </span>
                          )}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-green-600">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Right */}
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l bg-background flex flex-col shrink-0">
          {/* Member */}
          <div className="p-2 sm:p-3 border-b">
            <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 block">
              Penyetor
            </Label>
            {selectedMember ? (
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded border bg-muted/30">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {selectedMember.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {selectedMember.code || selectedMember.member_code}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                    onClick={() => setSelectedMember(null)}
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </div>
                <div className="text-[10px] sm:text-xs flex items-center justify-between px-0.5 sm:px-1">
                  <span className="text-muted-foreground">
                    Poin:{" "}
                    <span className="font-medium text-yellow-600">
                      {selectedMember.points?.toLocaleString() || 0}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    +{Math.floor(totals.totalAmount / 200000)} poin
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Quick search by code/barcode */}
                <div className="flex gap-1.5">
                  <div className="flex-1 relative">
                    <Barcode className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      ref={memberSearchRef}
                      placeholder={isMobile ? "Ketik kode member..." : "Scan atau ketik kode member..."}
                      value={memberSearchCode}
                      onChange={handleMemberInputChange}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchMember()}
                      onFocus={handleMemberInputFocus}
                      onBlur={handleMemberInputBlur}
                      className={`pl-7 h-8 text-xs ${!isMobile && scannerReady ? "ring-2 ring-green-500 border-green-500" : ""}`}
                      autoFocus={!isMobile}
                    />
                    {/* USB Scanner status indicator - desktop only */}
                    {!isMobile && scannerReady && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Camera scan button - only show on mobile */}
                  {isMobile && (
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                      title="Scan dengan kamera"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSearchMember()}
                    className="h-8 w-8"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* Status indicator */}
                {isMobile ? (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Tekan <Camera className="inline h-3 w-3" /> untuk scan kartu member
                  </p>
                ) : (
                  <div className={`flex items-center justify-center gap-1.5 text-[10px] ${scannerReady ? "text-green-600" : "text-muted-foreground"}`}>
                    <Usb className="h-3 w-3" />
                    <span>{scannerReady ? "Scanner siap" : "Klik untuk scan"}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm"
                  onClick={() => {
                    // Save cart state before navigating
                    sessionStorage.setItem(
                      "setor_emas_cart",
                      JSON.stringify({
                        depositItems,
                        locationId: selectedLocationId,
                        paymentMethod,
                        notes,
                        depositMode,
                        saveAsRawMaterial,
                      })
                    );
                    navigate("/members/select?return=/setor-emas");
                  }}
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Cari di Daftar Member
                </Button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="p-2 sm:p-3 border-b">
            <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-1.5 block">
              Pembayaran
            </Label>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {[
                { value: "cash", label: "Tunai", icon: Banknote },
                { value: "transfer", label: "Transfer", icon: Wallet },
                { value: "card", label: "Kartu", icon: CreditCard },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value as PaymentMethod)}
                  className={`flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded border text-[10px] sm:text-xs transition-colors ${
                    paymentMethod === m.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:border-primary/50"
                  }`}
                >
                  <m.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="p-2 sm:p-3 border-b">
            <Label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">
              Catatan
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsional"
              className="h-7 sm:h-8 text-xs sm:text-sm"
            />
          </div>

          {/* Simpan sebagai Raw Material */}
          <div className="p-2 sm:p-3 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <div>
                  <Label className="text-xs sm:text-sm font-medium">
                    Simpan Bahan Baku
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Untuk dilebur nanti
                  </p>
                </div>
              </div>
              <Switch
                checked={saveAsRawMaterial}
                onCheckedChange={setSaveAsRawMaterial}
              />
            </div>
            {saveAsRawMaterial && (
              <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400">
                  Emas akan disimpan ke inventory bahan baku.
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex-1 p-2 sm:p-3 flex flex-col">
            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Berat Kotor</span>
                <span className="font-medium">
                  {totals.totalWeightGross.toFixed(3)} g
                </span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Susut (avg)</span>
                <span>
                  -
                  {depositItems.length > 0
                    ? (
                        (1 - totals.totalWeight / totals.totalWeightGross) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Berat Bersih</span>
                <span className="font-semibold">
                  {totals.totalWeight.toFixed(3)} g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah Item</span>
                <span>{depositItems.length} item</span>
              </div>
            </div>
            <div className="border-t my-1.5 sm:my-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Total Bayar
              </span>
              <span className="text-lg sm:text-xl font-bold text-green-600">
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 sm:p-3 border-t space-y-1.5 sm:space-y-2">
            <Button
              className="w-full h-9 sm:h-11 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
              disabled={depositItems.length === 0 || isSubmitting}
              onClick={handlePaymentClick}
            >
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Proses Pembayaran
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <TransactionConfirmationModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        type="purchase"
        locationName={selectedLocationName}
        member={selectedMember}
        paymentMethod={paymentMethod}
        notes={notes}
        depositItems={depositItems}
        totalWeightGross={totals.totalWeightGross}
        totalWeightNet={totals.totalWeight}
        grandTotal={totals.totalAmount}
        saveAsRawMaterial={saveAsRawMaterial}
        isSubmitting={isSubmitting}
        onConfirm={submit}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onScan={handleCameraScan}
      />

      {/* Price Update Modal */}
      <PriceUpdateModal
        open={showPriceUpdateModal}
        onOpenChange={setShowPriceUpdateModal}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
