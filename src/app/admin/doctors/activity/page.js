"use client";

import { Suspense } from "react";
import DoctorActivityClient from "./DoctorActivityClient";

export default function DoctorActivityQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Doctor Activity...</p>
        </div>
      }
    >
      <DoctorActivityClient />
    </Suspense>
  );
}
