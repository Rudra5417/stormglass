import Lookup from "@/components/Lookup";

export default function IslandNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-sg-gold">Island not found</h1>
      <p className="text-sm text-[#8b95a8]">
        Unknown island code. Try another lookup.
      </p>
      <Lookup />
    </div>
  );
}
