/**
 * Native browser export utilities (no external packages required).
 * Replaces xlsx / jspdf / jspdf-autotable.
 */

type Row = Record<string, unknown>;

/** Download data as CSV file. */
export function downloadCSV(rows: Row[], filename: string): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download data as Excel-compatible CSV (same content, .xlsx extension). */
export function downloadExcel(rows: Row[], filename: string): void {
  downloadCSV(rows, filename.replace(/\.xlsx$/i, ".csv"));
}

/**
 * Open a print-friendly window with the data rendered as an HTML table.
 * Replaces jsPDF-based PDF export.
 */
export function printAsPDF(
  rows: Row[],
  title: string,
  _filename?: string,
): void {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
    h2 { margin-bottom: 4px; }
    p { margin: 0 0 12px; color: #555; font-size: 11px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #bbb; padding: 5px 8px; text-align: left; }
    th { background: #e8e8e8; font-weight: bold; }
    tr:nth-child(even) { background: #f9f9f9; }
    @media print { @page { size: landscape; margin: 10mm; } }
  </style>
</head>
<body>
  <h2>${title}</h2>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(
        (r) =>
          `<tr>${headers.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody>
  </table>
</body>
</html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }
}

/**
 * Download rows as AOA (array-of-arrays) to CSV.
 * Replaces xlsx.utils.aoa_to_sheet usage.
 */
export function downloadAoaCSV(
  aoa: (string | number)[][],
  filename: string,
): void {
  if (!aoa.length) return;
  const csv = aoa
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
