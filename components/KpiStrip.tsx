export default function KpiStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.label}
          className="rounded-sm border border-sg-panel-2 bg-sg-panel px-3 py-3"
        >
          <p className="text-sm text-[#8b95a8]">{item.label}</p>
          <p className="mt-1 text-lg font-semibold text-sg-gold tabular-nums">
            {item.value}
          </p>
        </li>
      ))}
    </ul>
  );
}
