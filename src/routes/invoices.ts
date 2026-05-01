import { Hono } from "hono";
import { db } from "../index";
import { generateInvoiceHtml } from "../lib/invoice-html";
import { generateInvoicePdf } from "../lib/invoice-pdf";
import type { JWTPayload } from "../middleware/auth";

const router = new Hono();

async function fetchInvoiceDetail(id: string) {
  const { rows } = await db.query(
    `SELECT
       i.*,
       c.name AS customer_name, c.email AS customer_email,
       c.phone AS customer_phone, c.billing_address AS customer_billing_address,
       co.name AS company_name, co.email AS company_email,
       co.phone AS company_phone, co.address AS company_address,
       l.freight_type, l.pickup_location, l.delivery_location, l.weight_kg
     FROM invoices i
     LEFT JOIN customers c  ON i.customer_id = c.id
     LEFT JOIN companies co ON i.company_id  = co.id
     LEFT JOIN loads l      ON i.load_id     = l.id
     WHERE i.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

router.get("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query(
    `SELECT i.*, c.name AS customer_name, l.freight_type
     FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     LEFT JOIN loads l ON i.load_id = l.id
     WHERE i.company_id=$1
     ORDER BY i.created_at DESC`,
    [company_id]
  );
  return c.json(rows);
});

router.get("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { rows } = await db.query(
    `SELECT i.*, c.name AS customer_name FROM invoices i
     LEFT JOIN customers c ON i.customer_id = c.id
     WHERE i.id=$1 AND i.company_id=$2`,
    [c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.post("/", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { load_id, customer_id, amount, currency, due_date, notes } = await c.req.json();
  const { rows } = await db.query(
    `INSERT INTO invoices (load_id, company_id, customer_id, amount, currency, due_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [load_id, company_id, customer_id, amount, currency ?? "USD", due_date, notes ?? null]
  );
  return c.json(rows[0], 201);
});

router.patch("/:id/status", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  const { status } = await c.req.json();
  const { rows } = await db.query(
    `UPDATE invoices SET status=$1, updated_at=NOW() WHERE id=$2 AND company_id=$3 RETURNING *`,
    [status, c.req.param("id"), company_id]
  );
  if (!rows[0]) return c.json({ error: "Not found" }, 404);
  return c.json(rows[0]);
});

router.get("/:id/html", async (c) => {
  const inv = await fetchInvoiceDetail(c.req.param("id"));
  if (!inv) return c.json({ error: "Not found" }, 404);
  const html = generateInvoiceHtml(inv);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

router.get("/:id/pdf", async (c) => {
  const inv = await fetchInvoiceDetail(c.req.param("id"));
  if (!inv) return c.json({ error: "Not found" }, 404);
  const pdf = await generateInvoicePdf(inv);
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${inv.id.slice(0, 8)}.pdf"`,
    },
  });
});

router.delete("/:id", async (c) => {
  const { company_id } = c.get("jwtPayload") as JWTPayload;
  await db.query("DELETE FROM invoices WHERE id=$1 AND company_id=$2", [c.req.param("id"), company_id]);
  return c.json({ success: true });
});

export default router;
