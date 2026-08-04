"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    <section className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background soft glowing blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-[var(--fog)] px-3 py-1 rounded-full border border-[var(--line)] shadow-xs">
            Patient Stories
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] tracking-tight leading-tight">
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--ink)] to-[var(--iris)] flex items-center justify-center text-white text-xl font-bold shadow-sm overflow-hidden flex-shrink-0">
                    {currentItem?.imageUrl ? (
                      <img
                        src={currentItem.imageUrl}
                        alt={patientName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      currentItem?.initials || getInitials(patientName)
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[var(--ink)] text-center leading-tight">
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
                    <p className="text-[var(--ink)] text-sm sm:text-base leading-relaxed font-semibold italic">
                      "{storyText}"
                    </p>
                  )}
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
                className="p-3 rounded-full border border-[var(--line)] bg-white text-[var(--ink)] hover:text-[var(--iris)] hover:border-[var(--iris)] shadow-sm transition-colors cursor-pointer"
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
