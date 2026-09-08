import type { HealthReport, HealthTone } from "@/lib/fortnite/trajectory";

const TONE: Record<HealthTone, { word: string; className: string }> = {
  up: { word: "Up", className: "text-sg-cyan" },
  down: { word: "Down", className: "text-sg-gold" },
  flat: { word: "Flat", className: "text-sg-ink" },
  unknown: { word: "No read", className: "text-sg-mute" },
};

const PLATES: {
  key: keyof HealthReport;
  title: string;
  hint: string;
}[] = [
  { key: "volume", title: "Volume", hint: "Unique players vs yesterday" },
  { key: "depth", title: "Depth", hint: "Minutes per play vs yesterday" },
  { key: "return", title: "Return", hint: "D1 retention vs yesterday" },
];

export default function HealthPlates({ health }: { health: HealthReport }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-3xl text-sg-ink">Yesterday vs the day before</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {PLATES.map((plate) => {
          const tone = TONE[health[plate.key]];
          return (
            <article key={plate.key} className="sg-plate sg-tile">
              <div
                className="sg-tile-art"
                style={
                  plate.key === "depth"
                    ? { ["--tile-x" as string]: "18%", ["--tile-y" as string]: "-6%" }
                    : plate.key === "return"
                      ? { ["--tile-x" as string]: "-12%", ["--tile-y" as string]: "10%" }
                      : undefined
                }
              />
              <div className="relative flex h-full flex-col justify-between p-4">
                <p className="text-sm text-sg-mute">{plate.title}</p>
                <p className={`sg-display text-5xl leading-none ${tone.className}`}>
                  {tone.word}
                </p>
                <p className="text-sm text-sg-mute">{plate.hint}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}