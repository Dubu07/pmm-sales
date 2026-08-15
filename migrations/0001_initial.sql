PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "InvoiceType" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "nextNumber" INTEGER NOT NULL DEFAULT 1,
  "padding" INTEGER NOT NULL DEFAULT 4,
  "documentTitle" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceType_prefix_key" ON "InvoiceType"("prefix");

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "contactPerson" TEXT,
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceDate" TEXT NOT NULL,
  "invoiceTypeId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "customerNameSnapshot" TEXT NOT NULL,
  "customerAddressSnapshot" TEXT NOT NULL,
  "contactPersonSnapshot" TEXT,
  "phoneSnapshot" TEXT,
  "subtotalCents" INTEGER NOT NULL,
  "discountCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "profitCents" INTEGER NOT NULL,
  "paymentStatus" TEXT NOT NULL,
  "terms" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_invoiceTypeId_fkey" FOREIGN KEY ("invoiceTypeId") REFERENCES "InvoiceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "invoiceId" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceCents" INTEGER NOT NULL,
  "lineTotalCents" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CompanySettings" (
  "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  "companyName" TEXT NOT NULL DEFAULT 'Premium 88 Machine Enterprise',
  "tin" TEXT NOT NULL DEFAULT 'D 60658890060',
  "bankName" TEXT NOT NULL DEFAULT 'Alliance Bank',
  "bankAccount" TEXT NOT NULL DEFAULT '070390013037129',
  "defaultTerms" TEXT NOT NULL DEFAULT 'Payment received',
  "defaultInvoiceTitle" TEXT NOT NULL DEFAULT 'Sales Invoice',
  "logoPath" TEXT NOT NULL DEFAULT '/company-logo.png',
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO "InvoiceType" ("name", "prefix", "nextNumber", "padding", "documentTitle", "isActive", "createdAt", "updatedAt") VALUES
  ('Normal Invoice', 'INV', 1, 4, 'Sales Invoice', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Consignment', 'CS', 1, 4, 'Consignment Invoice', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Replacement', 'RP', 1, 4, 'Replacement Invoice', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "CompanySettings" ("id", "companyName", "tin", "bankName", "bankAccount", "defaultTerms", "defaultInvoiceTitle", "logoPath", "updatedAt")
VALUES (1, 'Premium 88 Machine Enterprise', 'D 60658890060', 'Alliance Bank', '070390013037129', 'Payment received', 'Sales Invoice', '/company-logo.png', CURRENT_TIMESTAMP);
