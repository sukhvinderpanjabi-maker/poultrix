import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  downloadCSV as nativeCSV,
  downloadExcel as nativeExcel,
  printAsPDF,
} from "@/lib/exportUtils";
import { useAccessibleFarmIds, useCompanyScope } from "@/lib/roleFilter";
import { type Branch, type Company, type Zone, storage } from "@/lib/storage";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useMemo, useState } from "react";

type Row = Record<string, string | number>;

function lookupName(
  id: string | undefined,
  list: { id: string; name: string }[],
): string {
  return id ? (list.find((x) => x.id === id)?.name ?? "-") : "-";
}

function downloadCSV(rows: Row[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${r[h]}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function downloadExcel(rows: Row[], filename: string) {
  nativeExcel(rows, filename);
}

function downloadPDF(rows: Row[], title: string, filename: string) {
  printAsPDF(rows, title, filename);
}

function ReportTable({
  rows,
  title,
  filename,
}: { rows: Row[]; title: string; filename: string }) {
  const cols = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" data-ocid="reports.export.section">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => downloadExcel(rows, `${filename}.xlsx`)}
          data-ocid="reports.excel.button"
        >
          <FileSpreadsheet size={14} className="mr-1" />
          Excel
        </Button>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => downloadPDF(rows, title, `${filename}.pdf`)}
          data-ocid="reports.pdf.button"
        >
          <FileText size={14} className="mr-1" />
          PDF
        </Button>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => downloadCSV(rows, `${filename}.csv`)}
          data-ocid="reports.csv.button"
        >
          <Download size={14} className="mr-1" />
          CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.print()}
          data-ocid="reports.print.button"
        >
          <Printer size={14} className="mr-1" />
          Print
        </Button>
      </div>
      {rows.length === 0 ? (
        <Card data-ocid="reports.empty_state">
          <CardContent className="p-6 text-center text-muted-foreground">
            No data available for this report.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
          <table
            className="w-full text-sm border-collapse"
            data-ocid="reports.data.table"
          >
            <thead>
              <tr className="border-b bg-muted/50">
                {cols.map((c) => (
                  <th key={c} className="text-left p-2 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={JSON.stringify(r).slice(0, 32)}
                  className="border-b hover:bg-muted/30 even:bg-muted/10"
                >
                  {cols.map((c) => (
                    <td key={c} className="p-2">
                      {String(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { currentUser } = useAuth();
  const accessibleFarmIds = useAccessibleFarmIds();
  const {
    zones: allZones,
    branches: allBranches,
    users: allUsers,
    farms: scopedFarms,
  } = useCompanyScope();
  const allFarmsScoped = scopedFarms;

  const allBatches = storage.getBatches();
  const allFarms = allFarmsScoped;
  const allDailyEntries = storage.getDailyEntries();
  const feedPurchases = storage.getFeedPurchases();
  const allBirdSalesFull = storage.getBirdSales();
  const farmIds = new Set(allFarms.map((f) => f.id));
  const allBirdSales = allBirdSalesFull.filter((s) => farmIds.has(s.farmId));
  const allPayments = storage.getPayments();
  const allReceipts = storage.getReceipts();

  const allCompanies = storage.getCompanies();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [farmFilter, setFarmFilter] = useState("");
  const [farmerFilter, setFarmerFilter] = useState("");

  // Role-accessible base farms
  const accessibleFarms = allFarms.filter(
    (f) => accessibleFarmIds === null || accessibleFarmIds.includes(f.id),
  );

  // Companies visible to user (based on accessible farms)
  const accessibleCompanyIds = useMemo(() => {
    if (accessibleFarmIds === null) return null;
    const ids = new Set(
      accessibleFarms.map((f) => f.companyId).filter(Boolean) as string[],
    );
    return [...ids];
  }, [accessibleFarmIds, accessibleFarms]);

  const visibleCompanies = useMemo(() => {
    if (accessibleCompanyIds === null) return allCompanies;
    return allCompanies.filter((c) => accessibleCompanyIds.includes(c.id));
  }, [accessibleCompanyIds, allCompanies]);

  // Zones filtered by selected company (and role-accessible)
  const visibleZones = useMemo(() => {
    const baseZones = allZones.filter(
      (z) =>
        accessibleCompanyIds === null ||
        accessibleCompanyIds.includes(z.companyId),
    );
    if (!companyFilter) return baseZones;
    return baseZones.filter((z) => z.companyId === companyFilter);
  }, [accessibleCompanyIds, companyFilter, allZones]);

  // Branches filtered by selected zone (and company)
  const visibleBranches = useMemo(() => {
    const baseBranches = allBranches.filter(
      (b) =>
        accessibleCompanyIds === null ||
        accessibleCompanyIds.includes(b.companyId),
    );
    if (zoneFilter) return baseBranches.filter((b) => b.zoneId === zoneFilter);
    if (companyFilter)
      return baseBranches.filter((b) => b.companyId === companyFilter);
    return baseBranches;
  }, [accessibleCompanyIds, zoneFilter, companyFilter, allBranches]);

  // Farms filtered by company/zone/branch cascades
  const visibleFarms = useMemo(() => {
    if (branchFilter)
      return accessibleFarms.filter((f) => f.branchId === branchFilter);
    if (zoneFilter)
      return accessibleFarms.filter((f) => f.zoneId === zoneFilter);
    if (companyFilter)
      return accessibleFarms.filter((f) => f.companyId === companyFilter);
    return accessibleFarms;
  }, [accessibleFarms, companyFilter, zoneFilter, branchFilter]);

  // Farmers visible to current user
  const farmerUsers = allUsers.filter(
    (u) =>
      u.role === "Farmer" &&
      (accessibleFarmIds === null ||
        (u.assignedFarmIds || []).some((fid) =>
          accessibleFarmIds.includes(fid),
        )),
  );

  // Effective farm IDs after all filters
  const effectiveFarmIds: string[] | null = useMemo(() => {
    const baseIds = visibleFarms.map((f) => f.id);
    if (farmerFilter) {
      const farmer = allUsers.find((u) => u.id === farmerFilter);
      const farmerFarms = farmer?.assignedFarmIds || [];
      return farmerFarms.filter((fid) => baseIds.includes(fid));
    }
    if (farmFilter) {
      return baseIds.includes(farmFilter) ? [farmFilter] : [];
    }
    if (
      accessibleFarmIds === null &&
      !companyFilter &&
      !zoneFilter &&
      !branchFilter
    )
      return null;
    return baseIds;
  }, [
    visibleFarms,
    farmerFilter,
    farmFilter,
    accessibleFarmIds,
    companyFilter,
    zoneFilter,
    branchFilter,
    allUsers,
  ]);

  const batches =
    effectiveFarmIds === null
      ? allBatches
      : allBatches.filter((b) => effectiveFarmIds.includes(b.farmId));
  const farms =
    effectiveFarmIds === null
      ? allFarms
      : allFarms.filter((f) => effectiveFarmIds.includes(f.id));
  const batchIds = new Set(batches.map((b) => b.id));
  const dailyEntries = allDailyEntries.filter((e) => batchIds.has(e.batchId));
  const birdSales =
    effectiveFarmIds === null
      ? allBirdSales
      : allBirdSales.filter((s) => effectiveFarmIds.includes(s.farmId));
  const payments =
    effectiveFarmIds === null
      ? allPayments
      : allPayments.filter((p) => effectiveFarmIds.includes(p.farmId));
  const receipts =
    effectiveFarmIds === null
      ? allReceipts
      : allReceipts.filter((r) => effectiveFarmIds.includes(r.farmId));

  const dailyRows = (
    batchFilter
      ? dailyEntries.filter((e) => e.batchId === batchFilter)
      : dailyEntries
  )
    .filter(
      (e) =>
        (!dateFrom || e.entryDate >= dateFrom) &&
        (!dateTo || e.entryDate <= dateTo),
    )
    .map((e) => {
      const batch = allBatches.find((b) => b.id === e.batchId);
      const farm = allFarms.find((f) => f.id === batch?.farmId);
      return {
        Date: e.entryDate,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        Batch: batch?.batchNumber ?? "-",
        "Birds Alive": e.birdsAlive,
        Mortality: e.mortalityCount,
        "Cull Birds": e.cullBirds,
        "Feed (g)": e.feedIntakeGrams,
        "Weight (g)": e.bodyWeightGrams,
        FCR: e.fcr,
        "Mortality%": e.mortalityPct,
        Medicine: e.medicineUsed ?? "-",
        Vaccine: e.vaccineUsed ?? "-",
        Remarks: e.remarks ?? "-",
      };
    });

  const mortalityRows = dailyEntries
    .filter(
      (e) =>
        (!dateFrom || e.entryDate >= dateFrom) &&
        (!dateTo || e.entryDate <= dateTo),
    )
    .map((e) => {
      const batch = allBatches.find((b) => b.id === e.batchId);
      const farm = allFarms.find((f) => f.id === batch?.farmId);
      return {
        Date: e.entryDate,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        Batch: batch?.batchNumber ?? "-",
        Mortality: e.mortalityCount,
        "Cull Birds": e.cullBirds,
        "Total Dead": e.mortalityCount + e.cullBirds,
        "Mortality%": e.mortalityPct,
      };
    });

  const fcrRows = batches.map((b) => {
    const ents = dailyEntries.filter((e) => e.batchId === b.id);
    const avgFCR = ents.length
      ? (ents.reduce((s, e) => s + e.fcr, 0) / ents.length).toFixed(2)
      : "N/A";
    const farm = allFarms.find((f) => f.id === b.farmId);
    return {
      Batch: b.batchNumber,
      Company: lookupName(farm?.companyId, allCompanies),
      Zone: lookupName(farm?.zoneId, allZones),
      Branch: lookupName(farm?.branchId, allBranches),
      Farm: farm?.name ?? "-",
      "Chicks Placed": b.chicksQty,
      "Birds Alive": b.birdsAlive,
      "Avg FCR": avgFCR,
      Status: b.status,
    };
  });

  const feedConsRows = dailyEntries
    .filter(
      (e) =>
        (!dateFrom || e.entryDate >= dateFrom) &&
        (!dateTo || e.entryDate <= dateTo),
    )
    .map((e) => {
      const batch = allBatches.find((b) => b.id === e.batchId);
      const farm = allFarms.find((f) => f.id === batch?.farmId);
      return {
        Date: e.entryDate,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        Batch: batch?.batchNumber ?? "-",
        "Feed Intake (g)": e.feedIntakeGrams,
        "Cumulative Feed (g)": e.cumulativeFeed,
        "Water (L)": e.waterConsumptionLiters,
      };
    });

  const feedPurchaseRows = feedPurchases
    .filter(
      (p) =>
        (!dateFrom || p.purchaseDate >= dateFrom) &&
        (!dateTo || p.purchaseDate <= dateTo),
    )
    .map((p) => ({
      Date: p.purchaseDate,
      Supplier: p.supplierName,
      "Feed Type": p.feedType,
      Bags: p.quantityBags,
      "Rate/Bag": p.ratePerBag,
      Discount: p.discountAmount,
      "Total ₹": p.totalAmount,
    }));

  const chicksRows = batches
    .filter(
      (b) =>
        (!dateFrom || b.placementDate >= dateFrom) &&
        (!dateTo || b.placementDate <= dateTo),
    )
    .map((b) => {
      const farm = allFarms.find((f) => f.id === b.farmId);
      return {
        Date: b.placementDate,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        Batch: b.batchNumber,
        Hatchery: b.hatcheryName,
        Breed: b.breedType,
        "Chicks Qty": b.chicksQty,
        "Chicks Rate": b.chicksRate,
        Transport: b.transportCost,
        "Total Cost ₹": b.totalPlacementCost,
      };
    });

  const salesRows = birdSales
    .filter(
      (s) =>
        (!dateFrom || s.dispatchDate >= dateFrom) &&
        (!dateTo || s.dispatchDate <= dateTo),
    )
    .map((s) => {
      const farm = allFarms.find((f) => f.id === s.farmId);
      return {
        Date: s.dispatchDate,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        Batch: allBatches.find((b) => b.id === s.batchId)?.batchNumber ?? "-",
        "Birds Qty": s.birdsQty,
        "Avg Wt(kg)": s.avgWeightKg,
        "Rate/kg": s.ratePerKg,
        "Total Wt(kg)": s.totalWeightKg,
        "Amount ₹": s.totalAmount,
        Trader: s.traderName,
        Vehicle: s.vehicleNumber,
      };
    });

  const paymentRows = payments
    .filter(
      (p) => (!dateFrom || p.date >= dateFrom) && (!dateTo || p.date <= dateTo),
    )
    .map((p) => {
      const farm = allFarms.find((f) => f.id === p.farmId);
      return {
        Date: p.date,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        "Amount ₹": p.amount,
        Type: p.paymentType,
        Description: p.description ?? "-",
        "Entered By": p.enteredBy ?? "-",
      };
    });

  const receiptRows = receipts
    .filter(
      (r) => (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo),
    )
    .map((r) => {
      const farm = allFarms.find((f) => f.id === r.farmId);
      return {
        Date: r.date,
        Company: lookupName(farm?.companyId, allCompanies),
        Zone: lookupName(farm?.zoneId, allZones),
        Branch: lookupName(farm?.branchId, allBranches),
        Farm: farm?.name ?? "-",
        "Amount ₹": r.amount,
        Type: r.paymentType,
        Notes: r.notes ?? "-",
        "Entered By": r.enteredBy ?? "-",
      };
    });

  // Financial summary: company-level aggregation when no specific farm selected
  const financialSummaryRows = useMemo(() => {
    const targetFarms = effectiveFarmIds === null ? allFarms : farms;

    if (farmFilter) {
      return targetFarms.map((f) => ({
        Company: lookupName(f.companyId, allCompanies),
        Zone: lookupName(f.zoneId, allZones),
        Branch: lookupName(f.branchId, allBranches),
        Farm: f.name,
        "Total Payments ₹": payments
          .filter((p) => p.farmId === f.id)
          .reduce((s, p) => s + p.amount, 0),
        "Total Receipts ₹": receipts
          .filter((r) => r.farmId === f.id)
          .reduce((s, r) => s + r.amount, 0),
        "Net Balance ₹":
          receipts
            .filter((r) => r.farmId === f.id)
            .reduce((s, r) => s + r.amount, 0) -
          payments
            .filter((p) => p.farmId === f.id)
            .reduce((s, p) => s + p.amount, 0),
      }));
    }

    // Aggregate by company when no zone/branch filter
    if (!zoneFilter && !branchFilter) {
      const companiesForSummary: Company[] =
        effectiveFarmIds === null ? allCompanies : visibleCompanies;
      const rows: Row[] = [];
      for (const c of companiesForSummary) {
        const cFarms = targetFarms.filter((f) => f.companyId === c.id);
        if (!cFarms.length) continue;
        const fp = payments
          .filter((p) => cFarms.some((f) => f.id === p.farmId))
          .reduce((s, p) => s + p.amount, 0);
        const fr = receipts
          .filter((r) => cFarms.some((f) => f.id === r.farmId))
          .reduce((s, r) => s + r.amount, 0);
        rows.push({
          Level: "Company",
          Name: c.name,
          "Total Payments ₹": fp,
          "Total Receipts ₹": fr,
          "Net Balance ₹": fr - fp,
        });
      }
      if (rows.length) return rows;
    }

    // Aggregate by zone when zone filter applied
    if (zoneFilter && !branchFilter) {
      const zoneList: Zone[] = allZones.filter((z) => z.id === zoneFilter);
      const rows: Row[] = [];
      for (const z of zoneList) {
        const zFarms = targetFarms.filter((f) => f.zoneId === z.id);
        if (!zFarms.length) continue;
        const fp = payments
          .filter((p) => zFarms.some((f) => f.id === p.farmId))
          .reduce((s, p) => s + p.amount, 0);
        const fr = receipts
          .filter((r) => zFarms.some((f) => f.id === r.farmId))
          .reduce((s, r) => s + r.amount, 0);
        rows.push({
          Level: "Zone",
          Name: z.name,
          "Total Payments ₹": fp,
          "Total Receipts ₹": fr,
          "Net Balance ₹": fr - fp,
        });
      }
      if (rows.length) return rows;
    }

    // Aggregate by branch when branch filter applied
    if (branchFilter) {
      const branchList: Branch[] = allBranches.filter(
        (b) => b.id === branchFilter,
      );
      const rows: Row[] = [];
      for (const br of branchList) {
        const bFarms = targetFarms.filter((f) => f.branchId === br.id);
        if (!bFarms.length) continue;
        const fp = payments
          .filter((p) => bFarms.some((f) => f.id === p.farmId))
          .reduce((s, p) => s + p.amount, 0);
        const fr = receipts
          .filter((r) => bFarms.some((f) => f.id === r.farmId))
          .reduce((s, r) => s + r.amount, 0);
        rows.push({
          Level: "Branch",
          Name: br.name,
          "Total Payments ₹": fp,
          "Total Receipts ₹": fr,
          "Net Balance ₹": fr - fp,
        });
      }
      if (rows.length) return rows;
    }

    // Fallback: per-farm
    return targetFarms.map((f) => ({
      Company: lookupName(f.companyId, allCompanies),
      Zone: lookupName(f.zoneId, allZones),
      Branch: lookupName(f.branchId, allBranches),
      Farm: f.name,
      "Total Payments ₹": payments
        .filter((p) => p.farmId === f.id)
        .reduce((s, p) => s + p.amount, 0),
      "Total Receipts ₹": receipts
        .filter((r) => r.farmId === f.id)
        .reduce((s, r) => s + r.amount, 0),
      "Net Balance ₹":
        receipts
          .filter((r) => r.farmId === f.id)
          .reduce((s, r) => s + r.amount, 0) -
        payments
          .filter((p) => p.farmId === f.id)
          .reduce((s, p) => s + p.amount, 0),
    }));
  }, [
    effectiveFarmIds,
    farms,
    allFarms,
    farmFilter,
    zoneFilter,
    branchFilter,
    payments,
    receipts,
    allCompanies,
    allZones,
    allBranches,
    visibleCompanies,
  ]);

  const canFilterByFarmer = ["SuperAdmin", "CompanyAdmin", "Manager"].includes(
    currentUser?.role ?? "",
  );
  const canFilterByCompany = currentUser?.role === "SuperAdmin";

  const selectCls =
    "h-9 rounded-md border border-input bg-background px-3 text-sm w-full";

  function clearAll() {
    setDateFrom("");
    setDateTo("");
    setBatchFilter("");
    setCompanyFilter("");
    setZoneFilter("");
    setBranchFilter("");
    setFarmFilter("");
    setFarmerFilter("");
  }

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <h2 className="text-2xl font-bold">Reports</h2>

      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Date range + Batch + Clear */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>From Date</Label>
              <Input
                data-ocid="reports.date_from.input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                data-ocid="reports.date_to.input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
            </div>
            <div>
              <Label>Batch</Label>
              <select
                data-ocid="reports.batch.select"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              data-ocid="reports.clear.button"
            >
              Clear Filters
            </Button>
          </div>

          {/* Row 2: Hierarchy filters Company > Zone > Branch > Farm > Farmer */}
          <div className="flex flex-wrap gap-4 items-end">
            {canFilterByCompany && (
              <div className="min-w-[140px]">
                <Label>Company</Label>
                <select
                  data-ocid="reports.company.select"
                  value={companyFilter}
                  onChange={(e) => {
                    setCompanyFilter(e.target.value);
                    setZoneFilter("");
                    setBranchFilter("");
                    setFarmFilter("");
                    setFarmerFilter("");
                  }}
                  className={selectCls}
                >
                  <option value="">All Companies</option>
                  {visibleCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {visibleZones.length > 0 && (
              <div className="min-w-[140px]">
                <Label>Zone</Label>
                <select
                  data-ocid="reports.zone.select"
                  value={zoneFilter}
                  onChange={(e) => {
                    setZoneFilter(e.target.value);
                    setBranchFilter("");
                    setFarmFilter("");
                    setFarmerFilter("");
                  }}
                  className={selectCls}
                >
                  <option value="">All Zones</option>
                  {visibleZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {visibleBranches.length > 0 && (
              <div className="min-w-[140px]">
                <Label>Branch</Label>
                <select
                  data-ocid="reports.branch.select"
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setFarmFilter("");
                    setFarmerFilter("");
                  }}
                  className={selectCls}
                >
                  <option value="">All Branches</option>
                  {visibleBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="min-w-[140px]">
              <Label>Farm</Label>
              <select
                data-ocid="reports.farm.select"
                value={farmFilter}
                onChange={(e) => {
                  setFarmFilter(e.target.value);
                  setFarmerFilter("");
                }}
                className={selectCls}
              >
                <option value="">All Farms</option>
                {visibleFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            {canFilterByFarmer && (
              <div className="min-w-[140px]">
                <Label>Farmer</Label>
                <select
                  data-ocid="reports.farmer.select"
                  value={farmerFilter}
                  onChange={(e) => {
                    setFarmerFilter(e.target.value);
                    setFarmFilter("");
                  }}
                  className={selectCls}
                >
                  <option value="">All Farmers</option>
                  {farmerUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {(companyFilter ||
            zoneFilter ||
            branchFilter ||
            farmFilter ||
            farmerFilter) && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
              <span className="font-medium text-foreground">Filtering by:</span>
              {companyFilter && (
                <span className="bg-muted px-2 py-0.5 rounded">
                  Company: {lookupName(companyFilter, allCompanies)}
                </span>
              )}
              {zoneFilter && (
                <span className="bg-muted px-2 py-0.5 rounded">
                  Zone: {lookupName(zoneFilter, allZones)}
                </span>
              )}
              {branchFilter && (
                <span className="bg-muted px-2 py-0.5 rounded">
                  Branch: {lookupName(branchFilter, allBranches)}
                </span>
              )}
              {farmFilter && (
                <span className="bg-muted px-2 py-0.5 rounded">
                  Farm: {lookupName(farmFilter, allFarms)}
                </span>
              )}
              {farmerFilter && (
                <span className="bg-muted px-2 py-0.5 rounded">
                  Farmer:{" "}
                  {allUsers.find((u) => u.id === farmerFilter)?.name ?? "-"}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" data-ocid="reports.tab">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="daily" data-ocid="reports.daily.tab">
            Daily Performance
          </TabsTrigger>
          <TabsTrigger value="mortality" data-ocid="reports.mortality.tab">
            Mortality
          </TabsTrigger>
          <TabsTrigger value="fcr" data-ocid="reports.fcr.tab">
            FCR
          </TabsTrigger>
          <TabsTrigger value="feedcons" data-ocid="reports.feedcons.tab">
            Feed Consumption
          </TabsTrigger>
          <TabsTrigger
            value="feedpurchase"
            data-ocid="reports.feedpurchase.tab"
          >
            Feed Purchase
          </TabsTrigger>
          <TabsTrigger value="chicks" data-ocid="reports.chicks.tab">
            Chicks Purchase
          </TabsTrigger>
          <TabsTrigger value="sales" data-ocid="reports.sales.tab">
            Bird Sales
          </TabsTrigger>
          <TabsTrigger value="payments" data-ocid="reports.payments.tab">
            Payments
          </TabsTrigger>
          <TabsTrigger value="receipts" data-ocid="reports.receipts.tab">
            Receipts
          </TabsTrigger>
          <TabsTrigger value="financial" data-ocid="reports.financial.tab">
            Financial Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <ReportTable
            rows={dailyRows}
            title="Daily Farm Performance"
            filename="daily_performance"
          />
        </TabsContent>
        <TabsContent value="mortality" className="mt-4">
          <ReportTable
            rows={mortalityRows}
            title="Mortality Report"
            filename="mortality_report"
          />
        </TabsContent>
        <TabsContent value="fcr" className="mt-4">
          <ReportTable
            rows={fcrRows}
            title="FCR Report"
            filename="fcr_report"
          />
        </TabsContent>
        <TabsContent value="feedcons" className="mt-4">
          <ReportTable
            rows={feedConsRows}
            title="Feed Consumption Report"
            filename="feed_consumption"
          />
        </TabsContent>
        <TabsContent value="feedpurchase" className="mt-4">
          <ReportTable
            rows={feedPurchaseRows}
            title="Feed Purchase Report"
            filename="feed_purchase"
          />
        </TabsContent>
        <TabsContent value="chicks" className="mt-4">
          <ReportTable
            rows={chicksRows}
            title="Chicks Purchase Report"
            filename="chicks_purchase"
          />
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
          <ReportTable
            rows={salesRows}
            title="Bird Sales Report"
            filename="bird_sales"
          />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <ReportTable
            rows={paymentRows}
            title="Payment Report"
            filename="payment_report"
          />
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          <ReportTable
            rows={receiptRows}
            title="Receipt Report"
            filename="receipt_report"
          />
        </TabsContent>
        <TabsContent value="financial" className="mt-4">
          <ReportTable
            rows={financialSummaryRows}
            title="Farm Financial Summary"
            filename="financial_summary"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
