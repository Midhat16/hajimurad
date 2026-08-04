"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HeartHandshake, Plus, Trash2, Edit, User } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "successStories"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setStories(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Success stories snapshot fallback:", err);
          const unsubFallback = onSnapshot(
            collection(db, "successStories"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setStories(list);
              setLoading(false);
            },
            (e) => {
              console.warn("Success stories fallback notice:", e);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching success stories:", err);
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Patient Success Story?")) return;
    try {
      await deleteDoc(doc(db, "successStories", id));
    } catch (err) {
      console.error("Error deleting story:", err);
      alert("Failed to delete success story.");
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
            Patient Success Stories
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage patient recovery stories and testimonials shown on /media/success-stories.
          </p>
        </div>

        <Link
          href="/admin/media/success-stories/new"
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Success Story
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[var(--ink)]">Loading Success Stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-4 max-w-lg mx-auto">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-[var(--ink)]">No Success Stories Added Yet</h3>
          <p className="text-xs text-slate-500 font-medium">
            Click "Add Success Story" to publish your first patient recovery testimonial.
          </p>
          <Link
            href="/admin/media/success-stories/new"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add Story Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((item) => (
            <motion.div
              key={item.id}
              layout
              className="bg-white rounded-3xl p-6 border border-[var(--line)] shadow-sm flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0">
                        <img src={item.imageUrl} alt={item.patientName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--fog)] border border-slate-200 flex items-center justify-center text-[var(--iris)] font-bold flex-shrink-0">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-extrabold text-[var(--ink)] truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold">
                        {item.patientName || "Anonymous Patient"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold">
                    #{item.order || 1}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-semibold line-clamp-3 leading-relaxed border-t border-slate-100 pt-3">
                  {item.story}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={`/admin/media/success-stories/edit?id=${item.id}`}
                  className="inline-flex items-center gap-1 p-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="inline-flex items-center gap-1 p-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
