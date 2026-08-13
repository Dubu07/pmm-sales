import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export type PdfInvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  documentTitle: string;
  customerName: string;
  customerAddress: string;
  contactPerson: string | null;
  phone: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  terms: string;
  note: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

export type PdfCompanyData = {
  companyName: string;
  tin: string;
  bankName: string;
  bankAccount: string;
  logoPath: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const GOLD = rgb(0.58, 0.40, 0.16);
const DARK = rgb(0.12, 0.14, 0.17);
const MID = rgb(0.38, 0.41, 0.45);
const LIGHT = rgb(0.91, 0.92, 0.93);
const WHITE = rgb(1, 1, 1);

function money(cents: number): string {
  return `RM ${(cents / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateDisplay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const cleaned = (text || "").replace(/\r/g, "");
  const paragraphs = cleaned.split("\n");
  const output: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      output.push("");
      continue;
    }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${line} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else {
        output.push(line);
        line = words[i];
      }
    }
    output.push(line);
  }
  return output;
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size: number, color = DARK, lineHeight = size + 3): number {
  const lines = wrap(text, font, size, width);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

function drawRight(page: PDFPage, text: string, rightX: number, y: number, font: PDFFont, size: number, color = DARK) {
  page.drawText(text, { x: rightX - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function drawLine(page: PDFPage, y: number, thickness = 0.7, color = LIGHT) {
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness, color });
}

export async function generateInvoicePdf(invoice: PdfInvoiceData, company: PdfCompanyData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    const fileName = company.logoPath.startsWith("/") ? company.logoPath.slice(1) : company.logoPath;
    const logoBytes = await fs.readFile(path.join(process.cwd(), "public", fileName));
    logo = await pdf.embedPng(logoBytes);
  } catch {
    logo = null;
  }

  const pages: PDFPage[] = [];
  const newPage = (continuation = false) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    if (continuation) {
      page.drawText(company.companyName, { x: MARGIN, y: PAGE_HEIGHT - 45, size: 10, font: bold, color: DARK });
      drawRight(page, `${invoice.documentTitle} - ${invoice.invoiceNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 45, bold, 10, MID);
      drawLine(page, PAGE_HEIGHT - 58);
    }
    return page;
  };

  let page = newPage(false);
  let y = PAGE_HEIGHT - 42;

  if (logo) {
    const maxW = 148;
    const maxH = 82;
    const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
    const logoW = logo.width * scale;
    const logoH = logo.height * scale;
    page.drawImage(logo, { x: MARGIN, y: y - logoH + 2, width: logoW, height: logoH });
  } else {
    page.drawText(company.companyName, { x: MARGIN, y: y - 20, size: 18, font: bold, color: DARK });
  }

  const title = invoice.documentTitle.toUpperCase();
  drawRight(page, title, PAGE_WIDTH - MARGIN, y - 2, bold, 21, GOLD);
  drawRight(page, `Invoice No.  ${invoice.invoiceNumber}`, PAGE_WIDTH - MARGIN, y - 30, bold, 10, DARK);
  drawRight(page, `Date  ${dateDisplay(invoice.invoiceDate)}`, PAGE_WIDTH - MARGIN, y - 47, regular, 10, MID);

  y -= 110;
  drawLine(page, y, 1.2, GOLD);
  y -= 26;

  page.drawText("BILL TO", { x: MARGIN, y, size: 9, font: bold, color: GOLD });
  page.drawText(invoice.customerName, { x: MARGIN, y: y - 20, size: 12, font: bold, color: DARK });
  let customerY = drawWrapped(page, invoice.customerAddress, MARGIN, y - 38, 290, regular, 10, MID, 14);
  const details: string[] = [];
  if (invoice.contactPerson) details.push(`Contact: ${invoice.contactPerson}`);
  if (invoice.phone) details.push(`Phone: ${invoice.phone}`);
  if (details.length) {
    customerY -= 3;
    details.forEach((line) => {
      page.drawText(line, { x: MARGIN, y: customerY, size: 9.5, font: regular, color: DARK });
      customerY -= 14;
    });
  }

  const companyX = 365;
  page.drawText("FROM", { x: companyX, y, size: 9, font: bold, color: GOLD });
  page.drawText(company.companyName, { x: companyX, y: y - 20, size: 10.5, font: bold, color: DARK });
  page.drawText(`TIN: ${company.tin}`, { x: companyX, y: y - 37, size: 9.5, font: regular, color: MID });

  y = Math.min(customerY - 15, y - 85);
  drawLine(page, y);
  y -= 26;

  const col = {
    descX: MARGIN,
    descW: 270,
    qtyX: 330,
    qtyW: 48,
    unitRight: 459,
    totalRight: PAGE_WIDTH - MARGIN,
  };

  const tableHeader = () => {
    page.drawRectangle({ x: MARGIN, y: y - 7, width: CONTENT_WIDTH, height: 25, color: DARK });
    page.drawText("Description", { x: col.descX + 6, y, size: 9, font: bold, color: WHITE });
    page.drawText("Qty", { x: col.qtyX, y, size: 9, font: bold, color: WHITE });
    drawRight(page, "Unit Price", col.unitRight, y, bold, 9, WHITE);
    drawRight(page, "Amount", col.totalRight - 6, y, bold, 9, WHITE);
    y -= 34;
  };

  tableHeader();

  for (const item of invoice.items) {
    const descLines = wrap(item.description, regular, 9.5, col.descW - 8);
    const rowHeight = Math.max(28, descLines.length * 13 + 9);
    if (y - rowHeight < 170) {
      page = newPage(true);
      y = PAGE_HEIGHT - 88;
      tableHeader();
    }

    descLines.forEach((line, index) => {
      page.drawText(line, { x: col.descX + 6, y: y - index * 13, size: 9.5, font: regular, color: DARK });
    });
    page.drawText(String(item.quantity), { x: col.qtyX, y, size: 9.5, font: regular, color: DARK });
    drawRight(page, money(item.unitPriceCents), col.unitRight, y, regular, 9.5, DARK);
    drawRight(page, money(item.lineTotalCents), col.totalRight - 6, y, regular, 9.5, DARK);
    page.drawLine({ start: { x: MARGIN, y: y - rowHeight + 7 }, end: { x: PAGE_WIDTH - MARGIN, y: y - rowHeight + 7 }, thickness: 0.55, color: LIGHT });
    y -= rowHeight;
  }

  const neededForTotals = 185;
  if (y < neededForTotals) {
    page = newPage(true);
    y = PAGE_HEIGHT - 92;
  }

  y -= 8;
  const totalsX = 370;
  const totalsRight = PAGE_WIDTH - MARGIN;
  page.drawText("Subtotal", { x: totalsX, y, size: 9.5, font: regular, color: MID });
  drawRight(page, money(invoice.subtotalCents), totalsRight, y, regular, 9.5, DARK);
  y -= 20;
  page.drawText("Discount", { x: totalsX, y, size: 9.5, font: regular, color: MID });
  drawRight(page, money(invoice.discountCents), totalsRight, y, regular, 9.5, DARK);
  y -= 8;
  page.drawLine({ start: { x: totalsX, y }, end: { x: totalsRight, y }, thickness: 0.7, color: LIGHT });
  y -= 24;
  page.drawText("TOTAL", { x: totalsX, y, size: 11, font: bold, color: DARK });
  drawRight(page, money(invoice.totalCents), totalsRight, y, bold, 13, GOLD);

  y -= 42;
  drawLine(page, y);
  y -= 23;

  page.drawText("PAYMENT & TERMS", { x: MARGIN, y, size: 9, font: bold, color: GOLD });
  y -= 19;
  y = drawWrapped(page, `Terms: ${invoice.terms}`, MARGIN, y, CONTENT_WIDTH, regular, 9.5, DARK, 14);
  y -= 3;
  y = drawWrapped(page, `Please bank in to: ${company.companyName}`, MARGIN, y, CONTENT_WIDTH, regular, 9.5, DARK, 14);
  y = drawWrapped(page, `${company.bankName} account ${company.bankAccount}`, MARGIN, y, CONTENT_WIDTH, regular, 9.5, DARK, 14);

  if (invoice.note?.trim()) {
    y -= 10;
    page.drawText("NOTE", { x: MARGIN, y, size: 9, font: bold, color: GOLD });
    y -= 18;
    drawWrapped(page, invoice.note.trim(), MARGIN, y, CONTENT_WIDTH, regular, 9.5, DARK, 14);
  }

  pages.forEach((p, index) => {
    const footer = `Page ${index + 1} of ${pages.length}`;
    drawRight(p, footer, PAGE_WIDTH - MARGIN, 24, regular, 8, MID);
  });

  return pdf.save();
}
