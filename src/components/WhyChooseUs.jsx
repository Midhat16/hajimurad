"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Trophy, Users, Award, ShieldCheck, HeartHandshake, Eye } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Count-up counter component triggered on scroll in view
function Counter({ target, duration = 1500, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const animatedRef = useRef(false);

  useEffect(() => {
    if (isInView && !animatedRef.current) {
      animatedRef.current = true;
      let start = 0;
      const end = Number(target) || 0;
      const totalSteps = 60; // 60 frames
      const stepTime = duration / totalSteps;
      const increment = (end - start) / totalSteps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= totalSteps) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(Math.floor(start + increment * currentStep));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [isInView, target, duration]);

  // Nicely formats numbers (e.g. 45000 -> 45,000)
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return <span ref={ref}>{formatNumber(count)}{suffix}</span>;
}

const DEFAULT_WHY_CONTENT = {
  badgeText: "Pioneering Vision Science",
  heading: "Why Choose Haji Murad Eye Hospital Trust",
  description: "Haji Murad Eye Hospital is not just an eye hospital; it is a specialized center of vision science. We combine decades of experience with advanced diagnostics to resolve vision issues before they disrupt your life.",
  yearsExperience: 25,
  successfulSurgeries: 45000,
  certifiedSpecialists: 18,
  patientSuccessRate: 99.8,
  points: [
    {
      title: "Proper patient care",
      description: "Every laser and scanning machine we utilize is state-of-the-art and certified by international health boards.",
    },
    {
      title: "Early diagnosis & management",
      description: "Personalized outpatient care plans and a lifetime follow-up guarantee for all surgical procedures.",
    },
    {
      title: "Basic to advance treatment",
      description: "Using high-resolution wavefront imaging to construct highly precise customized profiles for your eyes.",
    },
  ],
};

const POINT_ICONS = [ShieldCheck, HeartHandshake, Eye];

export default function WhyChooseUs() {
  const [content, setContent] = useState(DEFAULT_WHY_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "siteContent", "whyChooseUs"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContent({
            ...DEFAULT_WHY_CONTENT,
            ...data,
            points: data.points && data.points.length > 0 ? data.points : DEFAULT_WHY_CONTENT.points,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn("WhyChooseUs subscription notice:", err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return (
    <section id="why-choose-us" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden w-full">
      {/* Dynamic blurred glow shapes */}
      <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-slate-100/40 blur-3xl pointer-events-none -translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT MAIN CONTENT AREA (8 COLS): HEADING -> 3 CARDS BELOW -> 4 STAT BLOCKS AT END ================= */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. HEADING & DESCRIPTION TEXT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <span className="inline-block text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3.5 py-1.5 rounded-full border border-[var(--line)] shadow-xs mb-3">
                {content.badgeText}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
                {content.heading}
              </h2>
              <p className="text-sm sm:text-base text-[var(--slate)] leading-relaxed font-medium max-w-2xl">
                {content.description}
              </p>
            </motion.div>

            {/* 2. THREE FEATURE CARDS REPOSITIONED DIRECTLY BELOW THE TEXT */}
            <div className="space-y-4 max-w-2xl">
              {content.points.map((point, index) => {
                const Icon = POINT_ICONS[index % POINT_ICONS.length] || ShieldCheck;
                const iconImageUrl = (point.iconUrl || point.icon || "").trim();
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[var(--line)] hover:border-[var(--iris)] shadow-xs hover:shadow-md transition-all duration-300 group"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl relative flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--iris)] ${
                        loading
                          ? "bg-slate-100"
                          : iconImageUrl
                          ? "bg-transparent"
                          : "bg-[var(--fog)] group-hover:bg-[var(--ink)] shadow-xs transition-colors duration-300 p-1.5"
                      }`}
                    >
                      {loading ? (
                        <div className="w-full h-full bg-slate-200/80 animate-pulse rounded-lg" />
                      ) : iconImageUrl ? (
                        <img
                          src={iconImageUrl}
                          alt={point.title || "Highlight Icon"}
                          style={{ objectFit: "contain" }}
                          className="w-full h-full transition-transform duration-500 ease-in-out group-hover:-scale-x-100"
                        />
                      ) : (
                        <Icon className="w-5 h-5 text-[var(--iris)] group-hover:text-white transition-all duration-500 ease-in-out group-hover:-scale-x-100" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#2B1F1A]">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[var(--slate)] leading-relaxed font-medium">
                        {point.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 3. FOUR STAT BLOCKS REARRANGED HORIZONTALLY IN 1 ROW AT THE END */}
            <div className="pt-4 border-t border-[var(--line)]/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Stat Block 1 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  className="glass-card bg-white p-4 rounded-2xl text-center space-y-1.5 flex flex-col items-center shadow-xs border border-[var(--line)] hover:border-[var(--iris)]/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--fog)] flex items-center justify-center text-[var(--iris)] group-hover:bg-[var(--iris)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
                    <Counter target={content.yearsExperience} suffix="+" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-[var(--iris)] uppercase tracking-wider leading-none">
                    Years of Expertise
                  </p>
                </motion.div>

                {/* Stat Block 2 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="glass-card bg-white p-4 rounded-2xl text-center space-y-1.5 flex flex-col items-center shadow-xs border border-[var(--line)] hover:border-[var(--iris)]/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--fog)] flex items-center justify-center text-[var(--iris)] group-hover:bg-[var(--iris)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
                    <Counter target={content.successfulSurgeries} suffix="+" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-[var(--iris)] uppercase tracking-wider leading-none">
                    Successful Surgeries
                  </p>
                </motion.div>

                {/* Stat Block 3 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                  className="glass-card bg-white p-4 rounded-2xl text-center space-y-1.5 flex flex-col items-center shadow-xs border border-[var(--line)] hover:border-[var(--iris)]/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--fog)] flex items-center justify-center text-[var(--iris)] group-hover:bg-[var(--iris)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
                    <Counter target={content.certifiedSpecialists} suffix="+" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-[var(--iris)] uppercase tracking-wider leading-none">
                    Certified Specialists
                  </p>
                </motion.div>

                {/* Stat Block 4 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
                  className="glass-card bg-white p-4 rounded-2xl text-center space-y-1.5 flex flex-col items-center shadow-xs border border-[var(--line)] hover:border-[var(--iris)]/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--fog)] flex items-center justify-center text-[var(--iris)] group-hover:bg-[var(--iris)] group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
                    <Counter target={content.patientSuccessRate} suffix="%" />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-[var(--iris)] uppercase tracking-wider leading-none">
                    Patient Success Rate
                  </p>
                </motion.div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (4 COLS): LEFT BLANK & EMPTY ================= */}
          <div className="hidden lg:block lg:col-span-4" />

        </div>
      </div>
    </section>
  );
}
