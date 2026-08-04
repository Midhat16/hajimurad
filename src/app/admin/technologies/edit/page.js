"use client";

import { Suspense } from "react";
import EditTechnologyClient from "./EditTechnologyClient";

export default function EditTechnologyQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[var(--ink)]">Loading Equipment Details...</p>
        </div>
      }
    >
      <EditTechnologyClient />
    </Suspense>
  );
}
