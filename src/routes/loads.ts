import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.get("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query(
    `SELECT l.*, c.name AS customer_name, d.name AS driver_name, v.plate_number
     FROM loads l
     LEFT JOIN customers c ON l.customer_id = c.id
     LEFT JOIN drivers d ON l.driver_id = d.id
     LEFT JOIN vehicles v ON l.vehicle_id = v.id
     WHERE l.company_id=$1
     ORDER BY l.created_at DESC`,
    [company_id]
  );
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows: loadRows } = await db.query(
    `SELECT l.*, c.name AS customer_name, d.name AS driver_name, v.plate_number
     FROM loads l
     LEFT JOIN customers c ON l.customer_id = c.id
     LEFT JOIN drivers d ON l.driver_id = d.id
     LEFT JOIN vehicles v ON l.vehicle_id = v.id
     WHERE l.id=$1 AND l.company_id=$2`,
    [c.req.param("id"), company_id]
  );
  if (!loadRows[0]) return c.json({ error: "Not found" }, 404);

  const { rows: stops } = await db.query(
    "SELECT * FROM stops WHERE load_id=$1 ORDER BY sequence_order",
    [c.req.param("id")]
  );
  const { rows: events } = await db.query(
    "SELECT * FROM tracking_events WHERE load_id=$1 ORDER BY timestamp DESC",
    [c.req.param("id")]
  );
  return c.json({ ...loadRows[0], stops, tracking_events: events });
});

router.post("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes } = await c.req.json();
  const { rows } = await db.query(
    `INSERT INTO loads (company_id, customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [company_id, customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes ?? null]
  );
  return c.json(rows[0], 201);
});

router.patch("/:id/assign", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { driver_id, vehicle_id } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE loads SET driver_id=$1, vehicle_id=$2, status='assigned', updated_at=NOW()
     WHERE id=$3 AND company_id=$4 RETURNING *`,
    [driver_id, vehicle_id, c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.patch("/:id/status", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { status } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE loads SET status=$1, updated_at=NOW() WHERE id=$2 AND company_id=$3 RETURNING *`,
    [status, c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.put("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes, status } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE loads SET customer_id=$1, pickup_location=$2, delivery_location=$3,
     scheduled_date=$4, freight_type=$5, weight_kg=$6, notes=$7, status=$8, updated_at=NOW()
     WHERE id=$9 AND company_id=$10 RETURNING *`,
    [customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes ?? null, status, c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.delete("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  await db.query("DELETE FROM loads WHERE id=$1 AND company_id=$2", [c.req.param("id"), company_id]);
  return c.json({ success: true });
});

router.get("/:id", async (c) => {
  const { rows: loadRows } = await db.query(
    `SELECT l.*, c.name AS customer_name, d.name AS driver_name, v.plate_number
     FROM loads l
     LEFT JOIN customers c ON l.customer_id = c.id
     LEFT JOIN drivers d ON l.driver_id = d.id
     LEFT JOIN vehicles v ON l.vehicle_id = v.id
     WHERE l.id = $1`,
    [c.req.param("id")]
  );
  if (!loadRows[0]) return c.json({ error: "Not found" }, 404);

  const { rows: stops } = await db.query(
    "SELECT * FROM stops WHERE load_id = $1 ORDER BY sequence_order",
    [c.req.param("id")]
  );
  const { rows: events } = await db.query(
    "SELECT * FROM tracking_events WHERE load_id = $1 ORDER BY timestamp DESC",
    [c.req.param("id")]
  );
  return c.json({ ...loadRows[0], stops, tracking_events: events });
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const {
    company_id, customer_id, pickup_location, delivery_location,
    scheduled_date, freight_type, weight_kg, notes
  } = body;
  const { rows } = await db.query(
    `INSERT INTO loads (company_id, customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [company_id, customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes ?? null]
  );
  return c.json(rows[0], 201);
});

router.patch("/:id/assign", async (c) => {
  const { driver_id, vehicle_id } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE loads SET driver_id=$1, vehicle_id=$2, status='assigned', updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [driver_id, vehicle_id, c.req.param("id")]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.patch("/:id/status", async (c) => {
  const { status } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE loads SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [status, c.req.param("id")]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.put("/:id", async (c) => {
  const body = await c.req.json();
  const {
    customer_id, pickup_location, delivery_location,
    scheduled_date, freight_type, weight_kg, notes, status
  } = body;
  const { rows } = await db.query(
    `UPDATE loads SET customer_id=$1, pickup_location=$2, delivery_location=$3,
     scheduled_date=$4, freight_type=$5, weight_kg=$6, notes=$7, status=$8, updated_at=NOW()
     WHERE id=$9 RETURNING *`,
    [customer_id, pickup_location, delivery_location, scheduled_date, freight_type, weight_kg, notes ?? null, status, c.req.param("id")]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.delete("/:id", async (c) => {
  await db.query("DELETE FROM loads WHERE id = $1", [c.req.param("id")]);
  return c.json({ success: true });
});

export default router;
