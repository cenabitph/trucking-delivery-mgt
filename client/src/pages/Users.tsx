import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Table from "../components/Table";
import Modal from "../components/Modal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  last_login: string | null;
  created_at: string;
}

const ROLES = ["owner", "admin", "dispatcher", "driver", "accountant"];

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "dispatcher", password: "" });
  const [error, setError] = useState("");

  function fetchUsers() {
    api.get<User[]>("/users").then(setUsers).finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", role: "dispatcher", password: "" });
    setError("");
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: "" });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        const payload: Record<string, string> = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing.id}`, payload);
      } else {
        if (!form.password) { setError("Password is required"); return; }
        await api.post("/users", form);
      }
      setOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete(id: string) {
    if (id === me?.id) return;
    if (!confirm("Delete this user?")) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r: User) => <span className="capitalize text-blue-700 font-medium text-xs bg-blue-50 px-2 py-0.5 rounded">{r.role}</span> },
    { key: "last_login", label: "Last Login", render: (r: User) => r.last_login ? new Date(r.last_login).toLocaleString() : "Never" },
    { key: "created_at", label: "Added", render: (r: User) => new Date(r.created_at).toLocaleDateString() },
    {
      key: "actions", label: "",
      render: (r: User) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="text-xs text-blue-600 hover:underline">Edit</button>
          {r.id !== me?.id && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff / Users</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Add User
        </button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : <Table columns={columns} data={users} />}

      <Modal isOpen={open} title={editing ? "Edit User" : "Add User"} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input required type="email" className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {editing ? "New Password (leave blank to keep)" : "Password"}
            </label>
            <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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
