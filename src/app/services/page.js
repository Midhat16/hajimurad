import React, { Suspense } from "react";
import Services from "@/components/Services";

export const metadata = {
  title: "Haji Murad Eye Hospital Trust | Eye Care Services & Cataract Surgery Gujranwala",
  description:
    "Comprehensive eye care services in Gujranwala including micro-incision cataract surgery (Phaco), LASIK, retina surgery, cornea care, and glaucoma treatment.",
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
