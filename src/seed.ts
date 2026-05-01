import { Pool } from "pg";

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Company ──────────────────────────────────────
  const { rows: companies } = await db.query(`
    INSERT INTO companies (name, email, phone, address, subscription_plan, status)
    VALUES
      ('FastHaul Logistics', 'ops@fasthaul.com', '+1-555-0101', '123 Freight Ave, Dallas TX 75201', 'pro', 'active'),
      ('Metro Cargo Co.', 'admin@metrocargo.com', '+1-555-0202', '456 Dock St, Houston TX 77001', 'basic', 'active')
    ON CONFLICT DO NOTHING
    RETURNING id, name
  `);

  if (companies.length === 0) {
    console.log("⚠️  Data already seeded. Skipping.");
    await db.end();
    return;
  }

  const companyId = companies[0].id;
  console.log(`  ✔ Companies: ${companies.map((c) => c.name).join(", ")}`);

  // ── Users (staff) ────────────────────────────────
  const adminHash = await Bun.password.hash("admin123");
  const dispatchHash = await Bun.password.hash("dispatch123");
  await db.query(`
    INSERT INTO users (company_id, name, email, role, password_hash)
    VALUES
      ($1, 'Admin User',      'admin@fasthaul.com',    'owner',      $2),
      ($1, 'Jane Dispatcher', 'dispatch@fasthaul.com', 'dispatcher', $3)
  `, [companyId, adminHash, dispatchHash]);
  console.log(`  ✔ Users: admin@fasthaul.com (admin123), dispatch@fasthaul.com (dispatch123)`);

  // ── Drivers ──────────────────────────────────────
  const { rows: drivers } = await db.query(`
    INSERT INTO drivers (company_id, name, license_number, phone, status)
    VALUES
      ($1, 'James Reyes',    'DL-TX-100421', '+1-555-1001', 'available'),
      ($1, 'Maria Santos',   'DL-TX-200832', '+1-555-1002', 'on_duty'),
      ($1, 'Carlos Mendez',  'DL-TX-309943', '+1-555-1003', 'off_duty'),
      ($1, 'Diane Nguyen',   'DL-TX-411254', '+1-555-1004', 'available')
    RETURNING id, name, status
  `, [companyId]);
  console.log(`  ✔ Drivers: ${drivers.map((d) => d.name).join(", ")}`);

  // ── Vehicles ─────────────────────────────────────
  const { rows: vehicles } = await db.query(`
    INSERT INTO vehicles (company_id, plate_number, type, capacity_kg, status, last_service_date)
    VALUES
      ($1, 'TX-4821-FH', 'semi',        20000, 'available',  '2026-03-15'),
      ($1, 'TX-7734-FH', 'refrigerated', 8000, 'in_use',     '2026-02-20'),
      ($1, 'TX-3390-FH', 'box_truck',    5000, 'available',  '2026-04-01'),
      ($1, 'TX-9912-FH', 'van',          1500, 'maintenance', '2025-12-10')
    RETURNING id, plate_number, status
  `, [companyId]);
  console.log(`  ✔ Vehicles: ${vehicles.map((v) => v.plate_number).join(", ")}`);

  // ── Customers ────────────────────────────────────
  const { rows: customers } = await db.query(`
    INSERT INTO customers (company_id, name, email, phone, billing_address, notes)
    VALUES
      ($1, 'Apex Manufacturing',  'billing@apexmfg.com',    '+1-555-2001', '10 Industry Blvd, Austin TX 78701',    'Priority account'),
      ($1, 'Green Farms Co.',     'accounts@greenfarms.com', '+1-555-2002', '900 Rural Rd, San Antonio TX 78201',   'Refrigerated loads only'),
      ($1, 'TechParts Ltd.',      'finance@techparts.com',   '+1-555-2003', '55 Silicon Dr, Round Rock TX 78664',   NULL),
      ($1, 'BuildRight Supply',   'pay@buildright.com',      '+1-555-2004', '200 Commerce St, Fort Worth TX 76102', 'Net-30 terms')
    RETURNING id, name
  `, [companyId]);
  console.log(`  ✔ Customers: ${customers.map((c) => c.name).join(", ")}`);

  const [apex, greenFarms, techParts, buildRight] = customers;
  const [james, maria, carlos] = drivers;
  const [semi, reefer, boxTruck] = vehicles;

  // ── Loads ────────────────────────────────────────
  const { rows: loads } = await db.query(`
    INSERT INTO loads (company_id, customer_id, driver_id, vehicle_id, status, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes)
    VALUES
      ($1, $2, $3, $4, 'in_transit',  '123 Freight Ave, Dallas TX',     '10 Industry Blvd, Austin TX',      '2026-05-01T08:00:00Z', 'Industrial Parts',    18500, 'Handle with care'),
      ($1, $5, $6, $7, 'assigned',    '900 Rural Rd, San Antonio TX',   '55 Silicon Dr, Round Rock TX',     '2026-05-02T07:00:00Z', 'Refrigerated Produce', 6200, 'Keep at 4°C'),
      ($1, $8, NULL, NULL, 'pending', '200 Commerce St, Fort Worth TX', '10 Industry Blvd, Austin TX',      '2026-05-03T09:00:00Z', 'Construction Supply', 4800, NULL),
      ($1, $9, $10, $11, 'delivered', '456 Dock St, Houston TX',        '200 Commerce St, Fort Worth TX',   '2026-04-28T06:00:00Z', 'Hardware Components', 3100, 'Delivered on time')
    RETURNING id, freight_type, status
  `, [
    companyId,
    apex.id,      james.id,  semi.id,
    greenFarms.id, maria.id, reefer.id,
    techParts.id,
    buildRight.id, carlos.id, boxTruck.id,
  ]);
  console.log(`  ✔ Loads: ${loads.map((l) => `${l.freight_type} (${l.status})`).join(", ")}`);

  const [load1, load2, , load4] = loads;

  // ── Stops ────────────────────────────────────────
  await db.query(`
    INSERT INTO stops (load_id, sequence_order, type, address, status, eta)
    VALUES
      ($1, 1, 'pickup',   '123 Freight Ave, Dallas TX',     'collected', '2026-05-01T08:00:00Z'),
      ($1, 2, 'delivery', '10 Industry Blvd, Austin TX',    'pending',   '2026-05-01T14:00:00Z'),
      ($2, 1, 'pickup',   '900 Rural Rd, San Antonio TX',   'pending',   '2026-05-02T07:00:00Z'),
      ($2, 2, 'delivery', '55 Silicon Dr, Round Rock TX',   'pending',   '2026-05-02T11:00:00Z'),
      ($3, 1, 'pickup',   '456 Dock St, Houston TX',        'delivered', '2026-04-28T06:00:00Z'),
      ($3, 2, 'delivery', '200 Commerce St, Fort Worth TX', 'delivered', '2026-04-28T13:00:00Z')
  `, [load1.id, load2.id, load4.id]);
  console.log(`  ✔ Stops seeded`);

  // ── Tracking Events ──────────────────────────────
  await db.query(`
    INSERT INTO tracking_events (load_id, event_type, timestamp, notes)
    VALUES
      ($1, 'departed',       '2026-05-01T08:15:00Z', 'Departed Dallas warehouse'),
      ($1, 'arrived_at_stop','2026-05-01T10:30:00Z', 'Arrived at Waco checkpoint'),
      ($2, 'departed',       '2026-04-28T06:20:00Z', 'Departed Houston dock'),
      ($2, 'completed',      '2026-04-28T13:45:00Z', 'Delivered successfully to Fort Worth')
  `, [load1.id, load4.id]);
  console.log(`  ✔ Tracking events seeded`);

  // ── Invoices ─────────────────────────────────────
  await db.query(`
    INSERT INTO invoices (load_id, company_id, customer_id, amount, currency, due_date, status, notes)
    VALUES
      ($1, $2, $3,  385000, 'USD', '2026-05-31', 'sent',  'Net-30'),
      ($4, $2, $5,  210000, 'USD', '2026-05-15', 'paid',  'Paid via wire transfer'),
      ($6, $2, $7,  155000, 'USD', '2026-06-01', 'draft', NULL),
      ($8, $2, $9,   98500, 'USD', '2026-04-15', 'overdue', 'Follow up required')
  `, [
    load1.id, companyId, apex.id,
    load4.id, buildRight.id,
    load2.id, greenFarms.id,
    load4.id, buildRight.id,
  ]);
  console.log(`  ✔ Invoices seeded`);

  console.log("\n✅ Seed complete!");
  console.log("\n🔑 Login credentials:");
  console.log("   Email:    admin@fasthaul.com");
  console.log("   Password: admin123");
  await db.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
