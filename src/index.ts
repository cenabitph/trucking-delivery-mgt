import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Pool } from "pg";

import { authMiddleware } from "./middleware/auth";
import authRouter from "./routes/auth";
import companiesRouter from "./routes/companies";
import usersRouter from "./routes/users";
import driversRouter from "./routes/drivers";
import vehiclesRouter from "./routes/vehicles";
import customersRouter from "./routes/customers";
import loadsRouter from "./routes/loads";
import invoicesRouter from "./routes/invoices";
import dashboardRouter from "./routes/dashboard";
import stopsRouter from "./routes/stops";
import trackingRouter from "./routes/tracking";

export const db = new Pool({ connectionString: process.env.DATABASE_URL });

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Public routes (no auth) — rewrite /api/stops/... to /stops/... for the stops router
app.route("/api/auth", authRouter);
app.post("/api/stops/scan", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/api/, "");
  return stopsRouter.fetch(new Request(url.toString(), c.req.raw));
});
app.get("/api/stops/scan/:token", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/api/, "");
  return stopsRouter.fetch(new Request(url.toString(), c.req.raw));
});

// Protected routes
app.use("/api/*", authMiddleware);
app.route("/api/companies", companiesRouter);
app.route("/api/users", usersRouter);
app.route("/api/drivers", driversRouter);
app.route("/api/vehicles", vehiclesRouter);
app.route("/api/customers", customersRouter);
app.route("/api/loads", loadsRouter);
app.route("/api/invoices", invoicesRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api", stopsRouter);
app.route("/api", trackingRouter);

app.get("/", (c) => c.json({ message: "Trucking Delivery Management API" }));

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
