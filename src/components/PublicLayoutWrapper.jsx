"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AppointmentModal = dynamic(() => import("@/components/AppointmentModal"), {
  ssr: false,
});
const EveningServicesPopup = dynamic(() => import("@/components/EveningServicesPopup"), {
  ssr: false,
});
const MobileBottomBar = dynamic(() => import("@/components/MobileBottomBar"), {
  ssr: false,
});

export default function PublicLayoutWrapper({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <main suppressHydrationWarning className="flex-1 overflow-x-clip overflow-y-visible w-full max-w-full relative" style={{ overflowX: "clip", overflowY: "visible" }}>{children}</main>
      <Footer />
      {mounted && (
        <>
          <MobileBottomBar />
          <AppointmentModal />
          <EveningServicesPopup />
        </>
      )}
    </>
  );
}
