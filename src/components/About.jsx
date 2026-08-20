"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building2, Target, Award, CheckCircle2 } from "lucide-react";

export default function About() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "siteContent", "about"),
        (docSnap) => {
          if (docSnap.exists()) {
            setAboutData(docSnap.data());
          } else {
            setAboutData(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("About content snapshot notice:", error.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("About section error:", err);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <section id="about" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded-full mx-auto animate-pulse" />
            <div className="h-8 w-3/4 bg-slate-200 rounded-xl mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-[var(--line)] space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-200 rounded-lg" />
              <div className="h-4 w-5/6 bg-slate-200 rounded-lg" />
              <div className="h-4 w-4/6 bg-slate-200 rounded-lg" />
            </div>
            <div className="lg:col-span-5 bg-slate-800 rounded-3xl p-8 border border-slate-700 space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-slate-700 rounded-lg" />
              <div className="h-4 w-full bg-slate-700 rounded-lg" />
              <div className="h-4 w-4/5 bg-slate-700 rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!aboutData) {
    return null;
  }

  const title = aboutData.title || "";
  const story = aboutData.story || "";
  const mission = aboutData.mission || "";
  const values = aboutData.values || "";

  const valueList = values
    ? values.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

  return (
    <section id="about" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Soft background glows */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        {title && (
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3 py-1 rounded-full border border-[var(--line)] shadow-xs">
                Our Legacy & Mission
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
                {title}
              </h2>
            </motion.div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Story Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#2B1F1A]">
                <div className="w-10 h-10 rounded-2xl bg-[var(--fog)] flex items-center justify-center text-[var(--iris)]">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Our Hospital Story</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                {story}
              </p>
            </div>

            {/* Values pills */}
            {valueList.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Core Hospital Values
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {valueList.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--fog)]/60 border border-[var(--line)]/60">
                      <CheckCircle2 className="w-4 h-4 text-[var(--iris)] flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-[#2B1F1A]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Mission & Vision Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 bg-[#1E1433] text-white rounded-3xl p-6 sm:p-8 border border-[var(--ink)] shadow-md flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--iris)] flex items-center justify-center text-white shadow-md">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Our Mission</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
                {mission}
              </p>
            </div>

            <div className="mt-8 border-t border-slate-700/80 pt-5 flex items-center gap-3">
              <Award className="w-6 h-6 text-[var(--iris)]" />
              <span className="text-xs font-bold text-slate-300">
                Unwavering Commitment to Patient Care Excellence
              </span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
