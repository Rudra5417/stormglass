export default function KpiStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-sg-gold/30 py-6 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm text-sg-mute">{item.label}</dt>
          <dd className="sg-kpi sg-display mt-1 text-2xl text-sg-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
