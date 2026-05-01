import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.get("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query("SELECT * FROM drivers WHERE company_id=$1 ORDER BY created_at DESC", [company_id]);
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query("SELECT * FROM drivers WHERE id=$1 AND company_id=$2", [c.req.param("id"), company_id]);
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.post("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { name, license_number, phone } = await c.req.json();
  const { rows } = await db.query(
    `INSERT INTO drivers (company_id, name, license_number, phone)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [company_id, name, license_number, phone]
  );
  return c.json(rows[0], 201);
});

router.put("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { name, license_number, phone, status } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE drivers SET name=$1, license_number=$2, phone=$3, status=$4, updated_at=NOW()
     WHERE id=$5 AND company_id=$6 RETURNING *`,
    [name, license_number, phone, status, c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.delete("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  await db.query("DELETE FROM drivers WHERE id=$1 AND company_id=$2", [c.req.param("id"), company_id]);
  return c.json({ success: true });
});

export default router;
