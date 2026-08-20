"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  MessageSquare,
  User,
  FileText,
  School,
  Calendar,
  Check,
  Send,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AdminInternshipApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "pending" | "accepted" | "rejected"
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "internshipApplications"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          rawTime: d.data().createdAt?.seconds ? d.data().createdAt.seconds * 1000 : Date.now(),
        }));
        list.sort((a, b) => b.rawTime - a.rawTime);
        setApplications(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Error fetching applications:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-open application modal if ?id=... is present in URL
  useEffect(() => {
    if (loading || applications.length === 0) return;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("id") || params.get("appId") || params.get("applicationId");
      if (targetId) {
        const found = applications.find((a) => a.id === targetId || a.internshipId === targetId);
        if (found) {
          handleMarkRead(found);
          setSelectedApp(found);
        }
      }
    }
  }, [loading, applications]);

  const handleMarkRead = async (item) => {
    if (item.read) return;
    try {
      await updateDoc(doc(db, "internshipApplications", item.id), {
        read: true,
      });
    } catch (err) {
      console.warn("Error marking read:", err);
    }
  };

  const processAcceptStatus = async (item) => {
    setActionLoadingId(item.id);
    try {
      await updateDoc(doc(db, "internshipApplications", item.id), {
        status: "accepted",
        read: true,
      });

      if (selectedApp?.id === item.id) {
        setSelectedApp((prev) => (prev ? { ...prev, status: "accepted", read: true } : null));
      }

      // Send Acceptance Email Notification
      await fetch("/api/internship-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INTERNSHIP_ACCEPTED",
          data: item,
        }),
      }).catch((err) => console.warn("Error triggering accept email:", err));
    } catch (err) {
      console.warn("Failed to accept application:", err);
    } finally {
      setActionLoadingId(null);
      setConfirmConfig(null);
    }
  };

  const processRejectStatus = async (item) => {
    setActionLoadingId(item.id);
    try {
      await updateDoc(doc(db, "internshipApplications", item.id), {
        status: "rejected",
        read: true,
      });

      if (selectedApp?.id === item.id) {
        setSelectedApp((prev) => (prev ? { ...prev, status: "rejected", read: true } : null));
      }

      // Send Rejection Email Notification
      await fetch("/api/internship-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INTERNSHIP_REJECTED",
          data: item,
        }),
      }).catch((err) => console.warn("Error triggering reject email:", err));
    } catch (err) {
      console.warn("Failed to reject application:", err);
    } finally {
      setActionLoadingId(null);
      setConfirmConfig(null);
    }
  };

  const processDelete = async (item) => {
    try {
      // 1. Delete application from internshipApplications
      await deleteDoc(doc(db, "internshipApplications", item.id));

      // 2. Clean up any related notifications and activity log entries
      const qNotifs = query(collection(db, "notifications"), where("applicationId", "==", item.id));
      const snapNotifs = await getDocs(qNotifs).catch(() => ({ docs: [] }));
      const p1 = (snapNotifs.docs || []).map((d) => deleteDoc(doc(db, "notifications", d.id)).catch(() => {}));

      const qLogs = query(collection(db, "activityLog"), where("applicationId", "==", item.id));
      const snapLogs = await getDocs(qLogs).catch(() => ({ docs: [] }));
      const p2 = (snapLogs.docs || []).map((d) => deleteDoc(doc(db, "activityLog", d.id)).catch(() => {}));

      await Promise.all([...p1, ...p2]);

      if (selectedApp?.id === item.id) {
        setSelectedApp(null);
      }
    } catch (err) {
      console.warn("Failed to delete application:", err);
    } finally {
      setConfirmConfig(null);
    }
  };

  const handleAcceptStatus = (item) => {
    setConfirmConfig({
      isOpen: true,
      type: "accept",
      title: "Accept Internship Candidate",
      message: `Are you sure you want to ACCEPT the application from ${item.applicantName || "this candidate"}? An official acceptance notification email will be sent to the candidate.`,
      confirmText: "Accept Candidate",
      onConfirm: () => processAcceptStatus(item),
    });
  };

  const handleRejectStatus = (item) => {
    setConfirmConfig({
      isOpen: true,
      type: "reject",
      title: "Reject Internship Candidate",
      message: `Are you sure you want to REJECT the application from ${item.applicantName || "this candidate"}? An official regret notification email will be sent to the candidate.`,
      confirmText: "Reject Candidate",
      onConfirm: () => processRejectStatus(item),
    });
  };

  const handleDelete = (item) => {
    setConfirmConfig({
      isOpen: true,
      type: "delete",
      title: "Delete Application Record",
      message: `Are you sure you want to permanently delete the application record for ${item.applicantName || "this candidate"}?`,
      confirmText: "Delete Record",
      onConfirm: () => processDelete(item),
    });
  };

  const handleOpenApp = (item) => {
    handleMarkRead(item);
    setSelectedApp(item);
  };

  const filteredApps = applications.filter((item) => {
    if (activeFilter === "all") return true;
    const itemStatus = (item.status || "pending").toLowerCase();
    if (activeFilter === "pending") return itemStatus === "pending" || itemStatus === "reviewed";
    return itemStatus === activeFilter.toLowerCase();
  });

  const pendingCount = applications.filter((a) => (a.status || "pending").toLowerCase() === "pending").length;
  const acceptedCount = applications.filter((a) => (a.status || "").toLowerCase() === "accepted").length;
  const rejectedCount = applications.filter((a) => (a.status || "").toLowerCase() === "rejected").length;
  const unreadCount = applications.filter((a) => !a.read).length;

  const formatDate = (ts) => {
    if (!ts) return "Recently";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    return String(ts);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/internships"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#2B1F1A]" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
                Internship Applications Portal
              </span>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-white bg-rose-500 px-2.5 py-0.5 rounded-full animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
              Candidate Applications ({applications.length})
            </h1>
            <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
              Review, accept, or reject candidate applications. Automated email notifications are dispatched on decision.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-[var(--line)] shadow-xs flex items-center gap-2 max-w-xl overflow-x-auto">
        {[
          { id: "all", label: `All (${applications.length})` },
          { id: "pending", label: `Pending (${pendingCount})` },
          { id: "accepted", label: `Accepted (${acceptedCount})` },
          { id: "rejected", label: `Rejected (${rejectedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeFilter === tab.id
                ? "bg-[var(--ink)] text-white shadow-xs"
                : "bg-[var(--fog)] text-[var(--slate)] hover:bg-[var(--line)]/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications Stream List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)]">
          <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A] uppercase">Loading Applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-[#2B1F1A]">No Applications Found</h3>
          <p className="text-xs font-semibold text-[var(--slate)]">
            There are no candidate applications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((item) => {
            const isUnread = !item.read;
            const status = (item.status || "pending").toLowerCase();
            const isAccepted = status === "accepted";
            const isRejected = status === "rejected";

            return (
              <div
                key={item.id}
                onClick={() => handleOpenApp(item)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer relative hover:shadow-md ${
                  isUnread
                    ? "bg-amber-50/40 border-amber-200 shadow-xs"
                    : isAccepted
                    ? "bg-emerald-50/30 border-emerald-200"
                    : isRejected
                    ? "bg-rose-50/30 border-rose-200"
                    : "bg-white border-[var(--line)]"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 shadow-xs ${
                      isAccepted
                        ? "bg-emerald-600"
                        : isRejected
                        ? "bg-rose-600"
                        : "bg-[var(--ink)]"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--fog)] text-[var(--iris)] px-2 py-0.5 rounded-md border border-[var(--line)]">
                        {item.department || "General"}
                      </span>

                      {/* Status Badge */}
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Accepted
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" /> Pending Review
                        </span>
                      )}

                      <h4 className="text-sm font-extrabold text-[#2B1F1A]">
                        {item.applicantName}
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        ({item.internshipTitle || "Internship"})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <School className="w-3.5 h-3.5 text-[var(--iris)] shrink-0" /> {item.instituteName || "N/A"}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Class of {item.graduationYear || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {item.email}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Phone className="w-3.5 h-3.5 shrink-0" /> {item.phone}
                      </span>
                    </div>

                    {item.coverMessage && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic pt-0.5">
                        "{item.coverMessage}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0 flex-wrap">
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mr-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  {/* Accept Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptStatus(item);
                    }}
                    disabled={actionLoadingId === item.id || isAccepted}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                      isAccepted
                        ? "bg-emerald-600 text-white cursor-default opacity-90"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepted ? "Accepted" : "Accept"}</span>
                  </button>

                  {/* Reject Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectStatus(item);
                    }}
                    disabled={actionLoadingId === item.id || isRejected}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                      isRejected
                        ? "bg-rose-600 text-white cursor-default opacity-90"
                        : "bg-rose-500 hover:bg-rose-600 text-white"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isRejected ? "Rejected" : "Reject"}</span>
                  </button>

                  {/* Delete Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                    title="Delete Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {isUnread && (
                    <div
                      className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-md animate-pulse cursor-pointer flex-shrink-0 ml-1"
                      title="Unread application"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Full Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[var(--line)] shadow-2xl space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
                  Internship Candidate Profile
                </span>
                <h3 className="text-xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
                  {selectedApp.applicantName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Application Status Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-slate-50">
              <span className="text-xs font-bold text-slate-500">Current Status:</span>
              {(selectedApp.status || "pending").toLowerCase() === "accepted" ? (
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Application Accepted
                </span>
              ) : (selectedApp.status || "").toLowerCase() === "rejected" ? (
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-300">
                  <XCircle className="w-4 h-4 text-rose-600" /> Application Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-700" /> Pending Review
                </span>
              )}
            </div>

            {/* Target Program Info */}
            <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-[var(--line)]/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Applied For Program</span>
              <span className="text-sm font-extrabold text-[#2B1F1A] block">{selectedApp.internshipTitle || "Internship"}</span>
              <span className="text-xs font-bold text-[var(--iris)] block">{selectedApp.department || "General Department"}</span>
            </div>

            {/* Candidate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Candidate Name</span>
                <span className="font-extrabold text-[#2B1F1A]">{selectedApp.applicantName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone / WhatsApp</span>
                <span className="font-extrabold text-emerald-700">{selectedApp.phone}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Institute / University</span>
                <span className="font-extrabold text-[#2B1F1A]">{selectedApp.instituteName || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Graduation Year</span>
                <span className="font-extrabold text-[var(--iris)]">{selectedApp.graduationYear ? `Class of ${selectedApp.graduationYear}` : "N/A"}</span>
              </div>
              <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                <span className="font-extrabold text-[#2B1F1A] truncate block">{selectedApp.email}</span>
              </div>
            </div>

            {/* Statement of Purpose / Cover Message */}
            {selectedApp.coverMessage && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--iris)] block">
                  Statement of Purpose / Cover Message
                </span>
                <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-[var(--line)]/60 text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedApp.coverMessage}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              {selectedApp.phone && (
                <a
                  href={`https://wa.me/${selectedApp.phone.replace(/\D/g, "").replace(/^0/, "92")}?text=${encodeURIComponent(`Hello ${selectedApp.applicantName}! This is regarding your internship application for ${selectedApp.internshipTitle} at Haji Murad Eye Hospital.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Candidate
                </a>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleAcceptStatus(selectedApp)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={() => handleRejectStatus(selectedApp)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        type={confirmConfig?.type}
        confirmText={confirmConfig?.confirmText}
        isLoading={!!actionLoadingId}
        onConfirm={confirmConfig?.onConfirm}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
