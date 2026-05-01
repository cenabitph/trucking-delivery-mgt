export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    // Load
    pending: "bg-yellow-100 text-yellow-700",
    assigned: "bg-blue-100 text-blue-700",
    in_transit: "bg-indigo-100 text-indigo-700",
    partially_delivered: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    // Driver
    available: "bg-green-100 text-green-700",
    on_duty: "bg-blue-100 text-blue-700",
    off_duty: "bg-gray-100 text-gray-600",
    inactive: "bg-red-100 text-red-700",
    // Vehicle
    in_use: "bg-blue-100 text-blue-700",
    maintenance: "bg-orange-100 text-orange-700",
    retired: "bg-gray-100 text-gray-600",
    // Invoice
    draft: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    // Stop
    arrived: "bg-blue-100 text-blue-700",
    collected: "bg-purple-100 text-purple-700",
    failed: "bg-red-100 text-red-700",
    // Company
    active: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        colors[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
