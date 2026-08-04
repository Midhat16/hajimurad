"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Newspaper, Calendar } from "lucide-react";
import { motion } from "framer-motion";

function getCoverImageUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.includes("/image/upload/")) {
    return fileUrl
      .replace("/image/upload/", "/image/upload/pg_1/")
      .replace(/\.pdf$/i, ".jpg");
  }
  return "";
}

function NewsletterCard({ nl, index }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = getCoverImageUrl(nl.fileUrl);
  const showCover = coverUrl && !imgError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <a
        href={nl.fileUrl ? `/media/view?url=${encodeURIComponent(nl.fileUrl)}` : "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white rounded-none overflow-hidden border border-[var(--line)] shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer h-full"
      >
        {/* Top Cover Thumbnail / Fallback Header */}
        <div className="relative w-full aspect-[3/4] bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
          {showCover ? (
            <img
              src={coverUrl}
              alt={nl.date || "Newsletter Bulletin"}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <Newspaper className="w-16 h-16 text-[#5EEAD4] mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {nl.date || "Latest Bulletin"}
              </span>
              <span className="text-xs text-slate-400 font-semibold mt-1">Medical Bulletin PDF</span>
            </div>
          )}
        </div>

        {/* Centered Period / Date Badge */}
        <div className="p-4 flex items-center justify-center bg-white">
          <span className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)] bg-[var(--fog)] px-4 py-2 border border-[var(--line)] text-center flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--iris)]" />
            {nl.date || "Latest Bulletin"}
          </span>
        </div>
      </a>
    </motion.div>
  );
}

export default function NewslettersPage() {
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

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-12 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <Newspaper className="w-4 h-4" /> Hospital Bulletins & News
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Official Newsletters
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Stay updated with hospital developments, new surgical laser installations, community eye camp schedules, and health advisories.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <div className="bg-white rounded-none p-16 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">Loading Newsletters...</p>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="bg-white rounded-none p-12 text-center border border-[var(--line)] shadow-sm space-y-3 max-w-lg mx-auto">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-extrabold text-[var(--ink)]">No Newsletters Published Yet</h3>
            <p className="text-xs text-slate-500 font-medium">
              Check back soon for latest hospital publications and medical bulletins.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {newsletters.map((nl, idx) => (
              <NewsletterCard key={nl.id} nl={nl} index={idx} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
