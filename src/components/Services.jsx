"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Sun, Eye, Activity, ShieldAlert, Smile, Calendar, ChevronRight } from "lucide-react";
import TiltCard from "./TiltCard";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const iconMap = {
  Sparkles,
  Sun,
  Eye,
  Activity,
  Smile,
  ShieldAlert,
};

const TARGET_ORDER_MAP = [
  { keywords: ["opd"], order: 1 },
  { keywords: ["diagnostic", "diagnostics"], order: 2 },
  { keywords: ["laser"], order: 3 },
  { keywords: ["therapeutic"], order: 4 },
  { keywords: ["refractive", "lasik", "prk"], order: 5 },
];

function getTargetOrder(docData, docId) {
  const textToMatch = `${docId} ${docData.title || ""} ${docData.name || ""}`.toLowerCase();
  for (const item of TARGET_ORDER_MAP) {
    if (item.keywords.some((kw) => textToMatch.includes(kw))) {
      return item.order;
    }
  }
  return docData.order || 99;
}

const DEFAULT_SERVICES = [
  {
    id: "opd",
    order: 1,
    title: "OPD",
    description: "Comprehensive outpatient eye care with expert consultations, advanced diagnostics, and personalized treatment for patients of all ages.",
    icon: "Eye",
    features: [
      "Expert Ophthalmologist Review",
      "Slit Lamp & Retinal Check",
      "Same-Day Prescription",
    ],
  },
  {
    id: "diagnostic",
    order: 2,
    title: "DIAGNOSTIC",
    description: "High-precision automated testing, OCT imaging, Corneal Topography, and Visual Field Analysis for early disease detection.",
    icon: "Activity",
    features: [
      "3D Spectral OCT Scan",
      "Automated Visual Field Testing",
      "Corneal Pachymetry",
    ],
  },
  {
    id: "laser",
    order: 3,
    title: "LASER",
    description: "Advanced Argon & YAG Laser treatments for Diabetic Retinopathy, Glaucoma, and Post-Cataract Capsulotomy.",
    icon: "Sun",
    features: [
      "YAG Laser Capsulotomy",
      "Selective Laser Trabeculoplasty",
      "Pan-Retinal Photocoagulation",
    ],
  },
  {
    id: "therapeutic-services",
    order: 4,
    title: "THERAPEUTIC SERVICES",
    description: "Personalized medical therapies and specialized care for chronic ocular diseases, corneal disorders, and retinal infections.",
    icon: "ShieldAlert",
    features: [
      "Vitreoretinal Therapy",
      "Intravitreal Anti-VEGF Injections",
      "Infection & Inflammation Care",
    ],
  },
  {
    id: "refractive-surgery",
    order: 5,
    title: "REFRACTIVE SURGERY",
    description: "Transforming your visual clarity with precise, state-of-the-art refractive surgery, Wavefront LASIK, and Custom PRK.",
    icon: "Sparkles",
    features: [
      "Blade-Free Femto-LASIK",
      "Custom Wavefront Guided",
      "Permanent Freedom from Glasses",
    ],
  },
];

export default function Services() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const servicesCol = collection(db, "services");
      const unsub = onSnapshot(
        servicesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const dataArray = snapshot.docs
              .map((docSnap) => {
                const data = docSnap.data();
                const expectedOrder = getTargetOrder(data, docSnap.id);
                
                // Auto-sync existing Firestore docs if order is missing or different
                if (data.order !== expectedOrder) {
                  try {
                    updateDoc(doc(db, "services", docSnap.id), { order: expectedOrder });
                  } catch (e) {
                    // Silent catch for permission or read-only modes
                  }
                }

                return {
                  id: docSnap.id,
                  order: expectedOrder,
                  ...data,
                };
              })
              .filter((svc) => svc.isDeleted !== true);

            // Sort strictly by order ascending
            dataArray.sort((a, b) => (a.order || 99) - (b.order || 99));

            setServices(dataArray);
          }
        },
        (error) => {
          console.warn("Firestore services fetch warning:", error.message);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn("Services subscription error:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || services.length === 0) return;
    const urlId = searchParams ? searchParams.get("id") : null;
    let targetId = urlId;

    if (!targetId && window.location.hash) {
      targetId = window.location.hash.replace("#", "");
    }

    if (targetId) {
      const decodedTarget = decodeURIComponent(targetId).toLowerCase();
      const matched = services.find(
        (s) =>
          (s.id && s.id.toLowerCase() === decodedTarget) ||
          (s.title && s.title.toLowerCase() === decodedTarget) ||
          (s.name && s.name.toLowerCase() === decodedTarget)
      );

      if (matched) {
        setActiveServiceId(matched.id);
        const cardElem = document.getElementById(`service-card-${matched.id}`);
        if (cardElem) {
          setTimeout(() => {
            cardElem.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      }
    }
  }, [searchParams, services]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 150, damping: 18 },
    },
  };

  return (
    <section id="services" className="py-14 lg:py-16 relative overflow-hidden bg-slate-900 min-h-screen">
      {/* Background Image with Clear View */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src="/images/services-bg.jpg"
          alt="Operation Theater Background"
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Subtle light overlay for sharp background & high contrast text */}
        <div 
          className="absolute inset-0 bg-white/25 backdrop-blur-[1px]" 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header (No wrapping white box container - rendered directly over background like Meet Our Doctors) */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-[11px] font-extrabold tracking-widest text-[#1E1433] uppercase bg-white px-3.5 py-1.5 rounded-full border border-black/10 shadow-xs">
              Department of Ophthalmology
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
              World-Class Eye Care Services
            </h2>
            <p className="mt-3.5 text-base sm:text-lg text-[#2B1F1A] font-normal leading-relaxed max-w-2xl mx-auto">
              Haji Murad Eye Hospital features dedicated sub-specialties to deliver highly personalized vision solutions, from standard screenings to the most complex microsurgical restorations.
            </p>
          </motion.div>
        </div>

        {/* Services Grid (Centered flex wrap with uniform card sizes) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-5 sm:gap-6 items-stretch"
        >
          {services.map((service, index) => {
            const IconComponent = typeof service.icon === "string" 
              ? (iconMap[service.icon] || Sparkles) 
              : (service.icon || Sparkles);

            const isActive = activeServiceId === service.id;

            return (
              <motion.div
                key={service.id || index}
                id={`service-card-${service.id}`}
                variants={cardVariants}
                className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[390px] h-[550px] flex flex-col"
                onClick={() => setActiveServiceId(service.id)}
              >
                <TiltCard
                  style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                  className={`rounded-3xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between h-full relative overflow-hidden transition-all duration-500 border shadow-lg ${
                    isActive
                      ? "ring-4 ring-[var(--iris)] border-2 border-[var(--iris)] shadow-2xl scale-[1.02] bg-white/40 backdrop-blur-md"
                      : "bg-white/40 backdrop-blur-md hover:bg-white/55 border-white/40 hover:border-white/60 shadow-md hover:shadow-xl"
                  }`}
                >
                  {/* Subtle inner corner highlight */}
                  <div
                    className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-[var(--ink)] to-[var(--iris)] rounded-bl-full transition-opacity duration-300 ${
                      isActive ? "opacity-30" : "opacity-[0.08] group-hover:opacity-[0.15]"
                    }`}
                  />
                  
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Icon Box */}
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--ink)] to-[var(--iris)] p-0.5 shadow-md flex items-center justify-center mb-4 transition-transform duration-300 flex-shrink-0 ${
                        isActive ? "scale-110" : ""
                      }`}
                    >
                      <div
                        className={`w-full h-full rounded-[14px] flex items-center justify-center transition-colors duration-300 ${
                          isActive
                            ? "bg-[var(--iris)] text-white"
                            : "bg-white/80 group-hover:bg-transparent text-[#1A1A1A] group-hover:text-white"
                        }`}
                      >
                        <IconComponent
                          className={`w-6 h-6 transition-colors duration-300 ${
                            isActive ? "text-white" : "text-[#1A1A1A] group-hover:text-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3
                      className={`text-lg sm:text-xl font-bold transition-colors duration-300 flex-shrink-0 ${
                        isActive
                          ? "text-[var(--iris)] font-extrabold text-xl sm:text-2xl"
                          : "text-[#1A1A1A] group-hover:text-[var(--iris)]"
                      }`}
                    >
                      {service.title}
                    </h3>
                    <p className="mt-1.5 text-[#2B1F1A] text-xs sm:text-sm leading-relaxed line-clamp-2 flex-shrink-0 font-medium">
                      {service.description}
                    </p>

                    {/* Features list (Uniform scrollable container for exact card heights) */}
                    {service.features && (
                      <ul className="mt-3 space-y-1.5 border-t border-black/10 pt-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {service.features.map((feat, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                isActive ? "bg-[var(--iris)] scale-125" : "bg-[var(--iris)]"
                              }`}
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Book Appointment Button pinned to bottom row */}
                  <div className="mt-auto pt-3 border-t border-black/10 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("open-appointment-modal", {
                              detail: { preSelectedService: service },
                            })
                          );
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:opacity-95 transition-opacity cursor-pointer border border-white/20"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Appointment</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                    </button>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
