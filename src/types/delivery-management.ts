// ─────────────────────────────────────────────
// Trucking & Delivery Management — TypeScript Types
// ─────────────────────────────────────────────

// ── Shared primitives ──────────────────────────

export type UUID = string;
export type ISODateString = string; // e.g. "2026-04-29T10:00:00Z"
export type LatLng = { lat: number; lng: number };

// ── Enums ──────────────────────────────────────

export type SubscriptionPlan = "basic" | "pro" | "enterprise";

export type CompanyStatus = "active" | "suspended" | "pending";

export type UserRole = "owner" | "admin" | "dispatcher" | "driver" | "accountant";

export type DriverStatus = "available" | "on_duty" | "off_duty" | "inactive";

export type VehicleType =
  | "flatbed"
  | "refrigerated"
  | "box_truck"
  | "semi"
  | "van"
  | "tanker";

export type VehicleStatus = "available" | "in_use" | "maintenance" | "retired";

export type LoadStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "partially_delivered"
  | "delivered"
  | "cancelled";

export type StopType = "pickup" | "delivery" | "collect";

export type StopStatus =
  | "pending"
  | "arrived"
  | "collected"
  | "delivered"
  | "failed";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type QRScanResult = "success" | "invalid" | "expired" | "already_scanned";

export type TrackingEventType =
  | "departed"
  | "arrived_at_stop"
  | "qr_scanned"
  | "delayed"
  | "completed"
  | "incident";

// ── Company ────────────────────────────────────

export interface Company {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_plan: SubscriptionPlan;
  status: CompanyStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateCompanyInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_plan?: SubscriptionPlan;
}

// ── User / Staff ───────────────────────────────

export interface User {
  id: UUID;
  company_id: UUID;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  last_login: ISODateString | null;
  created_at: ISODateString;
}

export interface CreateUserInput {
  company_id: UUID;
  name: string;
  email: string;
  password: string; // plain — hashed server-side
  role: UserRole;
}

// ── Driver ─────────────────────────────────────

export interface Driver {
  id: UUID;
  company_id: UUID;
  name: string;
  license_number: string;
  phone: string;
  status: DriverStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateDriverInput {
  company_id: UUID;
  name: string;
  license_number: string;
  phone: string;
}

// ── Vehicle ────────────────────────────────────

export interface Vehicle {
  id: UUID;
  company_id: UUID;
  plate_number: string;
  type: VehicleType;
  capacity_kg: number;
  status: VehicleStatus;
  last_service_date: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateVehicleInput {
  company_id: UUID;
  plate_number: string;
  type: VehicleType;
  capacity_kg: number;
}

// ── Customer ───────────────────────────────────

export interface Customer {
  id: UUID;
  company_id: UUID;
  name: string;
  email: string;
  phone: string;
  billing_address: string;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateCustomerInput {
  company_id: UUID;
  name: string;
  email: string;
  phone: string;
  billing_address: string;
  notes?: string;
}

// ── Load / Order ───────────────────────────────

export interface Load {
  id: UUID;
  company_id: UUID;
  customer_id: UUID;
  driver_id: UUID | null;
  vehicle_id: UUID | null;
  status: LoadStatus;
  pickup_location: string;
  delivery_location: string;
  scheduled_date: ISODateString;
  freight_type: string;
  weight_kg: number;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateLoadInput {
  company_id: UUID;
  customer_id: UUID;
  pickup_location: string;
  delivery_location: string;
  scheduled_date: ISODateString;
  freight_type: string;
  weight_kg: number;
  notes?: string;
}

export interface AssignLoadInput {
  driver_id: UUID;
  vehicle_id: UUID;
}

// ── Stop (with QR) ─────────────────────────────

export interface Stop {
  id: UUID;
  load_id: UUID;
  sequence_order: number;
  type: StopType;
  address: string;
  eta: ISODateString | null;

  // QR code fields
  qr_token: UUID;           // unique token encoded into the QR image
  qr_code_url: string;      // URL to the generated QR image (e.g. stored in S3)

  // Auto-updated on scan
  status: StopStatus;
  scanned_at: ISODateString | null;
  scanned_by_user_id: UUID | null;
  scanned_lat: number | null;
  scanned_lng: number | null;

  // Optional proof on delivery
  signature_url: string | null;
  photo_url: string | null;

  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateStopInput {
  load_id: UUID;
  sequence_order: number;
  type: StopType;
  address: string;
  eta?: ISODateString;
}

// Payload sent when driver scans a QR code
export interface QRScanInput {
  qr_token: UUID;
  scanned_by_user_id: UUID;
  location: LatLng;
  signature_url?: string;
  photo_url?: string;
}

// Response returned after processing a QR scan
export interface QRScanResponse {
  result: QRScanResult;
  stop: Stop | null;
  load_status_updated_to: LoadStatus | null;
  message: string;
}

// ── QR Scan Log ────────────────────────────────

export interface QRScanLog {
  id: UUID;
  stop_id: UUID;
  scanned_by_user_id: UUID;
  scanned_at: ISODateString;
  lat: number | null;
  lng: number | null;
  result: QRScanResult;
}

// ── Tracking Event ─────────────────────────────

export interface TrackingEvent {
  id: UUID;
  load_id: UUID;
  event_type: TrackingEventType;
  timestamp: ISODateString;
  lat: number | null;
  lng: number | null;
  notes: string | null;
}

export interface CreateTrackingEventInput {
  load_id: UUID;
  event_type: TrackingEventType;
  location?: LatLng;
  notes?: string;
}

// ── Invoice ────────────────────────────────────

export interface Invoice {
  id: UUID;
  load_id: UUID;
  company_id: UUID;
  customer_id: UUID;
  amount: number;          // in smallest currency unit (e.g. cents)
  currency: string;        // e.g. "USD", "SGD"
  issued_date: ISODateString;
  due_date: ISODateString;
  status: InvoiceStatus;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateInvoiceInput {
  load_id: UUID;
  company_id: UUID;
  customer_id: UUID;
  amount: number;
  currency: string;
  due_date: ISODateString;
  notes?: string;
}

// ── Enriched / joined response types ──────────

/** Load with its stops, driver, vehicle, and customer populated */
export interface LoadDetail extends Load {
  customer: Customer;
  driver: Driver | null;
  vehicle: Vehicle | null;
  stops: Stop[];
  tracking_events: TrackingEvent[];
}

/** Stop with its parent load summary */
export interface StopWithLoad extends Stop {
  load: Pick<Load, "id" | "status" | "company_id" | "customer_id">;
}

/** Compact company summary used in list views */
export interface CompanySummary {
  id: UUID;
  name: string;
  status: CompanyStatus;
  subscription_plan: SubscriptionPlan;
  driver_count: number;
  vehicle_count: number;
  active_load_count: number;
}