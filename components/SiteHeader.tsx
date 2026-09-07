import Link from "next/link";
import Lookup from "./Lookup";

export default function SiteHeader() {
  return (
    <header className="border-b border-sg-panel-2 bg-sg-panel">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <nav className="flex shrink-0 items-center gap-4">
          <Link href="/" className="text-lg font-semibold text-sg-gold">
            Stormglass
          </Link>
          <Link href="/rankings" className="text-sm text-sg-cyan">
            Rankings
          </Link>
        </nav>
        <Lookup />
      </div>
    </header>
  );
}
