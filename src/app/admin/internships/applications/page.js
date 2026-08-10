"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, GraduationCap, Mail, Phone, Clock, Building2, CheckCircle2, XCircle, Trash2, X, MessageSquare, User, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminInternshipApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "pending" | "reviewed"
  const [selectedApp, setSelectedApp] = useState(null);

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

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === "reviewed" ? "pending" : "reviewed";
    try {
      await updateDoc(doc(db, "internshipApplications", item.id), {
        status: nextStatus,
        read: true,
      });
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete application from ${item.applicantName}?`)) return;
    try {
      await deleteDoc(doc(db, "internshipApplications", item.id));
      if (selectedApp?.id === item.id) {
        setSelectedApp(null);
      }
    } catch (err) {
      alert("Failed to delete application.");
    }
  };

  const handleOpenApp = (item) => {
    handleMarkRead(item);
    setSelectedApp(item);
  };

  const filteredApps = applications.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

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
                Internship Submissions
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
              Review and manage incoming candidate applications for hospital & administrative internships.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-[var(--line)] shadow-xs flex items-center gap-2 max-w-md">
        {[
          { id: "all", label: `All (${applications.length})` },
          { id: "pending", label: "Pending Review" },
          { id: "reviewed", label: "Reviewed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
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
            There are no submitted candidate applications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((item) => {
            const isUnread = !item.read;
            const isReviewed = item.status === "reviewed";

            return (
              <div
                key={item.id}
                onClick={() => handleOpenApp(item)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative hover:shadow-md ${
                  isUnread
                    ? "bg-rose-50/50 border-rose-200 shadow-xs"
                    : isReviewed
                    ? "bg-emerald-50/30 border-emerald-200"
                    : "bg-white border-[var(--line)]"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 shadow-xs ${
                      isReviewed ? "bg-emerald-600" : "bg-[var(--ink)]"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--fog)] text-[var(--iris)] px-2 py-0.5 rounded-md border border-[var(--line)]">
                        {item.department || "General"}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#2B1F1A]">
                        {item.applicantName}
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        ({item.internshipTitle || "Internship"})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {item.email}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Phone className="w-3.5 h-3.5" /> {item.phone}
                      </span>
                    </div>

                    {item.coverMessage && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic pt-0.5">
                        "{item.coverMessage}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(item);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                      isReviewed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {isReviewed ? "Reviewed" : "Mark Reviewed"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Delete Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {isUnread && (
                    <div
                      className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-md animate-pulse cursor-pointer flex-shrink-0"
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
                  onClick={() => {
                    handleToggleStatus(selectedApp);
                    setSelectedApp({ ...selectedApp, status: selectedApp.status === "reviewed" ? "pending" : "reviewed" });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {selectedApp.status === "reviewed" ? "Mark Pending" : "Mark Reviewed"}
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
    </div>
  );
}
