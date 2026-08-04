"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap, Plus, Edit, Trash2, CheckCircle2, XCircle, Clock, Users, Building2, Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminInternshipsPage() {
  const [internships, setInternships] = useState([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to internships collection
    const unsubInternships = onSnapshot(
      collection(db, "internships"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setInternships(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Error fetching internships:", err);
        setLoading(false);
      }
    );

    // 2. Subscribe to internshipApplications collection for total applications badge
    const unsubApplications = onSnapshot(
      collection(db, "internshipApplications"),
      (snapshot) => {
        setApplicationsCount(snapshot.size);
      },
      (err) => console.warn("Error fetching applications count:", err)
    );

    return () => {
      unsubInternships();
      unsubApplications();
    };
  }, []);

  const handleToggleActive = async (item) => {
    try {
      await updateDoc(doc(db, "internships", item.id), {
        isActive: !item.isActive,
      });
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete internship program "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "internships", item.id));
    } catch (err) {
      alert("Failed to delete internship program.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
              Academic Control
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {internships.length} Active Programs
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            Internship Programs Management
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Create, edit, and manage department-wise internship offerings and candidate applications.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/internships/applications"
            className="inline-flex items-center gap-2 bg-[var(--fog)] text-[var(--ink)] hover:bg-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--line)] transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4 text-[var(--iris)]" />
            <span>Applications ({applicationsCount})</span>
          </Link>

          <Link
            href="/admin/internships/new"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white hover:bg-[var(--iris-dark)] px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Internship</span>
          </Link>
        </div>
      </div>

      {/* Program Cards / List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)]">
          <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[var(--ink)] uppercase">Loading Internships...</p>
        </div>
      ) : internships.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] space-y-4">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-[var(--ink)]">No Internship Programs Found</h3>
          <p className="text-xs font-semibold text-[var(--slate)] max-w-sm mx-auto">
            Get started by adding your hospital's first internship opportunity for medical or administrative candidates.
          </p>
          <Link
            href="/admin/internships/new"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--iris-dark)] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Program
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internships.map((program) => (
            <div
              key={program.id}
              className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs ${
                program.isActive === false ? "opacity-60 border-slate-200 bg-slate-50/50" : "border-[var(--line)]"
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--fog)] text-[var(--iris)] px-2.5 py-0.5 rounded-md border border-[var(--line)] flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {program.department || "General"}
                  </span>

                  <button
                    onClick={() => handleToggleActive(program)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                      program.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-300"
                    }`}
                  >
                    {program.isActive !== false ? "Active" : "Inactive"}
                  </button>
                </div>

                <h3 className="text-lg font-extrabold text-[var(--ink)] leading-snug">
                  {program.title}
                </h3>

                <p className="text-xs font-semibold text-[var(--slate)] line-clamp-2 leading-relaxed">
                  {program.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {program.duration || "3 Months"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[var(--iris)]" /> {program.seatsAvailable || 0} Seats
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-[var(--fog)] border-t border-[var(--line)]/60 flex items-center justify-between gap-2">
                <Link
                  href={`/academics/internships/apply?id=${program.id}`}
                  target="_blank"
                  className="p-2 text-slate-500 hover:text-[var(--ink)] rounded-lg hover:bg-white transition-colors"
                  title="View Public Page"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/internships/edit?id=${program.id}`}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--ink)] transition-all cursor-pointer shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-600" /> Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(program)}
                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                    title="Delete Program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
