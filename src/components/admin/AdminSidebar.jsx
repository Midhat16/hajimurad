"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  Eye,
  Menu,
  X,
  ExternalLink,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Appointments", href: "/admin/appointments", icon: Calendar },
  { label: "Doctors", href: "/admin/doctors", icon: Users },
  { label: "Services", href: "/admin/services", icon: Briefcase },
  { label: "Technologies", href: "/admin/technologies", icon: Cpu },
  { label: "Why Choose Us", href: "/admin/why-choose-us", icon: Sparkles },
  { label: "About", href: "/admin/about", icon: Info },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAdminAuth();
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
          if (data.is_read !== true && data.read !== true) {
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
    <div className="flex flex-col justify-between h-full p-5">
      <div className="space-y-8">
        {/* Brand logo */}
        <div className="flex items-center justify-between px-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow-md">
              <img src="/images/logo.png" alt="Haji Murad Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-white leading-tight">
                Haji Murad
              </span>
              <span className="text-[10px] font-bold text-[#3E8E6E] tracking-widest uppercase">
                Admin Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-300 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const isMessages = item.href === "/admin/messages";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                  ? "bg-[#3E8E6E] text-white shadow-md"
                  : "text-slate-300 hover:bg-[#082D44] hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
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
      <div className="border-t border-slate-700/60 pt-4 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#082D44] hover:text-white transition-all"
        >
          <ExternalLink className="w-4 h-4 text-[#3E8E6E]" />
          <span>View Live Website</span>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
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
          className="p-2 rounded-xl bg-[#0B3D5C] text-white shadow-lg border border-[#3E8E6E]/40 cursor-pointer hover:bg-[#082D44]"
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
              className="relative w-[85vw] max-w-[260px] bg-[#0B3D5C] text-white h-full shadow-2xl z-10 overflow-y-auto"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0B3D5C] text-white min-h-screen shadow-xl flex-shrink-0 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
