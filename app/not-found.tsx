import Lookup from "@/components/Lookup";

export default function NotFound() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-5xl text-sg-ink">Page not found</h1>
      <Lookup />
    </div>
  );
}
