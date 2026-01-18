# Ghazl Salon Management System

End-to-end salon management app (Arabic, RTL) with local-only persistence. Runs offline in the browser via IndexedDB and Vite dev server.

## Overview

- Frontend: React + TypeScript, Vite
- Storage: IndexedDB (no external backend)
- Language: Arabic (RTL)
- Currency: AED
- Launch: `start_app.bat` opens kiosk fullscreen and handles first-run dependency install (For easier client-side setup)

## Quick Start (Windows)

- Double-click `start_app.bat`
- The script installs dependencies if missing, starts the dev server, then opens Edge in fullscreen kiosk mode
- App runs at `http://localhost:5173`

If you prefer running manually:

```powershell
# from project root
npm install
npm run dev
# open http://localhost:5173
```

Type-check:

```powershell
npm run typecheck
```

## Features

### Customers
- Add, edit, delete customers (name, phone, email, notes)
- Fast search by name, phone, email
- Customer profile: recent receipts and summary tiles

Implementation:
- UI: `src/components/CustomerList.tsx`, `src/components/CustomerForm.tsx`, `src/components/CustomerProfile.tsx`
- Data: `CustomerService` in `src/db/service.ts`
- IndexedDB store: `customers` (`src/db/schema.ts`)

### Appointments
- Day view calendar with hourly slots for a full 24-hour day (00:00–23:00)
- Create/edit appointments: date, start/end time, status, notes
- Attach multiple services to each appointment

Implementation:
- UI: `src/components/AppointmentCalendar.tsx`, `src/components/AppointmentForm.tsx`
- Time slots: generated in `AppointmentCalendar.tsx` (24 entries)
- Default end time: capped safely for late-night slots in `AppointmentForm.tsx`
- Data: `AppointmentService`, `AppointmentServiceService` in `src/db/service.ts`
- Stores: `appointments`, `appointment_services`

### Point of Sale (POS)
- Unified cart for services and products
- Quantity controls, line totals, subtotal + tip + total (AED)
- Stock checks prevent selling unavailable quantities
- Generates itemized receipts

Implementation:
- UI: `src/components/POSSystem.tsx`
- Stock check: consults `InventoryService.getByProductId(...)`
- Receipt creation: `ReceiptService` + `ReceiptItemService` in `src/db/service.ts`
- Inventory deduction on sale via `InventoryService.adjustInventory(...)`

### Services & Products
- Services: name, price
- Products: name, price, min stock threshold
- Product names are unique (case-insensitive). SKU removed by design; products identified by name only.

Implementation:
- UI: `src/components/ServiceManager.tsx`, `src/components/ProductManager.tsx`
- Uniqueness: enforced in `ProductService.create` and `ProductService.update`
- Stores: `services`, `products`

### Inventory
- Auto-create inventory record on product creation
- Status: Available / Low / Out with color coding
- Adjustments: restock or manual change with notes
- Sale deduction logged with reason

Implementation:
- UI: `src/components/InventoryManager.tsx`
- Data: `InventoryService`, `InventoryLogService`
- Stores: `inventory` (unique index on `product_id`), `inventory_logs`

### Receipts
- Receipt history with search (by ID, customer name, phone)
- Detailed view: items, quantities, unit price, line totals
- Subtotal, tip, total (AED)

Implementation:
- UI: `src/components/ReceiptHistory.tsx`
- Data: `ReceiptService`, `ReceiptItemService`
- Stores: `receipts`, `receipt_items`

### Localization & UX
- Full Arabic UI, RTL layout
- Currency displayed as AED
- Responsive components across sections

## Data Model & Persistence

Stores (IndexedDB):
- `customers` (indices: `phone`, `name`)
- `appointments` (indices: `customer_id`, `date`, `status`)
- `appointment_services` (index: `appointment_id`)
- `services`
- `products` (legacy index `sku` exists; field not used)
- `inventory` (unique index: `product_id`)
- `inventory_logs` (indices: `product_id`, `created_at`)
- `receipts` (indices: `customer_id`, `timestamp`)
- `receipt_items` (index: `receipt_id`)

All writes are immediate once the transaction completes. Data is scoped to the browser profile and the app origin (`http://localhost:5173`).

## Key Flows

- Customer create/update: form → `CustomerService` write → list/profile refresh
- Appointment create/update:
  - Main record via `AppointmentService`
  - Linked services stored via `AppointmentServiceService`
- POS checkout:
  - Validate product stock
  - Create receipt
  - Insert receipt items
  - Deduct inventory for products
- Inventory adjust:
  - Update quantity and append log (reason: `sale`, `restock`, `adjustment`)

## Constraints & Edge Cases

- Product name must be unique (case-insensitive); attempts to duplicate will fail with a user-facing error
- Appointments: end-time defaults to +1 hour; late-night slots cap end-time safely to `23:59`
- Inventory deductions only occur on product sale items, not services
- Receipt creation and inventory adjustments occur in sequence; inventory logs reflect changes

## Troubleshooting

- “Vite not recognized”: run `npm install` or use `start_app.bat`
- Data missing after port/origin change: IndexedDB is origin-scoped; use the original URL
- Incognito/private windows: data is cleared on close

## Development

- `npm run dev` — start Vite
- `npm run typecheck` — TypeScript diagnostics

Structure:
- Components: `src/components/*`
- Services: `src/db/service.ts`
- Schema & DB bootstrap: `src/db/schema.ts`
- Types: `src/types/index.ts`

## Notes

- Everything runs locally in the browser; there is no backend or sync
- If a backup/restore feature is needed, add JSON export/import around the services layer
