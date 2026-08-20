"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  Building2,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Gift,
  Percent,
  FileText,
  User,
  Mail,
  Phone,
  School,
  Calendar,
  Send,
  X,
  AlertCircle,
  Check,
  ExternalLink,
  PlayCircle,
  Video,
  Quote,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const YoutubeSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

function renderVideoButton(url) {
  if (!url || typeof url !== "string") return null;
  const targetUrl = url.trim();
  if (!targetUrl) return null;

  const lower = targetUrl.toLowerCase();
  let label = "Watch Program Video Overview";
  let iconElement = <PlayCircle className="w-4 h-4 shrink-0" />;
  let bgClasses = "bg-[#1E1433] text-white hover:opacity-95 shadow-md border border-white/20";

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    label = "Watch Video on YouTube";
    iconElement = <YoutubeSvg />;
    bgClasses = "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 border border-red-500";
  } else if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
    label = "Watch Reel on Instagram";
    iconElement = <InstagramSvg />;
    bgClasses = "bg-[#1E1433] hover:opacity-95 text-white shadow-md border border-pink-400";
  } else if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    label = "Watch Video on Facebook";
    iconElement = <FacebookSvg />;
    bgClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-blue-500";
  }

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${bgClasses}`}
    >
      {iconElement}
      <span>{label}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0 ml-0.5" />
    </a>
  );
}

const DEFAULT_INFO_BOXES = [
  {
    id: 1,
    title: "100% Free Internship",
    subtitle: "No Tuition or Hidden Fees",
    icon: Gift,
    color: "from-blue-600/10 via-sky-500/10 to-blue-700/10 text-blue-950 border-blue-200 hover:border-blue-400",
    iconBg: "bg-[#1E1433] text-white",
  },
  {
    id: 2,
    title: "90% Attendance",
    subtitle: "Mandatory Session Requirement",
    icon: Percent,
    color: "from-blue-600/10 via-sky-500/10 to-blue-700/10 text-blue-950 border-blue-200 hover:border-blue-400",
    iconBg: "bg-[#1E1433] text-white",
  },
  {
    id: 3,
    title: "Theoretical & Clinical",
    subtitle: "Hands-on Practical Training",
    icon: BookOpen,
    color: "from-blue-600/10 via-sky-500/10 to-blue-700/10 text-blue-950 border-blue-200 hover:border-blue-400",
    iconBg: "bg-[#1E1433] text-white",
  },
  {
    id: 4,
    title: "Certification on Completion",
    subtitle: "Official Hospital Credentials",
    icon: Award,
    color: "from-blue-600/10 via-sky-500/10 to-blue-700/10 text-blue-950 border-blue-200 hover:border-blue-400",
    iconBg: "bg-[#1E1433] text-white",
  },
];

// Auto-Rotating Slider Component for Internship Media Gallery (5s interval, captions, thumbnail row & portaled lightbox)
function InternshipGallerySlider({ images, title = "Program & Practical Training Media Gallery" }) {
  const normalized = (images || [])
    .map((item) => {
      if (typeof item === "string") {
        return { imageUrl: item.trim(), caption: "" };
      }
      if (item && typeof item === "object") {
        return {
          imageUrl: (item.imageUrl || item.url || item.src || "").trim(),
          caption: (item.caption || item.title || "").trim(),
        };
      }
      return { imageUrl: "", caption: "" };
    })
    .filter((item) => Boolean(item.imageUrl));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (normalized.length > 1 && !isLightboxOpen) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % normalized.length);
      }, 5000);
    }
  }, [normalized.length, isLightboxOpen]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetTimer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + normalized.length) % normalized.length);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % normalized.length);
      }
    };

    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, normalized.length]);

  if (normalized.length === 0) return null;

  const currentItem = normalized[currentIndex] || normalized[0];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + normalized.length) % normalized.length);
    resetTimer();
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % normalized.length);
    resetTimer();
  };

  const handleThumbnailClick = (idx, e) => {
    e?.stopPropagation();
    setCurrentIndex(idx);
    resetTimer();
  };

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--iris)] flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5" /> Program & Practical Training Media Gallery
          </h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            Real practical training, equipment exposure & laboratory sessions
          </p>
        </div>

        {normalized.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[var(--ink)] hover:bg-slate-50 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Previous Photo"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <span className="text-xs font-black text-slate-600 px-1 font-mono">
              {currentIndex + 1} / {normalized.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[var(--ink)] hover:bg-slate-50 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Next Photo"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Slide Container */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="w-full h-[280px] sm:h-[360px] md:h-[420px] rounded-3xl bg-slate-900/5 border border-slate-200/80 relative group cursor-pointer select-none flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full flex-1 flex items-center justify-center relative min-h-0 overflow-hidden"
          >
            <Image
              src={currentItem.imageUrl}
              alt={currentItem.caption || `Clinical Program Photo ${currentIndex + 1} - Haji Murad Eye Hospital Trust`}
              width={800}
              height={420}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 rounded-3xl"
              onError={(e) => {
                e.currentTarget.src = "/images/haji-murad-main-campus.webp";
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Hover Zoom Overlay Badge */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center rounded-3xl bg-black/20 backdrop-blur-xs">
          <span className="bg-[var(--ink)]/90 text-white text-xs font-extrabold px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <Maximize2 className="w-4 h-4 text-[#5EEAD4]" /> Click to Enlarge (Fullscreen)
          </span>
        </div>

        {/* Caption Banner at Bottom of Main Image */}
        <div className="p-4 bg-slate-950/80 text-white z-10">
          {currentItem.caption ? (
            <p className="text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-xs">
              {currentItem.caption}
            </p>
          ) : (
            <p className="text-xs font-semibold text-slate-300 italic">
              Practical Training & Equipment Session #{currentIndex + 1}
            </p>
          )}
        </div>
      </div>

      {/* Horizontal Thumbnail Row Below Main Image */}
      {normalized.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 no-scrollbar">
          {normalized.map((item, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleThumbnailClick(idx, e)}
                className={`relative w-20 h-16 sm:w-24 sm:h-20 rounded-2xl overflow-hidden transition-all duration-300 shrink-0 cursor-pointer p-0.5 bg-white ${isSelected
                  ? "border-[3px] border-[var(--iris)] shadow-md scale-105"
                  : "border border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400"
                  }`}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.caption || `Clinical Training Thumbnail ${idx + 1} - Haji Murad Eye Hospital Trust`}
                  width={96}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "/images/haji-murad-main-campus.webp";
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal (Portaled) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isLightboxOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 z-[999999] w-screen h-screen bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
              >
                {/* Header */}
                <div
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 z-30 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <h3 className="text-white text-base sm:text-lg font-extrabold">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Photo {currentIndex + 1} of {normalized.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(false);
                    }}
                    className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white border border-white/30 transition-all cursor-pointer shadow-lg"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Main Lightbox Body */}
                <div
                  className="flex-1 w-full relative flex items-center justify-center p-4 sm:p-8 min-h-0 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {normalized.length > 1 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-4 z-30 p-3 sm:p-4 rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20 shadow-2xl hover:scale-110 cursor-pointer"
                    >
                      <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full flex flex-col items-center justify-center max-h-[82vh]"
                    >
                      <Image
                        src={currentItem.imageUrl}
                        alt={currentItem.caption || "Clinical Internship & Training Photo - Haji Murad Eye Hospital Trust"}
                        width={1200}
                        height={800}
                        loading="lazy"
                        decoding="async"
                        style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "72vh", width: "auto", height: "auto" }}
                        className="rounded-2xl border border-white/10"
                        onError={(e) => {
                          e.currentTarget.src = "/images/haji-murad-main-campus.webp";
                        }}
                      />
                      {currentItem.caption && (
                        <div className="mt-3 p-3 bg-slate-900/90 border border-white/10 rounded-xl text-center max-w-xl">
                          <p className="text-xs sm:text-sm font-bold text-slate-100">
                            {currentItem.caption}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {normalized.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-4 z-30 p-3 sm:p-4 rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20 shadow-2xl hover:scale-110 cursor-pointer"
                    >
                      <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function InternshipDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Enrollment Modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());
  const [coverMessage, setCoverMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchInternship() {
      try {
        let foundProgram = null;

        // 1. Check target document 1: 'internships/details' (programs array)
        try {
          const detailsRef = doc(db, "internships", "details");
          const detailsSnap = await getDoc(detailsRef);
          if (detailsSnap.exists()) {
            const data = detailsSnap.data();
            const progs = Array.isArray(data.programs) ? data.programs : [];
            const match = progs.find((p) => p.id === id);
            if (match) {
              foundProgram = match;
            }
          }
        } catch (e0) {
          console.warn("Notice fetching details doc:", e0);
        }

        // 2. Try root collection doc (if not found in details)
        if (!foundProgram) {
          try {
            const rootRef = doc(db, "internships", id);
            const docSnap = await getDoc(rootRef);
            if (docSnap.exists() && docSnap.id !== "details" && docSnap.id !== "imageSlider") {
              foundProgram = { id: docSnap.id, ...docSnap.data() };
            }
          } catch (e1) {
            console.warn("Root doc fetch notice:", e1);
          }
        }

        // 3. Try subcollection path
        if (!foundProgram) {
          try {
            const subRef = doc(db, "internships", "internshipdetail", "programs", id);
            const subSnap = await getDoc(subRef);
            if (subSnap.exists()) {
              foundProgram = { id: subSnap.id, ...subSnap.data() };
            }
          } catch (e2) {
            console.warn("Subcollection doc fetch notice:", e2);
          }
        }

        if (foundProgram) {
          setInternship(foundProgram);
        } else {
          setError("Internship program not found.");
        }
      } catch (err) {
        console.warn("Error fetching internship details:", err);
        setError("Failed to load internship details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInternship();
  }, [id]);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!applicantName.trim() || !email.trim() || !phone.trim() || !instituteName.trim() || !graduationYear) {
      setFormError("Please complete all required fields (Name, Email, Phone, Institute, Graduation Year).");
      return;
    }

    setIsSubmitting(true);

    try {
      let appId = "app-" + Date.now();
      try {
        const appRef = await addDoc(collection(db, "internshipApplications"), {
          applicantName: applicantName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          instituteName: instituteName.trim(),
          graduationYear: String(graduationYear).trim(),
          coverMessage: coverMessage.trim(),
          internshipId: id || "",
          internshipTitle: internship?.title || "General Internship",
          department: internship?.department || "General",
          status: "pending",
          read: false,
          createdAt: serverTimestamp(),
        });
        if (appRef?.id) appId = appRef.id;
      } catch (dbErr) {
        console.warn("Notice: internshipApplications client addDoc permission notice:", dbErr);
      }

      try {
        await addDoc(collection(db, "notifications"), {
          title: `New Internship Application: ${applicantName.trim()}`,
          message: `Applied for ${internship?.title || "Internship"} from ${instituteName.trim()} (${graduationYear})`,
          type: "internship_application",
          applicationId: appId,
          recipient_type: "admin",
          is_read: false,
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn("Notice: Admin notification addDoc permission notice:", notifErr);
      }

      try {
        await addDoc(collection(db, "activityLog"), {
          action: "internship_application_submitted",
          applicantName: applicantName.trim(),
          internshipTitle: internship?.title || "",
          department: internship?.department || "",
          message: `${applicantName.trim()} (${instituteName.trim()}) submitted an internship application for ${internship?.title || "Internship"}`,
          read: false,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn("Notice: activityLog addDoc permission notice:", logErr);
      }

      fetch("/api/internship-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INTERNSHIP_APPLICATION_RECEIVED",
          data: {
            applicantName: applicantName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            instituteName: instituteName.trim(),
            graduationYear: String(graduationYear).trim(),
            coverMessage: coverMessage.trim(),
            internshipTitle: internship?.title || "General Internship",
            department: internship?.department || "General",
          },
        }),
      }).catch((emailErr) => console.warn("Email notification error:", emailErr));

      setFormSuccess(true);
    } catch (err) {
      console.warn("Submit application notice:", err);
      setFormSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
            Loading Program Specifications...
          </p>
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-[var(--line)] text-center space-y-4 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-[#2B1F1A]">Program Not Found</h2>
          <p className="text-xs text-[var(--slate)] font-semibold">
            {error || "The internship program you are looking for does not exist or has been removed."}
          </p>
          <Link
            href="/academics/internships"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris-dark)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Internships Listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Banner / Breadcrumb Bar */}
      <section className="bg-[#1E1433] text-white py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-xl mb-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 space-y-4">
          <Link
            href="/academics/internships"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#5EEAD4] hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Internships
          </Link>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 text-white px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#5EEAD4] shrink-0" /> {internship.department || "Medical"}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {internship.duration || "3 Months"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {internship.title}
          </h1>
        </div>
      </section>

      {/* Main Details Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">

        {/* Program Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Department</span>
            <span className="font-extrabold text-[#2B1F1A] text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[var(--iris)] shrink-0" /> {internship.department || "Medical"}
            </span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Duration</span>
            <span className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" /> {internship.duration || "3 Months"}
            </span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Timing</span>
            <span className="font-extrabold text-[#2B1F1A] text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--iris)] shrink-0" /> {internship.timing || "08:00 AM - 02:00 PM"}
            </span>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-500 block">Certificate</span>
            <span className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> Official Award
            </span>
          </div>
        </div>

        {/* Full Description & Overview Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--iris)] flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <FileText className="w-4.5 h-4.5" /> Program Overview & Key Objectives
          </h3>
          <p className="text-sm sm:text-base text-slate-800 font-semibold leading-relaxed whitespace-pre-line">
            {internship.description}
          </p>

          {/* Video / Media Link CTA Button */}
          {(internship.videoUrl || internship.videoLink) && (
            <div className="pt-2 flex items-center justify-start">
              {renderVideoButton(internship.videoUrl || internship.videoLink)}
            </div>
          )}
        </div>

        {/* KEY PROGRAM HIGHLIGHTS */}
        {Array.isArray(internship.highlights) && internship.highlights.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-800 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-rose-600" /> Key Program Highlights
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {internship.highlights.length} Highlights
              </span>
            </div>

            {internship.highlights.some((h) => h.description && h.description.trim()) ? (
              <div className="space-y-3.5">
                {internship.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 bg-[#a6c4dc] p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="shrink-0 flex items-center justify-center p-1 rounded-2xl border border-rose-500 bg-white/80 shadow-2xs transition-transform group-hover:scale-105 duration-300 min-w-[44px] min-h-[44px]">
                      <Image
                        src="/icons/highlight-default.png"
                        alt={item.title}
                        width={44}
                        height={44}
                        loading="lazy"
                        className="max-w-[44px] max-h-[44px] w-auto h-auto object-contain block"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-serif font-extrabold text-[#1e293b] leading-tight">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {internship.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 bg-[#b5cee4] p-3.5 rounded-2xl border border-slate-300 shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="shrink-0 flex items-center justify-center p-1 rounded-2xl border border-rose-500 bg-white/80 shadow-2xs transition-transform group-hover:scale-105 duration-300 min-w-[40px] min-h-[40px]">
                      <Image
                        src="/icons/highlight-default.png"
                        alt={item.title}
                        width={40}
                        height={40}
                        loading="lazy"
                        className="max-w-[40px] max-h-[40px] w-auto h-auto object-contain block"
                      />
                    </div>
                    <h4 className="text-sm font-serif font-extrabold text-[#1e293b] leading-snug min-w-0">
                      {item.title}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROGRAM QUOTES / GUARANTEES & FEATURES */}
        {Array.isArray(internship.quotes) && internship.quotes.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--iris)] flex items-center gap-2">
              <Quote className="w-4.5 h-4.5 text-[var(--iris)]" /> Program Guarantees & Features
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {internship.quotes.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="shrink-0 flex items-center justify-center p-1 rounded-2xl border border-rose-500 bg-white/80 shadow-2xs transition-transform group-hover:scale-105 duration-300 min-w-[44px] min-h-[44px]">
                    <Image
                      src="/icons/feature-default.png"
                      alt={q.title}
                      width={44}
                      height={44}
                      loading="lazy"
                      className="max-w-[44px] max-h-[44px] w-auto h-auto object-contain block"
                    />
                  </div>

                  <h4 className="text-xs sm:text-sm font-extrabold text-[#2B1F1A] leading-snug min-w-0 flex-1">
                    {q.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 PROGRAM GUARANTEE INFO BOXES */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--iris)] flex items-center gap-2">
            <Award className="w-4.5 h-4.5" /> Additional Program Benefits
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {DEFAULT_INFO_BOXES.map((box) => {
              const IconComp = box.icon;
              return (
                <div
                  key={box.id}
                  className={`bg-white hover:bg-slate-50 ${box.color} p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center text-center space-y-2.5 shadow-xs hover:shadow-md transition-all group`}
                >
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${box.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-black text-[#2B1F1A] tracking-tight leading-snug">
                      {box.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-600 leading-tight">
                      {box.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eligibility & Qualifications Section */}
        {internship.requirements && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--iris)] flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle2 className="w-4.5 h-4.5" /> Eligibility & Candidate Requirements
            </h3>
            <p className="text-sm text-slate-800 font-semibold leading-relaxed whitespace-pre-line">
              {internship.requirements}
            </p>
          </div>
        )}

        {/* Bottom Action Footer */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">
              Official Certification Provided Upon Successful Completion
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/academics/internships"
              className="w-full sm:w-auto text-center px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-extrabold hover:bg-slate-100 transition-colors"
            >
              Back to Listing
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowEnrollModal(true);
                setFormError("");
                setFormSuccess(false);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#1E1433] hover:opacity-95 text-white px-7 py-3.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-xl transition-all cursor-pointer border border-white/20"
            >
              <GraduationCap className="w-5 h-5 text-[#5EEAD4]" />
              <span>Enroll Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* ENROLLMENT MODAL ON DETAILS PAGE */}
      <AnimatePresence>
        {showEnrollModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl max-w-xl w-full relative space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
                    Direct Registration
                  </span>
                  <h3 className="text-xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
                    Apply for {internship.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-[#2B1F1A]">Application Submitted Successfully!</h4>
                  <p className="text-xs text-slate-600 font-semibold max-w-md mx-auto leading-relaxed">
                    Thank you for applying. Our Academic Admissions Committee will review your qualifications and contact you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowEnrollModal(false)}
                    className="inline-flex items-center justify-center gap-2 bg-[var(--ink)] text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:bg-[var(--iris-dark)] transition-all cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnrollSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Ayesha Khan"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[var(--iris)] bg-slate-50/50 text-[#2B1F1A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="ayesha@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[var(--iris)] bg-slate-50/50 text-[#2B1F1A]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                        Phone / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="+92 300 1234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[var(--iris)] bg-slate-50/50 text-[#2B1F1A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                        Graduation / Passing Year <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2024"
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[var(--iris)] bg-slate-50/50 text-[#2B1F1A]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                      University / College Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. King Edward Medical University"
                        value={instituteName}
                        onChange={(e) => setInstituteName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[var(--iris)] bg-slate-50/50 text-[#2B1F1A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                      Additional Message / Cover Statement (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Briefly state your academic background or why you are interested in this clinical internship..."
                      value={coverMessage}
                      onChange={(e) => setCoverMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[var(--iris)] bg-slate-50/50 text-[#2B1F1A]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEnrollModal(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#5EEAD4]" />
                      <span>{isSubmitting ? "Submitting Application..." : "Submit Application"}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function InternshipDetailsClient() {
  return (
    <main className="min-h-screen bg-[var(--fog)]/30">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto py-20 px-4 text-center">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-extrabold text-[#2B1F1A]">Loading Internship Specifications...</p>
          </div>
        }
      >
        <InternshipDetailsContent />
      </Suspense>
    </main>
  );
}
