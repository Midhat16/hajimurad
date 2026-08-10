"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHospitalProfile, formatBrandName } from "@/lib/useHospitalProfile";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Cpu,
  Info,
  MessageSquare,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Bell,
  GraduationCap,
  FileText,
  Newspaper,
  Image as ImageIcon,
  HeartHandshake,
  CalendarDays,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Appointments", href: "/admin/appointments", icon: Calendar },
  { label: "Doctors", href: "/admin/doctors", icon: Users },
  { label: "Services", href: "/admin/services", icon: Briefcase },
  { label: "Technologies", href: "/admin/technologies", icon: Cpu },
  { label: "Internships", href: "/admin/internships", icon: GraduationCap },
  { label: "Gallery Manager", href: "/admin/media/gallery", icon: ImageIcon },
  { label: "Annual Reports", href: "/admin/media/annual-reports", icon: FileText },
  { label: "Newsletters", href: "/admin/media/newsletters", icon: Newspaper },
  { label: "Success Stories", href: "/admin/media/success-stories", icon: HeartHandshake },
  { label: "Upcoming Events", href: "/admin/media/events", icon: CalendarDays },
  { label: "Why Choose Us", href: "/admin/why-choose-us", icon: Sparkles },
  { label: "About Content", href: "/admin/about", icon: Info },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Site Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAdminAuth();
  const { profile } = useHospitalProfile();
  const brand = formatBrandName(profile.hospitalName);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMsgsCount, setUnreadMsgsCount] = useState(0);

  // Theme option state: "dark" (#1E1433) vs "light" (#FFFFFF)
  const [sidebarTheme, setSidebarTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_theme");
    if (saved === "light" || saved === "dark") {
      setSidebarTheme(saved);
    }
  }, []);

  const toggleTheme = (themeName) => {
    setSidebarTheme(themeName);
    localStorage.setItem("admin_sidebar_theme", themeName);
  };

  useEffect(() => {
    let unreadDocMsgsMap = new Map();
    let unreadGenMsgsMap = new Map();

    const updateCount = () => {
      const allKeys = new Set([...unreadDocMsgsMap.keys(), ...unreadGenMsgsMap.keys()]);
      setUnreadMsgsCount(allKeys.size);
    };

    const unsub1 = onSnapshot(
      collection(db, "doctor_messages"),
      (snap) => {
        unreadDocMsgsMap.clear();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.sender_type === "doctor" && data.is_read !== true && data.read !== true) {
            unreadDocMsgsMap.set(`doc-${d.id}`, true);
          }
        });
        updateCount();
      },
      (err) => console.warn("AdminSidebar doc_messages notice:", err)
    );

    const unsub2 = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        unreadGenMsgsMap.clear();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.sender_type !== "admin" && data.is_read !== true && data.read !== true) {
            unreadGenMsgsMap.set(`gen-${d.id}`, true);
          }
        });
        updateCount();
      },
      (err) => console.warn("AdminSidebar messages notice:", err)
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const isDark = sidebarTheme === "dark";

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5">
      <div className="space-y-5">
        {/* Brand logo Header */}
        <div className={`pb-3 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center justify-between px-1">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              {/* White background box for logo so red/purple logo icon pops with pristine contrast */}
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img src={profile.logoUrl} alt={profile.hospitalName} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-[#2B1F1A]"}`}>
                  {brand.mainFirst}{" "}
                  {brand.mainHighlight && (
                    <span className={isDark ? "text-[#FF4D5A]" : "text-[#C4232C]"}>{brand.mainHighlight}</span>
                  )}
                </span>
                <span className={`text-[9px] font-black tracking-widest uppercase ${isDark ? "text-[#FF4D5A]" : "text-[#C4232C]"}`}>
                  ADMIN PORTAL
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className={`md:hidden p-1 rounded-lg ${isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Option Selector Pills */}
          <div className="mt-3 pt-2.5 flex items-center justify-between text-[10px] font-extrabold px-1">
            <span className={isDark ? "text-slate-400 uppercase tracking-wider" : "text-slate-500 uppercase tracking-wider"}>
              Sidebar Color:
            </span>
            <div className="flex items-center gap-1 bg-slate-200/40 p-0.5 rounded-lg border border-slate-300/40">
              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  isDark
                    ? "bg-[#1E1433] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Option 1: Dark Navy (#1E1433)"
              >
                <Moon className="w-3 h-3" />
                <span>Dark Navy</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  !isDark
                    ? "bg-white text-[#2B1F1A] shadow-xs font-bold border border-slate-200"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Option 2: Light White (#FFFFFF)"
              >
                <Sun className="w-3 h-3" />
                <span>Light</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nav Items List */}
        <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar pr-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const isMessages = item.href === "/admin/messages";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-[#C4232C] to-[#E63946] text-white shadow-md font-black"
                    : isDark
                    ? "text-slate-300 hover:bg-white/10 hover:text-white font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-[#2B1F1A] font-semibold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    isActive
                      ? "text-white"
                      : isDark
                      ? "text-slate-400 group-hover:text-white"
                      : "text-slate-500 group-hover:text-[#C4232C]"
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isMessages && unreadMsgsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    {unreadMsgsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className={`pt-3.5 space-y-1.5 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <Link
          href="/"
          target="_blank"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
            isDark ? "text-emerald-400 hover:bg-white/10" : "text-emerald-800 hover:bg-slate-100"
          }`}
        >
          <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>View Live Website</span>
        </Link>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            isDark ? "text-rose-400 hover:bg-white/10" : "text-rose-800 hover:bg-slate-100"
          }`}
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const containerBgClass = isDark
    ? "bg-[#1E1433] text-white"
    : "bg-white text-[#2B1F1A] border-r border-slate-200";

  return (
    <>
      {/* Mobile Bar Trigger */}
      <div className="md:hidden fixed top-2.5 left-2.5 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`p-2 rounded-xl shadow-md border cursor-pointer transition-colors ${
            isDark
              ? "bg-[#1E1433] text-white border-slate-700 hover:bg-slate-800"
              : "bg-white text-[#2B1F1A] border-slate-200 hover:bg-slate-100"
          }`}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative w-[85vw] max-w-[260px] ${containerBgClass} h-full shadow-2xl z-10 overflow-y-auto`}
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden md:flex w-64 ${containerBgClass} min-h-screen shadow-md flex-shrink-0 flex-col`}>
        {sidebarContent}
      </aside>
    </>
  );
}
