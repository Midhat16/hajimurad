"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDoctorAuth } from "@/context/DoctorAuthContext";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import DoctorNotificationBell from "@/components/doctor/DoctorNotificationBell";
import { getWhatsAppAppointmentUrl } from "@/lib/whatsappHelper";
import { notifyOnDoctorAction } from "@/lib/notificationService";
import {
  Stethoscope,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Bell,
  MessageSquare,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorDashboard() {
  const { doctorProfile, doctorId, logoutDoctor } = useDoctorAuth();

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Notifications Modal state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");
  const [doctorActivityLogs, setDoctorActivityLogs] = useState([]);

  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    appt: null,
    newDate: "",
    newTime: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [unreadAdminMsgCount, setUnreadAdminMsgCount] = useState(0);

  // Real-time subscribe to appointments & activity logs
  useEffect(() => {
    if (!doctorProfile?.name && !doctorId) return;
    const doctorNameClean = (doctorProfile?.name || "").toLowerCase().trim();

    try {
      // 1. Subscribe to appointments
      const apptsRef = collection(db, "appointments");
      const unsubAppts = onSnapshot(
        apptsRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

          const assigned = list.filter((item) => {
            if (item.doctorId && doctorId && item.doctorId === doctorId) return true;
            if (item.doctor && doctorNameClean) {
              const itemDoctorClean = item.doctor.toLowerCase().trim();
              return (
                itemDoctorClean.includes(doctorNameClean) ||
                doctorNameClean.includes(itemDoctorClean)
              );
            }
            return false;
          });

          setAppointments(assigned);
          setLoadingAppts(false);
        },
        (err) => {
          console.warn("Appointments snapshot warning:", err);
          setLoadingAppts(false);
        }
      );

      // 2. Subscribe to activityLog for doctor actions history
      const logsRef = collection(db, "activityLog");
      const unsubLogs = onSnapshot(
        logsRef,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

          const filtered = list.filter((item) => {
            if (item.doctorId && doctorId && item.doctorId === doctorId) return true;
            if (item.doctorName && doctorNameClean) {
              const logDoctorClean = item.doctorName.toLowerCase().trim();
              return (
                logDoctorClean.includes(doctorNameClean) ||
                doctorNameClean.includes(logDoctorClean)
              );
            }
            return false;
          });

          setDoctorActivityLogs(filtered);
        },
        (err) => {
          console.warn("Doctor activityLog listener warning:", err);
        }
      );

      // 3. Subscribe to doctor_messages for unread admin messages
      const msgsRef = collection(db, "doctor_messages");
      const unsubDocMsgs = onSnapshot(
        msgsRef,
        (snapshot) => {
          const unreadMsgs = snapshot.docs.filter((d) => {
            const data = d.data();
            const isForThisDoc =
              (data.doctorId && doctorId && data.doctorId === doctorId) ||
              (data.doctorName && doctorNameClean && data.doctorName.toLowerCase().includes(doctorNameClean));

            return (
              isForThisDoc &&
              data.sender_type === "admin" &&
              data.is_read !== true &&
              data.read !== true
            );
          });
          setUnreadAdminMsgCount(unreadMsgs.length);
        },
        (err) => {
          console.warn("Doctor messages listener warning:", err);
        }
      );

      return () => {
        unsubAppts();
        unsubLogs();
        unsubDocMsgs();
      };
    } catch (err) {
      console.warn("Error setting up listeners:", err);
      setLoadingAppts(false);
    }
  }, [doctorProfile, doctorId]);

  // Log doctor activity to activityLog collection
  const logActivity = async (action, appt, details = "") => {
    try {
      const docName = doctorProfile?.name || "Doctor";
      const patName = appt.name || "Patient";
      const message = `This appointment was ${action} by Dr. ${docName} for patient ${patName}`;

      await addDoc(collection(db, "activityLog"), {
        doctorId: doctorId || "",
        doctorName: docName,
        action: action, // "accepted" | "rejected" | "rescheduled"
        appointmentId: appt.id,
        patientName: patName,
        service: appt.service || "",
        details: details,
        message: message,
        read: false,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to write to activityLog:", err);
    }
  };

  // Action: Accept Appointment
  const handleAccept = async (appt) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });
      await logActivity("accepted", appt, "Accepted appointment booking");
      await notifyOnDoctorAction("accepted", appt, doctorProfile?.name || "Doctor");

      // Trigger automatic WhatsApp open for patient notification
      const waUrl = getWhatsAppAppointmentUrl("confirmed", appt);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.error("Error accepting appointment:", err);
      alert("Failed to confirm appointment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Reject Appointment
  const handleReject = async (appt) => {
    if (!confirm(`Are you sure you want to reject appointment for ${appt.name}?`)) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
      await logActivity("rejected", appt, "Rejected appointment booking");
      await notifyOnDoctorAction("rejected", appt, doctorProfile?.name || "Doctor");

      // Trigger automatic WhatsApp open for patient notification
      const waUrl = getWhatsAppAppointmentUrl("cancelled", appt);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.error("Error rejecting appointment:", err);
      alert("Failed to reject appointment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Submit Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    const { appt, newDate, newTime } = rescheduleModal;
    if (!newDate || !newTime) {
      alert("Please select both a new date and time slot.");
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        date: newDate,
        time: newTime,
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });
      await logActivity(
        "rescheduled",
        appt,
        `Rescheduled to ${newDate} at ${newTime}`
      );
      await notifyOnDoctorAction(
        "rescheduled",
        appt,
        doctorProfile?.name || "Doctor",
        newDate,
        newTime
      );

      // Trigger automatic WhatsApp open for patient notification
      const waUrl = getWhatsAppAppointmentUrl("rescheduled", appt, newDate, newTime);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }

      setRescheduleModal({ open: false, appt: null, newDate: "", newTime: "" });
    } catch (err) {
      console.error("Error rescheduling appointment:", err);
      alert("Failed to reschedule appointment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute pending count for badge
  const pendingCount = appointments.filter((a) => (a.status || "pending") === "pending").length;

  // Combine all notifications for this doctor (from start to now)
  const doctorNotifications = [];

  appointments.forEach((appt) => {
    doctorNotifications.push({
      id: `appt-${appt.id}`,
      type: "appointment",
      appt: appt,
      title: `Appointment Request: ${appt.name || "Patient"}`,
      message: `${appt.service || "Eye Treatment"} on ${appt.date || "N/A"} (${appt.time || "N/A"})`,
      status: (appt.status || "pending").toLowerCase(),
      patientName: appt.name || "Patient",
      timestamp: appt.createdAt,
      rawTime: appt.createdAt?.seconds ? appt.createdAt.seconds * 1000 : Date.now(),
    });
  });

  doctorActivityLogs.forEach((log) => {
    const act = (log.action || "").toLowerCase();
    doctorNotifications.push({
      id: `log-${log.id}`,
      type: "action",
      action: act,
      title: `Action: Appointment ${act.toUpperCase()}`,
      message: log.message || `You ${act} appointment for ${log.patientName || "Patient"}`,
      status: act === "accepted" ? "confirmed" : act === "rejected" ? "cancelled" : "confirmed",
      patientName: log.patientName || "Patient",
      timestamp: log.timestamp,
      rawTime: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : Date.now(),
    });
  });

  // Sort by rawTime descending (newest first)
  doctorNotifications.sort((a, b) => b.rawTime - a.rawTime);

  // Filtered notification list for modal
  const filteredDoctorNotifs = doctorNotifications.filter((n) => {
    if (notifFilter === "all") return true;
    return n.status === notifFilter;
  });

  // Filtered appointments list for main page
  const filteredAppointments = appointments.filter((appt) => {
    const statusMatch =
      statusFilter === "all" ||
      (appt.status || "pending").toLowerCase() === statusFilter.toLowerCase();
    const queryClean = searchTerm.toLowerCase();
    const textMatch =
      !searchTerm ||
      (appt.name && appt.name.toLowerCase().includes(queryClean)) ||
      (appt.email && appt.email.toLowerCase().includes(queryClean)) ||
      (appt.phone && appt.phone.includes(queryClean)) ||
      (appt.service && appt.service.toLowerCase().includes(queryClean));
    return statusMatch && textMatch;
  });

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col font-sans">
      {/* Top Doctor Navigation Bar */}
      <header className="bg-[#0B3D5C] text-white sticky top-0 z-30 shadow-md min-w-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between min-w-0 gap-2">
          {/* Left: Doctor Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-bold text-[#5EEAD4] text-xs sm:text-sm shadow-inner flex-shrink-0">
              {doctorProfile?.initials || doctorProfile?.name?.charAt(0) || "D"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-white truncate">
                  {doctorProfile?.name || "Dr. Specialist"}
                </h1>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-[#5EEAD4] px-1.5 py-0.5 rounded-md border border-emerald-500/30 flex-shrink-0">
                  Doctor Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate">
                {doctorProfile?.specialty || doctorProfile?.role || "Ophthalmic Surgeon"}
              </p>
            </div>
          </div>

          {/* Right: Direct Chat, Notifications & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Direct Chat with Admin Link */}
            <Link
              href="/doctor/messages"
              className="p-2 rounded-xl bg-[#3E8E6E] hover:bg-[#32755a] text-white transition-colors flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer relative"
              title={unreadAdminMsgCount > 0 ? `${unreadAdminMsgCount} new messages from Admin` : "Direct Chat with Admin"}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Admin Chat</span>
              {unreadAdminMsgCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-[#0B3D5C] animate-pulse shadow-md">
                  {unreadAdminMsgCount}
                </span>
              )}
            </Link>

            {/* Dedicated Doctor Notifications Bell */}
            <DoctorNotificationBell />

            {/* Logout */}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#0B3D5C] via-[#124B6F] to-[#3E8E6E] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Assigned Patient Desk
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
              Welcome back, {doctorProfile?.name || "Doctor"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium leading-relaxed">
              Review and manage patient appointments assigned to your clinic schedule. Confirm, reschedule, or decline requests in real-time.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#D5E5DD] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#3F4B4A] uppercase tracking-wider">Total Assigned</p>
              <p className="text-2xl font-black text-[#0B3D5C] mt-1">{appointments.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#E8F0EC] text-[#0B3D5C] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D5E5DD] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#3F4B4A] uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D5E5DD] shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#3F4B4A] uppercase tracking-wider">Confirmed</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {appointments.filter((a) => a.status === "confirmed").length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D5E5DD] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient, phone, service..."
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-[#0B3D5C] focus:outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["all", "pending", "confirmed", "cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#0B3D5C] text-white shadow-xs"
                    : "bg-[#F4F7F5] text-[#3F4B4A] hover:bg-[#E8F0EC]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {loadingAppts ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D5E5DD]">
            <div className="w-8 h-8 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-[#0B3D5C]">Loading Assigned Appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#D5E5DD] space-y-3">
            <div className="w-14 h-14 bg-[#E8F0EC] text-[#3E8E6E] rounded-2xl flex items-center justify-center mx-auto">
              <CalendarDays className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B3D5C]">No Appointments Found</h3>
            <p className="text-xs font-medium text-[#3F4B4A] max-w-sm mx-auto">
              No patient appointment requests currently match your active filters or doctor assignment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAppointments.map((appt) => {
              const status = (appt.status || "pending").toLowerCase();
              return (
                <motion.div
                  key={appt.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border border-[#D5E5DD] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Header: Patient & Status Badge */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#E8F0EC] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E8F0EC] text-[#0B3D5C] font-extrabold flex items-center justify-center text-sm shadow-inner">
                        {appt.name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#0B3D5C] tracking-tight">
                          {appt.name || "Patient"}
                        </h3>
                        <span className="text-xs font-semibold text-[#3E8E6E]">
                          {appt.service || "Eye Treatment"}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                        status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : status === "cancelled"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Patient Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[#3F4B4A]">
                    <div className="flex items-center gap-2 bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E8F0EC]">
                      <Phone className="w-4 h-4 text-[#3E8E6E] flex-shrink-0" />
                      <span className="truncate">{appt.phone || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E8F0EC]">
                      <Mail className="w-4 h-4 text-[#3E8E6E] flex-shrink-0" />
                      <span className="truncate">{appt.email || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E8F0EC]">
                      <Calendar className="w-4 h-4 text-[#0B3D5C] flex-shrink-0" />
                      <span className="truncate">{appt.date || "Date Unset"}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F4F7F5] p-2.5 rounded-xl border border-[#E8F0EC]">
                      <Clock className="w-4 h-4 text-[#0B3D5C] flex-shrink-0" />
                      <span className="truncate">{appt.time || "Time Unset"}</span>
                    </div>
                  </div>

                  {/* Doctor Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-[#E8F0EC]">
                    {/* WhatsApp Action */}
                    {appt.phone && (
                      <a
                        href={getWhatsAppAppointmentUrl(status, appt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center justify-center"
                        title="Notify Patient via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      </a>
                    )}

                    {/* Accept Action */}
                    <button
                      onClick={() => handleAccept(appt)}
                      disabled={isProcessing || status === "confirmed"}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      {status === "confirmed" ? "Confirmed" : "Accept"}
                    </button>

                    {/* Reschedule Action */}
                    <button
                      onClick={() =>
                        setRescheduleModal({
                          open: true,
                          appt,
                          newDate: appt.date || "",
                          newTime: appt.time || "",
                        })
                      }
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#0B3D5C] hover:bg-[#082D45] text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reschedule
                    </button>

                    {/* Reject Action */}
                    <button
                      onClick={() => handleReject(appt)}
                      disabled={isProcessing || status === "cancelled"}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Reject Appointment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {rescheduleModal.open && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#D5E5DD] shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center justify-between border-b border-[#E8F0EC] pb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#3E8E6E]" />
                  <h3 className="text-lg font-extrabold text-[#0B3D5C]">
                    Reschedule Appointment
                  </h3>
                </div>
                <button
                  onClick={() =>
                    setRescheduleModal({ open: false, appt: null, newDate: "", newTime: "" })
                  }
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-[#3F4B4A]">
                Rescheduling appointment for{" "}
                <strong className="text-[#0B3D5C]">{rescheduleModal.appt?.name}</strong> (
                {rescheduleModal.appt?.service}).
              </p>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleModal.newDate}
                    onChange={(e) =>
                      setRescheduleModal((prev) => ({ ...prev, newDate: e.target.value }))
                    }
                    required
                    className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                    New Time Slot
                  </label>
                  <input
                    type="time"
                    value={rescheduleModal.newTime}
                    onChange={(e) =>
                      setRescheduleModal((prev) => ({ ...prev, newTime: e.target.value }))
                    }
                    required
                    className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRescheduleModal({ open: false, appt: null, newDate: "", newTime: "" })
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? "Updating..." : "Save & Confirm"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
