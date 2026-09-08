import type { RankSpan } from "@/lib/fortnite/trajectory";

export default function RankSpanValue({ span }: { span: RankSpan }) {
  if (span.kind === "entered") {
    return (
      <span className="flex items-baseline gap-2">
        <span className="sg-kpi text-sg-gold">#{span.currentRank}</span>
        <span className="text-sm text-sg-gold">entered</span>
      </span>
    );
  }
  const delta =
    span.delta === null
      ? ""
      : span.delta > 0
        ? `+${span.delta}`
        : String(span.delta);
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-sm text-sg-mute">
        #{span.previousRank} → #{span.currentRank}
      </span>
      <span className="sg-kpi text-sg-gold">{delta}</span>
    </span>
  );
}