-- Trucking Delivery Management — Database Schema
-- Run with: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT NOT NULL,
  address     TEXT NOT NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic','pro','enterprise')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','suspended','pending')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner','admin','dispatcher','driver','accountant')),
  password_hash TEXT NOT NULL,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  license_number  TEXT NOT NULL,
  phone           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_duty','off_duty','inactive')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate_number      TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('flatbed','refrigerated','box_truck','semi','van','tanker')),
  capacity_kg       NUMERIC NOT NULL,
  status            TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','in_use','maintenance','retired')),
  last_service_date DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loads (Orders)
CREATE TABLE IF NOT EXISTS loads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES customers(id),
  driver_id         UUID REFERENCES drivers(id),
  vehicle_id        UUID REFERENCES vehicles(id),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','assigned','in_transit','partially_delivered','delivered','cancelled')),
  pickup_location   TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  scheduled_date    TIMESTAMPTZ NOT NULL,
  freight_type      TEXT NOT NULL,
  weight_kg         NUMERIC NOT NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stops
CREATE TABLE IF NOT EXISTS stops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id             UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  sequence_order      INT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('pickup','delivery','collect')),
  address             TEXT NOT NULL,
  eta                 TIMESTAMPTZ,
  qr_token            UUID NOT NULL DEFAULT gen_random_uuid(),
  qr_code_url         TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','arrived','collected','delivered','failed')),
  scanned_at          TIMESTAMPTZ,
  scanned_by_user_id  UUID REFERENCES users(id),
  scanned_lat         NUMERIC,
  scanned_lng         NUMERIC,
  signature_url       TEXT,
  photo_url           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracking Events
CREATE TABLE IF NOT EXISTS tracking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id     UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('departed','arrived_at_stop','qr_scanned','delayed','completed','incident')),
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lat         NUMERIC,
  lng         NUMERIC,
  notes       TEXT
);

-- QR Scan Logs
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id             UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  scanned_by_user_id  UUID REFERENCES users(id),
  scanned_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lat                 NUMERIC,
  lng                 NUMERIC,
  result              TEXT NOT NULL CHECK (result IN ('success','invalid','expired','already_scanned'))
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id     UUID NOT NULL REFERENCES loads(id),
  company_id  UUID NOT NULL REFERENCES companies(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount      NUMERIC NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'USD',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
