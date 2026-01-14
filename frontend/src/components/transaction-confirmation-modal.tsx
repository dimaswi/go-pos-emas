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
  Receipt,
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
  Hash,
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-full",
              isSale ? "bg-green-100 dark:bg-green-900/50" : "bg-blue-100 dark:bg-blue-900/50"
            )}>
              {isSale ? (
                <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Konfirmasi {isSale ? "Penjualan" : "Setor Emas"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Periksa detail transaksi sebelum melanjutkan
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div ref={printRef} className="py-4 space-y-4">
            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="text-sm font-medium">{locationName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {isSale ? "Pelanggan" : "Penyetor"}
                  </p>
                  <p className="text-sm font-medium">
                    {member ? (
                      <span className="flex items-center gap-1">
                        {member.name}
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {member.code}
                        </Badge>
                      </span>
                    ) : (
                      "Umum"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <PaymentIcon className={cn("h-4 w-4", PAYMENT_METHODS[paymentMethod].color)} />
                <div>
                  <p className="text-xs text-muted-foreground">Pembayaran</p>
                  <p className="text-sm font-medium">{PAYMENT_METHODS[paymentMethod].label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Waktu</p>
                  <p className="text-sm font-medium">
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
                "px-4 py-2 flex items-center gap-2",
                isSale ? "bg-green-50 dark:bg-green-950/50" : "bg-blue-50 dark:bg-blue-950/50"
              )}>
                {isSale ? (
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-sm font-medium">
                  {isSale ? "Daftar Produk" : "Daftar Item Setor"}
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {items.length} item
                </Badge>
              </div>

              <div className="divide-y max-h-[200px] overflow-y-auto">
                {isSale ? (
                  cartItems.map((item, idx) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.weight.toFixed(2)}g</span>
                            <span>•</span>
                            <span className="font-mono">{item.serial_number}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))
                ) : (
                  depositItems.map((item, idx) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {item.gold_category_name || `Emas ${item.purity}%`}
                            </p>
                            {item.item_type === "custom" && (
                              <Badge variant="secondary" className="text-[10px]">Custom</Badge>
                            )}
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full text-white",
                              CONDITION_LABELS[item.condition]?.color || "bg-gray-500"
                            )}>
                              {CONDITION_LABELS[item.condition]?.label || item.condition}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.weight_gross.toFixed(2)}g</span>
                            <span className="text-orange-500">-{item.shrinkage_percent}%</span>
                            <span>→</span>
                            <span className="text-primary font-medium">{item.weight_grams.toFixed(2)}g bersih</span>
                            <span>×</span>
                            <span>{formatCurrency(item.price_per_gram)}/g</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              {isSale ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Diskon</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  {paymentMethod === "cash" && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dibayar</span>
                        <span>{formatCurrency(paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">Kembalian</span>
                        <span className="text-green-600">{formatCurrency(changeAmount)}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Berat Kotor</span>
                    <span>{totalWeightGross.toFixed(2)} gram</span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Susut (rata-rata)</span>
                    <span>
                      -{totalWeightGross > 0
                        ? ((1 - totalWeightNet / totalWeightGross) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Berat Bersih</span>
                    <span className="font-medium">{totalWeightNet.toFixed(2)} gram</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Bayar</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  {saveAsRawMaterial && (
                    <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Akan disimpan sebagai bahan baku
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            {notes && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                <p className="text-sm">{notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="px-6 py-4 border-t bg-muted/30 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <div className="flex-1 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onConfirm(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Bayar & Cetak Struk
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  isSale
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
                onClick={() => onConfirm(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Konfirmasi Bayar
              </Button>
            </div>
          </div>
          {/* Cetak Nota Button - Only for Sale transactions */}
          {isSale && (
            <Button
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={() => onConfirm(false, true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Bayar & Cetak Nota (Pre-printed)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
