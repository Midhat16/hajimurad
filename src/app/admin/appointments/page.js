"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyOnAdminAction } from "@/lib/notificationService";
import { Calendar, Clock, User, Mail, Phone, Stethoscope, CheckCircle2, XCircle, AlertCircle, Filter, X, MessageSquare } from "lucide-react";
import { getWhatsAppAppointmentUrl } from "@/lib/whatsappHelper";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'confirmed', 'cancelled'

  // Confirm modal state
  const [confirmingAppt, setConfirmingAppt] = useState(null);
  const [confirmDate, setConfirmDate] = useState("");
  const [confirmTime, setConfirmTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAppointments(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Appointments snapshot fallback:", error.message);
        // Fallback without orderBy if index is building
        const unsubFallback = onSnapshot(
          collection(db, "appointments"),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setAppointments(list);
            setLoading(false);
          },
          (err) => console.warn("Appointments fallback notice:", err.message)
        );
        return () => unsubFallback();
      }
    );

    return () => unsub();
  }, []);

  const openConfirmModal = (appt) => {
    setConfirmingAppt(appt);
    setConfirmDate(appt.date || "");
    setConfirmTime(appt.time || "");
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!confirmingAppt) return;
    setIsUpdating(true);
    try {
      const isRescheduled =
        confirmingAppt.date !== confirmDate || confirmingAppt.time !== confirmTime;

      await updateDoc(doc(db, "appointments", confirmingAppt.id), {
        status: "confirmed",
        date: confirmDate,
        time: confirmTime,
        confirmedAt: new Date().toISOString(),
      });

      // Trigger notification for Doctor
      const actionType = isRescheduled ? "rescheduled" : "accepted";
      await notifyOnAdminAction(actionType, confirmingAppt, confirmDate, confirmTime);

      // Trigger automatic WhatsApp open for patient notification
      const waUrl = getWhatsAppAppointmentUrl(isRescheduled ? "rescheduled" : "confirmed", confirmingAppt, confirmDate, confirmTime);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }

      setConfirmingAppt(null);
    } catch (err) {
      console.error("Failed to confirm appointment:", err);
      alert("Error confirming appointment.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelStatus = async (apptId) => {
    const appt = appointments.find((a) => a.id === apptId);
    if (!confirm("Are you sure you want to mark this appointment as cancelled?")) return;
    try {
      await updateDoc(doc(db, "appointments", apptId), {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      });

      // Trigger notification for Doctor
      if (appt) {
        await notifyOnAdminAction("rejected", appt);
        const waUrl = getWhatsAppAppointmentUrl("cancelled", appt);
        if (waUrl && typeof window !== "undefined") {
          window.open(waUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      alert("Error updating status.");
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5E5DD] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight">
            Patient Appointments Desk
          </h1>
          <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
            Review, adjust dates/slots, and confirm patient clinical consultation requests.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#D5E5DD] rounded-xl self-start sm:self-auto">
          {["all", "pending", "confirmed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === f
                  ? "bg-[#0B3D5C] text-white shadow-xs"
                  : "text-slate-600 hover:bg-[#E8F0EC]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0B3D5C]">Loading Appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#D5E5DD]">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0B3D5C]">No Appointments Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === "all"
              ? "No patient appointment requests have been logged yet."
              : `No appointments with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((appt) => (
            <motion.div
              key={appt.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[#D5E5DD] shadow-sm p-6 flex flex-col justify-between hover:border-[#3E8E6E] transition-all relative group"
            >
              <div>
                {/* Status Badge & Time */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                      appt.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : appt.status === "cancelled"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-sky-50 text-sky-700 border-sky-200"
                    }`}
                  >
                    {appt.status || "pending"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {appt.createdAt?.toDate
                      ? appt.createdAt.toDate().toLocaleDateString()
                      : "Recent"}
                  </span>
                </div>

                {/* Patient Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E8F0EC] text-[#0B3D5C] font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                    {appt.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B3D5C]">{appt.name}</h3>
                    <p className="text-xs text-[#3E8E6E] font-bold">{appt.service}</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <User className="w-4 h-4 text-[#0B3D5C] flex-shrink-0" />
                    <span>Doctor: {appt.doctor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{appt.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-semibold">
                    <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{appt.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#0B3D5C] font-bold bg-[#F4F7F5] p-2 rounded-xl border border-[#D5E5DD]/60">
                    <Calendar className="w-4 h-4 text-[#3E8E6E] flex-shrink-0" />
                    <span>
                      {appt.date} ({appt.time})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2">
                {appt.phone ? (
                  <a
                    href={getWhatsAppAppointmentUrl(appt.status || "pending", appt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors"
                    title="Notify patient via WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  {appt.status !== "confirmed" && (
                    <button
                      type="button"
                      onClick={() => openConfirmModal(appt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm Slot
                    </button>
                  )}

                  {appt.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleCancelStatus(appt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation & Slot Adjustment Modal */}
      <AnimatePresence>
        {confirmingAppt && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setConfirmingAppt(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-lg font-extrabold text-[#0B3D5C]">
                Confirm Appointment Slot
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Set final date & time slot for patient <strong className="text-slate-800">{confirmingAppt.name}</strong>.
              </p>

              <form onSubmit={handleConfirmSubmit} className="mt-5 space-y-4">
                {/* Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                    Final Date
                  </label>
                  <input
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    required
                    className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] rounded-xl px-4 py-2.5 text-xs text-[#0B3D5C] font-semibold focus:outline-none"
                  />
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                    Time Slot / Hours
                  </label>
                  <input
                    type="text"
                    value={confirmTime}
                    onChange={(e) => setConfirmTime(e.target.value)}
                    placeholder="e.g. Morning (10:30 AM)"
                    required
                    className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] rounded-xl px-4 py-2.5 text-xs text-[#0B3D5C] font-semibold focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmingAppt(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? "Confirming..." : "Confirm Appointment"}
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
