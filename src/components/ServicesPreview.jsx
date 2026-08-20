"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Activity, Zap, Stethoscope, Check, ArrowRight } from "lucide-react";

const SERVICES_DATA = [
  {
    id: "opd",
    title: "OPD Services",
    tabLabel: "OPD Services",
    icon: Eye,
    description:
      "Comprehensive outpatient consultations, visual acuity assessments, and specialized pediatric and adult eye examinations.",
    features: [
      "Qualitative & Quantitative Vision Assessment",
      "Orthoptic Assessment",
      "Consultation",
    ],
    image: "/images/service-opd.jpg",
    alt: "OPD Services Consultation & Assessment",
  },
  {
    id: "diagnostic",
    title: "Diagnostic Services",
    tabLabel: "Diagnostic Services",
    icon: Activity,
    description:
      "High-precision diagnostic imaging and non-invasive ocular testing for accurate detection of retinal, macular, and corneal conditions.",
    features: [
      "OCT Macula/RNFL",
      "B-SCAN",
      "Biometry",
    ],
    image: "/images/service-diagnostic.jpg",
    alt: "Diagnostic Services High-Precision Imaging",
  },
  {
    id: "laser",
    title: "Laser Services",
    tabLabel: "Laser Services",
    icon: Zap,
    description:
      "State-of-the-art retinal and anterior segment laser procedures designed for outpatient precision and rapid visual recovery.",
    features: [
      "YAG Laser Capsulotomy",
      "PRP",
      "360 Degree Laser Barrage",
    ],
    image: "/images/service-laser.jpg",
    alt: "Laser Services Ophthalmic Laser Treatment",
  },
  {
    id: "therapeutic",
    title: "Therapeutic Services",
    tabLabel: "Therapeutic Services",
    icon: Stethoscope,
    description:
      "Advanced medical and surgical therapies dedicated to resolving complex ocular diseases, cataracts, and vitreoretinal disorders.",
    features: [
      "Cataract Surgery",
      "Diabetic Retinopathy Treatment",
      "Vitreoretinal Surgery",
    ],
    image: "/images/service-therapeutic.jpg",
    alt: "Therapeutic Services Surgical Suite",
  },
];

export default function ServicesPreview() {
  const [activeTabId, setActiveTabId] = useState("opd");

  const activeService =
    SERVICES_DATA.find((svc) => svc.id === activeTabId) || SERVICES_DATA[0];

  return (
    <section id="services-preview" className="py-14 lg:py-18 bg-[var(--fog)] relative overflow-hidden">
      {/* Soft ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="mb-2">
              <span className="inline-block text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-4 py-1.5 rounded-full border border-[var(--line)] shadow-xs">
                Specialized Care
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight my-2">
              Our Core Clinical Services
            </h2>
            <p className="text-sm sm:text-base text-[var(--slate)] font-medium leading-relaxed max-w-2xl mx-auto mt-2">
              Explore our primary ophthalmic departments offering advanced diagnostic, laser, and therapeutic solutions for complete eye wellness.
            </p>
          </motion.div>
        </div>

        {/* 1. CENTERED COMPACT TABS ROW (Narrower cards grouped in a centered cluster, overlapping top border of content box) */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            {SERVICES_DATA.map((service) => {
              const IconComponent = service.icon;
              const isActive = service.id === activeTabId;

              return (
                <div key={service.id} className="relative w-[calc(50%-6px)] sm:w-40 md:w-44 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTabId(service.id)}
                    className={`group relative w-full py-6 sm:py-8 px-3 sm:px-4 rounded-[22px] min-h-[145px] sm:min-h-[165px] flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out cursor-pointer border overflow-hidden shadow-md ${
                      isActive
                        ? "bg-[#1E1433] text-white border-[#1E1433] shadow-2xl scale-[1.03]"
                        : "bg-white text-[#2B1F1A] border-[var(--line)] hover:border-[#1E1433]/70 hover:shadow-lg"
                    }`}
                  >
                    {/* Smooth 0.5s Top-to-Bottom Wipe Reveal Background on Hover for Inactive Tabs */}
                    {!isActive && (
                      <div
                        className="absolute inset-x-0 top-0 h-0 group-hover:h-full bg-[#1E1433] transition-all duration-500 ease-in-out z-0 pointer-events-none"
                      />
                    )}

                    <div
                      className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors duration-500 ease-in-out ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-[var(--fog)]/60 text-[var(--iris)] group-hover:bg-white/20 group-hover:text-white"
                      }`}
                    >
                      <IconComponent className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 stroke-[2.2]" />
                    </div>

                    <span
                      className={`relative z-10 text-xs sm:text-sm font-extrabold tracking-tight leading-snug transition-colors duration-500 ease-in-out ${
                        isActive ? "text-white" : "text-[#2B1F1A] group-hover:text-white"
                      }`}
                    >
                      {service.tabLabel}
                    </span>
                  </button>

                  {/* Animated Speech Bubble Pointer Triangle sliding smoothly across tabs with layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="servicesTabTriangle"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      aria-hidden="true"
                      className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#1E1433] z-30 pointer-events-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. CONTENT PANEL */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-28 shadow-xl border border-[var(--line)] w-full max-w-7xl mx-auto relative overflow-hidden z-10 -mt-16 sm:-mt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeService.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* LEFT COLUMN: Title, Description, Exactly 3 Features */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-[var(--iris)] bg-[var(--iris)]/10 px-3.5 py-1.5 rounded-md mb-1">
                    Department Overview
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight">
                    {activeService.title}
                  </h3>
                </div>

                <p className="text-sm sm:text-base lg:text-lg text-[var(--slate)] font-medium leading-relaxed">
                  {activeService.description}
                </p>

                {/* Limited Bullet-Point List of ONLY 3 features */}
                <div className="pt-2 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Highlights & Services
                  </h4>
                  <ul className="space-y-3.5">
                    {activeService.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base lg:text-lg font-semibold text-[#2B1F1A]">
                        <div className="w-6.5 h-6.5 rounded-full bg-[var(--iris)]/10 text-[var(--iris)] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[var(--iris)]/20">
                          <Check className="w-4 h-4 text-[var(--iris)] stroke-[3]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Text button inside container */}
                <div className="pt-3">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[var(--iris)] hover:text-[#E63946] transition-colors cursor-pointer group"
                  >
                    <span>View All Services</span>
                    <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* RIGHT COLUMN: Service Image */}
              <div className="lg:col-span-5 flex items-center">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-xl border border-[var(--line)] bg-white group">
                  <Image
                    src={activeService.image}
                    alt={activeService.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
