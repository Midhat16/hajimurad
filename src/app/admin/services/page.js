"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Sun,
  Eye,
  Activity,
  ShieldAlert,
  Smile,
  Briefcase,
  AlertTriangle,
  X,
  RotateCcw,
  Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  Sparkles,
  Sun,
  Eye,
  Activity,
  Smile,
  ShieldAlert,
};

export default function AdminServicesListPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState("active"); // "active" | "deleted"

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setServices(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Services fetch warning:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await updateDoc(doc(db, "services", deleteTarget.id), {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete service:", err);
      alert("Failed to delete service item.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (svcId) => {
    try {
      await updateDoc(doc(db, "services", svcId), {
        isDeleted: false,
        restoredAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to restore service:", err);
      alert("Failed to restore service.");
    }
  };

  const handlePermanentDelete = async (svcId) => {
    if (!confirm("Are you sure you want to permanently delete this service from the database?")) return;
    try {
      await deleteDoc(doc(db, "services", svcId));
    } catch (err) {
      console.error("Failed to permanently delete service:", err);
      alert("Failed to permanently remove service.");
    }
  };

  const activeServices = services.filter((s) => s.isDeleted !== true);
  const deletedServices = services.filter((s) => s.isDeleted === true);

  const displayList = viewMode === "active" ? activeServices : deletedServices;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
            Eye Care Services
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage sub-specialty hospital departments displayed on the public site homepage.
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-[#1E1433] hover:bg-[#2A1C47] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Service
        </Link>
      </div>

      {/* Filter Tabs (Active Services vs Deleted Services Archive) */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("active")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === "active"
                ? "bg-[var(--ink)] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Active Services ({activeServices.length})
          </button>
          <button
            onClick={() => setViewMode("deleted")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "deleted"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Deleted Services Archive ({deletedServices.length})</span>
          </button>
        </div>

        {viewMode === "deleted" && (
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            Deleted services are hidden from public site but available as templates
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Services...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[var(--line)] max-w-lg mx-auto shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2B1F1A]">
            {viewMode === "active" ? "No Active Services Added Yet" : "No Deleted Services in Archive"}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {viewMode === "active"
              ? "Click 'Add New Service' to create your first hospital specialty card."
              : "Soft-deleted services will appear here for restoration or template copying."}
          </p>
          {viewMode === "active" && (
            <Link
              href="/admin/services/new"
              className="mt-4 inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[var(--iris-dark)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Service Now
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map((svc) => {
            const IconComponent = typeof svc.icon === "string" ? (iconMap[svc.icon] || Sparkles) : Sparkles;

            return (
              <motion.div
                key={svc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col justify-between hover:border-[var(--iris)] transition-all relative group ${
                  svc.isDeleted ? "border-rose-200 bg-rose-50/20" : "border-[var(--line)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#1E1433] p-0.5 shadow-xs flex items-center justify-center">
                      <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-[#2B1F1A]" />
                      </div>
                    </div>
                    {svc.isDeleted && (
                      <span className="text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Soft Deleted
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#2B1F1A]">
                    {svc.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                    {svc.description}
                  </p>

                  {svc.features && svc.features.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3">
                      {svc.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[11px] font-semibold text-[var(--slate)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--iris)]" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                  {!svc.isDeleted ? (
                    <>
                      <Link
                        href={`/admin/services/edit?id=${svc.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(svc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRestore(svc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Service
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(svc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Purge
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-lg font-extrabold text-[#2B1F1A]">
                Confirm Soft Delete Service
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{deleteTarget.title}</strong>? This action will hide the service from the public website immediately, but keep it available in the template copy dropdown for future reuse.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSoftDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Yes, Soft Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
