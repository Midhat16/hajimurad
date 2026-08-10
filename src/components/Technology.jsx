"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TechnologyImageGallery from "./TechnologyImageGallery";

function parseDescription(descriptionText = "", usesArray = null) {
  if (Array.isArray(usesArray) && usesArray.length > 0) {
    return {
      intro: descriptionText,
      uses: usesArray,
    };
  }

  if (!descriptionText) return { intro: "", uses: [] };

  const usesIndex = descriptionText.search(/uses:/i);
  let intro = descriptionText;
  let uses = [];

  if (usesIndex !== -1) {
    intro = descriptionText.substring(0, usesIndex).trim();
    const usesRaw = descriptionText.substring(usesIndex + 5).trim();
    uses = usesRaw
      .split(/•|-|\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  } else if (descriptionText.includes("•")) {
    const parts = descriptionText.split("•");
    intro = parts[0].trim();
    uses = parts.slice(1).map((item) => item.trim()).filter(Boolean);
  }

  return { intro, uses };
}

const DEFAULT_TECHNOLOGIES = [
  {
    id: "default-1",
    name: "Femtosecond & Excimer Refractive Laser Suite",
    description: "Ultra-fast femtosecond laser technology for blade-free corneal flap creation and high-precision vision correction (LASIK / Contoura Vision).",
    images: [
      "/images/hero-1.jpg",
      "/images/hero-operating-theater.jpg",
      "/images/hero-opd-examination.jpg",
      "/images/hero-building-exterior.jpg",
    ],
    uses: [
      "Blade-Free LASIK & Femto-LASIK procedures",
      "Precision corneal tissue reshaping for Myopia & Astigmatism",
      "Minimal recovery time with enhanced flap stability",
    ],
    order: 1,
  },
  {
    id: "default-2",
    name: "High-Definition Optical Coherence Tomography (OCT)",
    description: "Non-invasive optical biopsy producing cross-sectional micron-resolution images of the retina, macula, and optic nerve head.",
    images: [
      "/images/hero-2.jpg",
      "/images/hero-3.jpg",
      "/images/hero-opd-examination.jpg",
    ],
    uses: [
      "Early detection & staging of Glaucoma",
      "Diabetic Retinopathy and Macular Edema scanning",
      "Pre- and post-operative retinal thickness monitoring",
    ],
    order: 2,
  },
  {
    id: "default-3",
    name: "Advanced Phacoemulsification Cataract System",
    description: "Micro-incision ultrasonic cataract surgery system with active fluidics for minimal corneal energy impact and rapid visual recovery.",
    images: [
      "/images/hero-operating-theater.jpg",
      "/images/hero-1.jpg",
      "/images/hero-opd-examination.jpg",
    ],
    uses: [
      "Micro-incision (MICS) cataract extraction",
      "Premium Toric and Multifocal intraocular lens insertion",
      "Safe surgery under topical drop anesthesia",
    ],
    order: 3,
  },
];

export default function Technology() {
  const [techList, setTechList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "technologies"),
        (snapshot) => {
          const dataArray = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          // Sort by order ascending
          dataArray.sort((a, b) => (a.order || 99) - (b.order || 99));
          setTechList(dataArray);
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore technologies fetch warning:", error.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn("Firestore initialization error:", err);
      setLoading(false);
    }
  }, []);

  const displayList = techList.length > 0 ? techList : DEFAULT_TECHNOLOGIES;

  return (
    <section id="technology" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3.5 py-1.5 rounded-full border border-[var(--line)] shadow-xs">
              Diagnostic & Surgical Suite
            </span>
            <h2 className="mt-3.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
              Pioneering Ophthalmic Technology
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--slate)] leading-relaxed">
              We invest in state-of-the-art medical hardware to deliver surgeries with maximum safety margins, microscopic precision, and rapid visual recovery.
            </p>
          </motion.div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#2B1F1A]">Loading Technologies Suite...</p>
          </div>
        ) : displayList.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-10 text-center border border-[var(--line)] max-w-xl mx-auto shadow-xs">
            <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-[#2B1F1A]">Technologies Information Coming Soon</h3>
            <p className="text-xs text-slate-400 mt-1">
              Our clinical hardware equipment list is being updated. Please check back shortly.
            </p>
          </div>
        ) : (
          /* Continuous Vertical Technology Stack */
          <div className="space-y-8 sm:space-y-12">
            {displayList.map((tech, index) => {
              const parsed = parseDescription(tech.description, tech.uses);
              const Icon = typeof tech.icon === "function" ? tech.icon : Cpu;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={tech.id || index}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass-card bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[var(--line)] shadow-md hover:border-[var(--iris)]/40 transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
                    
                    {/* Text Details Column */}
                    <div className={`md:col-span-7 flex flex-col justify-between space-y-4 ${
                      isEven ? "order-2 md:order-1" : "order-2 md:order-2"
                    }`}>
                      <div>
                        <span className="text-xs font-bold text-[var(--iris)] uppercase tracking-widest block">
                          Equipment Specs & Performance
                        </span>
                        
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] mt-1.5 leading-tight">
                          {tech.name}
                        </h3>
                        <div className="w-12 h-1 bg-[var(--iris)] rounded-full mt-2 mb-4" />

                        {/* Intro Paragraph */}
                        {parsed.intro && (
                          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                            {parsed.intro}
                          </p>
                        )}

                        {/* Uses Bullet-Point List */}
                        {parsed.uses && parsed.uses.length > 0 && (
                          <div className="mt-5 space-y-2.5">
                            <h4 className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
                              Uses:
                            </h4>
                            <ul className="space-y-2">
                              {parsed.uses.map((useItem, uIdx) => (
                                <li
                                  key={uIdx}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-700 leading-snug"
                                >
                                  <span className="w-2 h-2 rounded-full bg-[var(--iris)] mt-1.5 shrink-0" />
                                  <span>{useItem}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Specifications Grid */}
                        {tech.specs && (
                          <div className="mt-5 space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Performance Telemetry
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.entries(tech.specs).map(([key, val]) => (
                                <div key={key} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {key}
                                  </span>
                                  <span className="text-sm font-bold text-slate-700 mt-0.5">
                                    {val}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Column */}
                    <div className={`md:col-span-5 w-full ${
                      isEven ? "order-1 md:order-2" : "order-1 md:order-1"
                    }`}>
                      <TechnologyImageGallery
                        images={
                          Array.isArray(tech.images) && tech.images.length > 0
                            ? tech.images
                            : (tech.imageUrl ? [tech.imageUrl] : [])
                        }
                        name={tech.name}
                      />
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
