"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, ExternalLink, Play } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getOptimizedCloudinaryVideoUrl,
  getCloudinaryVideoPosterUrl,
  isDirectVideoUrl,
  getYoutubeEmbedUrl,
} from "@/lib/cloudinaryVideoUtil";

const YoutubeSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function renderTestimonialVideoButton(url) {
  if (!url || typeof url !== "string") return null;
  const targetUrl = url.trim();
  if (!targetUrl) return null;

  const lower = targetUrl.toLowerCase();
  let label = "Watch Video";
  let iconElement = <Play className="w-4 h-4 shrink-0 fill-current" />;
  let bgClasses = "bg-[#1E1433] text-white hover:opacity-95 shadow-md border border-white/20";

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    label = "Watch on YouTube";
    iconElement = <YoutubeSvg />;
    bgClasses = "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 border border-red-500";
  } else if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
    label = "Watch on Instagram";
    iconElement = <InstagramSvg />;
    bgClasses = "bg-[#1E1433] hover:opacity-95 text-white shadow-md border border-pink-400";
  } else if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    label = "Watch on Facebook";
    iconElement = <FacebookSvg />;
    bgClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-blue-500";
  }

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${bgClasses}`}
    >
      {iconElement}
      <span>{label}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0 ml-0.5" />
    </a>
  );
}

function TestimonialVideoDisplay({ videoUrl, posterUrl, title, patientName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!videoUrl || typeof videoUrl !== "string") return null;

  const directVideo = isDirectVideoUrl(videoUrl);
  const youtubeEmbed = getYoutubeEmbedUrl(videoUrl);

  if (directVideo) {
    const optimizedVideoUrl = getOptimizedCloudinaryVideoUrl(videoUrl);
    const autoPosterUrl = posterUrl || getCloudinaryVideoPosterUrl(videoUrl);

    return (
      <div className="w-full space-y-1.5 mt-3">
        <div className="rounded-xl overflow-hidden bg-slate-950 shadow-md border border-slate-200 aspect-video max-h-52 mx-auto relative group">
          {isPlaying ? (
            <video
              src={optimizedVideoUrl}
              poster={autoPosterUrl || undefined}
              controls
              autoPlay
              preload="auto"
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              onClick={() => setIsPlaying(true)}
              className="w-full h-full relative cursor-pointer group flex items-center justify-center bg-slate-900"
            >
              {autoPosterUrl ? (
                <Image
                  src={autoPosterUrl}
                  alt={`Patient Video Testimonial Cover - ${patientName || "Haji Murad Eye Hospital Trust Patient"}`}
                  width={400}
                  height={225}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0F172A] opacity-90" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 group-hover:bg-black/20 transition-colors p-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#C4232C] hover:bg-[#a81c24] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 border-2 border-white/80">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1" />
                </div>
                <span className="text-xs font-extrabold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                  Click to Play Video
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (youtubeEmbed) {
    return (
      <div className="w-full space-y-1.5 mt-3">
        <div className="rounded-xl overflow-hidden bg-slate-950 shadow-md border border-slate-200 aspect-video max-h-52 mx-auto relative group">
          {isPlaying ? (
            <iframe
              src={youtubeEmbed}
              title={title || "YouTube Video Testimonial"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              onClick={() => setIsPlaying(true)}
              className="w-full h-full relative cursor-pointer group flex items-center justify-center bg-slate-900"
            >
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={`YouTube Patient Testimonial Video Cover - ${patientName || "Haji Murad Eye Hospital Trust Patient"}`}
                  width={400}
                  height={225}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0F172A] opacity-90" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 group-hover:bg-black/20 transition-colors p-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#C4232C] hover:bg-[#a81c24] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 border-2 border-white/80">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-1" />
                </div>
                <span className="text-xs font-extrabold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                  Play Video
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      {renderTestimonialVideoButton(url)}
    </div>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const q = query(collection(db, "successStories"), orderBy("order", "asc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const dataArray = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTestimonials(dataArray);
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore successStories ordered query warning, falling back:", error.message);
          const unsubFallback = onSnapshot(
            collection(db, "successStories"),
            (snapshot) => {
              const dataArray = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTestimonials(dataArray);
              setLoading(false);
            },
            (err) => {
              console.warn("Firestore successStories fetch warning:", err.message);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore initialization error:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeIndex >= testimonials.length && testimonials.length > 0) {
      setActiveIndex(0);
    }
  }, [testimonials.length, activeIndex]);

  const slideNext = () => {
    if (testimonials.length === 0) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const slidePrev = () => {
    if (testimonials.length === 0) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (testimonials.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      slideNext();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, testimonials.length]);

  if (loading || !testimonials || testimonials.length === 0) {
    return null;
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const currentItem = testimonials[activeIndex] || testimonials[0];

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const patientName = currentItem?.patientName || currentItem?.name || "Patient";
  const procedureTitle = currentItem?.title || currentItem?.procedure;
  const storyText = currentItem?.story || currentItem?.quote;
  const hasAgeOrDate = Boolean(currentItem?.age || currentItem?.date);

  return (
    <section className="pt-10 pb-6 lg:pt-12 lg:pb-6 bg-[var(--fog)] relative overflow-hidden">
      {/* Background soft glowing blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="inline-block text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-[var(--fog)] px-3.5 py-1.5 rounded-full border border-[var(--line)] shadow-xs mb-3">
            Patient Stories
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
            Restored Sight, Transformed Lives
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--slate)]">
            Read first-hand accounts from patients who trusted Haji Murad with their most precious sense.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative flex flex-col items-center">
          
          {/* Main Card Viewport */}
          <div className="w-full min-h-[260px] sm:min-h-[220px] relative overflow-hidden flex items-center justify-center py-2">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentItem?.id || activeIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(e, { offset }) => {
                  const swipeThreshold = 50;
                  if (offset.x < -swipeThreshold) {
                    slideNext();
                  } else if (offset.x > swipeThreshold) {
                    slidePrev();
                  }
                }}
                className="w-full glass-card bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 border border-[var(--line)] shadow-md relative flex flex-col md:flex-row gap-6 sm:gap-8 items-center cursor-grab active:cursor-grabbing select-none"
              >
                {/* Floating Quotation Icon */}
                <Quote className="absolute top-5 right-6 w-12 h-12 text-[var(--fog)] rotate-180 pointer-events-none hidden sm:block" />

                {/* Left side: Profile Initials/Avatar and Details */}
                <div className="flex flex-col items-center flex-shrink-0 md:border-r md:border-[var(--line)] md:pr-6 md:w-[200px]">
                  <div className="w-16 h-16 rounded-full bg-[#1E1433] flex items-center justify-center text-white text-xl font-bold shadow-sm overflow-hidden flex-shrink-0">
                    {currentItem?.imageUrl ? (
                      <Image
                        src={currentItem.imageUrl}
                        alt={`${patientName || "Patient"} Photo - Haji Murad Eye Hospital Trust Patient`}
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      currentItem?.initials || getInitials(patientName)
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#2B1F1A] text-center leading-tight">
                    {patientName}
                  </h3>

                  {hasAgeOrDate && (
                    <p className="text-xs font-semibold text-[var(--slate)] mt-1">
                      {currentItem?.age ? `Age ${currentItem.age}` : ""}
                      {currentItem?.age && currentItem?.date ? " • " : ""}
                      {currentItem?.date || ""}
                    </p>
                  )}
                  
                  {/* Stars in Sage Green */}
                  <div className="flex gap-0.5 mt-3 text-[var(--iris)]">
                    {[...Array(currentItem?.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-[var(--iris)]" />
                    ))}
                  </div>
                </div>

                {/* Right side: Quote and Procedure Details */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  {procedureTitle && (
                    <div className="inline-block bg-[var(--fog)] px-3 py-1 rounded-full text-xs font-bold text-[var(--iris)] border border-[var(--line)]">
                      Procedure: {procedureTitle}
                    </div>
                  )}
                  {storyText && (
                    <p className="text-[#2B1F1A] text-sm sm:text-base leading-relaxed font-semibold italic">
                      "{storyText}"
                    </p>
                  )}
                  <TestimonialVideoDisplay
                    videoUrl={currentItem?.videoUrl || currentItem?.videoLink}
                    posterUrl={currentItem?.imageUrl}
                    patientName={patientName}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          {testimonials.length > 1 && (
            <div className="flex items-center gap-6 mt-8">
              
              {/* Left Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={slidePrev}
                className="p-3 rounded-full border border-[var(--line)] bg-white text-[#2B1F1A] hover:text-[var(--iris)] hover:border-[var(--iris)] shadow-sm transition-colors cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              {/* Pagination Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > activeIndex ? 1 : -1);
                      setActiveIndex(idx);
                    }}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeIndex ? "w-6 bg-[var(--ink)]" : "w-2.5 bg-[var(--line)] hover:bg-[var(--iris)]"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Right Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={slideNext}
                className="p-3 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-medical-blue hover:border-medical-blue/30 shadow-sm transition-colors cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>

            </div>
          )}
        </div>

      </div>
    </section>
  );
}
