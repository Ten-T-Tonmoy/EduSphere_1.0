function KpiCard({ Icon, label, value, sub, accent = "blue" }) {
  const iconBg = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };
  const ring = {
    blue: "ring-blue-100",
    green: "ring-emerald-100",
    violet: "ring-violet-100",
    amber: "ring-amber-100",
    orange: "ring-orange-100",
    red: "ring-red-100",
  };
  return (
    <div
      className={`card flex items-start gap-4 ring-1 ${ring[accent] || "ring-gray-100"}`}
    >
      <div
        className={`${iconBg[accent] || "bg-gray-100 text-gray-600"} p-3 rounded-xl shrink-0`}
      >
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
export default KpiCard;
