"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookOpen, Search, ArrowRight, Clock, Calendar, Sparkles, Filter, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientEducationClient() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "articles"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt?.seconds * 1000 || 0);
          const dateB = new Date(b.publishedAt || b.createdAt?.seconds * 1000 || 0);
          return dateB - dateA;
        });
        setArticles(list);
        setLoading(false);
      },
      (err) => {
        console.warn("PatientEducation articles notice:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))];

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      (art.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[var(--fog)] py-12 sm:py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--line)] shadow-2xs">
            <BookOpen className="w-4 h-4 text-[var(--iris)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--iris)]">
              Patient Education & Resources
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2B1F1A] tracking-tight leading-tight">
            Comprehensive Eye Health Guides & Articles
          </h1>

          <p className="text-sm sm:text-base text-[var(--slate)] font-medium leading-relaxed">
            Empowering patients with reliable ophthalmic insights, surgical recovery advice, and preventive eye care information from Haji Murad Eye Hospital Trust.
          </p>
        </div>

        {/* Search & Category Filter Control */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[var(--line)] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title or keyword..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[var(--iris)]"
              />
            </div>

            {/* Total Articles Counter */}
            <div className="text-xs font-bold text-slate-500 shrink-0">
              Showing <span className="text-[var(--iris)] font-extrabold">{filteredArticles.length}</span> Published Articles
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-[var(--ink)] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Article Cards Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[var(--line)] shadow-sm">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
              Loading Patient Education Guides...
            </p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-lg font-extrabold text-[#2B1F1A]">No Articles Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any articles matching your search criteria. Try clearing search keywords or selecting a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art, idx) => (
              <motion.article
                key={art.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-[var(--line)] shadow-xs hover:shadow-xl hover:border-[var(--iris)] transition-all duration-300 overflow-hidden flex flex-col justify-between group mb-[10px]"
              >
                <div>
                  {/* Optional Featured Cover Image */}
                  {art.featuredImage ? (
                    <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                      <Image
                        src={art.featuredImage}
                        alt={art.title}
                        width={400}
                        height={220}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {art.category && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-[#1E1433]/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            {art.category}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    art.category && (
                      <div className="p-5 pb-0">
                        <span className="inline-block bg-slate-100 text-[var(--iris)] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                          {art.category}
                        </span>
                      </div>
                    )
                  )}

                  {/* Card Main Info */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-[var(--iris)]" />
                      <span>{art.publishedAt || "Recently Published"}</span>
                    </div>

                    <h2 className="text-lg font-black text-[#2B1F1A] group-hover:text-[var(--iris)] transition-colors leading-snug line-clamp-2">
                      <Link href={`/patient-education/${art.slug || art.id}`}>
                        {art.title}
                      </Link>
                    </h2>

                    <p className="text-xs sm:text-sm font-medium text-[var(--slate)] line-clamp-3 leading-relaxed">
                      {art.excerpt || "Read full article details, care instructions, and medical guidelines from our ophthalmic team."}
                    </p>
                  </div>
                </div>

                {/* Read Full Article Footer Link */}
                <div className="p-6 pt-0 border-t border-slate-100/60 mt-4 flex items-center justify-between">
                  <Link
                    href={`/patient-education/${art.slug || art.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--ink)] group-hover:text-[var(--iris)] transition-colors"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="w-4 h-4 text-[var(--iris)] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
