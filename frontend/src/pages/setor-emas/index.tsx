import { useState, useEffect, useMemo } from "react";
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
import {
  LayoutDashboard,
  Plus,
  Minus,
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
} from "lucide-react";
import { toast } from "sonner";
import {
  goldCategoriesApi,
  locationsApi,
  api,
  type Member,
  type GoldCategory,
  type Location,
} from "@/lib/api";
import { generateUUID } from "@/lib/utils";

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

const CONDITION_OPTIONS: Record<
  GoldCondition,
  { label: string; color: string; shrinkage: number }
> = {
  new: { label: "Baru/Segel", color: "bg-green-500", shrinkage: 1 },
  like_new: { label: "Mulus", color: "bg-emerald-500", shrinkage: 2 },
  scratched: { label: "Ada Goresan", color: "bg-amber-500", shrinkage: 3 },
  dented: { label: "Penyok", color: "bg-orange-500", shrinkage: 4 },
  damaged: { label: "Rusak", color: "bg-red-500", shrinkage: 5 },
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function SetorEmasPage() {
  const navigate = useNavigate();

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
  const [saveAsRawMaterial, setSaveAsRawMaterial] = useState(false); // Hybrid: Simpan sebagai bahan baku
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form fields
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [standardWeight, setStandardWeight] = useState<string>(""); // Berat kotor
  const [standardShrinkage, setStandardShrinkage] = useState<string>(""); // Susut %
  const [standardBuyPrice, setStandardBuyPrice] = useState<string>(""); // Harga beli kita ke penjual
  const [standardNotes, setStandardNotes] = useState<string>("");
  const [standardCondition, setStandardCondition] =
    useState<GoldCondition>("like_new");
  const [customWeight, setCustomWeight] = useState<string>(""); // Berat kotor
  const [customShrinkage, setCustomShrinkage] = useState<string>(""); // Susut %
  const [customPurity, setCustomPurity] = useState<string>("");
  const [customPricePerGram, setCustomPricePerGram] = useState<string>("");
  const [customBuyPrice, setCustomBuyPrice] = useState<string>(""); // Harga beli kita ke penjual
  const [customNotes, setCustomNotes] = useState<string>("");
  const [customCondition, setCustomCondition] =
    useState<GoldCondition>("like_new");

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

      const [catRes, locRes] = await Promise.all([
        goldCategoriesApi.getAll({ page_size: 100 }),
        locationsApi.getAll({ page_size: 100 }),
      ]);

      const categories = catRes.data.data || [];
      setGoldCategories(categories.filter((c: GoldCategory) => c.is_active));

      const locs = locRes.data.data || [];
      setLocations(locs.filter((l: Location) => l.is_active));

      // Set location based on saved value or default
      if (savedLocationId) {
        // Use saved location from sessionStorage
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
    // Susut: gunakan input manual atau default dari kondisi
    const shrinkage = standardShrinkage
      ? parseFloat(standardShrinkage)
      : CONDITION_OPTIONS[standardCondition].shrinkage;
    const weightNet = weightGross * (1 - shrinkage / 100);
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
        condition: standardCondition,
        subtotal: (Math.round(weightNet * 100) / 100) * buyPrice,
        notes: standardNotes,
        item_type: "standard",
      },
    ]);
    setStandardWeight("");
    setStandardShrinkage("");
    setStandardBuyPrice("");
    setStandardNotes("");
    setStandardCondition("like_new");
    toast.success("Item ditambahkan");
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
    // Susut: gunakan input manual atau default dari kondisi
    const shrinkage = customShrinkage
      ? parseFloat(customShrinkage)
      : CONDITION_OPTIONS[customCondition].shrinkage;
    const weightNet = weightGross * (1 - shrinkage / 100);

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
        condition: customCondition,
        subtotal: (Math.round(weightNet * 100) / 100) * buyPrice,
        notes: customNotes || `Emas ${purity}%`,
        item_type: "custom",
      },
    ]);
    setCustomWeight("");
    setCustomShrinkage("");
    setCustomPurity("");
    setCustomPricePerGram("");
    setCustomBuyPrice("");
    setCustomNotes("");
    setCustomCondition("like_new");
    toast.success("Item ditambahkan");
  };

  const updateWeight = (id: string, delta: number) => {
    setDepositItems(
      depositItems
        .map((i) => {
          if (i.id === id) {
            const wGross = Math.max(
              0.1,
              Math.round((i.weight_gross + delta) * 100) / 100
            );
            const wNet =
              Math.round(wGross * (1 - i.shrinkage_percent / 100) * 100) / 100;
            return {
              ...i,
              weight_gross: wGross,
              weight_grams: wNet,
              subtotal: wNet * i.price_per_gram,
            };
          }
          return i;
        })
        .filter((i) => i.weight_gross >= 0.1)
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
                  <div className="flex-1 min-w-[120px] sm:min-w-[150px]">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Kategori Emas
                    </Label>
                    <SearchableSelect
                      options={goldCategoryOptions}
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                      placeholder="Pilih kategori"
                      searchPlaceholder="Cari kategori..."
                      emptyMessage="Kategori tidak ditemukan"
                    />
                  </div>
                  <div className="w-16 sm:w-24">
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
                  <div className="w-14 sm:w-20">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Susut %
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={standardShrinkage}
                      onChange={(e) => setStandardShrinkage(e.target.value)}
                      placeholder={CONDITION_OPTIONS[
                        standardCondition
                      ].shrinkage.toString()}
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="w-20 sm:w-28">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Harga/g <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={standardBuyPrice}
                      onChange={(e) => setStandardBuyPrice(e.target.value)}
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
                      placeholder="Deskripsi"
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
                {/* Kondisi Fisik Emas */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                    Kondisi:
                  </Label>
                  <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                    {(
                      Object.entries(CONDITION_OPTIONS) as [
                        GoldCondition,
                        (typeof CONDITION_OPTIONS)[GoldCondition]
                      ][]
                    ).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setStandardCondition(key);
                          if (!standardShrinkage) setStandardShrinkage(""); // Reset agar pakai default
                        }}
                        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs rounded-full border transition-all ${
                          standardCondition === key
                            ? `${val.color} text-white border-transparent`
                            : "hover:border-primary/50"
                        }`}
                      >
                        {val.label} ({val.shrinkage}%)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex gap-1.5 sm:gap-2 items-end flex-wrap">
                  <div className="w-16 sm:w-24">
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
                  <div className="w-14 sm:w-20">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 block">
                      Susut %
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={customShrinkage}
                      onChange={(e) => setCustomShrinkage(e.target.value)}
                      placeholder={CONDITION_OPTIONS[
                        customCondition
                      ].shrinkage.toString()}
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="w-14 sm:w-20">
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
                  <div className="w-20 sm:w-28">
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
                  <div className="w-20 sm:w-28">
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
                      placeholder="Deskripsi"
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
                {/* Kondisi Fisik Emas */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                    Kondisi:
                  </Label>
                  <div className="flex gap-0.5 sm:gap-1 flex-wrap">
                    {(
                      Object.entries(CONDITION_OPTIONS) as [
                        GoldCondition,
                        (typeof CONDITION_OPTIONS)[GoldCondition]
                      ][]
                    ).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setCustomCondition(key);
                          if (!customShrinkage) setCustomShrinkage("");
                        }}
                        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs rounded-full border transition-all ${
                          customCondition === key
                            ? `${val.color} text-white border-transparent`
                            : "hover:border-primary/50"
                        }`}
                      >
                        {val.label} ({val.shrinkage}%)
                      </button>
                    ))}
                  </div>
                </div>
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
                      <span className="text-muted-foreground hidden sm:inline">
                        |
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Kotor:</span>
                        <span className="font-medium">
                          {parseFloat(standardWeight).toFixed(2)}g
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Susut:</span>
                        <span className="text-orange-600 font-medium">
                          -
                          {(
                            (parseFloat(standardWeight) *
                              (parseFloat(standardShrinkage) ||
                                CONDITION_OPTIONS[standardCondition]
                                  .shrinkage)) /
                            100
                          ).toFixed(2)}
                          g
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Bersih:</span>
                        <span className="font-bold text-primary">
                          {(
                            parseFloat(standardWeight) *
                            (1 -
                              (parseFloat(standardShrinkage) ||
                                CONDITION_OPTIONS[standardCondition]
                                  .shrinkage) /
                                100)
                          ).toFixed(2)}
                          g
                        </span>
                      </div>
                    </>
                  )}
                  {standardBuyPrice &&
                    parseFloat(standardBuyPrice) > 0 &&
                    standardWeight &&
                    parseFloat(standardWeight) > 0 && (
                      <>
                        <span className="text-muted-foreground hidden sm:inline">
                          |
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(
                              parseFloat(standardWeight) *
                                (1 -
                                  (parseFloat(standardShrinkage) ||
                                    CONDITION_OPTIONS[standardCondition]
                                      .shrinkage) /
                                    100) *
                                parseFloat(standardBuyPrice)
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
                <div className="p-1.5 sm:p-2 space-y-1">
                  {depositItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2 rounded hover:bg-muted/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                          <span
                            className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full text-white ${
                              CONDITION_OPTIONS[item.condition].color
                            }`}
                          >
                            {CONDITION_OPTIONS[item.condition].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                          <span>{item.weight_gross.toFixed(2)}g</span>
                          <span className="text-orange-500">
                            -{item.shrinkage_percent}%
                          </span>
                          <span>→</span>
                          <span className="text-primary font-medium">
                            {item.weight_grams.toFixed(2)}g
                          </span>
                          <span>×</span>
                          <span className="text-green-600 font-medium">
                            {formatCurrency(item.price_per_gram)}/g
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          onClick={() => updateWeight(item.id, -0.1)}
                        >
                          <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                        <div className="w-12 sm:w-16 text-center">
                          <span className="text-[10px] sm:text-sm">
                            {item.weight_gross.toFixed(2)}g
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          onClick={() => updateWeight(item.id, 0.1)}
                        >
                          <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                      <div className="w-16 sm:w-24 text-right text-[10px] sm:text-sm font-medium">
                        {formatCurrency(item.subtotal)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-7 sm:w-7 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
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
                Pilih Member
              </Button>
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
                  {totals.totalWeightGross.toFixed(2)} g
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
                  {totals.totalWeight.toFixed(2)} g
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
    </div>
  );
}
