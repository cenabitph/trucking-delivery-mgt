import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  subscription_plan: string;
  status: string;
  created_at: string;
}

const PLANS = ["basic", "pro", "enterprise"];
const STATUSES = ["active", "suspended", "pending"];

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", subscription_plan: "basic", status: "active",
  });

  function fetchCompanies() {
    api.get<Company[]>("/companies").then(setCompanies).finally(() => setLoading(false));
  }

  useEffect(() => { fetchCompanies(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", address: "", subscription_plan: "basic", status: "active" });
    setOpen(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, subscription_plan: c.subscription_plan, status: c.status });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await api.put(`/companies/${editing.id}`, form);
    } else {
      await api.post("/companies", form);
    }
    setOpen(false);
    fetchCompanies();
  }

  const columns = [
    { key: "name", label: "Company Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "subscription_plan", label: "Plan", render: (r: Company) => <span className="capitalize font-medium text-blue-700">{r.subscription_plan}</span> },
    { key: "status", label: "Status", render: (r: Company) => <StatusBadge status={r.status} /> },
    { key: "created_at", label: "Created", render: (r: Company) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions", label: "",
      render: (r: Company) => (
        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="text-xs text-blue-600 hover:underline">Edit</button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Add Company
        </button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : <Table columns={columns} data={companies} />}

      <Modal isOpen={open} title={editing ? "Edit Company" : "Add Company"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "name", label: "Company Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "address", label: "Address" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.subscription_plan} onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">{editing ? "Save" : "Add"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
