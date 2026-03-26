import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyScope } from "@/lib/roleFilter";
import { type GCSettlement, storage } from "@/lib/storage";
import { Download, FileText, Printer, Receipt } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function GCSettlementReport() {
  const { farms } = useCompanyScope();
  const farmIds = useMemo(() => new Set(farms.map((f) => f.id)), [farms]);

  const accessibleFarms = farms;

  const [filterFarmId, setFilterFarmId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<GCSettlement[] | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const getFarmName = (farmId: string) =>
    farms.find((f) => f.id === farmId)?.name || farmId;

  const handleGenerate = () => {
    let settlements = storage
      .getGCSettlements()
      .filter((s) => farmIds.has(s.farmId));
    if (filterFarmId !== "all") {
      settlements = settlements.filter((s) => s.farmId === filterFarmId);
    }
    if (fromDate) {
      settlements = settlements.filter((s) => s.closedAt >= fromDate);
    }
    if (toDate) {
      const toEnd = `${toDate}T23:59:59`;
      settlements = settlements.filter((s) => s.closedAt <= toEnd);
    }
    setRows(settlements);
    if (settlements.length === 0) {
      toast.info("No settlements found for the selected filters.");
    }
  };

  const totals = useMemo(() => {
    if (!rows) return null;
    return {
      birdsPlaced: rows.reduce((s, r) => s + r.birdsPlaced, 0),
      birdsSold: rows.reduce((s, r) => s + r.birdsSold, 0),
      mortalityCount: rows.reduce((s, r) => s + r.mortalityCount, 0),
      fcrBonus: rows.reduce((s, r) => s + r.fcrBonus, 0),
      mortalityPenalty: rows.reduce((s, r) => s + r.mortalityPenalty, 0),
      totalGCPayable: rows.reduce((s, r) => s + r.totalGCPayable, 0),
    };
  }, [rows]);

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = async () => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export.");
      return;
    }
    try {
      const { downloadExcel: nativeXLSX } = await import("@/lib/exportUtils");
      nativeXLSX(
        rows as unknown as Record<string, unknown>[],
        "gc-settlement-report.csv",
      );
      toast.success("Excel exported.");
    } catch {
      toast.error("Failed to export Excel.");
    }
  };

  const handlePdfExport = async () => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export.");
      return;
    }
    try {
      const { printAsPDF: nativePDF } = await import("@/lib/exportUtils");
      nativePDF(
        rows as unknown as Record<string, unknown>[],
        "GC Settlement Report",
      );
      toast.success("PDF exported.");
    } catch {
      toast.error("Failed to export PDF.");
    }
  };

  return (
    <div data-ocid="gc_report.page" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Receipt size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            GC Settlement Report
          </h1>
          <p className="text-sm text-muted-foreground">
            View and download growing charge settlement details
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Farm</Label>
              <Select value={filterFarmId} onValueChange={setFilterFarmId}>
                <SelectTrigger data-ocid="gc_report.farm.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {accessibleFarms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>From Date</Label>
              <Input
                type="date"
                data-ocid="gc_report.from.input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>To Date</Label>
              <Input
                type="date"
                data-ocid="gc_report.to.input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              data-ocid="gc_report.generate.button"
            >
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {rows === null ? (
        <div
          data-ocid="gc_report.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3"
        >
          <FileText size={48} className="opacity-20" />
          <p className="text-sm">
            Select filters above and click <strong>Generate Report</strong> to
            view data.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">
                Report Results
                <Badge variant="secondary" className="ml-2">
                  {rows.length} records
                </Badge>
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="gc_report.excel.button"
                  onClick={handleExcelExport}
                >
                  <Download size={14} className="mr-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="gc_report.pdf.button"
                  onClick={handlePdfExport}
                >
                  <FileText size={14} className="mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="gc_report.print.button"
                  onClick={handlePrint}
                >
                  <Printer size={14} className="mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0" ref={tableRef}>
            {rows.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No settlements found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="gc_report.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farm Name</TableHead>
                      <TableHead>Batch No</TableHead>
                      <TableHead>Birds Placed</TableHead>
                      <TableHead>Birds Sold</TableHead>
                      <TableHead>Mortality</TableHead>
                      <TableHead>Mortality %</TableHead>
                      <TableHead>Final FCR</TableHead>
                      <TableHead>GC Rate (₹)</TableHead>
                      <TableHead>FCR Bonus (₹)</TableHead>
                      <TableHead>Penalty (₹)</TableHead>
                      <TableHead>Total GC (₹)</TableHead>
                      <TableHead>Closed Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {getFarmName(row.farmId)}
                        </TableCell>
                        <TableCell>{row.batchNumber}</TableCell>
                        <TableCell>
                          {row.birdsPlaced.toLocaleString()}
                        </TableCell>
                        <TableCell>{row.birdsSold.toLocaleString()}</TableCell>
                        <TableCell>
                          {row.mortalityCount.toLocaleString()}
                        </TableCell>
                        <TableCell>{row.mortalityPct.toFixed(2)}%</TableCell>
                        <TableCell>{row.finalFCR.toFixed(3)}</TableCell>
                        <TableCell>₹{row.gcRatePerBird.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ₹{row.fcrBonus.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ₹{row.mortalityPenalty.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          ₹{row.totalGCPayable.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {new Date(row.closedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {totals && (
                    <TableFooter>
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={2}>TOTAL</TableCell>
                        <TableCell>
                          {totals.birdsPlaced.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {totals.birdsSold.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {totals.mortalityCount.toLocaleString()}
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-green-600">
                          ₹{totals.fcrBonus.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          ₹{totals.mortalityPenalty.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-primary">
                          ₹{totals.totalGCPayable.toFixed(2)}
                        </TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
