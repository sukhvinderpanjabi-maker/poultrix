import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { logDelete } from "@/lib/auditHelper";
import { usePermissions } from "@/lib/permissions";
import { printRecord } from "@/lib/printRecord";
import { useNavigate } from "@/lib/react-router-compat";
import { useCompanyScope } from "@/lib/roleFilter";
import { type Batch, type Farm, type Shed, storage } from "@/lib/storage";
import {
  Bird,
  Building2,
  ExternalLink,
  Home,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

const BREEDS = ["Cobb", "Ross", "Hubbard", "Other"];

function daysBetween(from: string, to: string) {
  const d1 = new Date(from);
  const d2 = new Date(to);
  return Math.max(
    0,
    Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/** Abbreviates farm name: "Demo Poultry Farm" → "Demo P/F" */
function abbreviateFarmName(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0];
  const first = words[0];
  const rest = words
    .slice(1)
    .map((w) => w[0].toUpperCase())
    .join("/");
  return `${first} ${rest}`;
}

/** Returns next batch number for a farm: "Demo P/F-01", "Demo P/F-02", etc. */
function getNextBatchNumber(farmId: string, abbrev: string): string {
  const farmBatches = storage.getBatches().filter((b) => b.farmId === farmId);
  const next = farmBatches.length + 1;
  return `${abbrev}-${String(next).padStart(2, "0")}`;
}

export default function Farms() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh((n) => n + 1);
  const { canUpdate, canDelete, canPrint } = usePermissions();
  const [deleteTarget, setDeleteTarget] = useState<Farm | null>(null);
  const [editFarm, setEditFarm] = useState<Farm | null>(null);

  const {
    farms: scopedFarms,
    zones: allZones,
    branches: allBranches,
    users: allUsers,
    companyId: myCompanyId,
  } = useCompanyScope();
  const farms = scopedFarms as Farm[];

  const allShedsRaw = storage.getSheds();
  const sheds = allShedsRaw.filter((s) =>
    farms.some((f) => f.id === s.farmId),
  ) as Shed[];

  const allBatches = storage.getBatches();
  const batches = allBatches.filter((b) =>
    farms.some((f) => f.id === b.farmId),
  ) as Batch[];

  const companies = storage.getCompanies();

  const supervisors = allUsers.filter((u) => u.role === "Supervisor");
  const dealers = allUsers.filter((u) => u.role === "Dealer");

  // Farm dialog
  const [farmDialog, setFarmDialog] = useState(false);
  const [farmForm, setFarmForm] = useState({
    name: "",
    location: "",
    totalCapacity: "",
    companyId: "",
    zoneId: "",
    branchId: "",
    farmerName: "",
    farmerContact: "",
    address: "",
    supervisorId: "",
    dealerId: "",
  });

  // Shed dialog
  const [shedDialog, setShedDialog] = useState(false);
  const [shedForm, setShedForm] = useState({
    farmId: "",
    name: "",
    capacity: "",
    shedType: "Open" as "Open" | "Environment Controlled",
  });

  // Batch dialog
  const [batchDialog, setBatchDialog] = useState(false);
  const [batchFarmFilter, setBatchFarmFilter] = useState("");
  const [batchForm, setBatchForm] = useState({
    farmId: "",
    shedId: "",
    batchNumber: "",
    placementDate: new Date().toISOString().slice(0, 10),
    chicksQty: "",
    breedType: "Cobb",
    hatcheryName: "",
    initialBodyWeightGrams: "",
    chicksRate: "",
  });

  const canManage = [
    "SuperAdmin",
    "CompanyAdmin",
    "Manager",
    "Supervisor",
  ].includes(currentUser?.role || "");

  const filteredZones = farmForm.companyId
    ? allZones.filter((z) => z.companyId === farmForm.companyId)
    : allZones;
  const filteredBranches = farmForm.zoneId
    ? allBranches.filter((b) => b.zoneId === farmForm.zoneId)
    : farmForm.companyId
      ? allBranches.filter((b) => b.companyId === farmForm.companyId)
      : allBranches;

  // Sheds for selected farm in batch form (only sheds without active batch)
  const batchFormSheds = useMemo(() => {
    if (!batchForm.farmId) return [];
    return sheds.filter((s) => {
      if (s.farmId !== batchForm.farmId) return false;
      const activeBatch = allBatches.find(
        (b) => b.shedId === s.id && b.status === "active",
      );
      return !activeBatch;
    });
  }, [batchForm.farmId, sheds, allBatches]);

  // Auto-generate batch number scoped to the selected farm
  const autoNextBatchNumber = useMemo(() => {
    if (!batchForm.farmId) return "BATCH-01";
    const selectedFarm = farms.find((f) => f.id === batchForm.farmId);
    if (!selectedFarm) return "BATCH-01";
    const abbrev = abbreviateFarmName(selectedFarm.name);
    return getNextBatchNumber(batchForm.farmId, abbrev);
  }, [batchForm.farmId, farms]);

  const saveFarm = () => {
    if (!farmForm.name) return;
    const farmCompanyId =
      currentUser?.role === "SuperAdmin"
        ? farmForm.companyId
        : myCompanyId || farmForm.companyId;
    const newFarm = storage.addFarm({
      name: farmForm.name,
      location: farmForm.location,
      totalCapacity: Number.parseInt(farmForm.totalCapacity) || 0,
      companyId: farmCompanyId || undefined,
      zoneId: farmForm.zoneId || undefined,
      branchId: farmForm.branchId || undefined,
      farmerName: farmForm.farmerName || undefined,
      farmerContact: farmForm.farmerContact || undefined,
      address: farmForm.address || undefined,
      supervisorId: farmForm.supervisorId || undefined,
      dealerId: farmForm.dealerId || undefined,
    });

    // Auto-create default Shed and Batch for the new farm
    if (newFarm) {
      const abbrev = abbreviateFarmName(farmForm.name);
      const newShed = storage.addShed({
        farmId: newFarm.id,
        name: abbrev,
        capacity: Number.parseInt(farmForm.totalCapacity) || 0,
        shedType: "Open",
      });
      if (newShed) {
        storage.addBatch({
          batchNumber: getNextBatchNumber(newFarm.id, abbrev),
          farmId: newFarm.id,
          shedId: newShed.id,
          placementDate: new Date().toISOString().slice(0, 10),
          chicksQty: 0,
          chicksRate: 0,
          transportCost: 0,
          totalPlacementCost: 0,
          birdsAlive: 0,
          status: "active",
          hatcheryName: "",
          breedType: "Cobb",
        });
      }
    }

    refresh();
    setFarmForm({
      name: "",
      location: "",
      totalCapacity: "",
      companyId: "",
      zoneId: "",
      branchId: "",
      farmerName: "",
      farmerContact: "",
      address: "",
      supervisorId: "",
      dealerId: "",
    });
    setFarmDialog(false);
  };

  const confirmDeleteFarm = () => {
    if (!deleteTarget) return;
    logDelete({
      module: "Farms",
      recordId: deleteTarget.id,
      recordSummary: deleteTarget.name,
      user: currentUser,
    });
    storage.deleteFarm(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  };

  const saveShed = () => {
    if (!shedForm.name || !shedForm.farmId) return;
    storage.addShed({
      farmId: shedForm.farmId,
      name: shedForm.name,
      capacity: Number.parseInt(shedForm.capacity) || 0,
      shedType: shedForm.shedType,
    });
    refresh();
    setShedForm({ farmId: "", name: "", capacity: "", shedType: "Open" });
    setShedDialog(false);
  };

  const saveBatch = () => {
    if (!batchForm.farmId || !batchForm.shedId || !batchForm.chicksQty) return;
    const batchNumber = batchForm.batchNumber.trim() || autoNextBatchNumber;

    // Duplicate batch number check scoped to this farm
    const duplicate = storage
      .getBatches()
      .some(
        (b) => b.farmId === batchForm.farmId && b.batchNumber === batchNumber,
      );
    if (duplicate) {
      alert(
        `Batch number "${batchNumber}" already exists for this farm. Please use a different number.`,
      );
      return;
    }

    const qty = Number.parseInt(batchForm.chicksQty) || 0;
    const rate = Number.parseFloat(batchForm.chicksRate) || 0;
    storage.addBatch({
      batchNumber,
      farmId: batchForm.farmId,
      shedId: batchForm.shedId,
      placementDate: batchForm.placementDate,
      hatcheryName: batchForm.hatcheryName,
      breedType: batchForm.breedType,
      chicksQty: qty,
      chicksRate: rate,
      transportCost: 0,
      totalPlacementCost: qty * rate,
      birdsAlive: qty,
      status: "active",
      initialBodyWeightGrams:
        Number.parseInt(batchForm.initialBodyWeightGrams) || undefined,
    });
    refresh();
    setBatchForm({
      farmId: "",
      shedId: "",
      batchNumber: "",
      placementDate: new Date().toISOString().slice(0, 10),
      chicksQty: "",
      breedType: "Cobb",
      hatcheryName: "",
      initialBodyWeightGrams: "",
      chicksRate: "",
    });
    setBatchDialog(false);
  };

  const getCompanyName = (id?: string) =>
    companies.find((c) => c.id === id)?.name || "-";
  const getZoneName = (id?: string) =>
    allZones.find((z) => z.id === id)?.name || "-";
  const getBranchName = (id?: string) =>
    allBranches.find((b) => b.id === id)?.name || "-";
  const getShedName = (id?: string) =>
    allShedsRaw.find((s) => s.id === id)?.name || "-";
  const getUserName = (id?: string) =>
    allUsers.find((u) => u.id === id)?.name || "-";

  const isShedActive = (shedId: string) =>
    allBatches.some((b) => b.shedId === shedId && b.status === "active");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6" data-ocid="farms.page">
      <h2 className="text-2xl font-bold">Farm Management</h2>
      <Tabs defaultValue="farms" data-ocid="farms.tab">
        <TabsList>
          <TabsTrigger value="farms" data-ocid="farms.farms.tab">
            Farms ({farms.length})
          </TabsTrigger>
          <TabsTrigger value="sheds" data-ocid="farms.sheds.tab">
            Sheds ({sheds.length})
          </TabsTrigger>
          <TabsTrigger value="batches" data-ocid="farms.batches.tab">
            Batches ({batches.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== FARMS TAB ===== */}
        <TabsContent value="farms" className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button
                onClick={() => setFarmDialog(true)}
                data-ocid="farms.add_farm.button"
              >
                <Plus size={16} className="mr-1" />
                Add Farm
              </Button>
            </div>
          )}
          {farms.length === 0 ? (
            <Card data-ocid="farms.empty_state">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Building2 size={40} className="mx-auto mb-2" />
                <p>No farms added yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="farms.table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Farm Name</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Zone</th>
                    <th className="text-left p-2">Branch</th>
                    <th className="text-left p-2">Farmer</th>
                    <th className="text-left p-2">Supervisor</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-right p-2">Capacity</th>
                    <th className="text-right p-2">Sheds</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {farms.map((f, i) => (
                    <tr
                      key={f.id}
                      className="border-b hover:bg-muted/30"
                      data-ocid={`farms.row.${i + 1}`}
                    >
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-medium">
                        <button
                          type="button"
                          onClick={() => navigate(`/farm-dashboard/${f.id}`)}
                          data-ocid={`farms.dashboard.link.${i + 1}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {f.name}
                          <ExternalLink size={12} />
                        </button>
                      </td>
                      <td className="p-2">
                        {f.companyId ? (
                          <Badge variant="outline">
                            {getCompanyName(f.companyId)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {f.zoneId ? (
                          <Badge variant="secondary">
                            {getZoneName(f.zoneId)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        {f.branchId ? (
                          <Badge>{getBranchName(f.branchId)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">{f.farmerName || "-"}</div>
                        {f.farmerContact && (
                          <div className="text-xs text-muted-foreground">
                            {f.farmerContact}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-sm">
                        {f.supervisorId ? getUserName(f.supervisorId) : "-"}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {f.address || f.location || "-"}
                      </td>
                      <td className="p-2 text-right">
                        {f.totalCapacity.toLocaleString()}
                      </td>
                      <td className="p-2 text-right">
                        {sheds.filter((s) => s.farmId === f.id).length}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1 justify-end">
                          {canUpdate && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditFarm(f)}
                              data-ocid={`farms.edit_button.${i + 1}`}
                              title="Edit farm"
                            >
                              <Pencil size={14} className="text-blue-600" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(f)}
                              data-ocid={`farms.delete_button.${i + 1}`}
                              title="Delete farm"
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </Button>
                          )}
                          {canPrint && (
                            <Button
                              size="icon"
                              variant="ghost"
                              data-ocid={`farms.print_button.${i + 1}`}
                              title="Print farm"
                              onClick={() => {
                                const company = companies.find(
                                  (c) => c.id === f.companyId,
                                );
                                printRecord({
                                  companyName: company?.name,
                                  farmName: f.name,
                                  module: "Farm Management",
                                  generatedBy: currentUser?.name,
                                  entryDetails: {
                                    "Farm Name": f.name,
                                    Location: f.location,
                                    "Total Capacity": f.totalCapacity,
                                    "Farmer Name": f.farmerName,
                                    "Farmer Contact": f.farmerContact,
                                    Address: f.address,
                                  },
                                });
                              }}
                            >
                              <Printer size={14} className="text-green-600" />
                            </Button>
                          )}
                          {!canUpdate &&
                            !canDelete &&
                            !canPrint &&
                            canManage && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteTarget(f)}
                                data-ocid={`farms.delete_button.${i + 1}`}
                                title="Delete farm"
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== SHEDS TAB ===== */}
        <TabsContent value="sheds" className="space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Button
                onClick={() => setShedDialog(true)}
                data-ocid="farms.add_shed.button"
              >
                <Plus size={16} className="mr-1" />
                Add Shed
              </Button>
            </div>
          )}
          {sheds.length === 0 ? (
            <Card data-ocid="farms.sheds.empty_state">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Home size={40} className="mx-auto mb-2" />
                <p>No sheds added yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="farms.sheds.table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Shed Name</th>
                    <th className="text-left p-2">Farm</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Zone</th>
                    <th className="text-left p-2">Branch</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Capacity</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sheds.map((s, i) => {
                    const farm = farms.find((f) => f.id === s.farmId);
                    const active = isShedActive(s.id);
                    return (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-muted/30"
                        data-ocid={`farms.shed.row.${i + 1}`}
                      >
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2">{farm?.name || "-"}</td>
                        <td className="p-2">
                          {farm?.companyId ? (
                            <Badge variant="outline">
                              {getCompanyName(farm.companyId)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {farm?.zoneId ? (
                            <Badge variant="secondary">
                              {getZoneName(farm.zoneId)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2">
                          {farm?.branchId ? (
                            <Badge>{getBranchName(farm.branchId)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">{s.shedType || "Open"}</td>
                        <td className="p-2 text-right">
                          {s.capacity.toLocaleString()}
                        </td>
                        <td className="p-2">
                          {active ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Empty</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== BATCHES TAB ===== */}
        <TabsContent value="batches" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm shrink-0">Filter by Farm:</Label>
              <select
                value={batchFarmFilter}
                onChange={(e) => setBatchFarmFilter(e.target.value)}
                data-ocid="farms.batch_farm.select"
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value="">All Farms</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            {canManage && (
              <Button
                onClick={() => {
                  setBatchForm((b) => ({
                    ...b,
                    batchNumber: autoNextBatchNumber,
                  }));
                  setBatchDialog(true);
                }}
                data-ocid="farms.add_batch.button"
              >
                <Plus size={16} className="mr-1" />
                Add Batch
              </Button>
            )}
          </div>
          {(() => {
            const filtered = batches.filter(
              (b) => !batchFarmFilter || b.farmId === batchFarmFilter,
            );
            if (filtered.length === 0) {
              return (
                <Card data-ocid="farms.batches.empty_state">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Bird size={40} className="mx-auto mb-2" />
                    <p>No batches found.</p>
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  data-ocid="farms.batches.table"
                >
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Batch No</th>
                      <th className="text-left p-2">Farm</th>
                      <th className="text-left p-2">Shed</th>
                      <th className="text-left p-2">Placement Date</th>
                      <th className="text-right p-2">Chicks</th>
                      <th className="text-left p-2">Breed</th>
                      <th className="text-left p-2">Hatchery</th>
                      <th className="text-right p-2">Age (days)</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => {
                      const farm = farms.find((f) => f.id === b.farmId);
                      const age = daysBetween(b.placementDate, today);
                      return (
                        <tr
                          key={b.id}
                          className="border-b hover:bg-muted/30"
                          data-ocid={`farms.batch.row.${i + 1}`}
                        >
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2 font-medium">{b.batchNumber}</td>
                          <td className="p-2">{farm?.name || "-"}</td>
                          <td className="p-2">{getShedName(b.shedId)}</td>
                          <td className="p-2">{b.placementDate}</td>
                          <td className="p-2 text-right">
                            {b.chicksQty.toLocaleString()}
                          </td>
                          <td className="p-2">{b.breedType}</td>
                          <td className="p-2">{b.hatcheryName || "-"}</td>
                          <td className="p-2 text-right">{age}</td>
                          <td className="p-2">
                            {b.status === "active" ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {b.status === "closed" ? "Closed" : "Sold"}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* ===== ADD FARM DIALOG ===== */}
      <Dialog open={farmDialog} onOpenChange={setFarmDialog}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="farms.add_farm.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Farm</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">
            A default Shed and Batch will be auto-generated from the farm name.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Farm Name *</Label>
              <Input
                data-ocid="farms.farm_name.input"
                value={farmForm.name}
                onChange={(e) =>
                  setFarmForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Green Valley Farm"
              />
              {farmForm.name.trim() && (
                <p className="text-xs text-muted-foreground mt-1">
                  Shed: <strong>{abbreviateFarmName(farmForm.name)}</strong> ·
                  Batch: <strong>{abbreviateFarmName(farmForm.name)}-01</strong>
                </p>
              )}
            </div>
            <div>
              <Label>Location</Label>
              <Input
                data-ocid="farms.farm_location.input"
                value={farmForm.location}
                onChange={(e) =>
                  setFarmForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="District / Tehsil"
              />
            </div>
            <div>
              <Label>Full Address</Label>
              <Input
                data-ocid="farms.farm_address.input"
                value={farmForm.address}
                onChange={(e) =>
                  setFarmForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Full address"
              />
            </div>
            <div>
              <Label>Total Capacity (birds)</Label>
              <Input
                data-ocid="farms.farm_capacity.input"
                type="number"
                value={farmForm.totalCapacity}
                onChange={(e) =>
                  setFarmForm((f) => ({
                    ...f,
                    totalCapacity: e.target.value,
                  }))
                }
                placeholder="e.g. 50000"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Company</Label>
                <select
                  data-ocid="farms.farm_company.select"
                  value={farmForm.companyId}
                  onChange={(e) =>
                    setFarmForm((f) => ({
                      ...f,
                      companyId: e.target.value,
                      zoneId: "",
                      branchId: "",
                    }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- Select --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Zone</Label>
                <select
                  data-ocid="farms.farm_zone.select"
                  value={farmForm.zoneId}
                  onChange={(e) =>
                    setFarmForm((f) => ({
                      ...f,
                      zoneId: e.target.value,
                      branchId: "",
                    }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- Select --</option>
                  {filteredZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Branch</Label>
                <select
                  data-ocid="farms.farm_branch.select"
                  value={farmForm.branchId}
                  onChange={(e) =>
                    setFarmForm((f) => ({ ...f, branchId: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- Select --</option>
                  {filteredBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Farmer Name</Label>
                <Input
                  data-ocid="farms.farmer_name.input"
                  value={farmForm.farmerName}
                  onChange={(e) =>
                    setFarmForm((f) => ({ ...f, farmerName: e.target.value }))
                  }
                  placeholder="Farmer full name"
                />
              </div>
              <div>
                <Label>Farmer Contact</Label>
                <Input
                  data-ocid="farms.farmer_contact.input"
                  type="tel"
                  value={farmForm.farmerContact}
                  onChange={(e) =>
                    setFarmForm((f) => ({
                      ...f,
                      farmerContact: e.target.value,
                    }))
                  }
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Supervisor Assigned</Label>
                <select
                  data-ocid="farms.supervisor.select"
                  value={farmForm.supervisorId}
                  onChange={(e) =>
                    setFarmForm((f) => ({
                      ...f,
                      supervisorId: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- None --</option>
                  {supervisors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Dealer Assigned</Label>
                <select
                  data-ocid="farms.dealer.select"
                  value={farmForm.dealerId}
                  onChange={(e) =>
                    setFarmForm((f) => ({ ...f, dealerId: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  <option value="">-- None --</option>
                  {dealers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFarmDialog(false)}
              data-ocid="farms.add_farm.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={saveFarm} data-ocid="farms.add_farm.submit_button">
              Save Farm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ADD SHED DIALOG ===== */}
      <Dialog open={shedDialog} onOpenChange={setShedDialog}>
        <DialogContent data-ocid="farms.add_shed.dialog">
          <DialogHeader>
            <DialogTitle>Add New Shed</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <select
                data-ocid="farms.shed_farm.select"
                value={shedForm.farmId}
                onChange={(e) =>
                  setShedForm((f) => ({ ...f, farmId: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm bg-background"
              >
                <option value="">-- Select Farm --</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Shed Name / Number *</Label>
              <Input
                data-ocid="farms.shed_name.input"
                value={shedForm.name}
                onChange={(e) =>
                  setShedForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Shed A or Shed 1"
              />
            </div>
            <div>
              <Label>Capacity (birds)</Label>
              <Input
                data-ocid="farms.shed_capacity.input"
                type="number"
                value={shedForm.capacity}
                onChange={(e) =>
                  setShedForm((f) => ({ ...f, capacity: e.target.value }))
                }
                placeholder="e.g. 20000"
              />
            </div>
            <div>
              <Label>Shed Type</Label>
              <select
                data-ocid="farms.shed_type.select"
                value={shedForm.shedType}
                onChange={(e) =>
                  setShedForm((f) => ({
                    ...f,
                    shedType: e.target.value as
                      | "Open"
                      | "Environment Controlled",
                  }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm bg-background"
              >
                <option value="Open">Open</option>
                <option value="Environment Controlled">
                  Environment Controlled
                </option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShedDialog(false)}
              data-ocid="farms.add_shed.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={saveShed} data-ocid="farms.add_shed.submit_button">
              Save Shed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ADD BATCH DIALOG ===== */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="farms.add_batch.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Batch / Flock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <select
                data-ocid="farms.batch_farm_form.select"
                value={batchForm.farmId}
                onChange={(e) =>
                  setBatchForm((b) => ({
                    ...b,
                    farmId: e.target.value,
                    shedId: "",
                    batchNumber: "",
                  }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm bg-background"
              >
                <option value="">-- Select Farm --</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Shed *</Label>
              <select
                data-ocid="farms.batch_shed.select"
                value={batchForm.shedId}
                onChange={(e) =>
                  setBatchForm((b) => ({ ...b, shedId: e.target.value }))
                }
                className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                disabled={!batchForm.farmId}
              >
                <option value="">-- Select Shed --</option>
                {batchFormSheds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {batchForm.farmId && batchFormSheds.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  All sheds in this farm already have an active batch.
                </p>
              )}
            </div>
            <div>
              <Label>Batch Number</Label>
              <Input
                data-ocid="farms.batch_number.input"
                value={batchForm.batchNumber}
                onChange={(e) =>
                  setBatchForm((b) => ({
                    ...b,
                    batchNumber: e.target.value,
                  }))
                }
                placeholder={autoNextBatchNumber}
              />
            </div>
            <div>
              <Label>Placement Date *</Label>
              <Input
                data-ocid="farms.batch_date.input"
                type="date"
                value={batchForm.placementDate}
                onChange={(e) =>
                  setBatchForm((b) => ({
                    ...b,
                    placementDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Number of Chicks *</Label>
              <Input
                data-ocid="farms.batch_chicks.input"
                type="number"
                value={batchForm.chicksQty}
                onChange={(e) =>
                  setBatchForm((b) => ({ ...b, chicksQty: e.target.value }))
                }
                placeholder="e.g. 20000"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Chick Breed</Label>
                <select
                  data-ocid="farms.batch_breed.select"
                  value={batchForm.breedType}
                  onChange={(e) =>
                    setBatchForm((b) => ({ ...b, breedType: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-background"
                >
                  {BREEDS.map((br) => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Chick Rate (₹)</Label>
                <Input
                  data-ocid="farms.batch_rate.input"
                  type="number"
                  value={batchForm.chicksRate}
                  onChange={(e) =>
                    setBatchForm((b) => ({ ...b, chicksRate: e.target.value }))
                  }
                  placeholder="Rate per chick"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Hatchery Name</Label>
                <Input
                  data-ocid="farms.batch_hatchery.input"
                  value={batchForm.hatcheryName}
                  onChange={(e) =>
                    setBatchForm((b) => ({
                      ...b,
                      hatcheryName: e.target.value,
                    }))
                  }
                  placeholder="Hatchery name"
                />
              </div>
              <div>
                <Label>Initial Body Weight (g)</Label>
                <Input
                  data-ocid="farms.batch_initial_weight.input"
                  type="number"
                  value={batchForm.initialBodyWeightGrams}
                  onChange={(e) =>
                    setBatchForm((b) => ({
                      ...b,
                      initialBodyWeightGrams: e.target.value,
                    }))
                  }
                  placeholder="e.g. 42"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBatchDialog(false)}
              data-ocid="farms.add_batch.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={saveBatch}
              disabled={
                !batchForm.farmId || !batchForm.shedId || !batchForm.chicksQty
              }
              data-ocid="farms.add_batch.submit_button"
            >
              Save Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteFarm}
        recordSummary={deleteTarget?.name}
      />

      {/* Edit Farm Dialog */}
      <Dialog
        open={!!editFarm}
        onOpenChange={(v) => {
          if (!v) setEditFarm(null);
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="farms.edit_farm.dialog"
        >
          <DialogHeader>
            <DialogTitle>Edit Farm</DialogTitle>
          </DialogHeader>
          {editFarm && (
            <div className="space-y-3">
              <div>
                <Label>Farm Name</Label>
                <Input
                  data-ocid="farms.edit_farm_name.input"
                  value={editFarm.name}
                  onChange={(e) =>
                    setEditFarm((f) => (f ? { ...f, name: e.target.value } : f))
                  }
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  data-ocid="farms.edit_location.input"
                  value={editFarm.location}
                  onChange={(e) =>
                    setEditFarm((f) =>
                      f ? { ...f, location: e.target.value } : f,
                    )
                  }
                />
              </div>
              <div>
                <Label>Full Address</Label>
                <Input
                  data-ocid="farms.edit_address.input"
                  value={editFarm.address || ""}
                  onChange={(e) =>
                    setEditFarm((f) =>
                      f ? { ...f, address: e.target.value } : f,
                    )
                  }
                />
              </div>
              <div>
                <Label>Total Capacity (birds)</Label>
                <Input
                  data-ocid="farms.edit_capacity.input"
                  type="number"
                  value={editFarm.totalCapacity}
                  onChange={(e) =>
                    setEditFarm((f) =>
                      f
                        ? { ...f, totalCapacity: Number(e.target.value) || 0 }
                        : f,
                    )
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Farmer Name</Label>
                  <Input
                    data-ocid="farms.edit_farmer_name.input"
                    value={editFarm.farmerName || ""}
                    onChange={(e) =>
                      setEditFarm((f) =>
                        f ? { ...f, farmerName: e.target.value } : f,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Farmer Contact</Label>
                  <Input
                    data-ocid="farms.edit_farmer_contact.input"
                    value={editFarm.farmerContact || ""}
                    onChange={(e) =>
                      setEditFarm((f) =>
                        f ? { ...f, farmerContact: e.target.value } : f,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditFarm(null)}
              data-ocid="farms.edit_farm.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editFarm) return;
                storage.updateFarm(editFarm.id, editFarm);
                setEditFarm(null);
                refresh();
              }}
              data-ocid="farms.edit_farm.save_button"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
