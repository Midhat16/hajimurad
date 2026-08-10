"use client";

import { Suspense } from "react";
import EditServiceClient from "./EditServiceClient";

export default function EditServiceQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Service Details...</p>
        </div>
      }
    >
      <EditServiceClient />
    </Suspense>
  );
}
