import Lookup from "@/components/Lookup";

export default function NotFound() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl text-sg-ink sm:text-5xl">Page not found</h1>
      <Lookup />
    </div>
  );
}
