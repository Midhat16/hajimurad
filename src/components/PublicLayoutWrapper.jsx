"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AppointmentModal from "@/components/AppointmentModal";

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
