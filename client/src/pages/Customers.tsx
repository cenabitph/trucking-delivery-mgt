import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Table from "../components/Table";
import Modal from "../components/Modal";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  billing_address: string;
  notes: string | null;
  created_at: string;
}



export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", billing_address: "", notes: "" });

  function fetchCustomers() {
    api.get<Customer[]>("/customers").then(setCustomers).finally(() => setLoading(false));
  }

  useEffect(() => { fetchCustomers(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", billing_address: "", notes: "" });
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, billing_address: c.billing_address, notes: c.notes ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, notes: form.notes || undefined };
    if (editing) {
      await api.put(`/customers/${editing.id}`, payload);
    } else {
      await api.post("/customers", payload);
    }
    setOpen(false);
    fetchCustomers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "billing_address", label: "Billing Address" },
    { key: "created_at", label: "Added", render: (r: Customer) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions",
      label: "",
      render: (r: Customer) => (
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
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Add Customer
        </button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : <Table columns={columns} data={customers} />}

      <Modal isOpen={open} title={editing ? "Edit Customer" : "Add Customer"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "name", label: "Company / Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "billing_address", label: "Billing Address", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                required
                type={type}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
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
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
              {editing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
