"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getWhatsAppAppointmentUrl } from "@/lib/whatsappHelper";

function ActionDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const logId = searchParams.get("id");

  const [logData, setLogData] = useState(null);
  const [apptData, setApptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reschedule Modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // 1. Fetch activityLog document and auto-mark as read
  useEffect(() => {
    if (!logId) {
      setLoading(false);
      return;
    }

    // Auto-mark activityLog doc as read in Firestore
    updateDoc(doc(db, "activityLog", logId), { read: true, is_read: true }).catch(
      (err) => console.warn("Notice: activityLog read update handled:", err)
    );

    const unsubLog = onSnapshot(
      doc(db, "activityLog", logId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setLogData({ id: snap.id, ...data });

          // Cross-mark matching notification by appointmentId if available
          if (data.appointmentId) {
            const qNotifs = query(
              collection(db, "notifications"),
              where("appointmentId", "==", data.appointmentId)
            );
            getDocs(qNotifs)
              .then((snapNotifs) => {
                snapNotifs.docs.forEach((d) => {
                  updateDoc(doc(db, "notifications", d.id), {
                    is_read: true,
                    read: true,
                  }).catch(() => {});
                });
              })
              .catch(() => {});
          }

          // Fetch associated appointment data
          if (data.appointmentId) {
            getDoc(doc(db, "appointments", data.appointmentId))
              .then((apptSnap) => {
                if (apptSnap.exists()) {
                  setApptData({ id: apptSnap.id, ...apptSnap.data() });
                }
              })
              .catch((err) => console.warn("Notice: appt getDoc handled:", err));
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Notice: activityLog subscription handled:", err);
        setLoading(false);
      }
    );

    return () => unsubLog();
  }, [logId]);

  // Handle Accept Appointment
  const handleAccept = async () => {
    if (!apptData) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", apptData.id), {
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });

      const docName = logData?.doctorName || apptData.doctor || "Admin";
      await updateDoc(doc(db, "activityLog", logId), {
        action: "accepted",
        details: "Accepted appointment",
      }).catch(() => {});

      // WhatsApp trigger
      const waUrl = getWhatsAppAppointmentUrl("confirmed", apptData);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.warn("Error accepting appointment:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject Appointment
  const handleReject = async () => {
    if (!apptData) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", apptData.id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "activityLog", logId), {
        action: "rejected",
        details: "Rejected appointment",
      }).catch(() => {});

      // WhatsApp trigger
      const waUrl = getWhatsAppAppointmentUrl("cancelled", apptData);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.warn("Error rejecting appointment:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reschedule Submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!apptData || !rescheduleDate || !rescheduleTime) return;
    setIsProcessing(true);
    try {
      const updatedAppt = {
        ...apptData,
        date: rescheduleDate,
        time: rescheduleTime,
      };

      await updateDoc(doc(db, "appointments", apptData.id), {
        date: rescheduleDate,
        time: rescheduleTime,
        status: "rescheduled",
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "activityLog", logId), {
        action: "rescheduled",
        details: `Rescheduled to ${rescheduleDate} at ${rescheduleTime}`,
      }).catch(() => {});

      setShowRescheduleModal(false);

      // WhatsApp trigger
      const waUrl = getWhatsAppAppointmentUrl("rescheduled", updatedAppt);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    } catch (err) {
      console.warn("Error rescheduling appointment:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider">
          Loading Action Details...
        </p>
      </div>
    );
  }

  if (!logData) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[#2B1F1A]">
          Activity Log Record Not Found
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested activity log record could not be loaded or has been removed.
        </p>
        <Link
          href="/admin/notifications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--ink)] text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Notifications
        </Link>
      </div>
    );
  }

  const actionUpper = (logData.action || "UPDATE").toUpperCase();
  const isAccepted = actionUpper.includes("ACCEPT") || actionUpper.includes("CONFIRM");
  const isRejected = actionUpper.includes("REJECT") || actionUpper.includes("CANCEL");
  const isRescheduled = actionUpper.includes("RESCHEDULE");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[var(--line)] text-slate-700 text-xs font-bold hover:bg-[var(--fog)] transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">
            Log Record #{logData.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Main Message Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xs transition-all relative overflow-hidden ${
          isAccepted
            ? "bg-emerald-50/60 border-emerald-200"
            : isRejected
            ? "bg-rose-50/60 border-rose-200"
            : "bg-amber-50/60 border-amber-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm ${
              isAccepted
                ? "bg-emerald-600"
                : isRejected
                ? "bg-rose-600"
                : "bg-amber-600"
            }`}
          >
            {isAccepted ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isRejected ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <RefreshCw className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                  isAccepted
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isRejected
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                Doctor Action: {actionUpper}
              </span>
            </div>

            <h1 className="text-base sm:text-lg font-black text-[#2B1F1A] leading-snug">
              This appointment of{" "}
              <span className="text-[var(--iris)] underline decoration-dotted">
                {logData.patientName || apptData?.name || "Patient"}
              </span>{" "}
              for{" "}
              <span className="font-bold">
                {logData.service || apptData?.service || "Eye Care Service"}
              </span>{" "}
              was{" "}
              <span className="font-extrabold uppercase">{actionUpper}</span> by Dr.{" "}
              <span className="font-bold">
                {logData.doctorName || apptData?.doctor || "Doctor"}
              </span>
              .
            </h1>

            {logData.message && (
              <p className="text-xs font-semibold text-slate-700 mt-2 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80">
                {logData.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Information Card */}
      {apptData ? (
        <div className="bg-white rounded-3xl border border-[var(--line)] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-extrabold text-[#2B1F1A] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--iris)]" /> Complete Appointment
              Information
            </h3>
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                apptData.status === "confirmed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : apptData.status === "cancelled"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : apptData.status === "rescheduled"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-sky-50 text-sky-700 border-sky-200"
              }`}
            >
              Current Status: {apptData.status || "pending"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--iris)]" /> Patient Name
              </span>
              <p className="text-sm font-extrabold text-[#2B1F1A]">
                {apptData.name || "N/A"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[var(--iris)]" /> Phone / Contact
              </span>
              <p className="text-sm font-extrabold text-[#2B1F1A]">
                {apptData.phone || "N/A"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--iris)]" /> Requested Date
              </span>
              <p className="text-sm font-extrabold text-[#2B1F1A]">
                {apptData.date || "N/A"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--iris)]" /> Requested Time
              </span>
              <p className="text-sm font-extrabold text-[#2B1F1A]">
                {apptData.time || "N/A"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-[var(--iris)]" /> Doctor Assigned
              </span>
              <p className="text-sm font-extrabold text-[#2B1F1A]">
                {apptData.doctor || "General Hospital"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--iris)]" /> Specialty / Service
              </span>
              <p className="text-sm font-extrabold text-[#2B1F1A]">
                {apptData.service || "Eye Care"}
              </p>
            </div>
          </div>

          {apptData.notes && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase">
                Patient Notes / Reason
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {apptData.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3 flex-wrap">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept Appointment
            </button>

            <button
              onClick={() => {
                setRescheduleDate(apptData.date || "");
                setRescheduleTime(apptData.time || "");
                setShowRescheduleModal(true);
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> Reschedule
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold hover:bg-rose-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[var(--line)] p-6 text-center">
          <p className="text-xs text-slate-500 font-semibold">
            Associated appointment record unavailable or removed.
          </p>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-base font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" /> Reschedule Appointment
            </h3>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-semibold text-[#2B1F1A] focus:outline-none focus:border-[var(--iris)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Time
                </label>
                <input
                  type="text"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  placeholder="Preferred appointment time"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-xs font-semibold text-[#2B1F1A] focus:outline-none focus:border-[var(--iris)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all shadow-xs disabled:opacity-50"
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

export default function ActionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider">
            Loading Action Detail Page...
          </p>
        </div>
      }
    >
      <ActionDetailClient />
    </Suspense>
  );
}
