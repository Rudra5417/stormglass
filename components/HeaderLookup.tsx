"use client";

import { usePathname } from "next/navigation";
import Lookup from "@/components/Lookup";

export default function HeaderLookup() {
  const path = usePathname();
  if (path === "/") return null;
  return (
    <div className="min-w-0 w-full basis-full sm:w-auto sm:max-w-xs sm:basis-auto">
      <Lookup size="compact" />
    </div>
  );
}