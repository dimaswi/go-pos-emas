import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Printer,
  User,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  Package,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Clock,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  stock_id: number;
  product_name: string;
  barcode: string;
  serial_number: string;
  weight: number;
  price: number;
}

interface DepositItem {
  id: string;
  gold_category_id?: number;
  gold_category_name?: string;
  purity?: number;
  weight_gross: number;
  shrinkage_percent: number;
  weight_grams: number;
  original_price_per_gram: number;
  price_per_gram: number;
  condition: string;
  subtotal: number;
  notes: string;
  item_type: "standard" | "custom";
}

interface Member {
  id: number;
  name: string;
  code: string;
  member_type?: string;
}

interface TransactionConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "sale" | "purchase";
  // Common fields
  locationName: string;
  member?: Member | null;
  paymentMethod: "cash" | "transfer" | "card";
  notes?: string;
  // Sale specific
  cartItems?: CartItem[];
  subtotal?: number;
  discount?: number;
  grandTotal: number;
  paidAmount?: number;
  changeAmount?: number;
  // Purchase specific
  depositItems?: DepositItem[];
  totalWeightGross?: number;
  totalWeightNet?: number;
  saveAsRawMaterial?: boolean;
  // Actions
  isSubmitting: boolean;
  onConfirm: (withPrint: boolean, withNotaPrint?: boolean) => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const PAYMENT_METHODS = {
  cash: { label: "Tunai", icon: Banknote, color: "text-green-600" },
  transfer: { label: "Transfer", icon: Wallet, color: "text-blue-600" },
  card: { label: "Kartu", icon: CreditCard, color: "text-purple-600" },
};

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Baru/Segel", color: "bg-green-500" },
  like_new: { label: "Mulus", color: "bg-emerald-500" },
  scratched: { label: "Ada Goresan", color: "bg-amber-500" },
  dented: { label: "Penyok", color: "bg-orange-500" },
  damaged: { label: "Rusak", color: "bg-red-500" },
};

export function TransactionConfirmationModal({
  open,
  onOpenChange,
  type,
  locationName,
  member,
  paymentMethod,
  notes,
  cartItems = [],
  subtotal = 0,
  discount = 0,
  grandTotal,
  paidAmount = 0,
  changeAmount = 0,
  depositItems = [],
  totalWeightGross = 0,
  totalWeightNet = 0,
  saveAsRawMaterial = false,
  isSubmitting,
  onConfirm,
}: TransactionConfirmationModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const PaymentIcon = PAYMENT_METHODS[paymentMethod].icon;

  const isSale = type === "sale";
  const items = isSale ? cartItems : depositItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-full sm:max-w-2xl flex flex-col p-0 sm:rounded-lg rounded-none">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-gradient-to-r from-primary/10 to-primary/5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "p-2 sm:p-3 rounded-full",
              isSale ? "bg-green-100 dark:bg-green-900/50" : "bg-blue-100 dark:bg-blue-900/50"
            )}>
              {isSale ? (
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-xl font-bold">
                Konfirmasi {isSale ? "Penjualan" : "Setor Emas"}
              </DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Periksa detail transaksi sebelum melanjutkan
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-3 sm:px-6">
          <div ref={printRef} className="py-3 sm:py-4 space-y-3 sm:space-y-4">
            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-muted/50 border">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Lokasi</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{locationName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-muted/50 border">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {isSale ? "Pelanggan" : "Penyetor"}
                  </p>
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {member ? member.name : "Umum"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-muted/50 border">
                <PaymentIcon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0", PAYMENT_METHODS[paymentMethod].color)} />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Pembayaran</p>
                  <p className="text-xs sm:text-sm font-medium">{PAYMENT_METHODS[paymentMethod].label}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-muted/50 border">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Waktu</p>
                  <p className="text-xs sm:text-sm font-medium">
                    {new Date().toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="border rounded-lg overflow-hidden">
              <div className={cn(
                "px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2",
                isSale ? "bg-green-50 dark:bg-green-950/50" : "bg-blue-50 dark:bg-blue-950/50"
              )}>
                {isSale ? (
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-xs sm:text-sm font-medium">
                  {isSale ? "Daftar Produk" : "Daftar Item Setor"}
                </span>
                <Badge variant="secondary" className="ml-auto text-[10px] sm:text-xs">
                  {items.length} item
                </Badge>
              </div>

              <div className="divide-y">
                {isSale ? (
                  cartItems.map((item, idx) => (
                    <div key={item.id} className="px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground w-4 sm:w-5 shrink-0">{idx + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{item.product_name}</p>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                            <span>{item.weight.toFixed(2)}g</span>
                            <span>•</span>
                            <span className="font-mono truncate max-w-[80px] sm:max-w-none">{item.serial_number}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 shrink-0 ml-2">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))
                ) : (
                  depositItems.map((item, idx) => (
                    <div key={item.id} className="px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground w-4 sm:w-5 shrink-0">{idx + 1}.</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-medium truncate">
                              {item.gold_category_name || `Emas ${item.purity}%`}
                            </p>
                            {item.item_type === "custom" && (
                              <Badge variant="secondary" className="text-[8px] sm:text-[10px]">Custom</Badge>
                            )}
                            <span className={cn(
                              "text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full text-white",
                              CONDITION_LABELS[item.condition]?.color || "bg-gray-500"
                            )}>
                              {CONDITION_LABELS[item.condition]?.label || item.condition}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                            <span>{item.weight_gross.toFixed(2)}g</span>
                            <span className="text-orange-500">-{item.shrinkage_percent}%</span>
                            <span>→</span>
                            <span className="text-primary font-medium">{item.weight_grams.toFixed(2)}g</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="border rounded-lg p-2.5 sm:p-4 space-y-2 sm:space-y-3 bg-muted/30">
              {isSale ? (
                <>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-red-600">
                      <span>Diskon</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  {paymentMethod === "cash" && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Dibayar</span>
                        <span>{formatCurrency(paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm font-medium">
                        <span className="text-muted-foreground">Kembalian</span>
                        <span className="text-green-600">{formatCurrency(changeAmount)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Berat Kotor</span>
                    <span>{totalWeightGross.toFixed(2)} gram</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-amber-600">
                    <span>Susut (rata-rata)</span>
                    <span>
                      -{totalWeightGross > 0
                        ? ((1 - totalWeightNet / totalWeightGross) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Berat Bersih</span>
                    <span className="font-medium">{totalWeightNet.toFixed(2)} gram</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total Bayar</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  {saveAsRawMaterial && (
                    <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Akan disimpan sebagai bahan baku
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            {notes && (
              <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Catatan:</p>
                <p className="text-xs sm:text-sm">{notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t bg-muted/30 flex flex-col gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 sm:h-10 text-sm sm:text-sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 sm:h-10 text-[11px] sm:text-sm px-2 sm:px-4"
              onClick={() => onConfirm(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 sm:mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-1.5 sm:mr-2" />
              )}
              Bayar & Cetak Struk
            </Button>
            <Button
              size="sm"
              className={cn(
                "flex-1 h-10 sm:h-10 text-[11px] sm:text-sm px-2 sm:px-4",
                isSale
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={() => onConfirm(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 sm:mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5 sm:mr-2" />
              )}
              Konfirmasi Bayar
            </Button>
          </div>
          {/* Cetak Nota Button - Only for Sale transactions */}
          {isSale && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 sm:h-10 text-[10px] sm:text-sm border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={() => onConfirm(false, true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              Bayar & Cetak Nota (Pre-printed)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
