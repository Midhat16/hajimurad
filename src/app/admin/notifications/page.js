"use client";

// Admin Notifications Center Stream - Complete History (Past & Present)
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Bell,
  Calendar,
  MessageSquare,
  Clock,
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  Stethoscope,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notificationsDocs, setNotificationsDocs] = useState([]);
  const [appointmentsDocs, setAppointmentsDocs] = useState([]);
  const [messagesDocs, setMessagesDocs] = useState([]);
  const [activityLogsDocs, setActivityLogsDocs] = useState([]);
  const [internshipAppsDocs, setInternshipAppsDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "appointments" | "internships" | "messages"

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

    // 4. Subscribe to activityLog collection (for doctor & system actions history)
    const unsubLogs = onSnapshot(
      collection(db, "activityLog"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "activityLog",
          ...d.data(),
        }));
        setActivityLogsDocs(list);
      },
      (err) => console.warn("Logs notice:", err)
    );

    // 5. Subscribe to internshipApplications collection
    const unsubInternships = onSnapshot(
      collection(db, "internshipApplications"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "internshipApplications",
          ...d.data(),
        }));
        setInternshipAppsDocs(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Internships notice:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubNotifs();
      unsubAppts();
      unsubMsgs();
      unsubLogs();
      unsubInternships();
    };
  }, []);

  // Build unified complete stream of ALL notifications (from start to now)
  const activeAppIds = new Set(internshipAppsDocs.map((app) => app.id));
  const activeAppNames = new Set(
    internshipAppsDocs.map((app) => (app.applicantName || "").toLowerCase().trim()).filter(Boolean)
  );

  const allNotificationsMap = new Map();

  // A. Add records from `notifications` collection
  notificationsDocs.forEach((n) => {
    const rawTime = n.createdAt?.seconds ? n.createdAt.seconds * 1000 : Date.now();
    const isInternship =
      n.type === "internship_application" ||
      n.type === "internship" ||
      (n.title && /internship/i.test(n.title)) ||
      (n.message && /internship/i.test(n.message));

    if (isInternship) {
      const matchesActive = n.applicationId
        ? activeAppIds.has(n.applicationId)
        : (n.applicantName && activeAppNames.has(n.applicantName.toLowerCase().trim()));

      if (!matchesActive || internshipAppsDocs.length === 0) {
        // Auto-delete orphan notification from Firestore
        deleteDoc(doc(db, "notifications", n.id)).catch(() => {});
        return;
      }
    }

    const isDoctorMsg =
      !isInternship &&
      (n.type === "doctor_action" ||
        n.type === "direct_message" ||
        n.sender_type === "doctor" ||
        Boolean(n.doctorId) ||
        (n.title && n.title.toLowerCase().includes("doctor")));

    let formattedTitle = n.title || "Notification";

    if (isInternship) {
      const pTitle = n.internshipTitle || n.programTitle || "";
      if (pTitle) {
        formattedTitle = `New Internship Application: ${pTitle}`;
      } else if (n.applicantName) {
        formattedTitle = `New Internship Application: ${n.applicantName}`;
      } else {
        formattedTitle = "New Internship Application";
      }
    } else if (formattedTitle.includes("New message from Dr.")) {
      formattedTitle = formattedTitle.replace("New message from Dr.", "New Doctor Inquiry: Dr.");
    } else if (formattedTitle.includes("New Patient Inquiry:") && isDoctorMsg) {
      formattedTitle = formattedTitle.replace("New Patient Inquiry:", "New Doctor Inquiry:");
    }

    let href = n.href || "/admin/notifications";
    if (isInternship) {
      href = n.applicationId
        ? `/admin/internships/applications?id=${n.applicationId}`
        : "/admin/internships/applications";
    } else if (
      n.type === "appointment" ||
      n.type === "appointment_action" ||
      n.type === "doctor_action" ||
      (n.title && /appointment/i.test(n.title)) ||
      (n.message && /appointment/i.test(n.message))
    ) {
      href = "/admin/appointments";
    } else if (href === "/admin/messages" || href.startsWith("/admin/messages")) {
      if (isDoctorMsg) {
        href = n.doctorId
          ? `/admin/messages?tab=doctor_chats&doctorId=${n.doctorId}`
          : "/admin/messages?tab=doctor_chats";
      } else {
        href = "/admin/messages?tab=patient_inquiries";
      }
    }

    allNotificationsMap.set(`notif-${n.id}`, {
      id: n.id,
      collectionName: "notifications",
      appointmentId: n.appointmentId || "",
      applicationId: n.applicationId || "",
      type: isInternship ? "internship_application" : (n.type || "appointment"),
      sender_type: n.sender_type || "",
      isDoctorMsg,
      isInternship,
      title: formattedTitle,
      message: n.message || "",
      href,
      is_read: n.is_read === true || n.read === true,
      timestamp: n.createdAt,
      rawTime,
    });
  });

  // B. Add records from `activityLog` collection
  activityLogsDocs.forEach((log) => {
    const rawTime = log.timestamp?.seconds ? log.timestamp.seconds * 1000 : Date.now();
    const act = (log.action || "").toUpperCase();
    const mapKey = `act-${log.id}`;
    const isInternshipLog = act.includes("INTERNSHIP") || (log.message && /internship/i.test(log.message));

    if (isInternshipLog) {
      const matchesActive = log.applicationId
        ? activeAppIds.has(log.applicationId)
        : (log.applicantName && activeAppNames.has(log.applicantName.toLowerCase().trim()));

      if (!matchesActive || internshipAppsDocs.length === 0) {
        deleteDoc(doc(db, "activityLog", log.id)).catch(() => {});
        return;
      }
      const existingInternship = Array.from(allNotificationsMap.values()).find(
        (n) => n.isInternship && (
          (log.applicationId && n.applicationId === log.applicationId) ||
          (log.applicantName && n.message?.toLowerCase().includes(log.applicantName.toLowerCase())) ||
          Math.abs(n.rawTime - rawTime) < 180000
        )
      );

      if (existingInternship) {
        if ((log.read === true || log.is_read === true) && !existingInternship.is_read) {
          existingInternship.is_read = true;
        }
        return;
      }

      allNotificationsMap.set(mapKey, {
        id: log.id,
        collectionName: "activityLog",
        type: "internship_application",
        sender_type: "candidate",
        isInternship: true,
        title: `New Internship Application: ${log.internshipTitle || "Internship Program"}`,
        message: log.message || `Candidate submitted an application for ${log.internshipTitle || "Internship Program"}`,
        href: log.applicationId
          ? `/admin/internships/applications?id=${log.applicationId}`
          : "/admin/internships/applications",
        is_read: log.read === true || log.is_read === true,
        timestamp: log.timestamp,
        rawTime,
      });
      return;
    }

    const apptId = log.appointmentId || "";
    const existingEntry = Array.from(allNotificationsMap.values()).find(
      (n) => apptId && n.appointmentId === apptId && (n.type === "doctor_action" || n.collectionName === "notifications")
    );

    if (existingEntry) {
      if ((log.read === true || log.is_read === true) && !existingEntry.is_read) {
        existingEntry.is_read = true;
      }
      return;
    }

    if (!allNotificationsMap.has(mapKey)) {
      allNotificationsMap.set(mapKey, {
        id: log.id,
        collectionName: "activityLog",
        appointmentId: apptId,
        type: "doctor_action",
        sender_type: log.sender_type || "doctor",
        title: `Doctor Action: Appointment ${act}`,
        message: log.message || `Appointment was ${log.action} by Dr. ${log.doctorName || "Doctor"} for ${log.patientName || "Patient"}`,
        href: `/admin/notifications/action-detail?id=${log.id}`,
        is_read: log.read === true || log.is_read === true,
        timestamp: log.timestamp,
        rawTime,
      });
    }
  });

  // C. Add records from `internshipApplications` collection (only if not already mapped)
  internshipAppsDocs.forEach((app) => {
    const rawTime = app.createdAt?.seconds ? app.createdAt.seconds * 1000 : Date.now();
    const mapKey = `internship-${app.id}`;
    
    const existingInternship = Array.from(allNotificationsMap.values()).find(
      (n) => n.isInternship && (
        n.applicationId === app.id ||
        (app.applicantName && n.message?.toLowerCase().includes(app.applicantName.toLowerCase())) ||
        Math.abs(n.rawTime - rawTime) < 180000
      )
    );

    if (existingInternship) {
      if ((app.read === true || app.is_read === true) && !existingInternship.is_read) {
        existingInternship.is_read = true;
      }
      return;
    }

    if (!allNotificationsMap.has(mapKey)) {
      allNotificationsMap.set(mapKey, {
        id: app.id,
        collectionName: "internshipApplications",
        applicationId: app.id,
        type: "internship_application",
        sender_type: "candidate",
        isInternship: true,
        title: `New Internship Application: ${app.internshipTitle || "Internship Program"}`,
        message: `${app.applicantName || "Candidate"} (${app.instituteName || "University"}) submitted an application for ${app.internshipTitle || "Internship Program"}`,
        href: `/admin/internships/applications?id=${app.id}`,
        is_read: app.read === true || app.is_read === true,
        timestamp: app.createdAt,
        rawTime,
      });
    }
  });

  // D. Add records from `appointments` collection (if not already mapped)
  appointmentsDocs.forEach((appt) => {
    const rawTime = appt.createdAt?.seconds ? appt.createdAt.seconds * 1000 : Date.now();
    const mapKey = `appt-${appt.id}`;
    if (!allNotificationsMap.has(mapKey)) {
      allNotificationsMap.set(mapKey, {
        id: appt.id,
        collectionName: "appointments",
        appointmentId: appt.id,
        type: "appointment",
        sender_type: appt.sender_type || "patient",
        title: `New Appointment Request: ${appt.name || "Patient"}`,
        message: `Requested ${appt.service || "Eye Treatment"} with ${appt.doctor || "Doctor"} on ${appt.date || "N/A"} (${appt.time || "N/A"})`,
        href: "/admin/appointments",
        is_read: appt.read === true || appt.is_read === true,
        timestamp: appt.createdAt,
        rawTime,
      });
    }
  });

  // E. Add records from `messages` collection
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

      const href = isDoctorMsg
        ? (msg.doctorId ? `/admin/messages?tab=doctor_chats&doctorId=${msg.doctorId}` : "/admin/messages?tab=doctor_chats")
        : "/admin/messages?tab=patient_inquiries";

      allNotificationsMap.set(mapKey, {
        id: msg.id,
        collectionName: "messages",
        appointmentId: "",
        type: isDoctorMsg ? "doctor_message" : "message",
        sender_type: msg.sender_type || (isDoctorMsg ? "doctor" : "patient"),
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

  const fullStream = Array.from(allNotificationsMap.values()).filter(
    (item) => item.sender_type !== "admin"
  );
  fullStream.sort((a, b) => b.rawTime - a.rawTime);

  // Filter based on 4 tabs: "All", "Appointments", "Internships", "Messages"
  const filteredNotifications = fullStream.filter((item) => {
    if (activeTab === "all") return true;
    const type = (item.type || "").toLowerCase();

    if (activeTab === "appointments") {
      return !item.isInternship && (type.includes("appointment") || type.includes("doctor_action"));
    }
    if (activeTab === "internships") {
      return item.isInternship || type.includes("internship");
    }
    if (activeTab === "messages") {
      return !item.isInternship && (type.includes("message") || type.includes("inquiry"));
    }
    return true;
  });

  const unreadCount = fullStream.filter((n) => !n.is_read).length;

  // Mark single notification as read in Firestore across all matching collections
  const handleMarkAsRead = async (item) => {
    if (!item) return;
    try {
      await updateDoc(doc(db, item.collectionName, item.id), {
        is_read: true,
        read: true,
      });

      const apptId = item.appointmentId || (item.collectionName === "appointments" ? item.id : "");
      if (apptId) {
        const syncPromises = [];
        notificationsDocs
          .filter((n) => n.appointmentId === apptId && (n.is_read !== true && n.read !== true))
          .forEach((n) => syncPromises.push(updateDoc(doc(db, "notifications", n.id), { is_read: true, read: true }).catch(() => {})));

        activityLogsDocs
          .filter((l) => l.appointmentId === apptId && (l.read !== true && l.is_read !== true))
          .forEach((l) => syncPromises.push(updateDoc(doc(db, "activityLog", l.id), { is_read: true, read: true }).catch(() => {})));

        appointmentsDocs
          .filter((a) => a.id === apptId && (a.read !== true && a.is_read !== true))
          .forEach((a) => syncPromises.push(updateDoc(doc(db, "appointments", a.id), { read: true, is_read: true }).catch(() => {})));

        await Promise.all(syncPromises);
      }
    } catch (err) {
      console.warn("Failed to mark read:", err);
    }
  };

  // Mark all notifications as read across all collections
  const handleMarkAllRead = async () => {
    try {
      const promises = [];

      notificationsDocs.forEach((n) => {
        if (n.is_read !== true && n.read !== true) {
          promises.push(updateDoc(doc(db, "notifications", n.id), { is_read: true, read: true }));
        }
      });

      activityLogsDocs.forEach((l) => {
        if (l.read !== true && l.is_read !== true) {
          promises.push(updateDoc(doc(db, "activityLog", l.id), { is_read: true, read: true }));
        }
      });

      internshipAppsDocs.forEach((i) => {
        if (i.read !== true && i.is_read !== true) {
          promises.push(updateDoc(doc(db, "internshipApplications", i.id), { read: true, is_read: true }));
        }
      });

      appointmentsDocs.forEach((a) => {
        if (a.read !== true && a.is_read !== true) {
          promises.push(updateDoc(doc(db, "appointments", a.id), { read: true, is_read: true }));
        }
      });

      messagesDocs.forEach((m) => {
        if (m.read !== true && m.is_read !== true) {
          promises.push(updateDoc(doc(db, "messages", m.id), { read: true, is_read: true }));
        }
      });

      await Promise.all(promises);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2.5 rounded-xl bg-white border border-[var(--line)] text-[#2B1F1A] hover:bg-[var(--fog)] transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
                Hospital Management Audit
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white bg-rose-500 px-2.5 py-0.5 rounded-full animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
              Admin Notifications Center
            </h1>
            <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
              Complete history of all appointments, internships, doctor actions, and messages ({fullStream.length} total recorded).
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris-dark)] transition-all cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-[#5EEAD4]" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* 4 Filter Tabs (All, Appointments, Internships, Messages) */}
      <div className="bg-white p-3 rounded-2xl border border-[var(--line)] shadow-xs flex items-center gap-2 max-w-xl overflow-x-auto">
        {[
          { id: "all", label: `All (${fullStream.length})` },
          {
            id: "appointments",
            label: `Appointments (${fullStream.filter((n) => !n.isInternship && ((n.type || "").includes("appointment") || (n.type || "").includes("doctor_action"))).length})`,
          },
          {
            id: "internships",
            label: `Internships (${fullStream.filter((n) => n.isInternship || (n.type || "").includes("internship")).length})`,
          },
          {
            id: "messages",
            label: `Messages (${fullStream.filter((n) => !n.isInternship && (n.type || "").includes("message")).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--ink)] text-white shadow-xs"
                : "bg-[var(--fog)] text-[var(--slate)] hover:bg-[var(--fog)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Notifications Feed List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)]">
          <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Saved Notifications Stream...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-[#2B1F1A]">No Notifications Found</h3>
          <p className="text-xs font-semibold text-[var(--slate)] max-w-sm mx-auto">
            No saved notifications currently match the selected filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-[#2B1F1A] uppercase tracking-wider">
              Complete History Stream ({filteredNotifications.length})
            </h2>
            <span className="text-xs font-bold text-[var(--iris)] bg-[var(--fog)] px-3 py-1 rounded-full border border-[var(--line)]">
              Saved From Start
            </span>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const isInternship = item.isInternship || (item.type || "").includes("internship");
              const isAppt = !isInternship && ((item.type || "").includes("appointment") || (item.type || "").includes("doctor_action"));
              const isDoctorMsg = !isInternship && (item.isDoctorMsg || (item.type || "").includes("doctor"));
              const isUnread = !item.is_read;

              return (
                <motion.div
                  key={`${item.collectionName}-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={async () => {
                    await handleMarkAsRead(item);
                    router.push(item.href);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative group cursor-pointer hover:shadow-md ${
                    isUnread
                      ? "bg-purple-50/60 border-purple-200 shadow-xs"
                      : "bg-[var(--fog)] border-[var(--line)] opacity-90"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Icon Pill */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 shadow-xs ${
                        isInternship
                          ? "bg-purple-700"
                          : isAppt
                          ? "bg-sky-600"
                          : isDoctorMsg
                          ? "bg-emerald-600"
                          : "bg-amber-600"
                      }`}
                    >
                      {isInternship ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : isAppt ? (
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
                            isInternship
                              ? "bg-purple-100 text-purple-950 border border-purple-200"
                              : isAppt
                              ? "bg-sky-100 text-sky-800"
                              : isDoctorMsg
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isInternship
                            ? "Internship Application"
                            : isAppt
                            ? "Appointment / Action"
                            : isDoctorMsg
                            ? "Doctor Inquiry"
                            : "Patient Message Inquiry"}
                        </span>

                        <h4 className="text-sm font-extrabold text-[#2B1F1A] truncate">
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item);
                        router.push(item.href);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[var(--ink)] text-white hover:bg-[var(--iris-dark)] text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

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
