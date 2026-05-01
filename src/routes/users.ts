import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.get("/", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query(
    "SELECT id, company_id, name, email, role, last_login, created_at FROM users WHERE company_id = $1 ORDER BY created_at DESC",
    [payload.company_id]
  );
  return c.json(rows);
});

router.post("/", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { name, email, password, role } = await c.req.json();
  if (!name || !email || !password || !role) {
    return c.json({ error: "name, email, password, role required" }, 400);
  }
  const password_hash = await Bun.password.hash(password);
  const { rows } = await db.query(
    `INSERT INTO users (company_id, name, email, role, password_hash)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, company_id, name, email, role, created_at`,
    [payload.company_id, name, email, password_hash, role]
  );
  return c.json(rows[0], 201);
});

router.put("/:id", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  const { name, email, role, password } = await c.req.json();

  // If new password provided, hash it
  if (password) {
    const password_hash = await Bun.password.hash(password);
    const { rows } = await db.query(
      `UPDATE users SET name=$1, email=$2, role=$3, password_hash=$4
       WHERE id=$5 AND company_id=$6
       RETURNING id, company_id, name, email, role, created_at`,
      [name, email, role, password_hash, c.req.param("id"), payload.company_id]
    );
    if (!rows[0]) return c.json({ error: "Not found" }, 404);
    return c.json(rows[0]);
  }

  const { rows } = await db.query(
    `UPDATE users SET name=$1, email=$2, role=$3
     WHERE id=$4 AND company_id=$5
     RETURNING id, company_id, name, email, role, created_at`,
    [name, email, role, c.req.param("id"), payload.company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.delete("/:id", async (c) => {
  const payload = c.get("jwtPayload") as JWTPayload;
  // Prevent self-deletion
  if (c.req.param("id") === payload.user_id) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }
  await db.query("DELETE FROM users WHERE id=$1 AND company_id=$2", [
    c.req.param("id"),
    payload.company_id,
  ]);
  return c.json({ success: true });
});

export default router;
