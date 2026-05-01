import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";

interface Driver {
  id: string;
  name: string;
  license_number: string;
  phone: string;
  status: string;
  created_at: string;
}


const DRIVER_STATUSES = ["available", "on_duty", "off_duty", "inactive"];

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: "", license_number: "", phone: "", status: "available" });

  function fetchDrivers() {
    api.get<Driver[]>("/drivers").then(setDrivers).finally(() => setLoading(false));
  }

  useEffect(() => { fetchDrivers(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", license_number: "", phone: "", status: "available" });
    setOpen(true);
  }

  function openEdit(d: Driver) {
    setEditing(d);
    setForm({ name: d.name, license_number: d.license_number, phone: d.phone, status: d.status });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await api.put(`/drivers/${editing.id}`, form);
    } else {
      await api.post("/drivers", form);
    }
    setOpen(false);
    fetchDrivers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this driver?")) return;
    await api.delete(`/drivers/${id}`);
    fetchDrivers();
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "license_number", label: "License #" },
    { key: "phone", label: "Phone" },
    { key: "status", label: "Status", render: (r: Driver) => <StatusBadge status={r.status} /> },
    { key: "created_at", label: "Added", render: (r: Driver) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions",
      label: "",
      render: (r: Driver) => (
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
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Add Driver
        </button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : <Table columns={columns} data={drivers} />}

      <Modal isOpen={open} title={editing ? "Edit Driver" : "Add Driver"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "name", label: "Full Name" },
            { key: "license_number", label: "License Number" },
            { key: "phone", label: "Phone" },
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
          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          )}
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
