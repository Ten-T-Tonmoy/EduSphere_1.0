const DeptLegend = () => {
  const legendItems = [
    { color: "bg-blue-100 border-blue-200", label: "Regular" },
    { color: "bg-purple-100 border-purple-200", label: "Lab" },
    { color: "bg-red-100 border-red-200", label: "Cancelled" },
    { color: "bg-green-100 border-green-200", label: "Extra" },
  ];

  return (
    <div className="flex gap-4 mb-3 text-xs flex-wrap">
      {legendItems.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded border ${color}`} />
          <span className="text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default DeptLegend;
