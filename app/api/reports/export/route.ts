import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";
import { isValidYmd } from "@/lib/dates";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  if (!isValidYmd(from) || !isValidYmd(to) || from > to) return NextResponse.json({ error: "Valid From and To dates are required." }, { status: 400 });

  const invoices = await getDb().invoice.findMany({
    where: { invoiceDate: { gte: from, lte: to } },
    include: { invoiceType: true, items: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ invoiceDate: "asc" }, { id: "asc" }],
  });
  const active = invoices.filter((invoice) => invoice.paymentStatus !== "Cancelled");
  const totalSales = active.reduce((sum, invoice) => sum + invoice.totalCents, 0);
  const totalProfit = active.reduce((sum, invoice) => sum + invoice.profitCents, 0);
  const margin = totalSales === 0 ? 0 : (totalProfit / totalSales) * 100;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PMM Sales & Invoice System";
  const summary = workbook.addWorksheet("Summary");
  summary.addRows([
    ["Sales Report", `${from} to ${to}`],
    ["Total Sales (RM)", totalSales / 100],
    ["Total Profit (RM)", totalProfit / 100],
    ["Profit Margin (%)", margin],
    ["Active Invoice Count", active.length],
  ]);
  summary.getColumn(1).width = 24;
  summary.getColumn(2).width = 24;
  summary.getCell("A1").font = { bold: true, size: 14 };
  ["B2", "B3"].forEach((cell) => (summary.getCell(cell).numFmt = '"RM" #,##0.00'));
  summary.getCell("B4").numFmt = "0.00";

  const sheet = workbook.addWorksheet("Invoices");
  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Invoice", key: "invoice", width: 16 },
    { header: "Type", key: "type", width: 18 },
    { header: "Customer", key: "customer", width: 32 },
    { header: "Items", key: "items", width: 10 },
    { header: "Subtotal (RM)", key: "subtotal", width: 16 },
    { header: "Discount (RM)", key: "discount", width: 16 },
    { header: "Total (RM)", key: "total", width: 16 },
    { header: "Profit (RM)", key: "profit", width: 16 },
    { header: "Payment Status", key: "status", width: 18 },
    { header: "Terms", key: "terms", width: 28 },
    { header: "Note", key: "note", width: 35 },
  ];
  invoices.forEach((invoice) => sheet.addRow({
    date: invoice.invoiceDate,
    invoice: invoice.invoiceNumber,
    type: invoice.invoiceType.name,
    customer: invoice.customerNameSnapshot,
    items: invoice.items.length,
    subtotal: invoice.subtotalCents / 100,
    discount: invoice.discountCents / 100,
    total: invoice.totalCents / 100,
    profit: invoice.profitCents / 100,
    status: invoice.paymentStatus,
    terms: invoice.terms,
    note: invoice.note || "",
  }));
  sheet.getRow(1).font = { bold: true };
  [6, 7, 8, 9].forEach((col) => (sheet.getColumn(col).numFmt = '"RM" #,##0.00'));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "L1" };

  const itemsSheet = workbook.addWorksheet("Invoice Items");
  itemsSheet.columns = [
    { header: "Invoice", key: "invoice", width: 16 },
    { header: "Date", key: "date", width: 14 },
    { header: "Customer", key: "customer", width: 32 },
    { header: "Description", key: "description", width: 40 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Unit Price (RM)", key: "unit", width: 18 },
    { header: "Line Total (RM)", key: "line", width: 18 },
  ];
  invoices.forEach((invoice) => invoice.items.forEach((item) => itemsSheet.addRow({
    invoice: invoice.invoiceNumber,
    date: invoice.invoiceDate,
    customer: invoice.customerNameSnapshot,
    description: item.description,
    qty: item.quantity,
    unit: item.unitPriceCents / 100,
    line: item.lineTotalCents / 100,
  })));
  itemsSheet.getRow(1).font = { bold: true };
  [6, 7].forEach((col) => (itemsSheet.getColumn(col).numFmt = '"RM" #,##0.00'));
  itemsSheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PMM_Sales_Report_${from}_to_${to}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
