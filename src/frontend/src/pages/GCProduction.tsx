import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useCompanyScope } from "@/lib/roleFilter";
import { useAccessibleFarmIds } from "@/lib/roleFilter";
import { type Batch, type GCScheme, storage } from "@/lib/storage";
import { BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type CloseForm = {
  schemeId: string;
  totalFeedKg: string;
  avgBodyWeightKg: string;
  birdsSold: string;
};

export default function GCProduction() {
  const { currentUser } = useAuth();
  const accessibleFarmIds = useAccessibleFarmIds();
  const [batches, setBatches] = useState<Batch[]>(() => storage.getBatches());
  const { farms: scopedFarms, gcSchemes } = useCompanyScope();
  const [schemes, setSchemes] = useState<GCScheme[]>(() => gcSchemes);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [closeForm, setCloseForm] = useState<CloseForm>({
    schemeId: "",
    totalFeedKg: "",
    avgBodyWeightKg: "",
    birdsSold: "",
  });

  const farms = scopedFarms;
  const sheds = useMemo(() => storage.getSheds(), []);

  const activeBatches = useMemo(() => {
    const allActive = batches.filter((b) => b.status === "active");
    if (accessibleFarmIds === null) return allActive;
    return allActive.filter((b) => accessibleFarmIds.includes(b.farmId));
  }, [batches, accessibleFarmIds]);

  const selectedScheme = useMemo(
    () => schemes.find((s) => s.id === closeForm.schemeId) || null,
    [schemes, closeForm.schemeId],
  );

  const calc = useMemo(() => {
    if (!selectedBatch || !selectedScheme) return null;
    const birdsSold = Number.parseInt(closeForm.birdsSold) || 0;
    const totalFeedKg = Number.parseFloat(closeForm.totalFeedKg) || 0;
    const avgBodyWeightKg = Number.parseFloat(closeForm.avgBodyWeightKg) || 0;
    const mortalityCount = selectedBatch.chicksQty - birdsSold;
    const mortalityPct =
      selectedBatch.chicksQty > 0
        ? (mortalityCount / selectedBatch.chicksQty) * 100
        : 0;
    const finalFCR =
      birdsSold > 0 && avgBodyWeightKg > 0
        ? totalFeedKg / (birdsSold * avgBodyWeightKg)
        : 0;
    const fcrBonus =
      finalFCR > 0 && finalFCR < selectedScheme.standardFCR
        ? birdsSold * selectedScheme.fcrBonusPerBird
        : 0;
    const mortalityPenalty =
      mortalityPct > selectedScheme.standardMortalityPct
        ? birdsSold * selectedScheme.mortalityPenaltyPerBird
        : 0;
    const totalGCPayable =
      birdsSold * selectedScheme.baseGCRate + fcrBonus - mortalityPenalty;
    return {
      birdsSold,
      totalFeedKg,
      avgBodyWeightKg,
      mortalityCount,
      mortalityPct,
      finalFCR,
      fcrBonus,
      mortalityPenalty,
      totalGCPayable,
    };
  }, [selectedBatch, selectedScheme, closeForm]);

  const openCloseDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setCloseForm({
      schemeId: schemes[0]?.id || "",
      totalFeedKg: "",
      avgBodyWeightKg: "",
      birdsSold: String(batch.birdsAlive),
    });
    // refresh schemes
    setSchemes(gcSchemes);
  };

  const handleConfirm = () => {
    if (!selectedBatch || !selectedScheme || !calc) {
      toast.error("Please fill all required fields.");
      return;
    }
    storage.addPendingSettlement({
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      farmId: selectedBatch.farmId,
      schemeId: selectedScheme.id,
      birdsPlaced: selectedBatch.chicksQty,
      birdsSold: calc.birdsSold,
      mortalityCount: calc.mortalityCount,
      mortalityPct: calc.mortalityPct,
      totalFeedKg: calc.totalFeedKg,
      avgBodyWeightKg: calc.avgBodyWeightKg,
      finalFCR: calc.finalFCR,
      gcRatePerBird: selectedScheme.baseGCRate,
      fcrBonus: calc.fcrBonus,
      mortalityPenalty: calc.mortalityPenalty,
      totalGCPayable: calc.totalGCPayable,
      closedAt: new Date().toISOString(),
      closedBy: currentUser?.name || "Unknown",
      status: "pending",
    });
    storage.updateBatch(selectedBatch.id, { status: "closed" });
    setBatches(storage.getBatches());
    setSelectedBatch(null);
    toast.success(
      `Production book closed. Total GC Payable: ₹${calc.totalGCPayable.toFixed(2)}`,
    );
  };

  const getFarmName = (farmId: string) =>
    farms.find((f) => f.id === farmId)?.name || farmId;
  const getShedName = (shedId: string) =>
    sheds.find((s) => s.id === shedId)?.name || shedId;

  return (
    <div data-ocid="gc_production.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Production Book
          </h1>
          <p className="text-sm text-muted-foreground">
            Close production cycles and calculate growing charges
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeBatches.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No active batches found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="gc_production.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch No</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Shed</TableHead>
                    <TableHead>Placement Date</TableHead>
                    <TableHead>Birds Placed</TableHead>
                    <TableHead>Birds Alive</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBatches.map((batch, idx) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        {batch.batchNumber}
                      </TableCell>
                      <TableCell>{getFarmName(batch.farmId)}</TableCell>
                      <TableCell>{getShedName(batch.shedId)}</TableCell>
                      <TableCell>{batch.placementDate}</TableCell>
                      <TableCell>{batch.chicksQty.toLocaleString()}</TableCell>
                      <TableCell>{batch.birdsAlive.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`gc_production.close_button.${idx + 1}`}
                          onClick={() => openCloseDialog(batch)}
                        >
                          Close Production Book
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedBatch}
        onOpenChange={(open) => !open && setSelectedBatch(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Close Production Book — Batch {selectedBatch?.batchNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>GC Scheme</Label>
              <Select
                value={closeForm.schemeId}
                onValueChange={(v) =>
                  setCloseForm((p) => ({ ...p, schemeId: v }))
                }
              >
                <SelectTrigger data-ocid="gc_production.scheme.select">
                  <SelectValue placeholder="Select GC Scheme" />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Total Feed (kg)</Label>
                <Input
                  type="number"
                  data-ocid="gc_production.feed.input"
                  placeholder="e.g. 45000"
                  value={closeForm.totalFeedKg}
                  onChange={(e) =>
                    setCloseForm((p) => ({ ...p, totalFeedKg: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Avg Body Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  data-ocid="gc_production.weight.input"
                  placeholder="e.g. 2.1"
                  value={closeForm.avgBodyWeightKg}
                  onChange={(e) =>
                    setCloseForm((p) => ({
                      ...p,
                      avgBodyWeightKg: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Birds Sold</Label>
                <Input
                  type="number"
                  data-ocid="gc_production.sold.input"
                  value={closeForm.birdsSold}
                  onChange={(e) =>
                    setCloseForm((p) => ({ ...p, birdsSold: e.target.value }))
                  }
                />
              </div>
            </div>

            {calc && selectedScheme && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="font-semibold text-foreground mb-2">
                  Auto-Calculated Results
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">
                    Mortality Count:
                  </span>
                  <span className="font-medium">
                    {calc.mortalityCount.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Mortality %:</span>
                  <span className="font-medium">
                    {calc.mortalityPct.toFixed(2)}%
                  </span>
                  <span className="text-muted-foreground">Final FCR:</span>
                  <span className="font-medium">
                    {calc.finalFCR.toFixed(3)}
                  </span>
                  <span className="text-muted-foreground">FCR Bonus:</span>
                  <span className="font-medium text-green-600">
                    ₹{calc.fcrBonus.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    Mortality Penalty:
                  </span>
                  <span className="font-medium text-red-600">
                    ₹{calc.mortalityPenalty.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    Total GC Payable:
                  </span>
                  <span className="font-bold text-primary text-base">
                    ₹{calc.totalGCPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="gc_production.cancel_button"
              onClick={() => setSelectedBatch(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="gc_production.confirm_button"
              onClick={handleConfirm}
              disabled={!calc || !selectedScheme}
            >
              Close & Calculate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
