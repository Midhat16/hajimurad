import React, { Suspense } from "react";
import Services from "@/components/Services";

export const metadata = {
  title: "Specialty Ophthalmic Services | Haji Murad Eye Hospital",
  description: "Explore our specialized eye care procedures including Wavefront LASIK, Micro-Incision Cataract Surgery, and Retinal Laser Repair.",
};

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Services...</p>
        </div>
      }
    >
      <Services />
    </Suspense>
  );
}
