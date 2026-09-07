import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-sg-panel-2">
      <div className="mx-auto flex w-full max-w-5xl items-baseline justify-between gap-6 px-4 py-5">
        <Link href="/" className="sg-display text-2xl text-sg-ink">
          Stormglass
        </Link>
        <Link href="/rankings" className="text-sg-cyan">
          Rankings
        </Link>
      </div>
    </header>
  );
}
