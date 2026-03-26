import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { storage } from "@/lib/storage";
import { Download, FileText, Printer, Search } from "lucide-react";
import { useState } from "react";

function downloadInvoicePDF(
  invoice: ReturnType<typeof storage.getSubscriptionInvoices>[number],
  _userName: string,
  _userRole: string,
) {
  import("@/lib/exportUtils").then(({ printAsPDF: nativePDF }) => {
    const rows = [
      {
        "Invoice #": invoice.invoiceNumber,
        Date: new Date(invoice.invoiceDate).toLocaleDateString(),
        Birds: invoice.totalBirds,
        Amount: `₹${invoice.finalAmount.toFixed(2)}`,
        Status: invoice.status,
      },
    ];
    nativePDF(rows, `Invoice ${invoice.invoiceNumber}`);
  });
}

function downloadInvoiceExcel(
  invoice: ReturnType<typeof storage.getSubscriptionInvoices>[number],
  _userName: string,
  _userRole: string,
) {
  import("@/lib/exportUtils").then(({ downloadExcel: nativeXLSX }) => {
    const rows = [
      {
        "Invoice #": invoice.invoiceNumber,
        Date: new Date(invoice.invoiceDate).toLocaleDateString(),
        Birds: invoice.totalBirds,
        Amount: `₹${invoice.finalAmount.toFixed(2)}`,
        Status: invoice.status,
      },
    ];
    nativeXLSX(rows, `Invoice_${invoice.invoiceNumber}.csv`);
  });
}

export default function SubscriptionInvoices() {
  const { currentUser } = useAuth();
  const { isSuperAdmin } = useCompanyScope();
  const [search, setSearch] = useState("");

  const isAdmin = isSuperAdmin || currentUser?.role === "CompanyAdmin";
  const allUsers = storage.getUsers();

  let invoices = storage.getSubscriptionInvoices();
  if (!isAdmin && currentUser) {
    invoices = invoices.filter((inv) => inv.userId === currentUser.id);
  }
  if (search) {
    invoices = invoices.filter((inv) => {
      const user = allUsers.find((u) => u.id === inv.userId);
      return (
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        user?.name?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Download and manage billing invoices
          </p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search invoices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="billing.invoices.search_input"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              data-ocid="billing.invoices.empty_state"
            >
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="font-medium">No invoices yet</p>
              <p className="text-sm">
                Invoices are auto-generated when a payment is verified.
              </p>
            </div>
          ) : (
            <Table data-ocid="billing.invoices.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  {isAdmin && <TableHead>Client</TableHead>}
                  <TableHead>Period</TableHead>
                  <TableHead>Birds</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Calculated</TableHead>
                  <TableHead>Final (Rs)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv, idx) => {
                  const user = allUsers.find((u) => u.id === inv.userId);
                  return (
                    <TableRow
                      key={inv.id}
                      data-ocid={`billing.invoices.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium font-mono">
                        {inv.invoiceNumber}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {user?.name ?? "\u2014"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user?.role}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>{inv.period}</TableCell>
                      <TableCell>{inv.totalBirds.toLocaleString()}</TableCell>
                      <TableCell>Rs{inv.perBirdRate.toFixed(2)}</TableCell>
                      <TableCell>Rs{inv.calculatedAmount.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        Rs{inv.finalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Paid
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inv.invoiceDate}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`billing.invoices.pdf.button.${idx + 1}`}
                            onClick={() =>
                              downloadInvoicePDF(
                                inv,
                                user?.name ?? "Client",
                                user?.role ?? "",
                              )
                            }
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`billing.invoices.excel.button.${idx + 1}`}
                            onClick={() =>
                              downloadInvoiceExcel(
                                inv,
                                user?.name ?? "Client",
                                user?.role ?? "",
                              )
                            }
                            title="Download Excel"
                          >
                            <FileText size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`billing.invoices.print.button.${idx + 1}`}
                            onClick={() => window.print()}
                            title="Print"
                          >
                            <Printer size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
