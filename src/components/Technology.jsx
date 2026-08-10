"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Layers, Filter, CheckCircle2 } from "lucide-react";
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
    category: "Refractive & LASIK Suites",
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
    category: "Diagnostic Equipment",
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
    category: "Surgical & Operating Systems",
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
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  // Compute unique categories and item counts dynamically
  const categoryCounts = {};
  displayList.forEach((tech) => {
    const cat = tech.category && typeof tech.category === "string" && tech.category.trim() !== ""
      ? tech.category.trim()
      : "Uncategorized";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoriesList = ["All", ...Object.keys(categoryCounts)];

  const filteredList = selectedCategory === "All"
    ? displayList
    : displayList.filter((tech) => {
        const cat = tech.category && typeof tech.category === "string" && tech.category.trim() !== ""
          ? tech.category.trim()
          : "Uncategorized";
        return cat === selectedCategory;
      });

  return (
    <section id="technology" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
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
          /* Main Layout: Sticky Left Sidebar (Desktop) + Horizontal Filter Bar (Mobile) + Technology Stack */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* MOBILE & TABLET HORIZONTAL FILTER PILLS (< 1024px) */}
            <div className="lg:hidden col-span-1 border-b border-[var(--line)] pb-4 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-3.5 h-3.5 text-[var(--iris)]" />
                <span className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
                  Filter Category
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {categoriesList.map((catName) => {
                  const count = catName === "All" ? displayList.length : (categoryCounts[catName] || 0);
                  const isSelected = selectedCategory === catName;

                  return (
                    <button
                      key={catName}
                      onClick={() => setSelectedCategory(catName)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--ink)] text-white shadow-md"
                          : "bg-white border border-[var(--line)] text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{catName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESKTOP LEFT STICKY SIDEBAR (lg:col-span-3) */}
            <div className="hidden lg:block lg:col-span-3 sticky top-28 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-[var(--line)] shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--fog)] text-[var(--iris)]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#2B1F1A] uppercase tracking-wider">
                      Categories
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#2B1F1A] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {categoriesList.length - 1} Total
                  </span>
                </div>

                <div className="space-y-1.5">
                  {categoriesList.map((catName) => {
                    const count = catName === "All" ? displayList.length : (categoryCounts[catName] || 0);
                    const isSelected = selectedCategory === catName;

                    return (
                      <button
                        key={catName}
                        onClick={() => setSelectedCategory(catName)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-[var(--ink)] text-white shadow-sm ring-1 ring-[var(--ink)] font-extrabold"
                            : "text-slate-700 hover:bg-[var(--fog)] hover:text-[#2B1F1A]"
                        }`}
                      >
                        <span className="truncate pr-2">{catName}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MAIN CONTENT AREA: FILTERED TECHNOLOGIES LIST (lg:col-span-9) */}
            <div className="col-span-1 lg:col-span-9 space-y-8 sm:space-y-10">
              
              {/* Category Active Subheader */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#2B1F1A] uppercase tracking-wider">
                    Showing:
                  </span>
                  <span className="text-xs font-black text-[var(--iris)] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-xs">
                    {selectedCategory}
                  </span>
                </div>

                <span className="text-xs font-black text-[#2B1F1A]">
                  {filteredList.length} {filteredList.length === 1 ? "Equipment" : "Equipments"} Found
                </span>
              </div>

              {filteredList.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-[var(--line)] shadow-xs">
                  <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-base font-extrabold text-[#2B1F1A]">No Technologies in this Category</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    There are no technologies currently listed under "{selectedCategory}". Please select another category.
                  </p>
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="mt-4 px-4 py-2 rounded-xl bg-[var(--ink)] text-white text-xs font-bold hover:bg-[var(--iris)] transition-colors cursor-pointer"
                  >
                    View All Technologies
                  </button>
                </div>
              ) : (
                <div className="space-y-8 sm:space-y-10">
                  {filteredList.map((tech, index) => {
                    const parsed = parseDescription(tech.description, tech.uses);
                    const isEven = index % 2 === 0;

                    return (
                      <motion.div
                        key={tech.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="glass-card bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md hover:border-[var(--iris)]/40 transition-all duration-300"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
                          
                          {/* Text Details Column */}
                          <div className={`md:col-span-7 flex flex-col justify-between space-y-4 ${
                            isEven ? "order-2 md:order-1" : "order-2 md:order-2"
                          }`}>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-extrabold text-[var(--iris)] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {tech.category || "Uncategorized"}
                                </span>
                              </div>
                              
                              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] mt-1 leading-tight">
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

          </div>
        )}

      </div>
    </section>
  );
}
