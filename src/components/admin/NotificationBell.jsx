"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  MessageSquare,
  Calendar,
  X,
  Stethoscope,
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const isInitialRef = useRef(true);

  // Helper to add toast notification
  const addToast = (type, title, subtitle, href, docInfo = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, subtitle, href, ...docInfo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Helper to mark a specific toast's underlying notification as read permanently in Firestore
  const handleToastClick = async (toast) => {
    console.log("[NotificationBell] handleToastClick called for toast:", toast);
    setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    try {
      // 1. Mark primary target document by its real docId
      if (toast.collectionName && toast.docId) {
        console.log(`[NotificationBell] Updating ${toast.collectionName} docId: ${toast.docId}`);
        await updateDoc(doc(db, toast.collectionName, toast.docId), {
          is_read: true,
          read: true,
        });
      }

      // 2. Query & mark matching docs across notifications and activityLog by appointmentId
      if (toast.appointmentId) {
        console.log(`[NotificationBell] Cross-syncing appointmentId: ${toast.appointmentId}`);
        const qNotifs = query(collection(db, "notifications"), where("appointmentId", "==", toast.appointmentId));
        const snapNotifs = await getDocs(qNotifs);
        const p1 = snapNotifs.docs.map((d) => updateDoc(doc(db, "notifications", d.id), { is_read: true, read: true }).catch(() => {}));

        const qLogs = query(collection(db, "activityLog"), where("appointmentId", "==", toast.appointmentId));
        const snapLogs = await getDocs(qLogs);
        const p2 = snapLogs.docs.map((d) => updateDoc(doc(db, "activityLog", d.id), { is_read: true, read: true }).catch(() => {}));

        await Promise.all([...p1, ...p2]);
        await updateDoc(doc(db, "appointments", toast.appointmentId), { is_read: true, read: true }).catch(() => {});
      }
    } catch (err) {
      console.warn("Notice: handleToastClick error handled:", err);
    }
  };

  useEffect(() => {
    let unreadNotifsMap = new Map();
    let unreadApptsMap = new Map();
    let unreadMsgsMap = new Map();
    let unreadLogsMap = new Map();

    const updateTotalUnread = () => {
      const allUnreadKeys = new Set();

      unreadNotifsMap.forEach((item, id) => {
        const key = item.appointmentId ? `appt-${item.appointmentId}` : `notif-${id}`;
        allUnreadKeys.add(key);
      });

      unreadApptsMap.forEach((item, id) => {
        allUnreadKeys.add(`appt-${id}`);
      });

      unreadMsgsMap.forEach((item, id) => {
        allUnreadKeys.add(`msg-${id}`);
      });

      unreadLogsMap.forEach((item, id) => {
        const key = item.appointmentId ? `appt-${item.appointmentId}` : `log-${id}`;
        if (!allUnreadKeys.has(key)) {
          allUnreadKeys.add(key);
        }
      });

      setUnreadCount(allUnreadKeys.size);
    };

    let activeAppIds = new Set();

    // 0. Subscribe to internshipApplications
    const unsubInternships = onSnapshot(
      collection(db, "internshipApplications"),
      (snap) => {
        activeAppIds = new Set(snap.docs.map((d) => d.id));
        updateTotalUnread();
      },
      (err) => console.warn("Admin internships subscription notice:", err)
    );

    // 1. Subscribe to notifications collection for Admin
    const unsubNotifs = onSnapshot(
      collection(db, "notifications"),
      (snap) => {
        unreadNotifsMap.clear();
        snap.docs.forEach((docSnap) => {
          const n = docSnap.data();
          const isInternship =
            n.type === "internship_application" ||
            n.type === "internship" ||
            (n.title && /internship/i.test(n.title)) ||
            (n.message && /internship/i.test(n.message));

          if (isInternship) {
            const isAppValid = n.applicationId ? activeAppIds.has(n.applicationId) : activeAppIds.size > 0;
            if (!isAppValid) return;
          }

          if ((n.recipient_type || "admin") === "admin" && n.sender_type !== "admin" && n.is_read !== true && n.read !== true) {
            unreadNotifsMap.set(docSnap.id, { id: docSnap.id, appointmentId: n.appointmentId || "" });
          }
        });

        if (!isInitialRef.current) {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              if ((data.recipient_type || "admin") === "admin" && data.sender_type !== "admin") {
                const targetHref =
                  data.type === "appointment" || data.type === "appointment_action" || data.type === "doctor_action"
                    ? "/admin/appointments"
                    : (data.href || "/admin/notifications");

                addToast(
                  data.type || "notification",
                  data.title || "New Notification",
                  data.message || "",
                  targetHref,
                  { docId: change.doc.id, collectionName: "notifications", appointmentId: data.appointmentId || "" }
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
            unreadApptsMap.set(docSnap.id, { id: docSnap.id });
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
          if (msg.sender_type !== "admin" && msg.is_read !== true && msg.read !== true) {
            unreadMsgsMap.set(docSnap.id, { id: docSnap.id });
          }
        });
        updateTotalUnread();
      },
      (err) => console.warn("Admin msgs subscription notice:", err)
    );

    // 4. Subscribe to activityLog collection for Admin (triggers toast & badge on every doctor action)
    const unsubLogs = onSnapshot(
      collection(db, "activityLog"),
      (snap) => {
        unreadLogsMap.clear();
        snap.docs.forEach((docSnap) => {
          const log = docSnap.data();
          if (log.read !== true && log.is_read !== true) {
            unreadLogsMap.set(docSnap.id, { id: docSnap.id, appointmentId: log.appointmentId || "" });
          }
        });

        if (!isInitialRef.current) {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const log = change.doc.data();
              const act = (log.action || "").toUpperCase();
              addToast(
                "doctor_action",
                `Doctor Action: ${act}`,
                log.message || `Appointment was ${log.action} by Dr. ${log.doctorName || "Doctor"}`,
                "/admin/appointments",
                { docId: change.doc.id, collectionName: "activityLog", appointmentId: log.appointmentId || "" }
              );
            }
          });
        }

        updateTotalUnread();
      },
      (err) => console.warn("Admin activityLog subscription notice:", err)
    );

    return () => {
      unsubInternships();
      unsubNotifs();
      unsubAppts();
      unsubMsgs();
      unsubLogs();
    };
  }, []);

  return (
    <>
      {/* Bell Link Button navigating to /admin/notifications */}
      <div className="relative">
        <Link
          href="/admin/notifications"
          className="relative p-2.5 rounded-xl bg-white border border-[var(--line)] text-[#2B1F1A] hover:bg-[var(--fog)] transition-all cursor-pointer shadow-xs flex items-center justify-center"
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
                t.type === "doctor" || t.type === "doctor_action"
                  ? "border-l-emerald-600 border-slate-200"
                  : t.type === "appointment" || t.type === "appointment_booked"
                  ? "border-l-sky-600 border-slate-200"
                  : "border-l-amber-500 border-slate-200"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-xs ${
                  t.type === "doctor" || t.type === "doctor_action"
                    ? "bg-emerald-600"
                    : t.type === "appointment" || t.type === "appointment_booked"
                    ? "bg-sky-600"
                    : "bg-amber-600"
                }`}
              >
                {t.type === "doctor" || t.type === "doctor_action" ? (
                  <Stethoscope className="w-5 h-5" />
                ) : t.type === "appointment" || t.type === "appointment_booked" ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-black text-[#2B1F1A] truncate">
                  {t.title}
                </h5>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-snug">
                  {t.subtitle}
                </p>
                <Link
                  href={t.href}
                  onClick={() => handleToastClick(t)}
                  className="mt-1.5 inline-block text-[11px] font-extrabold text-[#2B1F1A] underline hover:text-[var(--iris)]"
                >
                  View Details &rarr;
                </Link>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
