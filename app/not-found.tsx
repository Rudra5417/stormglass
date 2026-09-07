import Lookup from "@/components/Lookup";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-sg-gold">Page not found</h1>
      <Lookup />
    </div>
  );
}
