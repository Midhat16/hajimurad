"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Cpu, Layers, CheckCircle2, Sparkles, Building2 } from "lucide-react";
import TechnologyImageGallery from "@/components/TechnologyImageGallery";

const DEFAULT_TECHNOLOGIES = [
  {
    id: "default-1",
    name: "Femtosecond & Excimer Refractive Laser Suite",
    category: "Refractive & LASIK Suites",
    description: "Ultra-fast femtosecond laser technology for blade-free corneal flap creation and high-precision vision correction (LASIK / Contoura Vision). It works with microscopic accuracy to reshape the cornea and eliminate refractive errors.",
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
      "Customized wavefront-guided treatments (Contoura Vision)",
    ],
    specs: {
      "Laser Frequency": "500 Hz",
      "Pulse Duration": "Femtosecond Precision",
      "Flap Creation Time": "< 10 Seconds",
      "Eye Tracking": "6D Active Tracking System",
    },
  },
  {
    id: "default-2",
    name: "Optical Coherence Tomography (OCT)",
    category: "Diagnostic Equipment",
    description: "OCT is a non-invasive imaging technique that uses light waves to capture high-resolution, cross-sectional images of tissue, most commonly the retina and cornea. It works like ultrasound but uses light instead of sound, allowing resolution down to a few microns.",
    images: [
      "/images/hero-2.jpg",
      "/images/hero-3.jpg",
      "/images/hero-opd-examination.jpg",
    ],
    uses: [
      "Diagnosing and monitoring retinal diseases (macular degeneration, diabetic retinopathy)",
      "Vitreomacular traction assessment",
      "Macular hole & pucker detection",
      "Retinal vein/artery occlusion monitoring",
      "Central serous chorioretinopathy (CSCR)",
      "Anti-VEGF injection monitoring",
      "Retinal detachment assessment",
      "Glaucoma detection via nerve fiber layer thickness",
      "Pre/post-surgical eye evaluation",
      "OCT-Angiography for visualizing blood flow without dye injection",
    ],
    specs: {
      "Scan Speed": "85,000 A-scans/sec",
      "Axial Resolution": "3.9 Microns",
      "Biomarker Analysis": "AI-Assisted Layer Segmentation",
      "Angiography Mode": "Non-Invasive OCT-A Enabled",
    },
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
      "Active fluidics pressure control for chamber stability",
    ],
    specs: {
      "Ultrasound Technology": "Torsional Phaco",
      "Incisions Size": "1.8mm - 2.2mm",
      "Fluidics System": "Active Pressure Control",
      "Recovery Time": "Same-Day Discharge",
    },
  },
];

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

function TechnologyDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);

  useEffect(() => {
    async function loadTech() {
      if (!id) {
        setError("No technology ID provided.");
        setLoading(false);
        return;
      }

      // Check default fallback items first
      const defaultMatch = DEFAULT_TECHNOLOGIES.find((t) => t.id === id);
      if (defaultMatch) {
        setTech(defaultMatch);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "technologies", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setTech({ id: snap.id, ...snap.data() });
        } else {
          setError("Technology equipment not found.");
        }
      } catch (err) {
        console.error("Error fetching technology detail:", err);
        setError("Failed to load technology equipment details.");
      } finally {
        setLoading(false);
      }
    }

    loadTech();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-[#2B1F1A]">Loading Technology Details...</p>
      </div>
    );
  }

  if (error || !tech) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-md space-y-4">
          <Cpu className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-extrabold text-[#2B1F1A]">{error || "Technology Not Found"}</h2>
          <p className="text-xs text-slate-500">The requested technology detail is unavailable or may have been updated.</p>
          <Link
            href="/technologies"
            className="inline-flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris)] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Technologies Suite
          </Link>
        </div>
      </div>
    );
  }

  const parsed = parseDescription(tech.description, tech.uses);
  const imagesList = Array.isArray(tech.images) && tech.images.length > 0
    ? tech.images
    : (tech.imageUrl ? [tech.imageUrl] : []);

  return (
    <div className="pb-16 bg-slate-50/50">
      {/* Top Banner Section */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-xl mb-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 space-y-4">
          <Link
            href="/technologies"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#5EEAD4] hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Technologies Suite
          </Link>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 text-white px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#5EEAD4] shrink-0" /> {tech.category || "Diagnostic & Surgical"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {tech.name}
          </h1>
        </div>
      </section>

      {/* Main Details Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left/Main Column: Overview & Uses */}
            <div className="md:col-span-7 space-y-6">

              {/* Category & Title */}
              <div>
                <span className="text-[11px] font-extrabold text-[var(--iris)] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  {tech.category || "Uncategorized"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] mt-2 leading-tight">
                  {tech.name}
                </h2>
                <div className="w-16 h-1 bg-[var(--iris)] rounded-full mt-2" />
              </div>

              {/* Full Description Intro */}
              {parsed.intro && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Technology Overview
                  </h3>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line">
                    {parsed.intro}
                  </p>
                </div>
              )}

              {/* Full Uses List */}
              {parsed.uses && parsed.uses.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2B1F1A] flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-[var(--iris)]" /> Clinical Uses & Key Capabilities
                  </h3>
                  <ul className="space-y-2.5">
                    {parsed.uses.map((useItem, uIdx) => (
                      <li
                        key={uIdx}
                        className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-800 leading-snug"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{useItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance Specs */}
              {tech.specs && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--iris)]" /> Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(tech.specs).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {key}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: High-Res Image Gallery */}
            <div className="md:col-span-5 space-y-4 sticky top-28">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[var(--iris)]" /> Equipment Gallery
                </h3>
                <TechnologyImageGallery images={imagesList} name={tech.name} />
              </div>
            </div>

          </div>

          {/* Bottom Back Button */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-start">
            <Link
              href="/technologies"
              className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-[var(--iris)] bg-slate-100 px-5 py-3 rounded-xl border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Technologies Page
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function TechnologyDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-[#2B1F1A]">Loading Technology Details...</p>
        </div>
      }
    >
      <TechnologyDetailsContent />
    </Suspense>
  );
}
