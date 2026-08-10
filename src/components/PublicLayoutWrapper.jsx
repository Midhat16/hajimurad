"use client";

import React from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AppointmentModal = dynamic(() => import("@/components/AppointmentModal"), {
  ssr: false,
});

export default function PublicLayoutWrapper({ children }) {
  const pathname = usePathname();
  const isPortalRoute =
    pathname?.startsWith("/admin") ||
    pathname === "/doctor/login" ||
    pathname?.startsWith("/doctor/") ||
    pathname === "/media/view" ||
    pathname?.startsWith("/media/view");

  if (isPortalRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      <AppointmentModal />
    </>
  );
}
