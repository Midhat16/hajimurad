"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DoctorAuthProvider, useDoctorAuth } from "@/context/DoctorAuthContext";

function DoctorGuard({ children }) {
  const { isDoctorAuthorized, loading } = useDoctorAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/doctor/login";

  useEffect(() => {
    if (!loading) {
      if (!isDoctorAuthorized && !isLoginPage) {
        router.push("/doctor/login");
      } else if (isDoctorAuthorized && isLoginPage) {
        router.push("/doctor/dashboard");
      }
    }
  }, [isDoctorAuthorized, loading, isLoginPage, router]);

  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[var(--fog)] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--ink)]">Authenticating Doctor Portal...</p>
      </div>
    );
  }

  return children;
}

export default function DoctorLayout({ children }) {
  return (
    <DoctorAuthProvider>
      <DoctorGuard>{children}</DoctorGuard>
    </DoctorAuthProvider>
  );
}
