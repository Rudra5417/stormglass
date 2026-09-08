import Link from "next/link";
import HeaderLookup from "@/components/HeaderLookup";

export default function SiteHeader() {
  return (
    <header className="border-b border-sg-panel-2">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="sg-display text-2xl text-sg-ink">
          Stormglass
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-6">
          <Link href="/rankings" className="shrink-0 text-sg-cyan">
            Rankings
          </Link>
          <HeaderLookup />
        </div>
      </div>
    </header>
  );
}
