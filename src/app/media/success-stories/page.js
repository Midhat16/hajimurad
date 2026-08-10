"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HeartHandshake, Quote, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function SuccessStoriesPage() {
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

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-12 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <HeartHandshake className="w-4 h-4" /> Patient Recovery & Testimonials
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Patient Success Stories
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Real stories of restored sight, life-changing eye surgeries, and heartfelt expressions from our patients.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">Loading Success Stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-3 max-w-lg mx-auto">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-extrabold text-[#2B1F1A]">No Stories Published Yet</h3>
            <p className="text-xs text-slate-500 font-medium">
              Patient success stories will appear here as soon as they are added by the hospital team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stories.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group"
              >
                <div className="space-y-6 relative z-10">
                  {/* Top Header: Large Patient Photo & Metadata */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-5">
                    {item.imageUrl ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-md flex-shrink-0 bg-slate-100 ring-4 ring-slate-50">
                        <img
                          src={item.imageUrl}
                          alt={item.patientName || "Patient Photo"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--fog)] border border-[var(--line)] flex items-center justify-center text-[var(--iris)] font-bold flex-shrink-0 shadow-md ring-4 ring-slate-50">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-1 rounded-lg border border-[var(--line)] inline-block">
                          Patient Recovery
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] tracking-tight leading-snug">
                        {item.title || "Restored Vision Journey"}
                      </h3>
                      {item.patientName && (
                        <p className="text-xs sm:text-sm font-bold text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          {item.patientName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Testimonial Story Content */}
                  <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line text-justify">
                    {item.story}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
