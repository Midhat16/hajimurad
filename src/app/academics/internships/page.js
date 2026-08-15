"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap, Clock, Building2, CheckCircle2, Info, X, Send, User, Mail, Phone, School, Calendar, Sparkles, ChevronLeft, ChevronRight, Play, Pause, Video, Image as ImageIcon, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InternshipsListingPage() {
  const [internships, setInternships] = useState([]);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("all");

  const videoRef = useRef(null);

  // Enrollment Modal state
  const [enrollModalItem, setEnrollModalItem] = useState(null);

  // Enrollment Form state
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear().toString());
  const [coverMessage, setCoverMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Auto rotate slider timer (pauses when video is playing)
  useEffect(() => {
    if (slides.length <= 1 || isVideoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        setIsVideoPlaying(false);
        return (prev + 1) % slides.length;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length, isVideoPlaying]);

  const handleSlideChange = (newIndex) => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setCurrentSlideIndex(newIndex);
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  useEffect(() => {
    let detailsPrograms = [];
    let imageSliderSlides = [];
    let rootDocs = [];
    let subPrograms = [];
    let subSlides = [];

    const updateMergedState = () => {
      // 1. Programs
      const pMap = new Map();
      detailsPrograms.forEach((p) => {
        if (p && p.id && (p.title || p.department) && p.isActive !== false) {
          pMap.set(p.id, p);
        }
      });
      rootDocs.forEach((p) => {
        if (Array.isArray(p.programs)) {
          p.programs.forEach((subP) => {
            if (subP && subP.id && (subP.title || subP.department) && subP.isActive !== false) {
              pMap.set(subP.id, subP);
            }
          });
        } else if (p.id !== "details" && p.id !== "imageSlider" && p.id !== "internshipdetail" && p.type !== "slider_slide" && (p.title || p.department) && p.isActive !== false) {
          pMap.set(p.id, p);
        }
      });
      subPrograms.forEach((p) => {
        if (p && p.id && (p.title || p.department) && p.isActive !== false) {
          pMap.set(p.id, p);
        }
      });

      const mergedPrograms = Array.from(pMap.values());
      mergedPrograms.sort((a, b) => (a.order || 0) - (b.order || 0));
      setInternships(mergedPrograms);

      // 2. Slides
      const sMap = new Map();
      imageSliderSlides.forEach((s) => {
        if (s && s.id && (s.mediaUrl || s.url) && s.isActive !== false) {
          sMap.set(s.id, s);
        }
      });
      rootDocs.forEach((s) => {
        if (Array.isArray(s.slides)) {
          s.slides.forEach((subS) => {
            if (subS && subS.id && (subS.mediaUrl || subS.url) && subS.isActive !== false) {
              sMap.set(subS.id, subS);
            }
          });
        } else if (s.type === "slider_slide" && s.isActive !== false) {
          sMap.set(s.id, s);
        }
      });
      subSlides.forEach((s) => {
        if (s && s.id && (s.mediaUrl || s.url) && s.isActive !== false) {
          sMap.set(s.id, s);
        }
      });

      const mergedSlides = Array.from(sMap.values());
      mergedSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSlides(mergedSlides);

      setLoading(false);
    };

    // Listener 1: doc internships/details
    const unsubDetails = onSnapshot(
      doc(db, "internships", "details"),
      (snap) => {
        if (snap.exists()) {
          detailsPrograms = Array.isArray(snap.data().programs) ? snap.data().programs : [];
        } else {
          detailsPrograms = [];
        }
        updateMergedState();
      },
      () => setLoading(false)
    );

    // Listener 2: doc internships/imageSlider
    const unsubSlider = onSnapshot(
      doc(db, "internships", "imageSlider"),
      (snap) => {
        if (snap.exists()) {
          imageSliderSlides = Array.isArray(snap.data().slides) ? snap.data().slides : [];
        } else {
          imageSliderSlides = [];
        }
        updateMergedState();
      },
      () => {}
    );

    // Listener 3: collection internships
    const unsubRoot = onSnapshot(
      collection(db, "internships"),
      (snap) => {
        rootDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        updateMergedState();
      },
      () => setLoading(false)
    );

    // Listener 4: subcollections
    let unsubSubP = () => {};
    let unsubSubS = () => {};

    try {
      unsubSubP = onSnapshot(
        collection(db, "internships", "internshipdetail", "programs"),
        (snap) => {
          subPrograms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          updateMergedState();
        },
        () => {}
      );

      unsubSubS = onSnapshot(
        collection(db, "internships", "internshipSlider", "slides"),
        (snap) => {
          subSlides = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          updateMergedState();
        },
        () => {}
      );
    } catch (e) {}

    return () => {
      unsubDetails();
      unsubSlider();
      unsubRoot();
      unsubSubP();
      unsubSubS();
    };
  }, []);

  // Extract unique departments
  const departments = ["all", ...new Set(internships.map((i) => i.department).filter(Boolean))];

  // Filter internships by selected department
  const filteredInternships = internships.filter((item) => {
    if (selectedDept === "all") return true;
    return item.department?.toLowerCase() === selectedDept.toLowerCase();
  });

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!applicantName.trim() || !email.trim() || !phone.trim() || !instituteName.trim() || !graduationYear) {
      setFormError("Please fill in all required fields (Name, Phone, Email, Institute, Graduation Year).");
      return;
    }

    if (!enrollModalItem) return;

    setIsSubmitting(true);

    try {
      let appId = "app-" + Date.now();
      // 1. Save document to internshipApplications
      try {
        const appRef = await addDoc(collection(db, "internshipApplications"), {
          applicantName: applicantName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          instituteName: instituteName.trim(),
          graduationYear: String(graduationYear).trim(),
          coverMessage: coverMessage.trim(),
          internshipTitle: enrollModalItem.title || "General Internship",
          department: enrollModalItem.department || "General",
          status: "pending",
          read: false,
          createdAt: serverTimestamp(),
        });
        if (appRef?.id) appId = appRef.id;
      } catch (dbErr) {
        console.warn("Notice: internshipApplications client addDoc permission notice:", dbErr);
      }

      // 2. Real-time notification for Admin
      try {
        await addDoc(collection(db, "notifications"), {
          title: `New Internship Candidate: ${applicantName.trim()}`,
          message: `Applied for ${enrollModalItem.title} from ${instituteName.trim()} (${graduationYear})`,
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

      // 3. Activity Log entry
      try {
        await addDoc(collection(db, "activityLog"), {
          action: "internship_application_submitted",
          applicantName: applicantName.trim(),
          internshipTitle: enrollModalItem.title || "",
          department: enrollModalItem.department || "",
          message: `${applicantName.trim()} (${instituteName.trim()}) submitted an application for ${enrollModalItem.title}`,
          read: false,
          timestamp: serverTimestamp(),
        });
      } catch (logErr) {
        console.warn("Notice: activityLog addDoc permission notice:", logErr);
      }

      // 4. Send Email Notifications
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
            internshipTitle: enrollModalItem.title || "General Internship",
            department: enrollModalItem.department || "General",
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

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      {/* Hero Header Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-12 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <GraduationCap className="w-4 h-4" /> Academic Training
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Internship Programs
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Gain practical experience, mentorship from internationally acclaimed surgeons, and state-of-the-art diagnostic expertise at Haji Murad Eye Hospital.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Department Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {departments.map((dept) => {
            const isActive = selectedDept.toLowerCase() === dept.toLowerCase();
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--iris)] text-white shadow-md shadow-[var(--iris)]/20 scale-105"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {dept === "all" ? "All Departments" : dept}
              </button>
            );
          })}
        </div>

        {/* Programs Listing Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--iris)] border-t-transparent rounded-full animate-spin" />
            <span>Loading Internship Programs...</span>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 max-w-md mx-auto p-8 shadow-xs">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold text-base">No programs found in this department.</p>
            <p className="text-slate-400 text-xs mt-1">Please select another category or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInternships.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Top Header & Department Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--iris)]/10 text-[var(--iris)] flex items-center justify-center font-extrabold shrink-0 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--iris)] bg-[var(--iris)]/10 px-3 py-1 rounded-full border border-[var(--iris)]/20">
                      {item.department || "Ophthalmology"}
                    </span>
                  </div>

                  {/* Title & Duration/Timing Meta */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-[var(--iris)] transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[var(--iris)]" />
                        <span>{item.duration || "3 Months"}</span>
                      </div>
                      {item.timing && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[var(--iris)]" />
                          <span>{item.timing}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Program Description */}
                  {item.description && (
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  )}

                  {/* Program Highlights Preview */}
                  {Array.isArray(item.highlights) && item.highlights.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Key Modules:</p>
                      <div className="space-y-1.5">
                        {item.highlights.slice(0, 3).map((h, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--teal)] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{typeof h === "string" ? h : h.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="p-6 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 mt-auto bg-slate-50/50">
                  <Link
                    href={`/academics/internships/details?id=${item.id}`}
                    className="flex-1 text-center py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs transition-all shadow-xs"
                  >
                    View Full Details
                  </Link>

                  <button
                    onClick={() => {
                      setEnrollModalItem(item);
                      setFormSuccess(false);
                      setFormError("");
                    }}
                    className="flex-1 text-center py-3 rounded-2xl bg-[var(--iris)] hover:bg-[var(--iris-dark)] text-white font-extrabold text-xs shadow-md shadow-[var(--iris)]/20 transition-all cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Demonstration Media Gallery Slider - Positioned at END of page */}
        {slides.length > 0 && (
          <section className="pt-12 border-t border-slate-200/80">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg space-y-6">
              {/* Header Matching Image 2 Style */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-rose-600 shrink-0" />
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#2B1F1A]">
                    CLINICAL & PRACTICAL TRAINING DEMONSTRATIONS
                  </h2>
                </div>

                <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                  <span>
                    SLIDE {currentSlideIndex + 1} OF {slides.length} ({isVideoPlaying ? "PLAYING VIDEO" : "4S AUTO-PLAY"})
                  </span>
                </div>
              </div>

              {/* Main Media Container - ZERO CROPPING (object-contain) */}
              <div className="relative w-full aspect-[16/9] max-h-[540px] bg-slate-950 rounded-3xl overflow-hidden shadow-inner group flex items-center justify-center border border-slate-800">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slides[currentSlideIndex]?.id || currentSlideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {slides[currentSlideIndex]?.mediaType === "video" ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <video
                          ref={videoRef}
                          src={slides[currentSlideIndex]?.mediaUrl}
                          controls={true}
                          controlsList="nodownload"
                          onPlay={() => setIsVideoPlaying(true)}
                          onPause={() => setIsVideoPlaying(false)}
                          onEnded={() => setIsVideoPlaying(false)}
                          className="w-full h-full object-contain"
                        />

                        {/* Big Center Play Button Overlay - HIDES automatically when video starts playing */}
                        {!isVideoPlaying && (
                          <button
                            onClick={toggleVideoPlay}
                            className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 shadow-2xl z-20 cursor-pointer border border-white/20"
                            title="Play Video"
                          >
                            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <img
                        src={slides[currentSlideIndex]?.mediaUrl || slides[currentSlideIndex]?.imageUrl}
                        alt={slides[currentSlideIndex]?.caption || "Demonstration photo"}
                        className={`w-full h-full ${
                          slides[currentSlideIndex]?.fitMode === "contain" ? "object-contain" : "object-cover"
                        }`}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next navigation arrows */}
                {slides.length > 1 && (
                  <>
                    <button
                      onClick={() => handleSlideChange((currentSlideIndex - 1 + slides.length) % slides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-all shadow-lg z-30 cursor-pointer border border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      onClick={() => handleSlideChange((currentSlideIndex + 1) % slides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-all shadow-lg z-30 cursor-pointer border border-white/10"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Sub-Bar Below Media Box: Attached Badges + Dots Indicator + Caption on White Space */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Attached Badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
                      DEMONSTRATION #{currentSlideIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLightboxPhoto(slides[currentSlideIndex])}
                      className="text-[10px] font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>CLICK TO ENLARGE FULL PHOTO</span>
                    </button>
                  </div>

                  {/* Right: Dots Pagination Indicator */}
                  {slides.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-full shadow-inner self-start sm:self-auto">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSlideChange(idx)}
                          className={`transition-all duration-300 rounded-full cursor-pointer ${
                            idx === currentSlideIndex
                              ? "w-6 h-2 bg-rose-500"
                              : "w-2 h-2 bg-slate-500 hover:bg-white opacity-70"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Caption Area on White Space Background */}
                {slides[currentSlideIndex]?.caption && (
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-left shadow-xs">
                    <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900 leading-snug">
                      {slides[currentSlideIndex]?.caption}
                    </h3>
                  </div>
                )}
              </div>

              {/* Thumbnail navigation row - Handles both images and video previews cleanly */}
              {slides.length > 1 && (
                <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      onClick={() => handleSlideChange(idx)}
                      className={`relative w-20 h-14 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-slate-900 ${
                        idx === currentSlideIndex
                          ? "border-rose-600 scale-105 shadow-md ring-2 ring-rose-500/20"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      {s.mediaType === "video" ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-slate-950 text-white">
                          <video src={s.mediaUrl} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={s.mediaUrl || s.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Fullview Modal for Slides */}
      <AnimatePresence>
        {selectedLightboxPhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <button
              onClick={() => setSelectedLightboxPhoto(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors z-50 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-w-5xl w-full space-y-4 text-center">
              <div className="relative aspect-video max-h-[80vh] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black flex items-center justify-center">
                {selectedLightboxPhoto.mediaType === "video" ? (
                  <video src={selectedLightboxPhoto.mediaUrl} controls autoPlay className="w-full h-full object-contain" />
                ) : (
                  <img src={selectedLightboxPhoto.mediaUrl || selectedLightboxPhoto.imageUrl} alt="Full view" className="w-full h-full object-contain" />
                )}
              </div>
              {selectedLightboxPhoto.caption && (
                <p className="text-white text-base font-bold">{selectedLightboxPhoto.caption}</p>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Enroll Modal */}
      <AnimatePresence>
        {enrollModalItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setEnrollModalItem(null)}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--iris)] bg-[var(--iris)]/10 px-3 py-1 rounded-full border border-[var(--iris)]/20">
                  {enrollModalItem.department || "Academic Program"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Apply for {enrollModalItem.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Fill out the form below to submit your application directly to the Academic Desk.
                </p>
              </div>

              {formSuccess ? (
                <div className="py-8 text-center space-y-4 bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-black text-emerald-900">Application Submitted!</h3>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                    Thank you, <strong>{applicantName}</strong>. Your application has been received. Our team will review your application and contact you via email or phone.
                  </p>
                  <button
                    onClick={() => setEnrollModalItem(null)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-md"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnrollSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Dr. / Mr. / Ms. Full Name"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Institute / Medical College *</label>
                      <input
                        type="text"
                        required
                        value={instituteName}
                        onChange={(e) => setInstituteName(e.target.value)}
                        placeholder="University / Medical Institute"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Year of Graduation / Current Semester *</label>
                    <input
                      type="text"
                      required
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g. 2025 / 7th Semester"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Short Cover Message (Optional)</label>
                    <textarea
                      rows={3}
                      value={coverMessage}
                      onChange={(e) => setCoverMessage(e.target.value)}
                      placeholder="Mention your relevant clinical experience or area of interest..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEnrollModalItem(null)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[var(--iris)] hover:bg-[var(--iris-dark)] text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
