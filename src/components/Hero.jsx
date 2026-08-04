"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, Star, Sparkles, Zap, Smile, Eye } from "lucide-react";
import EyeGallery from "./EyeGallery";

const HERO_BANNER_IMAGES = [
  {
    src: "/images/haji-murad-main-campus.jpg",
    alt: "Haji Murad Trust Eye Hospital Campus Building",
  },
  {
    src: "/images/hero-1.jpg",
    alt: "Advanced Ophthalmic Diagnostics & Retina Scan",
  },
  {
    src: "/images/hero-2.jpg",
    alt: "Expert Doctor Eye Examination & Slit Lamp Care",
  },
  {
    src: "/images/hero-3.jpg",
    alt: "State of the Art Laser Eye Surgery Theater",
  },
];

const MARQUEE_ITEMS = [
  { icon: Sparkles, text: "Blade-Free Wavefront LASIK", badge: "Refractive" },
  { icon: ShieldCheck, text: "Carl Zeiss HD OCT Scanner", badge: "Diagnostics" },
  { icon: Activity, text: "Micro-Incision Cataract IOL", badge: "Surgery" },
  { icon: Star, text: "Selective Laser SLT Therapy", badge: "Glaucoma" },
  { icon: Eye, text: "24/7 Retinal Emergency Unit", badge: "Emergency" },
  { icon: Smile, text: "Pediatric Strabismus Clinic", badge: "Pediatric" },
  { icon: Zap, text: "Femtosecond Laser Precision", badge: "Advanced" },
];

export default function Hero() {
  const [bgIndex, setBgIndex] = useState(0);

  // Rotate hero background images every 3 seconds with smooth fade
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BANNER_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <section className="relative pt-24 pb-10 lg:pt-28 lg:pb-12 flex flex-col justify-center bg-[var(--ink)] overflow-hidden min-h-[85vh]">
      
      {/* Animated Hero Banner Background Images (3 Seconds Fade Animation) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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
              src={HERO_BANNER_IMAGES[bgIndex].src}
              alt={HERO_BANNER_IMAGES[bgIndex].alt}
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-center scale-105 transition-transform duration-[4000ms] ease-out"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient Overlay for high text readability */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(120deg, rgba(20, 14, 12, 0.75) 0%, rgba(20, 14, 12, 0.55) 50%, rgba(20, 14, 12, 0.40) 100%)"
          }}
        />
        {/* Soft Light UV Radial Glow */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#8B5CF6]/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Headline Only */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start space-y-4"
          >
            {/* Main Bold Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md"
            >
              Rediscover the World with{" "}
              <span className="text-white drop-shadow-lg block mt-1">
                Crystal Clear Vision
              </span>
            </motion.h1>
          </motion.div>

          {/* Right: Interactive Real Eye/Hospital Photo Gallery */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 15,
              delay: 0.2,
            }}
            className="lg:col-span-5 w-full flex items-center justify-center lg:justify-end lg:pl-4 lg:translate-x-16 xl:translate-x-24 relative"
          >
            <EyeGallery />
          </motion.div>

        </div>

        {/* Infinite Right-to-Left Scrolling Marquee Banner */}
        <div className="mt-6 pt-4 border-t border-white/15 overflow-hidden relative marquee-gradient-mask">
          <div className="flex w-max animate-marquee gap-3">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => {
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
                    <span className="text-[11px] font-bold text-[var(--ink)] whitespace-nowrap mt-0.5">
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
