# Invoice Upgrade - Implementation Notes

## Agreed decisions implemented

- Discount is supported at invoice level and may be `0.00`.
- Normal invoice title defaults to **Sales Invoice**.
- Terms default to **Payment received** and remain editable for each invoice.
- Initial company details are Premium 88 Machine Enterprise, TIN D 60658890060, Alliance Bank, account 070390013037129.
- Customer address uses one multiline field.
- Item quantities are positive whole numbers.
- Profit remains one manually entered figure for the entire invoice and is internal only.

## Customer architecture

A saved Customer record contains name, address, contact person and phone. When an invoice is created, those fields are copied to invoice snapshot fields. This prevents customer-master edits from changing historical invoice documents.

## Invoice architecture

An invoice has one invoice type, one customer, one or more invoice items, one discount, one total, one internal profit figure, payment status, terms and optional note.

Sales reporting uses the invoice total after discount. Cancelled invoices are displayed in records/reports but excluded from aggregate totals.

## Generated invoice

The customer-facing invoice excludes internal profit and payment-status administration. It includes invoice number/date, customer snapshot, company/TIN, multiple items, subtotal, discount, total, editable terms, bank details and note. The supplied logo is embedded from `public/company-logo.png`.
