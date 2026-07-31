"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  MessageSquare,
  Calendar,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Stethoscope,
  Filter,
  ChevronRight,
  Clock
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const isInitialRef = useRef(true);

  // Helper to add toast notification
  const addToast = (type, title, subtitle, href) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, subtitle, href }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  useEffect(() => {
    let unreadNotifsMap = new Map();
    let unreadApptsMap = new Map();
    let unreadMsgsMap = new Map();

    const updateTotalUnread = () => {
      const allUnreadKeys = new Set([
        ...Array.from(unreadNotifsMap.keys()),
        ...Array.from(unreadApptsMap.keys()),
        ...Array.from(unreadMsgsMap.keys()),
      ]);
      setUnreadCount(allUnreadKeys.size);
    };

    // 1. Subscribe to notifications collection for Admin
    const unsubNotifs = onSnapshot(
      collection(db, "notifications"),
      (snap) => {
        unreadNotifsMap.clear();
        snap.docs.forEach((docSnap) => {
          const n = docSnap.data();
          if ((n.recipient_type || "admin") === "admin" && n.is_read !== true && n.read !== true) {
            unreadNotifsMap.set(`notif-${docSnap.id}`, true);
          }
        });

        if (!isInitialRef.current) {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              if ((data.recipient_type || "admin") === "admin") {
                addToast(
                  data.type || "notification",
                  data.title || "New Notification",
                  data.message || "",
                  data.href || "/admin/notifications"
                );
              }
            }
          });
        } else {
          isInitialRef.current = false;
        }

        updateTotalUnread();
      },
      (err) => console.warn("Notifications subscription notice:", err)
    );

    // 2. Subscribe to appointments collection for Admin
    const unsubAppts = onSnapshot(
      collection(db, "appointments"),
      (snap) => {
        unreadApptsMap.clear();
        snap.docs.forEach((docSnap) => {
          const appt = docSnap.data();
          if (appt.is_read !== true && appt.read !== true && appt.status === "pending") {
            unreadApptsMap.set(`appt-${docSnap.id}`, true);
          }
        });
        updateTotalUnread();
      },
      (err) => console.warn("Admin appts subscription notice:", err)
    );

    // 3. Subscribe to messages collection for Admin
    const unsubMsgs = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        unreadMsgsMap.clear();
        snap.docs.forEach((docSnap) => {
          const msg = docSnap.data();
          if (msg.is_read !== true && msg.read !== true) {
            unreadMsgsMap.set(`msg-${docSnap.id}`, true);
          }
        });
        updateTotalUnread();
      },
      (err) => console.warn("Admin msgs subscription notice:", err)
    );

    return () => {
      unsubNotifs();
      unsubAppts();
      unsubMsgs();
    };
  }, []);

  return (
    <>
      {/* Bell Link Button navigating to /admin/notifications */}
      <div className="relative">
        <Link
          href="/admin/notifications"
          className="relative p-2.5 rounded-xl bg-white border border-[#D5E5DD] text-[#0B3D5C] hover:bg-[#E8F0EC] transition-all cursor-pointer shadow-xs flex items-center justify-center"
          title="Open Notifications Center"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Real-Time Floating Toast Banners */}
      <div className="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`pointer-events-auto bg-white rounded-2xl border shadow-2xl p-4 flex items-start gap-3 border-l-4 ${
                t.type === "doctor"
                  ? "border-l-emerald-600 border-slate-200"
                  : t.type === "appointment"
                  ? "border-l-sky-600 border-slate-200"
                  : "border-l-amber-500 border-slate-200"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs ${
                  t.type === "doctor"
                    ? "bg-emerald-600"
                    : t.type === "appointment"
                    ? "bg-sky-600"
                    : "bg-amber-600"
                }`}
              >
                {t.type === "doctor" ? (
                  <Stethoscope className="w-5 h-5" />
                ) : t.type === "appointment" ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-black text-[#0B3D5C] truncate">
                  {t.title}
                </h5>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-snug">
                  {t.subtitle}
                </p>
                <Link
                  href={t.href}
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="mt-1.5 inline-block text-[11px] font-extrabold text-[#0B3D5C] underline hover:text-[#3E8E6E]"
                >
                  View Details &rarr;
                </Link>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
