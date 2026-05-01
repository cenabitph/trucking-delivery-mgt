import { useEffect, useState } from "react";
import { api } from "../lib/api";
import StatCard from "../components/StatCard";

interface Stats {
  loads: { status: string; count: string }[];
  drivers: { status: string; count: string }[];
  vehicles: { status: string; count: string }[];
  invoices: { status: string; total: string }[];
}

function sumCount(arr: { count: string }[]) {
  return arr.reduce((s, r) => s + Number(r.count), 0);
}

function findCount(arr: { status: string; count: string }[], status: string) {
  return Number(arr.find((r) => r.status === status)?.count ?? 0);
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>("/dashboard/stats").then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-gray-400 text-sm">Loading dashboard...</p>;
  if (!stats) return <p className="text-red-500 text-sm">Failed to load stats.</p>;

  const paidInvoices = stats.invoices.find((r) => r.status === "paid");
  const revenue = paidInvoices ? Number(paidInvoices.total) / 100 : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Loads"
          value={sumCount(stats.loads)}
          sub={`${findCount(stats.loads, "in_transit")} in transit`}
          color="blue"
        />
        <StatCard
          title="Active Drivers"
          value={findCount(stats.drivers, "available") + findCount(stats.drivers, "on_duty")}
          sub={`${findCount(stats.drivers, "on_duty")} on duty`}
          color="green"
        />
        <StatCard
          title="Vehicles"
          value={sumCount(stats.vehicles)}
          sub={`${findCount(stats.vehicles, "available")} available`}
          color="purple"
        />
        <StatCard
          title="Revenue (Paid)"
          value={`$${revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub="From paid invoices"
          color="yellow"
        />
      </div>

      {/* Load Status Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Load Status Breakdown</h2>
        <div className="flex flex-wrap gap-3">
          {stats.loads.map((r) => (
            <div key={r.status} className="bg-gray-50 border border-gray-200 rounded px-4 py-3 text-center min-w-[100px]">
              <p className="text-xl font-bold text-gray-900">{r.count}</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{r.status.replace(/_/g, " ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
