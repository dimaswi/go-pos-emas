import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  locationsApi,
  userLocationsApi,
  type Location,
  type UserLocation,
} from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Store, MapPin, Plus, Trash2, Star, StarOff } from "lucide-react";

interface UserLocationAssignmentProps {
  userId: number;
  userName?: string;
}

export function UserLocationAssignment({ userId, userName }: UserLocationAssignmentProps) {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userLocsRes, allLocsRes] = await Promise.all([
        userLocationsApi.getUserLocations(userId),
        locationsApi.getAll({ type: "toko", page_size: 1000 }),
      ]);

      const userLocs = userLocsRes.data.data || [];
      setUserLocations(userLocs);
      setAllLocations(allLocsRes.data.data || []);

      // Set selected IDs from existing assignments
      setSelectedLocationIds(userLocs.map(ul => ul.location_id));

      // Find default location
      const defaultLoc = userLocs.find(ul => ul.is_default);
      setDefaultLocationId(defaultLoc?.location_id || null);
    } catch (error) {
      console.error("Failed to load locations:", error);
      toast.error("Gagal memuat data lokasi");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    try {
      await userLocationsApi.bulkAssign({
        user_id: userId,
        location_ids: selectedLocationIds,
        default_id: defaultLocationId || undefined,
      });

      toast.success("Lokasi berhasil disimpan");
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to save assignments:", error);
      toast.error("Gagal menyimpan lokasi");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLocation = async (locationId: number) => {
    try {
      await userLocationsApi.remove(userId, locationId);
      toast.success("Lokasi berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Failed to remove location:", error);
      toast.error("Gagal menghapus lokasi");
    }
  };

  const handleSetDefault = async (locationId: number) => {
    try {
      await userLocationsApi.setDefault(userId, locationId);
      toast.success("Lokasi default berhasil diubah");
      loadData();
    } catch (error) {
      console.error("Failed to set default:", error);
      toast.error("Gagal mengatur lokasi default");
    }
  };

  const toggleLocationSelection = (locationId: number) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        // If removing, also clear default if it was this location
        if (defaultLocationId === locationId) {
          setDefaultLocationId(null);
        }
        return prev.filter(id => id !== locationId);
      }
      return [...prev, locationId];
    });
  };

  const toggleDefault = (locationId: number) => {
    setDefaultLocationId(prev => prev === locationId ? null : locationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Lokasi Toko yang Ditugaskan
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Karyawan hanya bisa akses POS dan Setor Emas di toko yang ditugaskan
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Kelola Lokasi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kelola Lokasi {userName}</DialogTitle>
              <DialogDescription>
                Pilih toko yang bisa diakses oleh karyawan ini
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-2">
                {allLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tidak ada toko yang tersedia
                  </p>
                ) : (
                  allLocations.map((location) => {
                    const isSelected = selectedLocationIds.includes(location.id);
                    const isDefault = defaultLocationId === location.id;

                    return (
                      <div
                        key={location.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isSelected ? "bg-primary/5 border-primary/50" : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          id={`loc-${location.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleLocationSelection(location.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`loc-${location.id}`}
                            className="text-sm font-medium cursor-pointer block"
                          >
                            {location.name}
                          </Label>
                          <p className="text-xs text-muted-foreground truncate">
                            {location.address || location.code}
                          </p>
                        </div>
                        {isSelected && (
                          <Button
                            type="button"
                            variant={isDefault ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => toggleDefault(location.id)}
                            title={isDefault ? "Hapus sebagai default" : "Jadikan default"}
                          >
                            {isDefault ? (
                              <Star className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <StarOff className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button onClick={handleSaveAssignments} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display assigned locations */}
      {userLocations.length === 0 ? (
        <div className="border border-dashed rounded-lg p-4 text-center">
          <Store className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Belum ada lokasi yang ditugaskan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Klik "Kelola Lokasi" untuk menambahkan toko
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {userLocations.map((ul) => (
            <div
              key={ul.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <Store className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{ul.location?.name}</span>
                  {ul.is_default && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {ul.location?.address || ul.location?.code}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!ul.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSetDefault(ul.location_id)}
                    title="Jadikan default"
                  >
                    <StarOff className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveLocation(ul.location_id)}
                  title="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
