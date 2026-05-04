function SectionTitle({ Icon, children, sub }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && (
        <Icon size={18} className="text-gray-500 shrink-0" strokeWidth={1.8} />
      )}
      <div>
        <h2 className="text-base font-semibold text-gray-800 leading-none">
          {children}
        </h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default SectionTitle;
