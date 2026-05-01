import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ScanPage() {
  const navigate = useNavigate();

  // Get token from URL
  const token = window.location.pathname.split("/scan/")[1];
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [stopInfo, setStopInfo] = useState<{ address: string; type: string; freight_type: string } | null>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid QR code"); return; }

    // Fetch stop info
    fetch(`/api/stops/scan/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStatus("error"); setMessage(data.error); return; }
        setStopInfo({ address: data.address, type: data.type, freight_type: data.freight_type });
      })
      .catch(() => { setStatus("error"); setMessage("Failed to load stop info"); });
  }, [token]);

  async function confirmScan() {
    setStatus("loading");
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Location optional
    }

    const res = await fetch("/api/stops/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_token: token, lat, lng }),
    });
    const data = await res.json();

    if (data.result === "success") {
      setStatus("success");
      setMessage(data.message);
    } else {
      setStatus("error");
      setMessage(data.message ?? "Scan failed");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">
          {status === "success" ? "✅" : status === "error" ? "❌" : "📦"}
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Delivery Stop QR Scan</h1>

        {stopInfo && status === "idle" && (
          <>
            <p className="text-sm text-gray-500 mb-1">
              <strong>Freight:</strong> {stopInfo.freight_type}
            </p>
            <p className="text-sm text-gray-500 mb-1 capitalize">
              <strong>Type:</strong> {stopInfo.type}
            </p>
            <p className="text-sm text-gray-700 mb-6">{stopInfo.address}</p>
            <button
              onClick={confirmScan}
              className="w-full bg-blue-600 text-white text-sm font-medium py-3 rounded hover:bg-blue-700"
            >
              Confirm {stopInfo.type === "pickup" ? "Pickup" : "Delivery"}
            </button>
          </>
        )}

        {status === "loading" && <p className="text-gray-500 text-sm">Processing scan...</p>}

        {(status === "success" || status === "error") && (
          <>
            <p className={`text-sm mb-4 ${status === "success" ? "text-green-700" : "text-red-600"}`}>
              {message}
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-blue-600 hover:underline"
            >
              Return to app
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Need these at top
import { useEffect, useState } from "react";
