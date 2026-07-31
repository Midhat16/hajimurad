"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const INITIAL_TESTIMONIALS_DATA = [
  {
    id: "test-1",
    name: "Aisha Rahman",
    age: 28,
    procedure: "Wavefront LASIK Surgery",
    rating: 5,
    quote: "Getting LASIK at Haji Murad was life-changing. I had extremely high nearsightedness. The actual surgery took only 10 minutes, and the doctors explained every step. The next morning, I woke up seeing 20/20. No pain, just pure clarity!",
    date: "2 months ago",
    initials: "AR"
  },
  {
    id: "test-2",
    name: "Kamran Siddiqui",
    age: 62,
    procedure: "Micro-Incision Cataract (Multifocal IOL)",
    rating: 5,
    quote: "My cataract had made driving at night impossible. Dr. Vance recommended a premium multifocal lens. The procedure was completely stitchless and painless. Now, I don't even need glasses to read the newspaper! Incredible team.",
    date: "1 month ago",
    initials: "KS"
  },
  {
    id: "test-3",
    name: "Sarah Thompson",
    age: 34,
    procedure: "Retinal Tear Laser Therapy",
    rating: 5,
    quote: "I noticed sudden flashes of light in my left eye and panicked. Haji Murad's emergency team scanned my eye immediately and detected a retinal tear. Dr. Sterling repaired it with a laser on the spot. They saved my sight.",
    date: "3 months ago",
    initials: "ST"
  },
  {
    id: "test-4",
    name: "Zainab Malik",
    age: 45,
    procedure: "Glaucoma SLT Laser Management",
    rating: 5,
    quote: "Glaucoma runs in my family, so I was terrified of vision loss. The early detection scanning here is incredible. They successfully stabilized my eye pressures with laser trabeculoplasty. The follow-up care is outstanding.",
    date: "5 months ago",
    initials: "ZM"
  }
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState(INITIAL_TESTIMONIALS_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const testimonialsCol = collection(db, "testimonials");
      const unsubscribe = onSnapshot(testimonialsCol, (snapshot) => {
        if (!snapshot.empty) {
          const dataArray = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (dataArray && dataArray.length > 0) {
            setTestimonials(dataArray);
          }
        }
      }, (error) => {
        console.warn("Firestore testimonials fetch warning:", error.message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore initialization error:", err);
    }
  }, []);

  const slideNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const slidePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      slideNext();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, testimonials.length]);

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

  return (
    <section className="py-14 lg:py-16 bg-[#F4F7F5] relative overflow-hidden">
      {/* Background soft glowing blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3E8E6E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#D5E5DD] shadow-xs">
            Patient Stories
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3D5C] tracking-tight leading-tight">
            Restored Sight, Transformed Lives
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#3F4B4A]">
            Read first-hand accounts from patients who trusted Haji Murad with their most precious sense.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative flex flex-col items-center">
          
          {/* Main Card Viewport */}
          <div className="w-full min-h-[260px] sm:min-h-[220px] relative overflow-hidden flex items-center justify-center py-2">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
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
                className="w-full glass-card bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 border border-[#D5E5DD] shadow-md relative flex flex-col md:flex-row gap-6 sm:gap-8 items-center cursor-grab active:cursor-grabbing select-none"
              >
                {/* Floating Quotation Icon */}
                <Quote className="absolute top-5 right-6 w-12 h-12 text-[#E8F0EC] rotate-180 pointer-events-none hidden sm:block" />

                {/* Left side: Profile Initials and Details */}
                <div className="flex flex-col items-center flex-shrink-0 md:border-r md:border-[#D5E5DD]/60 md:pr-6 md:w-[200px]">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0B3D5C] to-[#3E8E6E] flex items-center justify-center text-white text-xl font-bold shadow-sm">
                    {currentItem?.initials || currentItem?.name?.charAt(0)}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#0B3D5C] text-center leading-tight">
                    {currentItem?.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#3F4B4A] mt-1">
                    Age {currentItem?.age} • {currentItem?.date}
                  </p>
                  
                  {/* Stars in Sage Green */}
                  <div className="flex gap-0.5 mt-3 text-[#3E8E6E]">
                    {[...Array(currentItem?.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current text-[#3E8E6E]" />
                    ))}
                  </div>
                </div>

                {/* Right side: Quote and Procedure Details */}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="inline-block bg-[#E8F0EC] px-3 py-1 rounded-full text-xs font-bold text-[#3E8E6E] border border-[#D5E5DD]">
                    Procedure: {currentItem?.procedure}
                  </div>
                  <p className="text-[#0B3D5C] text-sm sm:text-base leading-relaxed font-semibold italic">
                    "{currentItem?.quote}"
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mt-8">
            
            {/* Left Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={slidePrev}
              className="p-3 rounded-full border border-[#D5E5DD] bg-white text-[#0B3D5C] hover:text-[#3E8E6E] hover:border-[#3E8E6E] shadow-sm transition-colors cursor-pointer"
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
                    idx === activeIndex ? "w-6 bg-[#0B3D5C]" : "w-2.5 bg-[#D5E5DD] hover:bg-[#3E8E6E]"
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
        </div>

      </div>
    </section>
  );
}
