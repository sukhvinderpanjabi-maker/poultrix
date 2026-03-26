import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { type PendingSettlement, storage } from "@/lib/storage";
import { CheckSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function ProductionSettlements() {
  const { currentUser } = useAuth();
  const { farms } = useCompanyScope();
  const farmIds = useMemo(() => new Set(farms.map((f) => f.id)), [farms]);
  const [settlements, setSettlements] = useState<PendingSettlement[]>(() =>
    storage.getPendingSettlements(),
  );

  const visible = useMemo(() => {
    return settlements.filter((s) => farmIds.has(s.farmId));
  }, [settlements, farmIds]);

  const canConfirm =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "CompanyAdmin";

  const handleConfirm = (s: PendingSettlement) => {
    storage.confirmPendingSettlement(s.id, currentUser?.name || "Admin");
    // Create ledger entry for the farmer
    const farm = farms.find((f) => f.id === s.farmId);
    if (farm) {
      const users = storage.getUsers();
      const farmer = users.find(
        (u) => u.role === "Farmer" && u.assignedFarmIds?.includes(s.farmId),
      );
      if (farmer) {
        storage.addLedgerEntry({
          farmerId: farmer.id,
          type: "gc_earning",
          amount: s.totalGCPayable,
          description: `GC Settlement - Batch ${s.batchNumber}`,
          date: new Date().toISOString().split("T")[0],
          batchId: s.batchId,
          settlementId: s.id,
        });
      }
    }
    setSettlements(storage.getPendingSettlements());
    toast.success("Settlement confirmed and posted to farmer ledger.");
  };

  const getFarmName = (farmId: string) =>
    farms.find((f) => f.id === farmId)?.name || farmId;

  return (
    <div data-ocid="settlements.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CheckSquare size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Production Settlements</h1>
          <p className="text-sm text-muted-foreground">
            Review and confirm GC settlements before posting to farmer ledger
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settlement Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {visible.length === 0 ? (
            <div
              data-ocid="settlements.empty_state"
              className="py-12 text-center text-muted-foreground text-sm"
            >
              No settlements found. Close a production batch to generate a
              settlement.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="settlements.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch No</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Birds Placed</TableHead>
                    <TableHead>Birds Sold</TableHead>
                    <TableHead>Mortality %</TableHead>
                    <TableHead>Final FCR</TableHead>
                    <TableHead>GC Rate</TableHead>
                    <TableHead>Total GC (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Closed At</TableHead>
                    {canConfirm && (
                      <TableHead className="text-right">Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((s, idx) => (
                    <TableRow
                      key={s.id}
                      data-ocid={`settlements.row.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {s.batchNumber}
                      </TableCell>
                      <TableCell>{getFarmName(s.farmId)}</TableCell>
                      <TableCell>{s.birdsPlaced.toLocaleString()}</TableCell>
                      <TableCell>{s.birdsSold.toLocaleString()}</TableCell>
                      <TableCell>{s.mortalityPct.toFixed(2)}%</TableCell>
                      <TableCell>{s.finalFCR.toFixed(3)}</TableCell>
                      <TableCell>₹{s.gcRatePerBird.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹
                        {s.totalGCPayable.toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            s.status === "confirmed"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }
                        >
                          {s.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.closedAt.split("T")[0]}
                      </TableCell>
                      {canConfirm && (
                        <TableCell className="text-right">
                          {s.status === "pending" ? (
                            <Button
                              size="sm"
                              data-ocid={`settlements.confirm_button.${idx + 1}`}
                              onClick={() => handleConfirm(s)}
                            >
                              Confirm &amp; Post
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Posted
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
