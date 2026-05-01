# Trucking Delivery Management

A full-stack web application for managing trucking and delivery operations — including loads, drivers, vehicles, customers, invoices, and real-time stop tracking via QR codes.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Backend | [Hono](https://hono.dev) |
| Database | PostgreSQL |
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | JWT (hono/jwt + Bun.password bcrypt) |
| PDF | pdfkit |
| QR Codes | qrcode |

## Features

- **Dashboard** — live stats for loads, drivers, vehicles, and invoices
- **Loads** — full CRUD, driver/vehicle assignment, status tracking
- **Stops** — per-load stops with auto-generated QR codes for field scanning
- **QR Scan** — public scan page for drivers (no login required); geo-logs each scan
- **Tracking Events** — manual event logging per load (departed, arrived, delayed, etc.)
- **Drivers & Vehicles** — manage fleet and staff availability
- **Customers** — customer records with billing info
- **Invoices** — generate, view as HTML, and download as PDF
- **Companies** — multi-company support
- **Staff / Users** — role-based access (owner, admin, dispatcher, driver, accountant)
- **JWT Auth** — login-protected dashboard with auto-logout on token expiry

## Project Structure

```
├── src/                    # Backend (Bun + Hono)
│   ├── index.ts            # App entry, DB pool, route wiring
│   ├── middleware/
│   │   └── auth.ts         # JWT verification middleware
│   ├── routes/             # API route handlers
│   │   ├── auth.ts         # POST /api/auth/login
│   │   ├── companies.ts
│   │   ├── users.ts
│   │   ├── drivers.ts
│   │   ├── vehicles.ts
│   │   ├── customers.ts
│   │   ├── loads.ts
│   │   ├── stops.ts        # Stop creation + public QR scan endpoint
│   │   ├── tracking.ts
│   │   ├── invoices.ts     # Includes HTML view + PDF download
│   │   └── dashboard.ts
│   ├── lib/
│   │   ├── invoice-html.ts
│   │   └── invoice-pdf.ts
│   └── seed.ts             # Sample data seeder
├── client/                 # Frontend (React + Vite + Tailwind)
│   └── src/
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── RequireAuth.tsx
│       │   ├── Table.tsx
│       │   ├── Modal.tsx
│       │   └── StatusBadge.tsx
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Loads.tsx / LoadDetail.tsx
│       │   ├── Drivers.tsx
│       │   ├── Vehicles.tsx
│       │   ├── Customers.tsx
│       │   ├── Invoices.tsx
│       │   ├── Companies.tsx
│       │   ├── Users.tsx
│       │   └── ScanPage.tsx  # Public QR scan page
│       └── lib/
│           └── api.ts        # Fetch wrapper with auth header
├── schema.sql              # PostgreSQL schema (10 tables)
├── package.json
└── .env
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- PostgreSQL running locally

### 1. Install dependencies

```sh
bun install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```sh
cp .env.example .env
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/trucking_delivery_db
PORT=3000
JWT_SECRET=your-super-secret-key-change-in-production
```

### 3. Run database migrations

```sh
bun run db:migrate
```

### 4. Seed sample data

```sh
bun run db:seed
```

This creates two companies, drivers, vehicles, customers, loads, stops, tracking events, and invoices, plus two user accounts:

| Email | Password | Role |
|---|---|---|
| admin@fasthaul.com | admin123 | owner |
| dispatch@fasthaul.com | dispatch123 | dispatcher |

### 5. Start development servers

```sh
bun run dev:all
```

- Backend API: http://localhost:3000
- Frontend: http://localhost:5173

## API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/dashboard/stats` | ✓ | Aggregate stats |
| GET/POST | `/api/loads` | ✓ | List / create loads |
| GET/PATCH/DELETE | `/api/loads/:id` | ✓ | Load detail / update / delete |
| POST | `/api/loads/:id/stops` | ✓ | Add stop + generate QR |
| POST | `/api/loads/:id/tracking` | ✓ | Log tracking event |
| POST | `/api/stops/scan` | Public | QR scan (field use) |
| GET | `/api/stops/scan/:token` | Public | QR token info |
| GET | `/api/invoices/:id/html` | ✓ | View invoice as HTML |
| GET | `/api/invoices/:id/pdf` | ✓ | Download invoice as PDF |
| GET/POST/PUT/DELETE | `/api/drivers` | ✓ | Driver management |
| GET/POST/PUT/DELETE | `/api/vehicles` | ✓ | Vehicle management |
| GET/POST/PUT/DELETE | `/api/customers` | ✓ | Customer management |
| GET/POST/PUT/DELETE | `/api/invoices` | ✓ | Invoice management |
| GET/POST/PUT | `/api/companies` | ✓ | Company management |
| GET/POST/PUT/DELETE | `/api/users` | ✓ | User/staff management |
