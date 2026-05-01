import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import Modal from "../components/Modal";

interface Stop {
  id: string;
  sequence_order: number;
  type: string;
  address: string;
  status: string;
  eta: string | null;
  scanned_at: string | null;
  qr_code_url: string;
  qr_token: string;
}

interface TrackingEvent {
  id: string;
  event_type: string;
  timestamp: string;
  notes: string | null;
}

interface LoadDetail {
  id: string;
  status: string;
  freight_type: string;
  weight_kg: number;
  pickup_location: string;
  delivery_location: string;
  scheduled_date: string;
  notes: string | null;
  customer_name: string;
  driver_name: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  plate_number: string | null;
  stops: Stop[];
  tracking_events: TrackingEvent[];
}

interface Driver { id: string; name: string; status: string }
interface Vehicle { id: string; plate_number: string; status: string }

const LOAD_STATUSES = ["pending","assigned","in_transit","partially_delivered","delivered","cancelled"];
const STOP_TYPES = ["pickup","delivery","collect"];
const TRACKING_TYPES = ["departed","arrived_at_stop","qr_scanned","delayed","completed","incident"];

export default function LoadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ driver_id: "", vehicle_id: "" });
  const [stopOpen, setStopOpen] = useState(false);
  const [stopForm, setStopForm] = useState({ sequence_order: "", type: "pickup", address: "", eta: "" });
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackForm, setTrackForm] = useState({ event_type: "departed", notes: "" });
  const [qrStop, setQrStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchLoad() {
    api.get<LoadDetail>(`/loads/${id}`).then(setLoad).finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLoad();
    api.get<Driver[]>("/drivers").then(setDrivers);
    api.get<Vehicle[]>("/vehicles").then(setVehicles);
  }, [id]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    await api.patch(`/loads/${id}/assign`, assignForm);
    setAssignOpen(false);
    fetchLoad();
  }

  async function handleStatusChange(status: string) {
    await api.patch(`/loads/${id}/status`, { status });
    fetchLoad();
  }

  async function handleAddStop(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/loads/${id}/stops`, {
      ...stopForm,
      sequence_order: Number(stopForm.sequence_order),
      eta: stopForm.eta || undefined,
    });
    setStopOpen(false);
    setStopForm({ sequence_order: "", type: "pickup", address: "", eta: "" });
    fetchLoad();
  }

  async function handleDeleteStop(stopId: string) {
    if (!confirm("Delete this stop?")) return;
    await api.delete(`/stops/${stopId}`);
    fetchLoad();
  }

  async function handleAddTrackingEvent(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/loads/${id}/tracking`, trackForm);
    setTrackOpen(false);
    setTrackForm({ event_type: "departed", notes: "" });
    fetchLoad();
  }

  async function handleDelete() {
    if (!confirm("Delete this load?")) return;
    await api.delete(`/loads/${id}`);
    navigate("/loads");
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;
  if (!load) return <p className="text-red-500 text-sm">Load not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/loads")} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">Load Detail</h1>
        <select
          value={load.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white"
        >
          {LOAD_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
        <button
          onClick={() => setAssignOpen(true)}
          className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
        >
          Assign Driver/Vehicle
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-50 text-red-600 text-sm px-3 py-1.5 rounded hover:bg-red-100 border border-red-200"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Load Info</h2>
          <Row label="Status"><StatusBadge status={load.status} /></Row>
          <Row label="Customer">{load.customer_name}</Row>
          <Row label="Freight">{load.freight_type}</Row>
          <Row label="Weight">{load.weight_kg} kg</Row>
          <Row label="Pickup">{load.pickup_location}</Row>
          <Row label="Delivery">{load.delivery_location}</Row>
          <Row label="Scheduled">{new Date(load.scheduled_date).toLocaleString()}</Row>
          {load.notes && <Row label="Notes">{load.notes}</Row>}
        </div>

        {/* Assignment Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Assignment</h2>
          <Row label="Driver">{load.driver_name ?? <span className="text-gray-400">Unassigned</span>}</Row>
          <Row label="Vehicle">{load.plate_number ?? <span className="text-gray-400">Unassigned</span>}</Row>
        </div>
      </div>

      {/* Stops */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Stops</h2>
          <button onClick={() => { setStopForm({ sequence_order: String((load.stops.length + 1)), type: "pickup", address: "", eta: "" }); setStopOpen(true); }}
            className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100">
            + Add Stop
          </button>
        </div>
        {load.stops.length === 0 ? (
          <p className="text-gray-400 text-sm">No stops — add one to generate QR codes</p>
        ) : (
          <div className="space-y-2">
            {load.stops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-bold shrink-0">
                  {stop.sequence_order}
                </span>
                <span className="text-xs text-gray-500 uppercase w-14 shrink-0">{stop.type}</span>
                <span className="text-sm text-gray-800 flex-1">{stop.address}</span>
                {stop.eta && <span className="text-xs text-gray-400">{new Date(stop.eta).toLocaleString()}</span>}
                <StatusBadge status={stop.status} />
                {stop.scanned_at && (
                  <span className="text-xs text-gray-400">Scanned {new Date(stop.scanned_at).toLocaleString()}</span>
                )}
                {stop.qr_code_url && (
                  <button onClick={() => setQrStop(stop)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-1 rounded">
                    QR
                  </button>
                )}
                <button onClick={() => handleDeleteStop(stop.id)}
                  className="text-xs text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tracking Events */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tracking Events</h2>
          <button onClick={() => setTrackOpen(true)}
            className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100">
            + Log Event
          </button>
        </div>
        {load.tracking_events.length === 0 ? (
          <p className="text-gray-400 text-sm">No events yet</p>
        ) : (
          <div className="space-y-2">
            {load.tracking_events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs font-medium text-blue-600 uppercase">{ev.event_type.replace(/_/g," ")}</span>
                <span className="text-xs text-gray-400">{new Date(ev.timestamp).toLocaleString()}</span>
                {ev.notes && <span className="text-sm text-gray-600">{ev.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal isOpen={assignOpen} title="Assign Driver & Vehicle" onClose={() => setAssignOpen(false)}>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
            <select
              required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={assignForm.driver_id}
              onChange={(e) => setAssignForm({ ...assignForm, driver_id: e.target.value })}
            >
              <option value="">Select driver</option>
              {drivers.filter((d) => d.status === "available" || d.status === "on_duty").map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
            <select
              required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={assignForm.vehicle_id}
              onChange={(e) => setAssignForm({ ...assignForm, vehicle_id: e.target.value })}
            >
              <option value="">Select vehicle</option>
              {vehicles.filter((v) => v.status === "available").map((v) => (
                <option key={v.id} value={v.id}>{v.plate_number} ({v.status})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAssignOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Assign</button>
          </div>
        </form>
      </Modal>

      {/* Add Stop Modal */}
      <Modal isOpen={stopOpen} title="Add Stop" onClose={() => setStopOpen(false)}>
        <form onSubmit={handleAddStop} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sequence #</label>
              <input required type="number" min={1} className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={stopForm.sequence_order} onChange={(e) => setStopForm({ ...stopForm, sequence_order: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={stopForm.type} onChange={(e) => setStopForm({ ...stopForm, type: e.target.value })}>
                {STOP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={stopForm.address} onChange={(e) => setStopForm({ ...stopForm, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ETA (optional)</label>
            <input type="datetime-local" className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={stopForm.eta} onChange={(e) => setStopForm({ ...stopForm, eta: e.target.value })} />
          </div>
          <p className="text-xs text-gray-400">A QR code will be auto-generated for this stop.</p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setStopOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Add Stop</button>
          </div>
        </form>
      </Modal>

      {/* Log Tracking Event Modal */}
      <Modal isOpen={trackOpen} title="Log Tracking Event" onClose={() => setTrackOpen(false)}>
        <form onSubmit={handleAddTrackingEvent} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              value={trackForm.event_type} onChange={(e) => setTrackForm({ ...trackForm, event_type: e.target.value })}>
              {TRACKING_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none"
              value={trackForm.notes} onChange={(e) => setTrackForm({ ...trackForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setTrackOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Log Event</button>
          </div>
        </form>
      </Modal>

      {/* QR Code Viewer Modal */}
      <Modal isOpen={!!qrStop} title="Stop QR Code" onClose={() => setQrStop(null)}>
        {qrStop && (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">{qrStop.type.toUpperCase()} — {qrStop.address}</p>
            <img src={qrStop.qr_code_url} alt="QR Code" className="mx-auto w-48 h-48" />
            <p className="text-xs text-gray-400">Scan to confirm {qrStop.type === "pickup" ? "pickup" : "delivery"}</p>
            <a
              href={qrStop.qr_code_url}
              download={`qr-stop-${qrStop.id.slice(0, 8)}.png`}
              className="inline-block text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 px-4 py-2 rounded"
            >
              Download QR
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{children}</span>
    </div>
  );
}
