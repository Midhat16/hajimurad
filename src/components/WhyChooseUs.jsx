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
  heading: "Setting New Milestones in Ophthalmic Excellence",
  description: "Haji Murad Eye Hospital is not just an eye clinic; it is a specialized center of vision science. We combine decades of experience with advanced diagnostics to resolve vision issues before they disrupt your life.",
  yearsExperience: 25,
  successfulSurgeries: 45000,
  certifiedSpecialists: 18,
  patientSuccessRate: 99.8,
  points: [
    {
      title: "FDA-Approved Surgical Tech",
      description: "Every laser and scanning machine we utilize is state-of-the-art and certified by international health boards.",
    },
    {
      title: "Patient-First Care Structure",
      description: "Personalized outpatient care plans and a lifetime follow-up guarantee for all surgical procedures.",
    },
    {
      title: "Advanced Cornea Topography",
      description: "Using high-resolution wavefront imaging to construct highly precise customized profiles for your eyes.",
    },
  ],
};

const POINT_ICONS = [ShieldCheck, HeartHandshake, Eye];

export default function WhyChooseUs() {
  const [content, setContent] = useState(DEFAULT_WHY_CONTENT);

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
      },
      (err) => console.warn("WhyChooseUs subscription notice:", err.message)
    );

    return () => unsub();
  }, []);

  return (
    <section id="why-choose-us" className="py-14 lg:py-16 bg-[#F4F7F5] relative overflow-hidden">
      {/* Dynamic blurred glow shapes */}
      <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-[#3E8E6E]/10 blur-3xl pointer-events-none -translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline and Key Points */}
          <div className="lg:col-span-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#D5E5DD]">
                {content.badgeText}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3D5C] tracking-tight leading-tight">
                {content.heading}
              </h2>
              <p className="text-base sm:text-lg text-[#3F4B4A] leading-relaxed">
                {content.description}
              </p>
            </motion.div>

            {/* List of Key Points */}
            <div className="space-y-4">
              {content.points.map((point, index) => {
                const Icon = POINT_ICONS[index % POINT_ICONS.length] || ShieldCheck;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-[#D5E5DD] hover:border-[#3E8E6E] shadow-xs transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B3D5C] transition-colors duration-300">
                      <Icon className="w-5 h-5 text-[#3E8E6E] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0B3D5C]">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[#3F4B4A] leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Statistics Grid */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              
              {/* Stat Card 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
                className="glass-card bg-white p-5 sm:p-6 rounded-3xl text-center space-y-2 flex flex-col items-center shadow-xs border border-[#D5E5DD]"
              >
                <div className="w-10 h-10 rounded-full bg-[#E8F0EC] flex items-center justify-center text-[#3E8E6E]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0B3D5C] tracking-tight">
                  <Counter target={content.yearsExperience} suffix="+" />
                </div>
                <p className="text-[11px] font-bold text-[#3E8E6E] uppercase tracking-widest leading-none">
                  Years of Expertise
                </p>
                <p className="text-[10px] sm:text-[11px] font-medium text-[#3F4B4A] pt-1 border-t border-[#D5E5DD]/60 w-full">
                  Pioneering eye surgeries
                </p>
              </motion.div>

              {/* Stat Card 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
                className="glass-card bg-white p-5 sm:p-6 rounded-3xl text-center space-y-2 flex flex-col items-center shadow-xs border border-[#D5E5DD]"
              >
                <div className="w-10 h-10 rounded-full bg-[#E8F0EC] flex items-center justify-center text-[#3E8E6E]">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0B3D5C] tracking-tight">
                  <Counter target={content.successfulSurgeries} suffix="+" />
                </div>
                <p className="text-[11px] font-bold text-[#3E8E6E] uppercase tracking-widest leading-none">
                  Successful Surgeries
                </p>
                <p className="text-[10px] sm:text-[11px] font-medium text-[#3F4B4A] pt-1 border-t border-[#D5E5DD]/60 w-full">
                  Cataract, LASIK, Retina
                </p>
              </motion.div>

              {/* Stat Card 3 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 80, delay: 0.3 }}
                className="glass-card bg-white p-5 sm:p-6 rounded-3xl text-center space-y-2 flex flex-col items-center shadow-xs border border-[#D5E5DD]"
              >
                <div className="w-10 h-10 rounded-full bg-[#E8F0EC] flex items-center justify-center text-[#3E8E6E]">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0B3D5C] tracking-tight">
                  <Counter target={content.certifiedSpecialists} suffix="+" />
                </div>
                <p className="text-[11px] font-bold text-[#3E8E6E] uppercase tracking-widest leading-none">
                  Certified Specialists
                </p>
                <p className="text-[10px] sm:text-[11px] font-medium text-[#3F4B4A] pt-1 border-t border-[#D5E5DD]/60 w-full">
                  Ex-Johns Hopkins, Harvard fellows
                </p>
              </motion.div>

              {/* Stat Card 4 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 80, delay: 0.4 }}
                className="glass-card bg-white p-5 sm:p-6 rounded-3xl text-center space-y-2 flex flex-col items-center shadow-xs border border-[#D5E5DD]"
              >
                <div className="w-10 h-10 rounded-full bg-[#E8F0EC] flex items-center justify-center text-[#3E8E6E]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0B3D5C] tracking-tight">
                  <Counter target={content.patientSuccessRate} suffix="%" />
                </div>
                <p className="text-[11px] font-bold text-[#3E8E6E] uppercase tracking-widest leading-none">
                  Patient Success Rate
                </p>
                <p className="text-[10px] sm:text-[11px] font-medium text-[#3F4B4A] pt-1 border-t border-[#D5E5DD]/60 w-full">
                  Independently audited index
                </p>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
