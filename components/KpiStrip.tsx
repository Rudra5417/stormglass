import type { KpiItem } from "@/lib/fortnite/kpiModel";

export default function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-sg-gold/30 py-6 md:grid-cols-4 md:gap-x-8">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-sm text-sg-mute">{item.label}</dt>
          <dd className="sg-kpi sg-display mt-1 break-words text-xl text-sg-ink sm:text-2xl">
            {item.value}
            {item.delta ? (
              <span className="ml-2 text-sm text-sg-gold">{item.delta}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
