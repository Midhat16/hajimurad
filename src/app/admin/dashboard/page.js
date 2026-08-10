"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, MessageSquare, Users, Briefcase, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);

  const [counts, setCounts] = useState({
    pendingAppointments: 0,
    unreadMessages: 0,
    totalDoctors: 0,
    totalServices: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 1. Pending Appointments count
    const qApptsCount = query(collection(db, "appointments"), where("status", "==", "pending"));
    const unsubApptsCount = onSnapshot(
      qApptsCount,
      (snap) => {
        setCounts((prev) => ({ ...prev, pendingAppointments: snap.size }));
      },
      (err) => console.warn("ApptsCount notice:", err.message)
    );

    // 2. Recent Appointments list (limit 4)
    const unsubApptsRecent = onSnapshot(
      collection(db, "appointments"),
      (snap) => {
        const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
        setRecentAppointments(list.slice(0, 4));
      },
      (err) => console.warn("ApptsRecent notice:", err.message)
    );

    // 3. Unread Patient Messages count
    const unsubMsgsCount = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        const unreadPatients = snap.docs.filter((docSnap) => {
          const data = docSnap.data();
          const isPatient = data.sender_type !== "doctor" && data.sender_type !== "admin" && data.sender !== "doctor" && data.sender !== "admin" && data.name !== "Hospital Admin";
          return !data.read && isPatient;
        });
        setCounts((prev) => ({ ...prev, unreadMessages: unreadPatients.length }));
      },
      (err) => console.warn("MsgsCount notice:", err.message)
    );

    // 4. Recent Contact Messages list (Patient messages only, limit 3)
    const unsubMsgsRecent = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        const patientMsgs = list.filter((msg) => 
          msg.sender_type !== "doctor" && 
          msg.sender_type !== "admin" && 
          msg.sender !== "doctor" && 
          msg.sender !== "admin" && 
          msg.name !== "Hospital Admin"
        );
        patientMsgs.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
        setRecentMessages(patientMsgs.slice(0, 3));
      },
      (err) => console.warn("MsgsRecent notice:", err.message)
    );

    // 5. Total Doctors count
    const unsubDocs = onSnapshot(
      collection(db, "doctors"),
      (snap) => {
        setCounts((prev) => ({ ...prev, totalDoctors: snap.size }));
      },
      (err) => console.warn("DocsCount notice:", err.message)
    );

    // 6. Total Services count
    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snap) => {
        setCounts((prev) => ({ ...prev, totalServices: snap.size }));
      },
      (err) => console.warn("ServicesCount notice:", err.message)
    );

    return () => {
      unsubApptsCount();
      unsubApptsRecent();
      unsubMsgsCount();
      unsubMsgsRecent();
      unsubDocs();
      unsubServices();
    };
  }, [mounted]);

  const SUMMARY_CARDS = [
    {
      title: "Pending Appointments",
      count: counts.pendingAppointments,
      href: "/admin/appointments",
      icon: Calendar,
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200",
      iconColor: "text-sky-600",
    },
    {
      title: "Unread Messages",
      count: counts.unreadMessages,
      href: "/admin/messages",
      icon: MessageSquare,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-600",
    },
    {
      title: "Total Doctors",
      count: counts.totalDoctors,
      href: "/admin/doctors",
      icon: Users,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Services",
      count: counts.totalServices,
      href: "/admin/services",
      icon: Briefcase,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
    },
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A]">Loading Administrative Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
          Hospital Administrative Dashboard
        </h1>
        <p className="text-xs text-[var(--slate)] font-semibold mt-1">
          Real-time summary metrics, appointments queue, and inquiry messages log.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SUMMARY_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} href={card.href}>
              <motion.div
                whileHover={{ y: -4 }}
                className={`p-6 rounded-3xl border ${card.borderColor} ${card.bgColor} bg-white shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-40 group`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl ${card.bgColor} border ${card.borderColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-[#2B1F1A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <div>
                  <span className="text-3xl font-black text-[#2B1F1A]">
                    {card.count}
                  </span>
                  <p className="text-xs font-bold text-[var(--slate)] uppercase tracking-wider mt-1">
                    {card.title}
                  </p>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Dual Activity Feed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Appointments */}
        <div className="bg-white rounded-3xl border border-[var(--line)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--iris)]" />
                <h3 className="text-base font-extrabold text-[#2B1F1A]">Recent Appointments</h3>
              </div>
              <Link
                href="/admin/appointments"
                className="text-xs font-bold text-[var(--iris)] hover:text-[#2B1F1A] flex items-center gap-1"
              >
                View All &rarr;
              </Link>
            </div>

            {recentAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">No appointment requests yet.</p>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-2xl bg-[var(--fog)] border border-[var(--line)]/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-[#2B1F1A]">{appt.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{appt.service} ({appt.doctor})</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        appt.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : appt.status === "cancelled"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {appt.status || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-3xl border border-[var(--line)] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--iris)]" />
                <h3 className="text-base font-extrabold text-[#2B1F1A]">Recent Contact Messages</h3>
              </div>
              <Link
                href="/admin/messages"
                className="text-xs font-bold text-[var(--iris)] hover:text-[#2B1F1A] flex items-center gap-1"
              >
                View All &rarr;
              </Link>
            </div>

            {recentMessages.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">No inquiry messages yet.</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl bg-[var(--fog)] border border-[var(--line)]/60 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-[#2B1F1A] truncate">{msg.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate font-medium">{msg.message}</p>
                    </div>
                    {msg.read ? (
                      <span className="text-[10px] text-slate-400 font-bold flex-shrink-0">Read</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--iris)] text-white text-[9px] font-extrabold flex-shrink-0 uppercase">
                        Unread
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
