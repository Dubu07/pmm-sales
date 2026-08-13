# PMM Sales & Invoice System - Local Invoice Upgrade

A local-first sales, customer and invoice system for Premium 88 Machine Enterprise.

## What this version includes

- Local Next.js web application
- SQLite database through Prisma ORM
- Independent invoice sequences (default `INV0001`, `CS0001`, `RP0001`)
- Existing customer selection with saved name, address, contact person and phone
- New-customer entry that automatically saves the customer for future invoices
- Customer master screen with editing
- Customer-detail snapshots on invoices so historical invoices do not change when a customer master record changes
- Multiple line items per sale
- Whole-number quantities
- Automatic line totals and subtotal
- Invoice-level discount; enter `0` / `0.00` when there is no discount
- Automatic invoice total = subtotal - discount
- One manually entered Profit value for the complete invoice; profit is internal and never printed on the customer invoice
- Payment statuses: Paid, Pending, Partial, Consignment, Replacement, Cancelled
- Terms default to `Payment received` and can be edited per invoice
- Notes (for example `FOC 1 unit`)
- Professional customer invoice preview
- Direct PDF invoice download using the supplied Premium Machine Enterprise logo
- Browser print / Save as PDF view
- Dashboard, Sales Records, edit sale, date-range reporting and Excel export
- Cancelled invoices remain visible but are excluded from dashboard/report totals
- Company details, bank details, invoice titles and invoice sequences are editable in Settings
- Timestamped SQLite backup from Settings

## First setup on Windows

1. Install **Node.js 22 LTS or newer**.
2. Extract this project folder.
3. Double-click `setup.bat`.
4. When setup finishes, double-click `start.bat`.
5. Open `http://localhost:3000` if it does not open automatically.

The database is stored at:

`data/pmm-sales.db`

Backups created from Settings are stored at:

`data/backups/`

## Default company details

- Company: Premium 88 Machine Enterprise
- TIN: D 60658890060
- Bank: Alliance Bank
- Account: 070390013037129
- Default terms: Payment received
- Default normal document title: Sales Invoice

These can be changed in **Settings** without editing source code.

## Default invoice types

| Type | Prefix | First Number | Document title |
| --- | --- | ---: | --- |
| Normal Invoice | INV | 1 | Sales Invoice |
| Consignment | CS | 1 | Consignment Invoice |
| Replacement | RP | 1 | Replacement Invoice |

Each type has its own counter. Invoice numbers are allocated only when the sale is successfully saved.

## Core workflow

1. Open **New Sale**.
2. Choose invoice type and invoice date.
3. Choose **Existing Customer** or **New Customer**.
4. For an existing customer, search/select the customer and verify the loaded details.
5. For a new customer, enter name, address, contact person and phone. The customer is saved automatically.
6. Add one or more invoice items.
7. Enter quantity and unit price; line totals and subtotal calculate automatically.
8. Enter discount (use zero when none).
9. Enter the internal Profit figure.
10. Choose payment status, edit terms if necessary, and enter a note if needed.
11. Save. The invoice number is allocated and the sale is stored.
12. Open **Customer Invoice** to preview, print or download the PDF.

## Historical customer data

An invoice keeps a snapshot of the customer name, address, contact person and phone at the time it is created. If you later edit the customer in **Customers**, previously issued invoices keep their original details.

## Money storage

Currency amounts are stored as integer cents rather than floating-point values, reducing rounding problems for financial records.

## Important upgrade note

This package is a consolidated updated build. It does **not** automatically import the old Excel workbook, and it does not contain an automated migration from an earlier draft SQLite schema. If you already entered important data into an older draft database, keep a copy of that database before switching and migrate it separately.

## Project structure

- `app/` - pages and API routes
- `components/` - reusable UI and forms
- `lib/` - database, money/date utilities and PDF generator
- `prisma/` - SQLite schema and seed data
- `public/company-logo.png` - supplied company logo used in the UI and invoices
- `data/` - local SQLite database and backups
- `docs/Invoice_Design_Preview.pdf` - static preview of the intended invoice layout

## Development commands

```bash
npm install
npm run setup
npm run dev
```

Production build:

```bash
npm run build
npm start
```
