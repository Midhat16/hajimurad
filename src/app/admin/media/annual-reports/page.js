"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FileText, Plus, Trash2, Edit, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAnnualReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "annualReports"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setReports(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Annual reports snapshot fallback:", err);
          const unsubFallback = onSnapshot(
            collection(db, "annualReports"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setReports(list);
              setLoading(false);
            },
            (e) => {
              console.warn("Annual reports fallback notice:", e);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching annual reports:", err);
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Annual Report?")) return;
    try {
      await deleteDoc(doc(db, "annualReports", id));
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Failed to delete report.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Media Management
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            Annual Reports
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage official hospital annual audit reports and PDF links shown on /media/annual-reports.
          </p>
        </div>

        <Link
          href="/admin/media/annual-reports/new"
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Annual Report
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[var(--ink)]">Loading Annual Reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-4 max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-[var(--ink)]">No Annual Reports Added Yet</h3>
          <p className="text-xs text-slate-500 font-medium">
            Click "Add Annual Report" to publish your first annual report PDF link.
          </p>
          <Link
            href="/admin/media/annual-reports/new"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add Report Now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-[var(--fog)] border-b border-[var(--line)] text-[var(--slate)] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Report Title</th>
                  <th className="py-4 px-4">Year</th>
                  <th className="py-4 px-4">PDF Link</th>
                  <th className="py-4 px-4">Order</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-[var(--ink)]">
                      {report.title}
                    </td>
                    <td className="py-4 px-4 font-bold text-[var(--iris)]">
                      {report.year || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                      {report.fileUrl ? (
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          View PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">No PDF attached</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-bold">
                      #{report.order || 1}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/media/annual-reports/edit?id=${report.id}`}
                        className="inline-flex items-center gap-1 p-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                        title="Edit Report"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="inline-flex items-center gap-1 p-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold cursor-pointer"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
