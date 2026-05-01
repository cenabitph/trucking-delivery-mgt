import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";

interface Load {
  id: string;
  customer_name: string;
  driver_name: string | null;
  plate_number: string | null;
  status: string;
  pickup_location: string;
  delivery_location: string;
  scheduled_date: string;
  freight_type: string;
  weight_kg: number;
}

interface Customer { id: string; name: string }



export default function Loads() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState<Load[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    customer_id: "",
    pickup_location: "",
    delivery_location: "",
    scheduled_date: "",
    freight_type: "",
    weight_kg: "",
    notes: "",
  });

  function fetchLoads() {
    api.get<Load[]>("/loads").then(setLoads).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLoads();
    api.get<Customer[]>("/customers").then(setCustomers);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/loads", {
      ...form,
      weight_kg: Number(form.weight_kg),
    });
    setOpen(false);
    setForm({ customer_id: "", pickup_location: "", delivery_location: "", scheduled_date: "", freight_type: "", weight_kg: "", notes: "" });
    fetchLoads();
  }

  const columns = [
    { key: "freight_type", label: "Freight" },
    { key: "customer_name", label: "Customer" },
    { key: "pickup_location", label: "Pickup" },
    { key: "delivery_location", label: "Delivery" },
    { key: "driver_name", label: "Driver" },
    { key: "plate_number", label: "Vehicle" },
    {
      key: "status",
      label: "Status",
      render: (row: Load) => <StatusBadge status={row.status} />,
    },
    {
      key: "scheduled_date",
      label: "Scheduled",
      render: (row: Load) => new Date(row.scheduled_date).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
      render: (row: Load) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/loads/${row.id}`); }}
          className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loads</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          + New Load
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <Table
          columns={columns}
          data={loads}
          onRowClick={(row) => navigate(`/loads/${row.id}`)}
        />
      )}

      <Modal isOpen={open} title="Create Load" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
            <select
              required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {[
            { key: "pickup_location", label: "Pickup Location" },
            { key: "delivery_location", label: "Delivery Location" },
            { key: "freight_type", label: "Freight Type" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                required
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Date</label>
              <input
                type="datetime-local"
                required
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                required
                min={0}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
