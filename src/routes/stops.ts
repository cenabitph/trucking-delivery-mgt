import { Hono } from "hono";
import QRCode from "qrcode";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

// Create a stop for a load (generates QR code)
router.post("/loads/:loadId/stops", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { loadId } = c.req.param();
  const { sequence_order, type, address, eta } = await c.req.json();

  // Verify load belongs to company
  const { rows: loadRows } = await db.query(
    "SELECT id FROM loads WHERE id=$1 AND company_id=$2",
    [loadId, payload.company_id]
  );
  if (!loadRows[0]) return c.json({ error: "Load not found" }, 404);

  // Insert stop to get qr_token
  const { rows: stopRows } = await db.query(
    `INSERT INTO stops (load_id, sequence_order, type, address, eta)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [loadId, sequence_order, type, address, eta ?? null]
  );
  const stop = stopRows[0];

  // Generate QR code data URL encoding the scan URL
  const scanUrl = `${process.env.APP_URL ?? "http://localhost:5173"}/scan/${stop.qr_token}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2 });

  // Save QR URL back to stop
  const { rows: updated } = await db.query(
    "UPDATE stops SET qr_code_url=$1 WHERE id=$2 RETURNING *",
    [qrDataUrl, stop.id]
  );

  return c.json(updated[0], 201);
});

// Get all stops for a load
router.get("/loads/:loadId/stops", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { loadId } = c.req.param();

  const { rows } = await db.query(
    `SELECT s.* FROM stops s
     JOIN loads l ON s.load_id = l.id
     WHERE s.load_id=$1 AND l.company_id=$2
     ORDER BY s.sequence_order`,
    [loadId, payload.company_id]
  );
  return c.json(rows);
});

// Delete a stop
router.delete("/stops/:id", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query(
    `DELETE FROM stops s USING loads l
     WHERE s.load_id = l.id AND s.id=$1 AND l.company_id=$2
     RETURNING s.id`,
    [c.req.param("id"), payload.company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

// QR scan endpoint — public, no auth required
router.post("/stops/scan", async (c) => {
  const { qr_token, lat, lng } = await c.req.json();
  if (!qr_token) return c.json({ result: "invalid", message: "Missing qr_token" }, 400);

  // Find stop by token
  const { rows: stopRows } = await db.query(
    "SELECT * FROM stops WHERE qr_token=$1",
    [qr_token]
  );
  const stop = stopRows[0];
  if (!stop) return c.json({ result: "invalid", message: "QR code not found" }, 404);

  if (stop.status === "delivered" || stop.status === "collected") {
    await db.query(
      `INSERT INTO qr_scan_logs (stop_id, lat, lng, result) VALUES ($1,$2,$3,'already_scanned')`,
      [stop.id, lat ?? null, lng ?? null]
    );
    return c.json({ result: "already_scanned", message: "This stop has already been scanned" });
  }

  // Determine new status based on stop type
  const newStatus = stop.type === "pickup" ? "collected" : "delivered";

  const { rows: updated } = await db.query(
    `UPDATE stops SET status=$1, scanned_at=NOW(), scanned_lat=$2, scanned_lng=$3
     WHERE id=$4 RETURNING *`,
    [newStatus, lat ?? null, lng ?? null, stop.id]
  );

  await db.query(
    `INSERT INTO qr_scan_logs (stop_id, lat, lng, result) VALUES ($1,$2,$3,'success')`,
    [stop.id, lat ?? null, lng ?? null]
  );

  // Auto-update load status
  const { rows: allStops } = await db.query(
    "SELECT status FROM stops WHERE load_id=$1",
    [stop.load_id]
  );
  const allDone = allStops.every((s) => s.status === "delivered" || s.status === "collected");
  const anyDone = allStops.some((s) => s.status === "delivered" || s.status === "collected");
  const loadStatus = allDone ? "delivered" : anyDone ? "partially_delivered" : "in_transit";

  await db.query(
    "UPDATE loads SET status=$1, updated_at=NOW() WHERE id=$2",
    [loadStatus, stop.load_id]
  );

  // Log tracking event
  await db.query(
    `INSERT INTO tracking_events (load_id, event_type, lat, lng, notes)
     VALUES ($1,'qr_scanned',$2,$3,$4)`,
    [stop.load_id, lat ?? null, lng ?? null, `QR scanned at stop: ${stop.address}`]
  );

  return c.json({
    result: "success",
    stop: updated[0],
    load_status_updated_to: loadStatus,
    message: `Stop marked as ${newStatus}`,
  });
});

// Public: resolve QR token info (for scan page preview)
router.get("/stops/scan/:token", async (c) => {
  const { rows } = await db.query(
    `SELECT s.*, l.freight_type, l.pickup_location, l.delivery_location, l.status AS load_status
     FROM stops s JOIN loads l ON s.load_id = l.id
     WHERE s.qr_token=$1`,
    [c.req.param("token")]
  );
  if (!rows[0]) return c.json({ error: "Invalid QR token" }, 404);
  return c.json(rows[0]);
});

export default router;
