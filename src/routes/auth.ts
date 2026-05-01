import { Hono } from "hono";
import { sign } from "hono/jwt";
import { db } from "../index";

const router = new Hono();

router.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: "Email and password required" }, 400);

  const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

  const secret = process.env.JWT_SECRET ?? "changeme";
  const token = await sign(
    {
      user_id: user.id,
      company_id: user.company_id,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    secret,
    "HS256"
  );

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    },
  });
});

router.post("/logout", (c) => c.json({ success: true }));

export default router;
