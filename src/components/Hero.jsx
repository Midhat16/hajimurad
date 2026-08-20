"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, HeartHandshake, Eye, Award, Clock, Activity } from "lucide-react";
import EyeGallery from "./EyeGallery";

const HERO_BANNER_IMAGES = [
  {
    src: "/images/fixed-hero-1.jpg",
    alt: "Best Eye Hospital in Gujranwala - Haji Murad Eye Hospital Trust Campus",
    position: "center 18%",
  },
  {
    src: "/images/fixed-hero-2.jpg",
    alt: "Top Eye Specialist and Ophthalmologist in Gujranwala Eye Examination",
    position: "center top",
  },
  {
    src: "/images/fixed-hero-3.jpg",
    alt: "Cataract Surgery and Phaco Procedure at Haji Murad Eye Hospital Gujranwala",
    position: "center center",
  },
  {
    src: "/images/fixed-hero-1.jpg",
    alt: "Haji Murad Eye Hospital Gujranwala Building Exterior",
    position: "center 18%",
  },
];

export default function Hero() {
  const [bgIndex, setBgIndex] = useState(0);
  const galleryRef = useRef(null);

  // Background Auto-Slide Interval (3 Seconds per slide)
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BANNER_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Continuous 60fps Floating Gallery Controller for Desktop Viewports
  useEffect(() => {
    let animFrameId = null;

    const updateGalleryPosition = () => {
      if (typeof window === "undefined" || !galleryRef.current) return;

      const el = galleryRef.current;

      // Mobile / Tablet screens (< 1024px): sit inline inside Hero grid
      if (window.innerWidth < 1024) {
        el.style.position = "relative";
        el.style.top = "0px";
        el.style.right = "0px";
        el.style.zIndex = "20";
        return;
      }

      // Desktop floating logic
      const footerEl = document.querySelector("footer");
      const baseTop = 220; // 220px below top -> guarantees top orbital circle thumbnail is 100% visible and starting high in Hero section
      const galleryHeight = 320;

      let computedTop = baseTop;

      if (footerEl) {
        const footerRect = footerEl.getBoundingClientRect();
        // Dynamically cap top position so bottom edge NEVER touches the footer!
        const maxTopAllowed = footerRect.top - galleryHeight - 30;
        computedTop = Math.min(baseTop, maxTopAllowed);
      }

      // Keep position fixed continuously on desktop -> NO layout toggling jump!
      el.style.position = "fixed";
      el.style.top = `${computedTop}px`;
      el.style.right = window.innerWidth >= 1280 ? "3.5rem" : "1.5rem";
      el.style.zIndex = "30"; // z-30 guarantees it renders BELOW Header (z-50)
    };

    const onScrollOrResize = () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(updateGalleryPosition);
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    updateGalleryPosition();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const marqueeItems = [
    { icon: Activity, text: "24/7 Emergency Eye Care", badge: "Urgent Care" },
    { icon: Eye, text: "Advanced Femto LASIK & Cataract", badge: "Specialized" },
    { icon: Clock, text: "OPD: Mon-Sat 9AM-8PM", badge: "Timing" },
    { icon: ShieldCheck, text: "Certified Ophthalmic Surgeons", badge: "Trust" },
    { icon: Award, text: "44+ Years Vision Excellence", badge: "Legacy" },
    { icon: HeartHandshake, text: "Free Welfare Vision Camps", badge: "Community" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const currentImage = HERO_BANNER_IMAGES[bgIndex];

  return (
    <section id="hero-banner-section" className="relative mt-0 pt-6 pb-2 sm:pt-8 sm:pb-3 lg:pt-10 lg:pb-4 flex flex-col justify-center bg-[var(--ink)] min-h-0 md:min-h-[85vh] w-full">

      {/* Animated Hero Banner Background Images */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[var(--ink)]">
        <AnimatePresence mode="sync">
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              priority={bgIndex === 0}
              quality={95}
              sizes="100vw"
              className="w-full h-full object-cover transition-all duration-500"
              style={{
                objectPosition: currentImage.position,
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Multi-stage subtle dark vignette scrim overlay for clear background text contrast */}
        <div className="absolute inset-0 z-10 bg-[#0C1322]/60 pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0C1322]/50 via-transparent to-[#0C1322]/40 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left: Main Headline & Subtitle */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start space-y-4 pr-0 lg:pr-4"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-white/95">
                Haji Murad Eye Hospital Trust
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md max-w-2xl mx-auto lg:mx-0"
            >
              Advanced Eye Care{" "}
              <span className="text-white block sm:inline mt-1 sm:mt-0">
                in Gujranwala
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-base lg:text-lg font-medium text-white leading-relaxed max-w-xl mx-auto lg:mx-0 drop-shadow-md"
            >
              Comprehensive eye examinations, cataract surgery, laser treatment and specialized ophthalmic care delivered by experienced eye-care professionals.
            </motion.p>
          </motion.div>

          {/* Right: Reserved EyeGallery Slot (Mobile only, desktop handled by page.js sticky wrapper) */}
          <div className="lg:col-span-5 w-full flex items-center justify-center lg:justify-end relative z-40 overflow-visible mt-0 lg:-mt-2 block lg:hidden">
            <div
              ref={galleryRef}
              className="w-full max-w-[270px] sm:max-w-[340px] lg:max-w-[360px] flex items-center justify-center relative z-40 overflow-visible"
            >
              <EyeGallery />
            </div>
          </div>

        </div>

        {/* Infinite Right-to-Left Scrolling Marquee Banner Positioned Lower at Hero Image Boundary */}
        <div className="mt-8 sm:mt-10 lg:mt-12 pt-3 border-t border-white/15 overflow-hidden w-full max-w-full relative z-20 marquee-gradient-mask -mb-6 sm:-mb-7 lg:-mb-8 translate-y-6 sm:translate-y-7 lg:translate-y-8">
          <div className="flex w-max animate-marquee gap-3">
            {[...marqueeItems, ...marqueeItems].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-white/90 border border-white/30 rounded-xl px-3.5 py-2 shadow-sm hover:bg-white transition-colors cursor-pointer select-none backdrop-blur-md"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--fog)] flex items-center justify-center text-[var(--iris)] flex-shrink-0">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-[var(--iris)] uppercase tracking-widest leading-none">
                      {item.badge}
                    </span>
                    <span className="text-[11px] font-bold text-[#2B1F1A] whitespace-nowrap mt-0.5">
                      {item.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
