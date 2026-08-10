"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit3, Trash2, Cpu, AlertTriangle, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTechnologiesListPage() {
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "technologies"),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        // Sort by order ascending
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setTechnologies(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Technologies fetch warning:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "technologies", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete technology:", err);
      alert("Failed to delete equipment record.");
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
            Surgical & Diagnostic Technologies
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage high-precision laser hardware and diagnostic devices in the technology suite.
          </p>
        </div>

        <Link
          href="/admin/technologies/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Technology
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Technologies...</p>
        </div>
      ) : technologies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[var(--line)]">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2B1F1A]">No Technology Added Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Add Technology" to showcase your hospital's advanced diagnostic lasers.
          </p>
          <Link
            href="/admin/technologies/new"
            className="mt-4 inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[var(--iris-dark)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Technology Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech) => (
            <motion.div
              key={tech.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[var(--line)] shadow-sm p-6 flex flex-col justify-between hover:border-[var(--iris)] transition-all relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(tech.images && tech.images.length > 0) || tech.imageUrl ? (
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[var(--line)] shadow-xs flex-shrink-0 bg-slate-50 p-1 flex items-center justify-center">
                        <img
                          src={tech.images && tech.images.length > 0 ? tech.images[0] : tech.imageUrl}
                          alt={tech.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[var(--fog)] text-[var(--iris)] flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-[var(--iris)] uppercase tracking-wider block">
                        Sequence #{tech.order || 1}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#2B1F1A]">
                  {tech.name}
                </h3>

                <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                  {tech.description}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/technologies/edit?id=${tech.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(tech)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
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
                Confirm Delete Equipment
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{deleteTarget.name}</strong>?
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
