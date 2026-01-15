import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { membersApi, type Member } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Search, Loader2, UserPlus, Check, X } from "lucide-react";

export default function MemberSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("return") || "/pos";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await membersApi.getAll({ is_active: true, page_size: 500 });
      setMembers(res.data.data || []);
    } catch {
      toast.error("Gagal memuat data member");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = search
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.code.toLowerCase().includes(search.toLowerCase()) ||
          m.phone?.includes(search)
      )
    : members;

  const handleSelect = (member: Member) => {
    // Simpan member yang dipilih ke sessionStorage
    sessionStorage.setItem("selectedMember", JSON.stringify(member));
    navigate(returnUrl);
  };

  const handleBack = () => {
    navigate(returnUrl);
  };

  const handleSkip = () => {
    sessionStorage.removeItem("selectedMember");
    navigate(returnUrl);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await membersApi.create({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        is_active: true,
      });

      toast.success(`Member ${res.data.data.code} berhasil dibuat`);
      handleSelect(res.data.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Gagal membuat member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-10 sm:h-12 border-b flex items-center px-2 sm:px-4 gap-2 sm:gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleBack}>
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <h1 className="font-semibold text-sm sm:text-base">Pilih Member</h1>
        <div className="flex-1" />
        <Button
          variant={showForm ? "secondary" : "outline"}
          size="sm"
          className="h-7 sm:h-8 text-xs sm:text-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
          Baru
        </Button>
      </header>

      {/* Form Buat Member */}
      {showForm && (
        <div className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-amber-500/5 p-2 sm:p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-amber-500 px-3 sm:px-4 py-2 sm:py-3">
                <h3 className="text-white font-semibold flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  Member Baru
                </h3>
              </div>
              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5 block">Nama Lengkap <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5 block">No. Telepon</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5 block">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@contoh.com"
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5 block">Alamat</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Alamat lengkap"
                      className="h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => {
                      setShowForm(false);
                      setForm({ name: "", phone: "", email: "", address: "" });
                    }}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    Batal
                  </Button>
                  <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90" onClick={handleCreate} disabled={saving || !form.name.trim()}>
                    {saving ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 animate-spin" /> : <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />}
                    <span className="hidden xs:inline">Simpan & Pilih</span>
                    <span className="xs:hidden">Simpan</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-2 sm:p-4 border-b">
        <div className="max-w-md relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, atau telepon..."
            className="pl-7 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm"
            autoFocus
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-muted-foreground text-xs sm:text-sm">
            {search ? "Tidak ada member ditemukan" : "Belum ada member"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] sm:w-[100px] text-[10px] sm:text-sm">Kode</TableHead>
                <TableHead className="text-[10px] sm:text-sm">Nama</TableHead>
                <TableHead className="w-[100px] sm:w-[140px] hidden sm:table-cell text-[10px] sm:text-sm">Telepon</TableHead>
                <TableHead className="w-[140px] sm:w-[180px] hidden md:table-cell text-[10px] sm:text-sm">Email</TableHead>
                <TableHead className="w-[60px] sm:w-[80px] text-right text-[10px] sm:text-sm">Poin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelect(member)}
                >
                  <TableCell className="font-mono text-[10px] sm:text-sm">{member.code}</TableCell>
                  <TableCell className="font-medium text-[10px] sm:text-sm">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground text-[10px] sm:text-sm hidden sm:table-cell">{member.phone || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-[10px] sm:text-sm hidden md:table-cell">{member.email || "-"}</TableCell>
                  <TableCell className="text-right font-medium text-[10px] sm:text-sm">{member.points.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Footer */}
      <div className="h-9 sm:h-11 border-t flex items-center justify-between px-2 sm:px-4 text-[10px] sm:text-sm shrink-0">
        <span className="text-muted-foreground">{filteredMembers.length} member</span>
        <Button variant="ghost" size="sm" className="h-7 sm:h-8 text-[10px] sm:text-xs" onClick={handleSkip}>
          Lewati
        </Button>
      </div>
    </div>
  );
}
