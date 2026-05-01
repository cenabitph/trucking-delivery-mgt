import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.get("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query("SELECT * FROM vehicles WHERE company_id=$1 ORDER BY created_at DESC", [company_id]);
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query("SELECT * FROM vehicles WHERE id=$1 AND company_id=$2", [c.req.param("id"), company_id]);
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.post("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { plate_number, type, capacity_kg } = await c.req.json();
  const { rows } = await db.query(
    `INSERT INTO vehicles (company_id, plate_number, type, capacity_kg)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [company_id, plate_number, type, capacity_kg]
  );
  return c.json(rows[0], 201);
});

router.put("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { plate_number, type, capacity_kg, status, last_service_date } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE vehicles SET plate_number=$1, type=$2, capacity_kg=$3, status=$4, last_service_date=$5, updated_at=NOW()
     WHERE id=$6 AND company_id=$7 RETURNING *`,
    [plate_number, type, capacity_kg, status, last_service_date ?? null, c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.delete("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  await db.query("DELETE FROM vehicles WHERE id=$1 AND company_id=$2", [c.req.param("id"), company_id]);
  return c.json({ success: true });
});

export default router;
