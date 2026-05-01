import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";

interface Invoice {
  id: string;
  customer_name: string;
  freight_type: string;
  amount: number;
  currency: string;
  status: string;
  issued_date: string;
  due_date: string;
}

interface Load { id: string; freight_type: string; customer_id: string; customer_name: string }


const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];

async function downloadPdf(id: string) {
  const res = await fetch(`/api/invoices/${id}/pdf`);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${id.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    load_id: "", amount: "", currency: "USD", due_date: "", notes: "",
  });

  function fetchInvoices() {
    api.get<Invoice[]>("/invoices").then(setInvoices).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchInvoices();
    api.get<Load[]>("/loads").then(setLoads);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedLoad = loads.find((l) => l.id === form.load_id);
    if (!selectedLoad) return;
    await api.post("/invoices", {
      ...form,
      customer_id: selectedLoad.customer_id,
      amount: Math.round(Number(form.amount) * 100), // store in cents
    });
    setOpen(false);
    setForm({ load_id: "", amount: "", currency: "USD", due_date: "", notes: "" });
    fetchInvoices();
  }

  async function handleStatusChange(id: string, status: string) {
    await api.patch(`/invoices/${id}/status`, { status });
    fetchInvoices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await api.delete(`/invoices/${id}`);
    fetchInvoices();
  }

  const columns = [
    { key: "customer_name", label: "Customer" },
    { key: "freight_type", label: "Freight" },
    {
      key: "amount",
      label: "Amount",
      render: (r: Invoice) =>
        `${r.currency} ${(r.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
    { key: "issued_date", label: "Issued", render: (r: Invoice) => new Date(r.issued_date).toLocaleDateString() },
    { key: "due_date", label: "Due", render: (r: Invoice) => new Date(r.due_date).toLocaleDateString() },
    { key: "status", label: "Status", render: (r: Invoice) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "",
      render: (r: Invoice) => (
        <div className="flex items-center gap-2">
          <select
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
            value={r.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); handleStatusChange(r.id, e.target.value); }}
          >
            {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`/api/invoices/${r.id}/html`, "_blank"); }}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200"
            title="View Invoice"
          >
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); downloadPdf(r.id); }}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200"
            title="Download PDF"
          >
            PDF
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-xs text-red-500 hover:underline">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button onClick={() => setOpen(true)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + New Invoice
        </button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : <Table columns={columns} data={invoices} />}

      <Modal isOpen={open} title="Create Invoice" onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Load</label>
            <select
              required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.load_id}
              onChange={(e) => setForm({ ...form, load_id: e.target.value })}
            >
              <option value="">Select load</option>
              {loads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.freight_type} — {l.customer_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
              <input
                required type="number" min={0} step="0.01"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <input
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
            <input
              required type="date"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
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
