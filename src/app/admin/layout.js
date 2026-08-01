"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import NotificationBell from "@/components/admin/NotificationBell";
import { ShieldCheck } from "lucide-react";

function AdminContentGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthorized } = useAdminAuth();

  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";

  useEffect(() => {
    if (!loading) {
      if (!isLoginPage && (!user || !isAuthorized)) {
        router.push("/admin/login");
      } else if (isLoginPage && user && isAuthorized) {
        router.push("/admin/dashboard");
      }
    }
  }, [user, loading, isAuthorized, isLoginPage, router]);

  if (isLoginPage) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-[#0B3D5C] uppercase tracking-widest">
          Authenticating Admin Portal...
        </p>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#D5E5DD] px-3 sm:px-8 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-40 min-w-0">
          <div className="flex items-center gap-2 pl-11 md:pl-0 min-w-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#3E8E6E] flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0B3D5C] tracking-tight uppercase truncate">
              Management Portal
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <NotificationBell />
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0B3D5C] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                A
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0B3D5C]">
                  {user?.email || "Admin"}
                </span>
                <span className="text-[10px] text-[#3E8E6E] font-semibold">
                  Authorized Administrator
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminContentGuard>{children}</AdminContentGuard>
    </AdminAuthProvider>
  );
}
