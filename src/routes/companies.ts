import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.get("/", async (c) => {
  const { rows } = await db.query("SELECT * FROM companies ORDER BY created_at DESC");
  return c.json(rows);
});

router.get("/me", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query("SELECT * FROM companies WHERE id = $1", [payload.company_id]);
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.get("/:id", async (c) => {
  const { rows } = await db.query("SELECT * FROM companies WHERE id = $1", [c.req.param("id")]);
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.post("/", async (c) => {
  const { name, email, phone, address, subscription_plan } = await c.req.json();
  const { rows } = await db.query(
    `INSERT INTO companies (name, email, phone, address, subscription_plan)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, email, phone, address, subscription_plan ?? "basic"]
  );
  return c.json(rows[0], 201);
});

router.put("/:id", async (c) => {
  const { name, email, phone, address, subscription_plan, status } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE companies SET name=$1, email=$2, phone=$3, address=$4,
     subscription_plan=$5, status=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
    [name, email, phone, address, subscription_plan, status, c.req.param("id")]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

export default router;
