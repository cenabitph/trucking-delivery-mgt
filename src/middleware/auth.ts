import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export interface JWTPayload {
  user_id: string;
  company_id: string;
  role: string;
  name: string;
  exp: number;
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = auth.slice(7);
  try {
    const payload = await verify(token, process.env.JWT_SECRET ?? "changeme", "HS256");
    c.set("jwtPayload", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
