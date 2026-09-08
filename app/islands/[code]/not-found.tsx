import Lookup from "@/components/Lookup";

export default function IslandNotFound() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl text-sg-ink sm:text-5xl">Island not found</h1>
      <p className="text-sg-mute">Unknown island code. Try another lookup.</p>
      <Lookup />
    </div>
  );
}
