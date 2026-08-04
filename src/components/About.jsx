"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building2, Target, Heart, Award, CheckCircle2 } from "lucide-react";

const DEFAULT_ABOUT = {
  title: "Pioneering Vision Restoration for Over 3 Decades",
  story: "Founded with a mission to eliminate preventable blindness, Haji Murad Eye Hospital has grown from a humble specialized outpatient clinic into a world-renowned ophthalmic center of excellence. We combine compassionate care with cutting-edge laser technologies to transform lives.",
  mission: "To deliver international gold-standard eye surgical care, accessible vision screening, and pioneering laser treatment to every patient with surgical excellence and warmth.",
  values: "Uncompromising Surgical Safety, Patient-Centric Compassion, Continuous Technology Innovation, Ethical Transparent Practice",
};

export default function About() {
  const [aboutData, setAboutData] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "siteContent", "about"),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAboutData({
              title: data.title || DEFAULT_ABOUT.title,
              story: data.story || DEFAULT_ABOUT.story,
              mission: data.mission || DEFAULT_ABOUT.mission,
              values: data.values || DEFAULT_ABOUT.values,
            });
          }
        },
        (error) => {
          console.warn("About content snapshot notice:", error.message);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("About section error:", err);
    }
  }, []);

  const valueList = aboutData.values
    ? aboutData.values.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

  return (
    <section id="about" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Soft background glows */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
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
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] tracking-tight leading-tight">
              {aboutData.title}
            </h2>
          </motion.div>
        </div>

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
              <div className="flex items-center gap-3 text-[var(--ink)]">
                <div className="w-10 h-10 rounded-2xl bg-[var(--fog)] flex items-center justify-center text-[var(--iris)]">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Our Hospital Story</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                {aboutData.story}
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
                      <span className="text-xs sm:text-sm font-bold text-[var(--ink)]">{val}</span>
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
            className="lg:col-span-5 bg-gradient-to-br from-[var(--ink)] to-[var(--iris-dark)] text-white rounded-3xl p-6 sm:p-8 border border-[var(--ink)] shadow-md flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--iris)] flex items-center justify-center text-white shadow-md">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Our Mission</h3>
              </div>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
                {aboutData.mission}
              </p>
            </div>

            <div className="mt-8 border-t border-slate-700/80 pt-5 flex items-center gap-3">
              <Award className="w-6 h-6 text-[var(--iris)]" />
              <span className="text-xs font-bold text-slate-300">
                100% Commitment to Patient Care Excellence
              </span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
