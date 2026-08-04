"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDoctorAuth } from "@/context/DoctorAuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Calendar, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorNotificationBell() {
  const { doctorProfile, doctorId } = useDoctorAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const isInitialRef = useRef(true);

  const addToast = (type, title, subtitle, href) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, subtitle, href }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  useEffect(() => {
    if (!doctorId && !doctorProfile?.name) return;
    const doctorNameClean = (doctorProfile?.name || "").toLowerCase().trim();
    const docKey = doctorId || doctorNameClean || "doc";
    const lastSeenTime = parseInt(typeof window !== "undefined" ? localStorage.getItem(`doctor_last_seen_notifs_${docKey}`) || "0" : "0", 10);

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

    // 1. Subscribe to notifications collection for Doctor
    const unsubNotifs = onSnapshot(
      collection(db, "notifications"),
      (snap) => {
        unreadNotifsMap.clear();
        snap.docs.forEach((d) => {
          const data = d.data();
          const isForDoctor =
            (data.recipient_type || "doctor") === "doctor" &&
            data.sender_type !== "doctor" &&
            ((data.recipient_id && doctorId && data.recipient_id === doctorId) ||
              (data.doctorName && doctorNameClean && data.doctorName.toLowerCase().includes(doctorNameClean)));

          const itemTime = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0;
          if (isForDoctor && data.is_read !== true && data.read !== true && itemTime > lastSeenTime) {
            unreadNotifsMap.set(`notif-${d.id}`, true);
          }
        });

        if (!isInitialRef.current) {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              const isForDoctor =
                (data.recipient_type || "doctor") === "doctor" &&
                data.sender_type !== "doctor" &&
                ((data.recipient_id && doctorId && data.recipient_id === doctorId) ||
                  (data.doctorName && doctorNameClean && data.doctorName.toLowerCase().includes(doctorNameClean)));

              if (isForDoctor) {
                addToast(
                  data.type || "appointment",
                  data.title || "New Notification",
                  data.message || "",
                  data.href || "/doctor/notifications"
                );
              }
            }
          });
        } else {
          isInitialRef.current = false;
        }

        updateTotalUnread();
      },
      (err) => console.warn("Doctor notifs subscription notice:", err)
    );

    // 2. Subscribe to new pending appointments assigned to this doctor
    const unsubAppts = onSnapshot(
      collection(db, "appointments"),
      (snap) => {
        unreadApptsMap.clear();
        snap.docs.forEach((d) => {
          const appt = d.data();
          const isAssigned =
            (appt.doctorId && doctorId && appt.doctorId === doctorId) ||
            (appt.doctor && doctorNameClean && appt.doctor.toLowerCase().includes(doctorNameClean));

          const itemTime = appt.createdAt?.seconds ? appt.createdAt.seconds * 1000 : 0;
          const isNewPending = isAssigned && appt.status === "pending" && appt.readByDoctor !== true && itemTime > lastSeenTime;

          if (isNewPending) {
            unreadApptsMap.set(`appt-${d.id}`, true);
          }
        });
        updateTotalUnread();
      },
      (err) => console.warn("Doctor appts subscription notice:", err)
    );

    // 3. Subscribe to doctor_messages from Admin
    const unsubDocMsgs = onSnapshot(
      collection(db, "doctor_messages"),
      (snap) => {
        unreadMsgsMap.clear();
        snap.docs.forEach((d) => {
          const msg = d.data();
          const isForThisDoc =
            (msg.doctorId && doctorId && msg.doctorId === doctorId) ||
            (msg.doctorName && doctorNameClean && msg.doctorName.toLowerCase().includes(doctorNameClean));

          const itemTime = msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : 0;
          if (isForThisDoc && msg.sender_type === "admin" && msg.is_read !== true && msg.read !== true && itemTime > lastSeenTime) {
            unreadMsgsMap.set(`msg-${d.id}`, true);
          }
        });
        updateTotalUnread();
      },
      (err) => console.warn("Doctor msgs subscription notice:", err)
    );

    return () => {
      unsubNotifs();
      unsubAppts();
      unsubDocMsgs();
    };
  }, [doctorId, doctorProfile]);

  return (
    <>
      <div className="relative">
        <Link
          href="/doctor/notifications"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative cursor-pointer flex items-center justify-center border border-white/10"
          title="Open Doctor Notifications Center"
        >
          <Bell className="w-5 h-5 text-slate-100" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--ink)] animate-pulse shadow-md">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Floating Toasts for Doctor */}
      <div className="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 flex items-start gap-3 border-l-4 border-l-sky-600"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs">
                {t.type === "appointment" ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-black text-[var(--ink)] truncate">{t.title}</h5>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-snug">{t.subtitle}</p>
                <Link
                  href={t.href}
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="mt-1.5 inline-block text-[11px] font-extrabold text-[var(--ink)] underline hover:text-[var(--iris)]"
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
