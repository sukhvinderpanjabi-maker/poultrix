import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  type Batch,
  type BirdSale,
  type Branch,
  type Company,
  type DailyEntry,
  type Farm,
  type Zone,
  storage,
} from "@/lib/storage";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type DatePreset = "today" | "week" | "month" | "custom";

type FarmRow = {
  farmId: string;
  farmName: string;
  chicksPlaced: number;
  placementDate: string;
  ageDays: number;
  dailyFeedIntake: number;
  cumulativeFeed: number;
  bodyWeight: number;
  fcr: number;
  birdsSold: number;
  mortality: number;
  birdsBalance: number;
};

function getDateRange(
  preset: DatePreset,
  from: string,
  to: string,
): { start: Date | null; end: Date } {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  if (preset === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (preset === "week") {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (preset === "month") {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  // custom
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : now;
  if (end) end.setHours(23, 59, 59, 999);
  return { start, end };
}

function computeFarmRows(
  farms: Farm[],
  batches: Batch[],
  dailyEntries: DailyEntry[],
  birdSales: BirdSale[],
  endDate: Date,
  startDate: Date | null,
): FarmRow[] {
  return farms.map((farm) => {
    const farmBatches = batches.filter((b) => b.farmId === farm.id);

    // Chicks placed
    const chicksPlaced = farmBatches.reduce((s, b) => s + b.chicksQty, 0);

    // Placement date = earliest
    const placementDates = farmBatches.map((b) => new Date(b.placementDate));
    const earliestPlacement = placementDates.length
      ? new Date(Math.min(...placementDates.map((d) => d.getTime())))
      : null;
    const placementDateStr = earliestPlacement
      ? earliestPlacement.toISOString().slice(0, 10)
      : "—";

    // Age in days
    const ageDays = earliestPlacement
      ? Math.floor((endDate.getTime() - earliestPlacement.getTime()) / 86400000)
      : 0;

    // Daily entries for this farm (filtered by date range)
    const batchIds = farmBatches.map((b) => b.id);
    const farmEntries = dailyEntries.filter((e) => {
      if (!batchIds.includes(e.batchId)) return false;
      const d = new Date(e.entryDate);
      if (startDate && d < startDate) return false;
      if (d > endDate) return false;
      return true;
    });

    // Get latest entry per batch
    const latestPerBatch: Record<string, DailyEntry> = {};
    for (const e of farmEntries) {
      if (
        !latestPerBatch[e.batchId] ||
        new Date(e.entryDate) > new Date(latestPerBatch[e.batchId].entryDate)
      ) {
        latestPerBatch[e.batchId] = e;
      }
    }
    const latestEntries = Object.values(latestPerBatch);

    // Daily feed: most recent entry across all batches
    let dailyFeedIntake = 0;
    let latestEntryDate = "";
    for (const e of farmEntries) {
      if (!latestEntryDate || e.entryDate > latestEntryDate) {
        latestEntryDate = e.entryDate;
        dailyFeedIntake = e.feedIntakeGrams;
      }
    }

    // Cumulative feed: sum of latest cumulativeFeed per batch
    const cumulativeFeed = latestEntries.reduce(
      (s, e) => s + (e.cumulativeFeed || 0),
      0,
    );

    // Body weight: average of latest bodyWeightGrams across batches
    const bodyWeight =
      latestEntries.length > 0
        ? latestEntries.reduce((s, e) => s + (e.bodyWeightGrams || 0), 0) /
          latestEntries.length
        : 0;

    // Birds alive (from batches)
    const birdsAlive = farmBatches.reduce((s, b) => s + b.birdsAlive, 0);

    // FCR = totalCumulativeFeed / (birdsAlive * avgBodyWeightKg)
    const avgBodyWeightKg = bodyWeight / 1000;
    const totalLiveWeight = birdsAlive * avgBodyWeightKg;
    const fcr = totalLiveWeight > 0 ? cumulativeFeed / totalLiveWeight : 0;

    // Bird sales (filtered by date range)
    const farmSales = birdSales.filter((s) => {
      if (s.farmId !== farm.id) return false;
      const d = new Date(s.dispatchDate);
      if (startDate && d < startDate) return false;
      if (d > endDate) return false;
      return true;
    });
    const birdsSold = farmSales.reduce((s, sale) => s + sale.birdsQty, 0);

    // Mortality: sum from all daily entries (filtered)
    const mortality = farmEntries.reduce(
      (s, e) => s + (e.mortalityCount || 0),
      0,
    );

    // Birds balance
    const birdsBalance = chicksPlaced - birdsSold - mortality;

    return {
      farmId: farm.id,
      farmName: farm.name,
      chicksPlaced,
      placementDate: placementDateStr,
      ageDays,
      dailyFeedIntake,
      cumulativeFeed,
      bodyWeight,
      fcr,
      birdsSold,
      mortality,
      birdsBalance,
    };
  });
}

function fmt(n: number, decimals = 0) {
  if (n === 0) return "0";
  return n.toLocaleString("en-PK", { maximumFractionDigits: decimals });
}

export default function PerformanceReport() {
  const { currentUser } = useAuth();
  const {
    farms: allFarms,
    zones: allZones,
    branches: allBranches,
  } = useCompanyScope();
  const _allCompanies = useMemo(() => storage.getCompanies(), []);

  const showZoneBranch = !["Supervisor", "Farmer", "Dealer", "Staff"].includes(
    currentUser?.role || "",
  );

  // Filters
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedFarm, setSelectedFarm] = useState<string>("all");
  const [preset, setPreset] = useState<DatePreset>("month");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [reportData, setReportData] = useState<FarmRow[] | null>(null);
  const [generated, setGenerated] = useState(false);

  // Accessible farms - already scoped by useCompanyScope
  const accessibleFarms = allFarms;

  // Cascading zone filter
  const filteredZones = useMemo(() => {
    return allZones.filter((z) =>
      accessibleFarms.some((f) => f.zoneId === z.id),
    );
  }, [allZones, accessibleFarms]);

  // Branches filtered by zone
  const filteredBranches = useMemo(() => {
    let branches = allBranches.filter((b) =>
      accessibleFarms.some((f) => f.branchId === b.id),
    );
    if (selectedZone !== "all") {
      branches = branches.filter((b) => b.zoneId === selectedZone);
    }
    return branches;
  }, [allBranches, accessibleFarms, selectedZone]);

  // Farms filtered by zone/branch
  const filteredFarms = useMemo(() => {
    let farms = accessibleFarms;
    if (selectedZone !== "all")
      farms = farms.filter((f) => f.zoneId === selectedZone);
    if (selectedBranch !== "all")
      farms = farms.filter((f) => f.branchId === selectedBranch);
    return farms;
  }, [accessibleFarms, selectedZone, selectedBranch]);

  const handleGenerate = () => {
    const { start, end } = getDateRange(preset, fromDate, toDate);
    const farmsToReport =
      selectedFarm !== "all"
        ? filteredFarms.filter((f) => f.id === selectedFarm)
        : filteredFarms;

    const batches = storage.getBatches();
    const dailyEntries = storage.getDailyEntries();
    const farmIdsSet = new Set(allFarms.map((f) => f.id));
    const birdSales = storage
      .getBirdSales()
      .filter((s) => farmIdsSet.has(s.farmId));

    const rows = computeFarmRows(
      farmsToReport,
      batches,
      dailyEntries,
      birdSales,
      end,
      start,
    );
    setReportData(rows);
    setGenerated(true);
  };

  const clearFilters = () => {
    setSelectedZone("all");
    setSelectedBranch("all");
    setSelectedFarm("all");
    setPreset("month");
    setFromDate("");
    setToDate("");
    setReportData(null);
    setGenerated(false);
  };

  // Totals row
  const totals = useMemo(() => {
    if (!reportData) return null;
    return {
      chicksPlaced: reportData.reduce((s, r) => s + r.chicksPlaced, 0),
      dailyFeedIntake: reportData.reduce((s, r) => s + r.dailyFeedIntake, 0),
      cumulativeFeed: reportData.reduce((s, r) => s + r.cumulativeFeed, 0),
      bodyWeight:
        reportData.length > 0
          ? reportData.reduce((s, r) => s + r.bodyWeight, 0) / reportData.length
          : 0,
      fcr:
        reportData.length > 0
          ? reportData.reduce((s, r) => s + r.fcr, 0) / reportData.length
          : 0,
      birdsSold: reportData.reduce((s, r) => s + r.birdsSold, 0),
      mortality: reportData.reduce((s, r) => s + r.mortality, 0),
      birdsBalance: reportData.reduce((s, r) => s + r.birdsBalance, 0),
    };
  }, [reportData]);

  // Active filter chips
  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (selectedZone !== "all") {
    const zone = allZones.find((z) => z.id === selectedZone);
    activeFilters.push({
      label: `Zone: ${zone?.name || selectedZone}`,
      onRemove: () => {
        setSelectedZone("all");
        setSelectedBranch("all");
      },
    });
  }
  if (selectedBranch !== "all") {
    const branch = allBranches.find((b) => b.id === selectedBranch);
    activeFilters.push({
      label: `Branch: ${branch?.name || selectedBranch}`,
      onRemove: () => setSelectedBranch("all"),
    });
  }
  if (selectedFarm !== "all") {
    const farm = allFarms.find((f) => f.id === selectedFarm);
    activeFilters.push({
      label: `Farm: ${farm?.name || selectedFarm}`,
      onRemove: () => setSelectedFarm("all"),
    });
  }
  const presetLabel =
    preset === "today"
      ? "Today"
      : preset === "week"
        ? "This Week"
        : preset === "month"
          ? "This Month"
          : `${fromDate} – ${toDate}`;
  activeFilters.push({
    label: `Date: ${presetLabel}`,
    onRemove: () => {
      setPreset("month");
      setFromDate("");
      setToDate("");
    },
  });

  // Export helpers
  const handleExcelExport = () => {
    if (!reportData) return;
    // Use CSV export instead (same data, compatible format)
    handleCSVExport();
  };

  const handlePDFExport = () => {
    if (!reportData) return;
    import("@/lib/exportUtils").then(({ printAsPDF: nativePDF }) => {
      const pdfRows = reportData.map((r) => ({
        Farm: r.farmName,
        "Chicks Placed": r.chicksPlaced,
        "Placement Date": r.placementDate,
        "Age (Days)": r.ageDays,
        "Body Wt (g)": r.bodyWeight,
        FCR: r.fcr,
        "Birds Sold": r.birdsSold,
        Mortality: r.mortality,
        Balance: r.birdsBalance,
      }));
      nativePDF(pdfRows as Record<string, unknown>[], "Performance Report");
    });
  };

  const handleCSVExport = () => {
    if (!reportData) return;
    const rows = [
      [
        "Farm",
        "Chicks Placed",
        "Placement Date",
        "Age (Days)",
        "Daily Feed (g)",
        "Cum. Feed (g)",
        "Body Wt (g)",
        "FCR",
        "Birds Sold",
        "Mortality",
        "Balance",
      ],
      ...reportData.map((r) => [
        r.farmName,
        r.chicksPlaced,
        r.placementDate,
        r.ageDays,
        r.dailyFeedIntake,
        r.cumulativeFeed,
        r.bodyWeight.toFixed(0),
        r.fcr.toFixed(2),
        r.birdsSold,
        r.mortality,
        r.birdsBalance,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PerformanceReport.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  if (currentUser?.role === "Staff") {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-4"
        data-ocid="performance.empty_state"
      >
        <BarChart3 size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground text-lg">
          You do not have access to Performance Reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            Performance Report
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Zone-wise · Branch-wise · Farm-wise summary
          </p>
        </div>
        {generated && (
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleExcelExport}
              data-ocid="performance.excel.button"
            >
              <FileSpreadsheet size={15} className="mr-1" /> Excel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handlePDFExport}
              data-ocid="performance.pdf.button"
            >
              <FileText size={15} className="mr-1" /> PDF
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCSVExport}
              data-ocid="performance.csv.button"
            >
              <Download size={15} className="mr-1" /> CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              data-ocid="performance.print.button"
            >
              <Printer size={15} className="mr-1" /> Print
            </Button>
          </div>
        )}
      </div>

      {/* Filters Card */}
      <div className="bg-card border rounded-xl p-5 shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-foreground uppercase tracking-wide">
            Filters
          </h2>
          {(activeFilters.length > 1 || generated) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              data-ocid="performance.reset.button"
            >
              <RefreshCw size={12} /> Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Zone */}
          {showZoneBranch && (
            <div className="space-y-1">
              <Label className="text-xs">Zone</Label>
              <Select
                value={selectedZone}
                onValueChange={(v) => {
                  setSelectedZone(v);
                  setSelectedBranch("all");
                  setSelectedFarm("all");
                }}
              >
                <SelectTrigger data-ocid="performance.zone.select">
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {filteredZones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Branch */}
          {showZoneBranch && (
            <div className="space-y-1">
              <Label className="text-xs">Branch</Label>
              <Select
                value={selectedBranch}
                onValueChange={(v) => {
                  setSelectedBranch(v);
                  setSelectedFarm("all");
                }}
              >
                <SelectTrigger data-ocid="performance.branch.select">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {filteredBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Farm */}
          <div className="space-y-1">
            <Label className="text-xs">Farm</Label>
            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
              <SelectTrigger data-ocid="performance.farm.select">
                <SelectValue placeholder="All Farms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farms</SelectItem>
                {filteredFarms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Preset */}
          <div className="space-y-1">
            <Label className="text-xs">Date Range</Label>
            <div className="flex gap-1 flex-wrap">
              {(["today", "week", "month", "custom"] as DatePreset[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    data-ocid={`performance.${p}.toggle`}
                    className={`px-2 py-1 text-xs rounded border transition-colors font-medium ${
                      preset === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {p === "today"
                      ? "Today"
                      : p === "week"
                        ? "This Week"
                        : p === "month"
                          ? "This Month"
                          : "Custom"}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Custom date inputs */}
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-ocid="performance.from.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-ocid="performance.to.input"
              />
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((f) => (
              <Badge
                key={f.label}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {f.label}
                <button
                  type="button"
                  onClick={f.onRemove}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${f.label} filter`}
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleGenerate}
            className="px-8"
            data-ocid="performance.generate.primary_button"
          >
            <BarChart3 size={16} className="mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!generated && (
        <div
          className="flex flex-col items-center justify-center py-20 border rounded-xl bg-card text-center gap-4"
          data-ocid="performance.empty_state"
        >
          <BarChart3 size={56} className="text-muted-foreground/40" />
          <div>
            <p className="text-lg font-semibold text-foreground">
              No report generated yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Select your filters above and click{" "}
              <strong>Generate Report</strong> to view farm-wise performance
              data.
            </p>
          </div>
        </div>
      )}

      {/* Report Table */}
      {generated && reportData && (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
            <span className="font-semibold text-sm">
              {reportData.length} Farm{reportData.length !== 1 ? "s" : ""} ·{" "}
              {presetLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              Generated {new Date().toLocaleString()}
            </span>
          </div>

          {reportData.length === 0 ? (
            <div
              className="py-16 text-center text-muted-foreground"
              data-ocid="performance.table.empty_state"
            >
              No farms found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="performance.table">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-xs whitespace-nowrap">
                      Farm Name
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Chicks Placed
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap">
                      Placement Date
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Age (Days)
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Daily Feed (g)
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Cum. Feed (g)
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Body Wt (g)
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      FCR
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Birds Sold
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Mortality
                    </TableHead>
                    <TableHead className="font-bold text-xs whitespace-nowrap text-right">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, i) => (
                    <TableRow
                      key={row.farmId}
                      data-ocid={`performance.item.${i + 1}`}
                      className="hover:bg-muted/30 even:bg-muted/10"
                    >
                      <TableCell className="font-medium text-sm whitespace-nowrap">
                        {row.farmName}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmt(row.chicksPlaced)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {row.placementDate}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.ageDays}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmt(row.dailyFeedIntake)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmt(row.cumulativeFeed)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmt(row.bodyWeight, 1)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.fcr.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {fmt(row.birdsSold)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-600">
                        {fmt(row.mortality)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-green-700">
                        {fmt(row.birdsBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  {totals && (
                    <TableRow className="bg-primary/10 border-t-2 border-primary/30 font-bold">
                      <TableCell className="font-bold text-sm">TOTAL</TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {fmt(totals.chicksPlaced)}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right text-sm font-bold">
                        {fmt(totals.dailyFeedIntake)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {fmt(totals.cumulativeFeed)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {fmt(totals.bodyWeight, 1)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {totals.fcr.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {fmt(totals.birdsSold)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-red-600">
                        {fmt(totals.mortality)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-green-700">
                        {fmt(totals.birdsBalance)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
