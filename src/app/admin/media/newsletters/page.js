"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Newspaper, Plus, Trash2, Edit, ExternalLink, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminNewslettersPage() {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "newsletters"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setNewsletters(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Newsletters snapshot fallback:", err);
          const unsubFallback = onSnapshot(
            collection(db, "newsletters"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setNewsletters(list);
              setLoading(false);
            },
            (e) => {
              console.warn("Newsletters fallback notice:", e);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching newsletters:", err);
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Newsletter?")) return;
    try {
      await deleteDoc(doc(db, "newsletters", id));
    } catch (err) {
      console.error("Error deleting newsletter:", err);
      alert("Failed to delete newsletter.");
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
            Newsletters & Bulletins
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage hospital newsletters, publication dates, and PDF download links.
          </p>
        </div>

        <Link
          href="/admin/media/newsletters/new"
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Newsletter
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[var(--ink)]">Loading Newsletters...</p>
        </div>
      ) : newsletters.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-4 max-w-lg mx-auto">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-[var(--ink)]">No Newsletters Added Yet</h3>
          <p className="text-xs text-slate-500 font-medium">
            Click "Add Newsletter" to publish your first hospital newsletter bulletin.
          </p>
          <Link
            href="/admin/media/newsletters/new"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add Newsletter Now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[var(--line)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-[var(--fog)] border-b border-[var(--line)] text-[var(--slate)] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Newsletter Title</th>
                  <th className="py-4 px-4">Publication Date</th>
                  <th className="py-4 px-4">PDF Link</th>
                  <th className="py-4 px-4">Order</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {newsletters.map((nl) => (
                  <tr key={nl.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-[var(--ink)]">
                      <div>
                        <span>{nl.title}</span>
                        {nl.description && (
                          <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                            {nl.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-[var(--iris)]">
                      {nl.date || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                      {nl.fileUrl ? (
                        <a
                          href={nl.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          View PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">No PDF link</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-bold">
                      #{nl.order || 1}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/media/newsletters/edit?id=${nl.id}`}
                        className="inline-flex items-center gap-1 p-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                        title="Edit Newsletter"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(nl.id)}
                        className="inline-flex items-center gap-1 p-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold cursor-pointer"
                        title="Delete Newsletter"
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
