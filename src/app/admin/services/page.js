"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit3, Trash2, Sparkles, Sun, Eye, Activity, ShieldAlert, Smile, Briefcase, AlertTriangle, X } from "lucide-react";
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "services", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete service:", err);
      alert("Failed to delete service item.");
    } finally {
      setDeleting(false);
    }
  };

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
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Service
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[var(--line)]">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2B1F1A]">No Services Added Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Add New Service" to create your first hospital specialty card.
          </p>
          <Link
            href="/admin/services/new"
            className="mt-4 inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[var(--iris-dark)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Service Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => {
            const IconComponent = typeof svc.icon === "string" ? (iconMap[svc.icon] || Sparkles) : Sparkles;

            return (
              <motion.div
                key={svc.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-[var(--line)] shadow-sm p-6 flex flex-col justify-between hover:border-[var(--iris)] transition-all relative group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--ink)] to-[var(--iris)] p-0.5 shadow-xs flex items-center justify-center mb-4">
                    <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-[#2B1F1A]" />
                    </div>
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
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
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
                Confirm Delete Service
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{deleteTarget.title}</strong>? This action will remove the service card from the live site immediately.
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
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
