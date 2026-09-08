import Link from "next/link";
import { tileShift } from "@/lib/ui/tileShift";
import type { Genre } from "@/lib/fortnite/types";

export default function GenreTile({ genre }: { genre: Genre }) {
  const art = tileShift(genre.slug);
  return (
    <article className="sg-plate sg-tile">
      <div
        className="sg-tile-art"
        style={{
          ["--tile-x" as string]: art.x,
          ["--tile-y" as string]: art.y,
        }}
      />
      <p className="sg-display pointer-events-none absolute -bottom-2 right-1 text-[4.5rem] leading-none text-sg-gold/25">
        {genre.displayName.slice(0, 2)}
      </p>
      <div className="relative flex h-full flex-col justify-end p-4">
        <h2 className="text-2xl leading-snug">
          <Link
            href={`/rankings/${encodeURIComponent(genre.slug)}`}
            className="text-sg-ink hover:text-sg-cyan"
          >
            {genre.displayName}
          </Link>
        </h2>
      </div>
    </article>
  );
}