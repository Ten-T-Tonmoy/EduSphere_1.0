import SectionTitle from "./SectionTitle";

function ChartCard({ title, Icon, sub, children, className = "" }) {
  return (
    <div className={`card  ${className}`}>
      <SectionTitle Icon={Icon} sub={sub}>
        {title}
      </SectionTitle>
      {children}
    </div>
  );
}

export default ChartCard;
