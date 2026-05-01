import { Hono } from "hono";
import { db } from "../index";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

router.get("/stats", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const [loads, drivers, vehicles, invoices] = await Promise.all([
    db.query("SELECT status, COUNT(*) as count FROM loads WHERE company_id=$1 GROUP BY status", [company_id]),
    db.query("SELECT status, COUNT(*) as count FROM drivers WHERE company_id=$1 GROUP BY status", [company_id]),
    db.query("SELECT status, COUNT(*) as count FROM vehicles WHERE company_id=$1 GROUP BY status", [company_id]),
    db.query("SELECT status, SUM(amount) as total FROM invoices WHERE company_id=$1 GROUP BY status", [company_id]),
  ]);

  return c.json({
    loads: loads.rows,
    drivers: drivers.rows,
    vehicles: vehicles.rows,
    invoices: invoices.rows,
  });
});

export default router;
