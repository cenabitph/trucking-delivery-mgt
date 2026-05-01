interface Props {
  title: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export default function StatCard({ title, value, sub, color = "blue" }: Props) {
  const bar: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
  };
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200">
      <div className={`w-8 h-1 rounded ${bar[color] ?? bar.blue} mb-3`} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
