"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit3, Trash2, Stethoscope, GraduationCap, Award, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AdminDoctorAvatar({ docItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const photo = docItem.photoUrl || docItem.photo || docItem.imageUrl;

  useEffect(() => {
    setImgFailed(false);
  }, [photo]);

  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={docItem.name}
        className="w-full h-full rounded-full object-cover"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full rounded-full bg-gradient-to-tr ${
        docItem.gradient || "from-sky-400 to-blue-500"
      } flex items-center justify-center text-white font-bold text-lg`}
    >
      {docItem.initials || docItem.name?.charAt(0) || "D"}
    </div>
  );
}

export default function AdminDoctorsListPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDoctors(list);
        setLoading(false);
      },
      (error) => {
        console.warn("Doctors fetch warning:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "doctors", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete doctor:", err);
      alert("Failed to delete doctor item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5E5DD] pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight">
            Doctors & Specialists
          </h1>
          <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
            Manage expert medical board members appearing on the public site in real-time.
          </p>
        </div>

        <Link
          href="/admin/doctors/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Doctor
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0B3D5C]">Loading Doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#D5E5DD]">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0B3D5C]">No Doctors Added Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Add New Doctor" to create your first specialist card.
          </p>
          <Link
            href="/admin/doctors/new"
            className="mt-4 inline-flex items-center gap-2 bg-[#0B3D5C] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[#082D44] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Doctor Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-[#D5E5DD] shadow-sm p-6 flex flex-col justify-between hover:border-[#3E8E6E] transition-all relative group"
            >
              <div>
                {/* Doctor Avatar / Photo */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-[#D5E5DD] shadow-xs">
                    <AdminDoctorAvatar docItem={doc} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#0B3D5C] truncate">
                      {doc.name}
                    </h3>
                    <p className="text-[11px] font-bold text-[#3E8E6E] uppercase tracking-wider truncate">
                      {doc.role}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                      {doc.specialty}
                    </p>
                  </div>
                </div>

                {/* Info badges */}
                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium truncate">
                    <GraduationCap className="w-4 h-4 text-[#3E8E6E] flex-shrink-0" />
                    <span className="truncate">{doc.education || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium truncate">
                    <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{doc.metrics || "N/A"}</span>
                  </div>
                </div>

                {/* Bio Snippet */}
                {doc.bio && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic font-serif">
                    "{doc.bio}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/doctors/${doc.id}/activity`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  View Activity
                </Link>
                <Link
                  href={`/admin/doctors/${doc.id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(doc)}
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

              <h3 className="text-lg font-extrabold text-[#0B3D5C]">
                Confirm Delete Doctor
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{deleteTarget.name}</strong>? This action will remove the surgeon from both the Admin Panel and the live public website.
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
