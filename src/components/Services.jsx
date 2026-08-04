"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Sun, Eye, Activity, ShieldAlert, Smile } from "lucide-react";
import TiltCard from "./TiltCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const iconMap = {
  Sparkles,
  Sun,
  Eye,
  Activity,
  Smile,
  ShieldAlert
};

export default function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    try {
      const servicesCol = collection(db, "services");
      const unsubscribe = onSnapshot(
        servicesCol,
        (snapshot) => {
          const dataArray = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setServices(dataArray);
        },
        (error) => {
          console.warn("Firestore services fetch warning:", error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore initialization error:", err);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 80, damping: 14 },
    },
  };

  return (
    <section id="services" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3 py-1 rounded-full border border-[var(--line)] shadow-xs">
              Department of Ophthalmology
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] tracking-tight leading-tight">
              World-Class Eye Care Services
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--slate)] leading-relaxed">
              Haji Murad Eye Hospital features dedicated sub-specialties to deliver highly personalized vision solutions, from standard screenings to the most complex microsurgical restorations.
            </p>
          </motion.div>
        </div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {services.map((service, index) => {
            const IconComponent = typeof service.icon === "string" 
              ? (iconMap[service.icon] || Sparkles) 
              : (service.icon || Sparkles);

            return (
              <motion.div key={service.id || index} variants={cardVariants} className="h-full">
                <TiltCard className="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between h-full bg-white border border-[var(--line)] relative overflow-hidden group">
                  
                  {/* Subtle inner corner highlight */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--ink)] to-[var(--iris)] opacity-[0.04] group-hover:opacity-[0.1] rounded-bl-full transition-opacity duration-300" />
                  
                  <div>
                    {/* Icon Box */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--ink)] to-[var(--iris)] p-0.5 shadow-md flex items-center justify-center mb-5">
                      <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                        <IconComponent className="w-6 h-6 text-[var(--ink)] group-hover:text-white transition-colors duration-300" />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)] group-hover:text-[var(--iris)] transition-colors duration-300">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-[var(--slate)] text-sm sm:text-base leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features list */}
                    {service.features && (
                      <ul className="mt-4 space-y-1.5 border-t border-[var(--line)]/60 pt-4">
                        {service.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--slate)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--iris)]" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
