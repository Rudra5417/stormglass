"use client";

import { usePathname } from "next/navigation";
import Lookup from "@/components/Lookup";

export default function HeaderLookup() {
  const path = usePathname();
  if (path === "/") return null;
  return (
    <div className="hidden min-w-0 sm:block">
      <Lookup size="compact" />
    </div>
  );
}