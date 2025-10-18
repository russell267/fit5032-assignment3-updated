// src/utils/export.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function getDeepValue(obj: any, path: string) {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}


function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export function exportToCSV(
  data: Record<string, any>[],
  columns: { header: string; field: string }[],
  filename = "export.csv"
) {
  const headers = columns.map((c) => c.header);
  const rows = (data || []).map((row) =>
    columns
      .map((c) => {
        const v = getDeepValue(row, c.field);
        const s = v == null ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, filename);
}


export function exportToJSON(
  data: Record<string, any>[],
  columns: { header: string; field: string }[],
  filename = "export.json"
) {
  const mapped = (data || []).map((row) => {
    const o: Record<string, any> = {};
    columns.forEach((c) => (o[c.header] = getDeepValue(row, c.field) ?? ""));
    return o;
  });
  const blob = new Blob([JSON.stringify(mapped, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}


export function exportToPDF(
  data: Record<string, any>[],
  columns: { header: string; field: string }[],
  filename = "export.pdf",
  title = "Data Export"
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(14);
  doc.text(title, 40, 40);

  const head = [columns.map((c) => c.header)];
  const body = (data || []).map((row) =>
    columns.map((c) => {
      const v = getDeepValue(row, c.field);
      return v == null ? "" : String(v);
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: 60,
    styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fontStyle: "bold" },
    didDrawPage: () => {
      const pageSize = doc.internal.pageSize as any;
      const pageHeight = pageSize.height || pageSize.getHeight();
      doc.setFontSize(9);
      doc.text(`Generated at ${new Date().toLocaleString()}`, 40, pageHeight - 20);
    },
  });

  doc.save(filename);
}
