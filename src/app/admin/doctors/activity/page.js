"use client";

import { Suspense } from "react";
import DoctorActivityClient from "./DoctorActivityClient";

export default function DoctorActivityQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0B3D5C]">Loading Clinical Activity...</p>
        </div>
      }
    >
      <DoctorActivityClient />
    </Suspense>
  );
}
