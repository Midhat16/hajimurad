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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5 overflow-hidden">
      {/* Brand logo Header */}
      <div className="flex items-center justify-between px-1 pb-3 border-b border-[#E5E5E5] shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img src={profile.logoUrl} alt={profile.hospitalName} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-[#2B1F1A] leading-tight">
              {brand.mainFirst}{" "}
              {brand.mainHighlight && (
                <span className="text-[#C4232C]">{brand.mainHighlight}</span>
              )}
            </span>
            <span className="text-[9px] font-black text-[#C4232C] tracking-widest uppercase">
              ADMIN PORTAL
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items List */}
      <nav className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1 my-4 space-y-1.5">
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
                  : "text-[#2B1F1A] hover:bg-slate-100 hover:text-[#C4232C]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                  isActive ? "text-white" : "text-slate-600 group-hover:text-[#C4232C]"
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

      {/* Footer Actions */}
      <div className="border-t border-[#E5E5E5] pt-3.5 space-y-1.5 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-emerald-800 hover:bg-slate-100 transition-all"
        >
          <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>View Live Website</span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-rose-800 hover:bg-slate-100 hover:text-rose-950 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Bar Trigger */}
      <div className="md:hidden fixed top-2.5 left-2.5 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-white text-[#2B1F1A] shadow-md border border-[#E5E5E5] cursor-pointer hover:bg-slate-50 transition-colors"
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-[85vw] max-w-[260px] bg-white border-r border-[#E5E5E5] text-[#2B1F1A] h-full shadow-2xl z-10 overflow-y-auto"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 fixed top-0 left-0 bottom-0 z-30 bg-white border-r border-[#E5E5E5] text-[#2B1F1A] h-screen shadow-xs flex-shrink-0 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
