import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.post("/loads/:loadId/tracking", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { loadId } = c.req.param();
  const { event_type, lat, lng, notes } = await c.req.json();

  const { rows: loadRows } = await db.query(
    "SELECT id FROM loads WHERE id=$1 AND company_id=$2",
    [loadId, payload.company_id]
  );
  if (!loadRows[0]) return c.json({ error: "Load not found" }, 404);

  const { rows } = await db.query(
    `INSERT INTO tracking_events (load_id, event_type, lat, lng, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [loadId, event_type, lat ?? null, lng ?? null, notes ?? null]
  );
  return c.json(rows[0], 201);
});

export default router;
