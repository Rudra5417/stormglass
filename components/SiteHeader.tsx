import Link from "next/link";
import HeaderLookup from "@/components/HeaderLookup";

export default function SiteHeader() {
  return (
    <header className="border-b border-sg-panel-2 pt-[max(0px,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:py-4">
        <Link href="/" className="sg-display text-2xl text-sg-ink">
          Stormglass
        </Link>
        <Link href="/rankings" className="ml-auto shrink-0 text-sg-cyan">
          Rankings
        </Link>
        <HeaderLookup />
      </div>
    </header>
  );
}
