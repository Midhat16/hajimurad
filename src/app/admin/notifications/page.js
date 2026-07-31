"use client";

// Admin Notifications Center Stream - Complete History (Past & Present)
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Bell,
  Calendar,
  MessageSquare,
  Clock,
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminNotificationsPage() {
  const [notificationsDocs, setNotificationsDocs] = useState([]);
  const [appointmentsDocs, setAppointmentsDocs] = useState([]);
  const [messagesDocs, setMessagesDocs] = useState([]);
  const [activityLogsDocs, setActivityLogsDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "appointments" | "messages"

  useEffect(() => {
    // 1. Subscribe to notifications collection
    const unsubNotifs = onSnapshot(
      collection(db, "notifications"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, collectionName: "notifications", ...d.data() }))
          .filter((n) => (n.recipient_type || "admin") === "admin");
        setNotificationsDocs(list);
      },
      (err) => console.warn("Notifs notice:", err)
    );

    // 2. Subscribe to appointments collection (for complete past history)
    const unsubAppts = onSnapshot(
      collection(db, "appointments"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "appointments",
          ...d.data(),
        }));
        setAppointmentsDocs(list);
      },
      (err) => console.warn("Appts notice:", err)
    );

    // 3. Subscribe to messages collection (for patient inquiries history)
    const unsubMsgs = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "messages",
          ...d.data(),
        }));
        setMessagesDocs(list);
      },
      (err) => console.warn("Msgs notice:", err)
    );

    // 4. Subscribe to activityLog collection (for doctor actions history)
    const unsubLogs = onSnapshot(
      collection(db, "activityLog"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "activityLog",
          ...d.data(),
        }));
        setActivityLogsDocs(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Logs notice:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubNotifs();
      unsubAppts();
      unsubMsgs();
      unsubLogs();
    };
  }, []);

  // Build unified complete stream of ALL notifications (from start to now)
  const allNotificationsMap = new Map();

  // A. Add records from `notifications` collection
  notificationsDocs.forEach((n) => {
    const rawTime = n.createdAt?.seconds ? n.createdAt.seconds * 1000 : Date.now();
    const isDoctorMsg =
      n.type === "doctor_action" ||
      n.type === "direct_message" ||
      n.sender_type === "doctor" ||
      Boolean(n.doctorId) ||
      (n.title && n.title.toLowerCase().includes("doctor"));

    let formattedTitle = n.title || "Notification";
    if (formattedTitle.includes("New message from Dr.")) {
      formattedTitle = formattedTitle.replace("New message from Dr.", "New Doctor Inquiry: Dr.");
    } else if (formattedTitle.includes("New Patient Inquiry:") && isDoctorMsg) {
      formattedTitle = formattedTitle.replace("New Patient Inquiry:", "New Doctor Inquiry:");
    }

    allNotificationsMap.set(`notif-${n.id}`, {
      id: n.id,
      collectionName: "notifications",
      type: n.type || "appointment",
      isDoctorMsg,
      title: formattedTitle,
      message: n.message || "",
      href: n.href || "/admin/notifications",
      is_read: n.is_read === true,
      timestamp: n.createdAt,
      rawTime,
    });
  });

  // B. Add records from `appointments` collection (if not already mapped)
  appointmentsDocs.forEach((appt) => {
    const rawTime = appt.createdAt?.seconds ? appt.createdAt.seconds * 1000 : Date.now();
    const mapKey = `appt-${appt.id}`;
    if (!allNotificationsMap.has(mapKey)) {
      allNotificationsMap.set(mapKey, {
        id: appt.id,
        collectionName: "appointments",
        type: "appointment",
        title: `New Appointment Request: ${appt.name || "Patient"}`,
        message: `Requested ${appt.service || "Eye Treatment"} with ${appt.doctor || "Doctor"} on ${appt.date || "N/A"} (${appt.time || "N/A"})`,
        href: "/admin/appointments",
        is_read: appt.read === true || appt.is_read === true,
        timestamp: appt.createdAt,
        rawTime,
      });
    }
  });

  // C. Add records from `messages` collection
  messagesDocs.forEach((msg) => {
    const rawTime = msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : Date.now();
    const mapKey = `msg-${msg.id}`;
    if (!allNotificationsMap.has(mapKey)) {
      const isDoctorMsg =
        msg.sender_type === "doctor" ||
        msg.category === "doctor_chat" ||
        Boolean(msg.doctorId) ||
        (msg.name && /^dr[\s\.]/i.test(msg.name.trim())) ||
        (msg.doctorName && msg.doctorName.length > 0);

      const nameStr = msg.doctorName || msg.name || (isDoctorMsg ? "Doctor" : "Patient");
      const title = isDoctorMsg
        ? `New Doctor Inquiry: ${nameStr}`
        : `New Patient Inquiry: ${nameStr}`;

      const href = isDoctorMsg && msg.doctorId ? `/admin/messages?doctorId=${msg.doctorId}` : "/admin/messages";

      allNotificationsMap.set(mapKey, {
        id: msg.id,
        collectionName: "messages",
        type: isDoctorMsg ? "doctor_message" : "message",
        isDoctorMsg,
        title,
        message: msg.message || "Contact message received",
        href,
        is_read: msg.read === true || msg.is_read === true,
        timestamp: msg.createdAt,
        rawTime,
      });
    }
  });

  // D. Add records from `activityLog` collection (doctor actions)
  activityLogsDocs.forEach((log) => {
    const rawTime = log.timestamp?.seconds ? log.timestamp.seconds * 1000 : Date.now();
    const act = (log.action || "").toUpperCase();
    const mapKey = `act-${log.id}`;
    if (!allNotificationsMap.has(mapKey)) {
      allNotificationsMap.set(mapKey, {
        id: log.id,
        collectionName: "activityLog",
        type: "doctor_action",
        title: `Doctor Action: Appointment ${act}`,
        message: log.message || `Appointment was ${log.action} by Dr. ${log.doctorName || "Doctor"} for ${log.patientName || "Patient"}`,
        href: log.doctorId ? `/admin/doctors/${log.doctorId}/activity` : "/admin/doctors",
        is_read: log.read === true || log.is_read === true,
        timestamp: log.timestamp,
        rawTime,
      });
    }
  });

  const fullStream = Array.from(allNotificationsMap.values());
  fullStream.sort((a, b) => b.rawTime - a.rawTime);

  // Filter based on 3 tabs: "All", "Appointments", "Messages"
  const filteredNotifications = fullStream.filter((item) => {
    if (activeTab === "all") return true;
    const type = (item.type || "").toLowerCase();
    if (activeTab === "appointments") {
      return type.includes("appointment") || type.includes("doctor_action");
    }
    if (activeTab === "messages") {
      return type.includes("message") || type.includes("inquiry");
    }
    return true;
  });

  const unreadCount = fullStream.filter((n) => !n.is_read).length;

  // Mark single notification as read in Firestore
  const handleMarkAsRead = async (item) => {
    if (item.is_read) return;
    try {
      await updateDoc(doc(db, item.collectionName, item.id), {
        is_read: true,
        read: true,
      });
    } catch (err) {
      console.warn("Failed to mark read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const unreadList = fullStream.filter((n) => !n.is_read);
      await Promise.all(
        unreadList.map((n) =>
          updateDoc(doc(db, n.collectionName, n.id), { is_read: true, read: true })
        )
      );
    } catch (err) {
      console.warn("Failed to mark all read:", err);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "Recently";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    return String(ts);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5E5DD] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2.5 rounded-xl bg-white border border-[#D5E5DD] text-[#0B3D5C] hover:bg-[#E8F0EC] transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#3E8E6E] bg-[#E8F0EC] px-2.5 py-0.5 rounded-md border border-[#D5E5DD]">
                Hospital Management Audit
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white bg-rose-500 px-2.5 py-0.5 rounded-full animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight mt-1">
              Admin Notifications Center
            </h1>
            <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
              Complete history of all appointments, doctor actions, and messages from start to present ({fullStream.length} total recorded).
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 bg-[#0B3D5C] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#082D44] transition-all cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-[#5EEAD4]" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* 3 Filter Tabs (All, Appointments, Messages) */}
      <div className="bg-white p-3 rounded-2xl border border-[#D5E5DD] shadow-xs flex items-center gap-2 max-w-md">
        {[
          { id: "all", label: `All (${fullStream.length})` },
          {
            id: "appointments",
            label: `Appointments (${fullStream.filter((n) => (n.type || "").includes("appointment") || (n.type || "").includes("doctor_action")).length})`,
          },
          {
            id: "messages",
            label: `Messages (${fullStream.filter((n) => (n.type || "").includes("message")).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
              activeTab === tab.id
                ? "bg-[#0B3D5C] text-white shadow-xs"
                : "bg-[#F4F7F5] text-[#3F4B4A] hover:bg-[#E8F0EC]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Notifications Feed List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#D5E5DD]">
          <div className="w-8 h-8 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#0B3D5C]">Loading Saved Notifications Stream...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#D5E5DD] space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-[#0B3D5C]">No Notifications Found</h3>
          <p className="text-xs font-semibold text-[#3F4B4A] max-w-sm mx-auto">
            No saved notifications currently match the selected filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D5E5DD] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-[#0B3D5C] uppercase tracking-wider">
              Complete History Stream ({filteredNotifications.length})
            </h2>
            <span className="text-xs font-bold text-[#3E8E6E] bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#D5E5DD]">
              Saved From Start
            </span>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const isAppt = (item.type || "").includes("appointment") || (item.type || "").includes("doctor_action");
              const isDoctorMsg = item.isDoctorMsg || (item.type || "").includes("doctor");
              const isUnread = !item.is_read;

              return (
                <motion.div
                  key={`${item.collectionName}-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative group ${
                    isUnread
                      ? "bg-rose-50/50 border-rose-200 shadow-xs"
                      : "bg-[#F4F7F5] border-[#D5E5DD] opacity-90"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Icon Pill */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 shadow-xs ${
                        isAppt
                          ? "bg-sky-600"
                          : isDoctorMsg
                          ? "bg-emerald-600"
                          : "bg-amber-600"
                      }`}
                    >
                      {isAppt ? (
                        <Calendar className="w-5 h-5" />
                      ) : isDoctorMsg ? (
                        <Stethoscope className="w-5 h-5" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isAppt
                              ? "bg-sky-100 text-sky-800"
                              : isDoctorMsg
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isAppt
                            ? "Appointment / Action"
                            : isDoctorMsg
                            ? "Doctor Inquiry"
                            : "Patient Message Inquiry"}
                        </span>

                        <h4 className="text-sm font-extrabold text-[#0B3D5C] truncate">
                          {item.title}
                        </h4>
                      </div>

                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions & Red Unread Mark */}
                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>

                    <Link
                      href={item.href}
                      onClick={() => handleMarkAsRead(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#0B3D5C] text-white hover:bg-[#082D44] text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* RED MARK INDICATOR IF UNREAD */}
                    {isUnread && (
                      <div
                        onClick={() => handleMarkAsRead(item)}
                        className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-md animate-pulse cursor-pointer flex-shrink-0"
                        title="Unread notification — click to mark read"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
