import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";

interface Vehicle {
  id: string;
  plate_number: string;
  type: string;
  capacity_kg: number;
  status: string;
  last_service_date: string | null;
  created_at: string;
}


const VEHICLE_TYPES = ["flatbed","refrigerated","box_truck","semi","van","tanker"];
const VEHICLE_STATUSES = ["available","in_use","maintenance","retired"];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    plate_number: "", type: "van", capacity_kg: "", status: "available", last_service_date: "",
  });

  function fetchVehicles() {
    api.get<Vehicle[]>("/vehicles").then(setVehicles).finally(() => setLoading(false));
  }

  useEffect(() => { fetchVehicles(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ plate_number: "", type: "van", capacity_kg: "", status: "available", last_service_date: "" });
    setOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      plate_number: v.plate_number,
      type: v.type,
      capacity_kg: String(v.capacity_kg),
      status: v.status,
      last_service_date: v.last_service_date?.slice(0, 10) ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, capacity_kg: Number(form.capacity_kg), last_service_date: form.last_service_date || null };
    if (editing) {
      await api.put(`/vehicles/${editing.id}`, payload);
    } else {
      await api.post("/vehicles", payload);
    }
    setOpen(false);
    fetchVehicles();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vehicle?")) return;
    await api.delete(`/vehicles/${id}`);
    fetchVehicles();
  }

  const columns = [
    { key: "plate_number", label: "Plate #" },
    { key: "type", label: "Type", render: (r: Vehicle) => <span className="capitalize">{r.type.replace(/_/g," ")}</span> },
    { key: "capacity_kg", label: "Capacity (kg)" },
    { key: "status", label: "Status", render: (r: Vehicle) => <StatusBadge status={r.status} /> },
    { key: "last_service_date", label: "Last Service", render: (r: Vehicle) => r.last_service_date ? new Date(r.last_service_date).toLocaleDateString() : "—" },
    {
      key: "actions",
      label: "",
      render: (r: Vehicle) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Add Vehicle
        </button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : <Table columns={columns} data={vehicles} />}

      <Modal isOpen={open} title={editing ? "Edit Vehicle" : "Add Vehicle"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plate Number</label>
            <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Capacity (kg)</label>
              <input required type="number" min={0} className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })} />
            </div>
          </div>
          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Service Date</label>
            <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.last_service_date} onChange={(e) => setForm({ ...form, last_service_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
              {editing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
