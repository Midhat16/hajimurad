"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Inbox
} from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorActivityClient() {
  const searchParams = useSearchParams();
  const doctorId = searchParams?.get("id");

  const [doctor, setDoctor] = useState(null);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [rawLogs, setRawLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Doctor Profile
  useEffect(() => {
    async function fetchDoctor() {
      if (!doctorId) return;
      try {
        const snap = await getDoc(doc(db, "doctors", doctorId));
        if (snap.exists()) {
          setDoctor({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.warn("Failed to fetch doctor details:", err);
      }
    }
    fetchDoctor();
  }, [doctorId]);

  // Subscribe to appointments & activityLog
  useEffect(() => {
    if (!doctorId) return;

    // 1. Subscribe to appointments
    const unsubAppts = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAppointmentsList(list);
      },
      (err) => console.warn("Appts snapshot warning:", err)
    );

    // 2. Subscribe to activityLog
    const unsubLogs = onSnapshot(
      collection(db, "activityLog"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRawLogs(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Logs snapshot warning:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubAppts();
      unsubLogs();
    };
  }, [doctorId]);

  const doctorNameClean = (doctor?.name || "").toLowerCase().trim();

  // Filter appointments for this doctor
  const doctorAppts = appointmentsList.filter((item) => {
    if (item.doctorId && item.doctorId === doctorId) return true;
    if (item.doctor && doctorNameClean) {
      const itemDoctorClean = item.doctor.toLowerCase().trim();
      return (
        itemDoctorClean.includes(doctorNameClean) ||
        doctorNameClean.includes(itemDoctorClean)
      );
    }
    return false;
  });

  // Filter activityLog for this doctor
  const doctorLogs = rawLogs.filter((item) => {
    if (item.doctorId && item.doctorId === doctorId) return true;
    if (item.doctorName && doctorNameClean) {
      const logDoctorClean = item.doctorName.toLowerCase().trim();
      return (
        logDoctorClean.includes(doctorNameClean) ||
        doctorNameClean.includes(logDoctorClean)
      );
    }
    return false;
  });

  // Combine both sources into unified timeline items
  const combinedItems = [];

  // Add doctor logs (accept, reject, reschedule actions)
  doctorLogs.forEach((log) => {
    combinedItems.push({
      id: `log-${log.id}`,
      type: "action",
      action: log.action || "updated",
      doctorName: log.doctorName || doctor?.name || "Doctor",
      patientName: log.patientName || "Patient",
      service: log.service || "",
      details: log.details || "",
      timestamp: log.timestamp,
      rawTime: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : Date.now(),
    });
  });

  // Add appointments (received requests)
  doctorAppts.forEach((appt) => {
    combinedItems.push({
      id: `appt-${appt.id}`,
      type: "received",
      action: "received",
      status: appt.status || "pending",
      doctorName: appt.doctor || doctor?.name || "Doctor",
      patientName: appt.name || "Patient",
      service: appt.service || "",
      details: `Requested appointment slot on ${appt.date || "N/A"} (${appt.time || "N/A"})`,
      phone: appt.phone || "",
      email: appt.email || "",
      timestamp: appt.createdAt,
      rawTime: appt.createdAt?.seconds ? appt.createdAt.seconds * 1000 : Date.now(),
    });
  });

  // Sort by rawTime descending (newest first)
  combinedItems.sort((a, b) => b.rawTime - a.rawTime);

  // Metrics
  const totalReceived = doctorAppts.length;
  const acceptedCount = doctorLogs.filter(
    (l) => (l.action || "").toLowerCase() === "accepted"
  ).length;
  const rejectedCount = doctorLogs.filter(
    (l) => (l.action || "").toLowerCase() === "rejected"
  ).length;
  const rescheduledCount = doctorLogs.filter(
    (l) => (l.action || "").toLowerCase() === "rescheduled"
  ).length;

  const formatTimestamp = (ts) => {
    if (!ts) return "Recently";
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    if (typeof ts === "number") {
      return new Date(ts).toLocaleString();
    }
    return String(ts);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/doctors"
            className="p-2.5 rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--fog)] transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--iris)]">
              Doctor Activity & Audit Log
            </span>
            <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight">
              Activity History — {doctor?.name || "Doctor"}
            </h1>
            <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
              {doctor?.specialty || doctor?.role || "Ophthalmic Surgeon"} • PMDC: {doctor?.pmdcNo || "Verified"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-[var(--slate)] uppercase tracking-wider">
              Received Appts
            </p>
            <p className="text-xl sm:text-2xl font-black text-[var(--ink)] mt-1">{totalReceived}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-[var(--slate)] uppercase tracking-wider">
              Accepted
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{acceptedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-[var(--slate)] uppercase tracking-wider">
              Rejected
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{rejectedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-[var(--slate)] uppercase tracking-wider">
              Rescheduled
            </p>
            <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{rescheduledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Timeline Stream */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)]">
          <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[var(--ink)]">Loading Activity Audit Trail...</p>
        </div>
      ) : combinedItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] space-y-3">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-[var(--ink)]">No Activity Recorded Yet</h3>
          <p className="text-xs font-semibold text-[var(--slate)] max-w-sm mx-auto">
            This doctor has not received any appointments or logged actions yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-[var(--ink)] uppercase tracking-wider">
              Complete Activity Audit Stream ({combinedItems.length})
            </h2>
            <span className="text-xs font-bold text-[var(--iris)] bg-[var(--fog)] px-3 py-1 rounded-full border border-[var(--line)]">
              Real-Time Feed
            </span>
          </div>

          <div className="space-y-4">
            {combinedItems.map((item) => {
              const act = (item.action || "").toLowerCase();
              const isAccepted = act === "accepted" || act === "confirmed";
              const isRejected = act === "rejected" || act === "cancelled";
              const isRescheduled = act === "rescheduled";
              const isReceived = item.type === "received";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isAccepted
                      ? "bg-emerald-50/50 border-emerald-200"
                      : isRejected
                      ? "bg-rose-50/50 border-rose-200"
                      : isRescheduled
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-[var(--fog)] border-[var(--line)]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Action Icon Pill */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 mt-0.5 shadow-xs ${
                        isAccepted
                          ? "bg-emerald-600"
                          : isRejected
                          ? "bg-rose-600"
                          : isRescheduled
                          ? "bg-blue-600"
                          : "bg-[var(--ink)]"
                      }`}
                    >
                      {isAccepted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isRejected ? (
                        <XCircle className="w-5 h-5" />
                      ) : isRescheduled ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <Inbox className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isAccepted
                              ? "bg-emerald-100 text-emerald-800"
                              : isRejected
                              ? "bg-rose-100 text-rose-800"
                              : isRescheduled
                              ? "bg-blue-100 text-blue-800"
                              : "bg-[var(--ink)]/10 text-[var(--ink)]"
                          }`}
                        >
                          {isReceived
                            ? `Incoming Appointment (${item.status})`
                            : `Appointment ${act.toUpperCase()}`}
                        </span>

                        <span className="text-xs font-extrabold text-[var(--ink)]">
                          Patient: <strong className="text-[var(--iris)]">{item.patientName}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-bold leading-relaxed">
                        {isReceived ? (
                          <>
                            Patient <strong>{item.patientName}</strong> booked an appointment for{" "}
                            <span className="text-[var(--ink)] font-extrabold">{item.service}</span>.
                          </>
                        ) : (
                          <>
                            Appointment for <strong>{item.patientName}</strong> was{" "}
                            <span className="font-black uppercase">{act}</span> by{" "}
                            <strong>{item.doctorName}</strong>.
                          </>
                        )}
                      </p>

                      {item.details && (
                        <p className="text-xs text-slate-500 font-semibold bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-block">
                          Details: {item.details}
                        </p>
                      )}

                      {item.service && (
                        <p className="text-[11px] font-semibold text-slate-500">
                          Service: {item.service}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold self-end sm:self-center flex-shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTimestamp(item.timestamp)}</span>
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
