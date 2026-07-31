"use client";

// Doctor Notifications Center Stream - Complete History (Past & Present)
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDoctorAuth } from "@/context/DoctorAuthContext";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import DoctorNotificationBell from "@/components/doctor/DoctorNotificationBell";
import { notifyOnDoctorAction } from "@/lib/notificationService";
import {
  Bell,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  CheckCheck,
  LogOut
} from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorNotificationsPage() {
  const { doctorProfile, doctorId, logoutDoctor, loading: authLoading } = useDoctorAuth();
  const router = useRouter();

  const [notificationsDocs, setNotificationsDocs] = useState([]);
  const [appointmentsDocs, setAppointmentsDocs] = useState([]);
  const [activityLogsDocs, setActivityLogsDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "pending" | "confirmed" | "cancelled"

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    appt: null,
    newDate: "",
    newTime: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!doctorProfile?.name && !doctorId) return;
    const doctorNameClean = (doctorProfile?.name || "").toLowerCase().trim();

    try {
      // 1. Subscribe to unified notifications collection for this doctor
      const unsubNotifs = onSnapshot(
        collection(db, "notifications"),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            collectionName: "notifications",
            ...d.data(),
          }));

          const filtered = list.filter((item) => {
            if ((item.recipient_type || "doctor") !== "doctor") return false;
            if (item.recipient_id && doctorId && item.recipient_id === doctorId) return true;
            if (item.doctorName && doctorNameClean) {
              const itemDocClean = item.doctorName.toLowerCase().trim();
              return itemDocClean.includes(doctorNameClean) || doctorNameClean.includes(itemDocClean);
            }
            return false;
          });

          setNotificationsDocs(filtered);
        },
        (err) => console.warn("Notifs error:", err)
      );

      // 2. Subscribe to appointments assigned to this doctor (complete history)
      const unsubAppts = onSnapshot(
        collection(db, "appointments"),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            collectionName: "appointments",
            ...d.data(),
          }));

          const assigned = list.filter((item) => {
            if (item.doctorId && doctorId && item.doctorId === doctorId) return true;
            if (item.doctor && doctorNameClean) {
              const itemDocClean = item.doctor.toLowerCase().trim();
              return itemDocClean.includes(doctorNameClean) || doctorNameClean.includes(itemDocClean);
            }
            return false;
          });

          setAppointmentsDocs(assigned);
        },
        (err) => console.warn("Appts error:", err)
      );

      // 3. Subscribe to activityLogs for this doctor
      const unsubLogs = onSnapshot(
        collection(db, "activityLog"),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            collectionName: "activityLog",
            ...d.data(),
          }));

          const filtered = list.filter((item) => {
            if (item.doctorId && doctorId && item.doctorId === doctorId) return true;
            if (item.doctorName && doctorNameClean) {
              const itemDocClean = item.doctorName.toLowerCase().trim();
              return itemDocClean.includes(doctorNameClean) || doctorNameClean.includes(itemDocClean);
            }
            return false;
          });

          setActivityLogsDocs(filtered);
          setLoading(false);
        },
        (err) => {
          console.warn("Logs error:", err);
          setLoading(false);
        }
      );

      return () => {
        unsubNotifs();
        unsubAppts();
        unsubLogs();
      };
    } catch (err) {
      console.warn("Error setting up subscriptions:", err);
      setLoading(false);
    }
  }, [doctorProfile, doctorId, authLoading]);

  // Combine unified complete stream for Doctor
  const doctorNotifMap = new Map();

  notificationsDocs.forEach((n) => {
    const rawTime = n.createdAt?.seconds ? n.createdAt.seconds * 1000 : Date.now();
    doctorNotifMap.set(`notif-${n.id}`, {
      id: n.id,
      collectionName: "notifications",
      type: n.type || "appointment",
      title: n.title || "Notification",
      message: n.message || "",
      status: n.message?.toLowerCase().includes("accept") ? "confirmed" : n.message?.toLowerCase().includes("reject") ? "cancelled" : "pending",
      is_read: n.is_read === true,
      timestamp: n.createdAt,
      rawTime,
    });
  });

  appointmentsDocs.forEach((appt) => {
    const rawTime = appt.createdAt?.seconds ? appt.createdAt.seconds * 1000 : Date.now();
    const st = (appt.status || "pending").toLowerCase();
    const mapKey = `appt-${appt.id}`;
    if (!doctorNotifMap.has(mapKey)) {
      doctorNotifMap.set(mapKey, {
        id: appt.id,
        collectionName: "appointments",
        type: "appointment",
        appt: appt,
        title: `Appointment Request: ${appt.name || "Patient"}`,
        message: `Requested ${appt.service || "Eye Treatment"} on ${appt.date || "N/A"} (${appt.time || "N/A"})`,
        status: st,
        patientName: appt.name || "Patient",
        is_read: appt.readByDoctor === true || appt.read === true || appt.is_read === true,
        timestamp: appt.createdAt,
        rawTime,
      });
    }
  });

  activityLogsDocs.forEach((log) => {
    const rawTime = log.timestamp?.seconds ? log.timestamp.seconds * 1000 : Date.now();
    const act = (log.action || "").toLowerCase();
    const mapKey = `log-${log.id}`;
    if (!doctorNotifMap.has(mapKey)) {
      doctorNotifMap.set(mapKey, {
        id: log.id,
        collectionName: "activityLog",
        type: "action",
        title: `Action Log: Appointment ${act.toUpperCase()}`,
        message: log.message || `You ${act} appointment for ${log.patientName || "Patient"}`,
        status: act === "accepted" ? "confirmed" : act === "rejected" ? "cancelled" : "confirmed",
        patientName: log.patientName || "Patient",
        is_read: log.readByDoctor === true || log.read === true || log.is_read === true,
        timestamp: log.timestamp,
        rawTime,
      });
    }
  });

  const fullDoctorStream = Array.from(doctorNotifMap.values());
  fullDoctorStream.sort((a, b) => b.rawTime - a.rawTime);

  const unreadCount = fullDoctorStream.filter((n) => !n.is_read).length;

  const filteredNotifs = fullDoctorStream.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

  // Mark single item read
  const handleMarkRead = async (item) => {
    if (item.is_read) return;
    try {
      await updateDoc(doc(db, item.collectionName, item.id), {
        is_read: true,
        read: true,
        readByDoctor: true,
      });
    } catch (err) {
      console.warn("Error marking read:", err);
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      const unreadItems = fullDoctorStream.filter((n) => !n.is_read);
      await Promise.all(
        unreadItems.map((n) =>
          updateDoc(doc(db, n.collectionName, n.id), {
            is_read: true,
            read: true,
            readByDoctor: true,
          })
        )
      );
    } catch (err) {
      console.warn("Error marking all read:", err);
    }
  };

  // Log activity helper
  const logActivity = async (action, appt, details = "") => {
    try {
      const docName = doctorProfile?.name || "Doctor";
      const patName = appt.name || "Patient";
      const message = `This appointment was ${action} by Dr. ${docName} for patient ${patName}`;

      await addDoc(collection(db, "activityLog"), {
        doctorId: doctorId || "",
        doctorName: docName,
        action: action,
        appointmentId: appt.id,
        patientName: patName,
        service: appt.service || "",
        details: details,
        message: message,
        read: true,
        readByDoctor: true,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Log activity error:", err);
    }
  };

  // Accept appointment
  const handleAccept = async (item) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", item.id), {
        status: "confirmed",
        readByDoctor: true,
        read: true,
        is_read: true,
        updatedAt: serverTimestamp(),
      });
      await logActivity("accepted", item.appt || { id: item.id, name: item.patientName });
      await notifyOnDoctorAction("accepted", item.appt || { id: item.id, name: item.patientName }, doctorProfile?.name || "Doctor");
    } catch (err) {
      alert("Failed to confirm appointment.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject appointment
  const handleReject = async (item) => {
    if (!confirm(`Are you sure you want to reject appointment for ${item.patientName || "Patient"}?`)) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", item.id), {
        status: "cancelled",
        readByDoctor: true,
        read: true,
        is_read: true,
        updatedAt: serverTimestamp(),
      });
      await logActivity("rejected", item.appt || { id: item.id, name: item.patientName });
      await notifyOnDoctorAction("rejected", item.appt || { id: item.id, name: item.patientName }, doctorProfile?.name || "Doctor");
    } catch (err) {
      alert("Failed to reject appointment.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reschedule submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    const { appt, newDate, newTime } = rescheduleModal;
    if (!newDate || !newTime) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        date: newDate,
        time: newTime,
        status: "confirmed",
        readByDoctor: true,
        read: true,
        is_read: true,
        updatedAt: serverTimestamp(),
      });
      await logActivity("rescheduled", appt, `Rescheduled to ${newDate} at ${newTime}`);
      await notifyOnDoctorAction("rescheduled", appt, doctorProfile?.name || "Doctor", newDate, newTime);
      setRescheduleModal({ open: false, appt: null, newDate: "", newTime: "" });
    } catch (err) {
      alert("Failed to reschedule appointment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "Recently";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    return String(ts);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0B3D5C] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-white">
                Doctor Notifications Stream
              </h1>
              <p className="text-xs text-slate-300">
                Dr. {doctorProfile?.name || "Specialist"} — Complete History ({fullDoctorStream.length} items)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DoctorNotificationBell />
            <button
              onClick={logoutDoctor}
              className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5E5DD] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#3E8E6E] bg-[#E8F0EC] px-2.5 py-0.5 rounded-md border border-[#D5E5DD]">
                Doctor Clinical Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white bg-rose-500 px-2.5 py-0.5 rounded-full animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight mt-1">
              Saved Notifications Stream
            </h2>
            <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
              All appointments and clinical updates stored from start to present ({fullDoctorStream.length} items).
            </p>
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

        {/* Filter Tabs */}
        <div className="bg-white p-2.5 rounded-2xl border border-[#D5E5DD] shadow-xs flex items-center gap-2 max-w-lg">
          {[
            { id: "all", label: `All (${fullDoctorStream.length})` },
            { id: "pending", label: "Pending" },
            { id: "confirmed", label: "Confirmed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
                activeFilter === tab.id
                  ? "bg-[#0B3D5C] text-white shadow-xs"
                  : "bg-[#F4F7F5] text-[#3F4B4A] hover:bg-[#E8F0EC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D5E5DD]">
            <div className="w-8 h-8 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-[#0B3D5C]">Loading Notifications...</p>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D5E5DD] space-y-3">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-[#0B3D5C]">No Notifications Found</h3>
            <p className="text-xs font-semibold text-[#3F4B4A]">
              There are no saved notifications matching this filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifs.map((item) => {
              const isUnread = !item.is_read;
              const isAppt = item.type === "appointment";
              const st = item.status;

              return (
                <div
                  key={`${item.collectionName}-${item.id}`}
                  onClick={() => handleMarkRead(item)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative ${
                    isUnread
                      ? "bg-rose-50/50 border-rose-200 shadow-xs"
                      : st === "confirmed"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : st === "cancelled"
                      ? "bg-rose-50/30 border-rose-200"
                      : "bg-[#F4F7F5] border-[#D5E5DD]"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 shadow-xs ${
                        st === "confirmed"
                          ? "bg-emerald-600"
                          : st === "cancelled"
                          ? "bg-rose-600"
                          : "bg-amber-500 animate-pulse"
                      }`}
                    >
                      {st === "confirmed" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : st === "cancelled" ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200">
                          {st}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#0B3D5C]">
                          {item.title}
                        </h4>
                      </div>

                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(item.timestamp)}</span>
                    </div>

                    {/* Quick action buttons if pending appointment */}
                    {isAppt && st === "pending" && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAccept(item)}
                          disabled={isProcessing}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            setRescheduleModal({
                              open: true,
                              appt: item.appt || { id: item.id, name: item.patientName },
                              newDate: item.appt?.date || "",
                              newTime: item.appt?.time || "",
                            })
                          }
                          disabled={isProcessing}
                          className="bg-[#0B3D5C] hover:bg-[#082D45] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleReject(item)}
                          disabled={isProcessing}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* RED MARK INDICATOR IF UNREAD */}
                    {isUnread && (
                      <div
                        className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-md animate-pulse cursor-pointer flex-shrink-0"
                        title="Unread notification — click to mark read"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reschedule Modal */}
      {rescheduleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#D5E5DD] shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-[#0B3D5C]">
              Reschedule Appointment
            </h3>
            <p className="text-xs text-slate-600 font-semibold">
              Select a new date and time slot for {rescheduleModal.appt?.name}
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0B3D5C] block mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={rescheduleModal.newDate}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-[#3E8E6E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0B3D5C] block mb-1">New Time Slot</label>
                <input
                  type="time"
                  required
                  value={rescheduleModal.newTime}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, newTime: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-[#3E8E6E]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setRescheduleModal({ open: false, appt: null, newDate: "", newTime: "" })
                  }
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B3D5C] text-white text-xs font-bold hover:bg-[#082D44] cursor-pointer"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
