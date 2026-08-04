"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHospitalProfile, formatBrandName } from "@/lib/useHospitalProfile";

// Custom SVG components for brand icons
const FacebookIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const ThreadsIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 21.5c-4.8 0-8.5-3.3-8.5-8.5 0-5.5 4-9.5 9-9.5 5.2 0 8.5 3.7 8.5 8.2 0 4-2.5 6.8-5.5 6.8-1.5 0-2.7-.8-3.2-2.2-.6.9-1.7 1.5-3 1.5-2.2 0-3.8-1.7-3.8-3.8 0-2.4 1.8-4.2 4.5-4.2 1.3 0 2.5.4 3.2 1v-1c0-.8-.6-1.5-1.8-1.5-1 0-1.8.3-2.3.6" />
    <path d="M13.2 12c0 1.2-.8 2.1-1.9 2.1-1 0-1.7-.8-1.7-1.9 0-1.3.9-2.1 2-2.1.6 0 1.2.2 1.6.6" />
  </svg>
);

const TiktokIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const DEFAULT_CONTACT_INFO = {
  uanNumber: "111 333 456",
  callNumber: "0332-4290724",
  helplineNumber: "0324-1111691",
  mainDeskNumber: "111 333 456",
  emergencyNumber: "0332-4290724",
  email: "info@hajimuradhospital.org",
  address: "Upper Chanab Canal Bank G.T Road Gujranwala",
};

export default function Footer() {
  const [services, setServices] = useState([]);
  const [contactInfo, setContactInfo] = useState(DEFAULT_CONTACT_INFO);
  const { profile } = useHospitalProfile();
  const brand = formatBrandName(profile.hospitalName);

  useEffect(() => {
    // 1. Live subscription to Firestore services collection
    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setServices(items);
      },
      (err) => console.warn("Footer services subscription notice:", err.message)
    );

    // 2. Live subscription to siteContent/contactInfo document
    const unsubContact = onSnapshot(
      doc(db, "siteContent", "contactInfo"),
      (docSnap) => {
        if (docSnap.exists()) {
          setContactInfo({
            ...DEFAULT_CONTACT_INFO,
            ...docSnap.data(),
          });
        }
      },
      (err) => console.warn("Footer contactInfo subscription notice:", err.message)
    );

    return () => {
      unsubServices();
      unsubContact();
    };
  }, []);

  const socialVariants = {
    hover: {
      y: -5,
      transition: { type: "spring", stiffness: 300, damping: 10 },
    },
  };

  return (
    <footer className="bg-[var(--ink)] text-white border-t border-white/10 pt-12 pb-6 lg:pt-14 lg:pb-6 text-left relative z-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-10 border-b border-white/10">
          {/* Logo & Slogan Column */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-13 w-13 sm:h-14 sm:w-14 md:h-15 md:w-15 flex-shrink-0 overflow-hidden">
                <img
                  src={profile.logoUrl}
                  alt={profile.hospitalName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white leading-tight">
                  {brand.mainFirst}{" "}
                  {brand.mainHighlight && (
                    <span className="text-[var(--iris)]">{brand.mainHighlight}</span>
                  )}
                </span>
                {brand.sub && (
                  <span className="text-[10px] font-semibold text-[var(--iris)] tracking-widest uppercase">
                    {brand.sub}
                  </span>
                )}
              </div>
            </Link>

            <p className="text-sm text-white/70 leading-relaxed font-medium max-w-sm">
              We coordinate premier surgical expertise with advanced diagnostics to restore visual clarity. Safeguarding your vision is our lifelong hospital focus.
            </p>

            {/* Social Icons list */}
            <div className="flex gap-3.5 flex-wrap">
              {[
                {
                  icon: FacebookIcon,
                  label: "Facebook",
                  href: "https://www.facebook.com/profile.php?id=61592548296831",
                },
                {
                  icon: InstagramIcon,
                  label: "Instagram",
                  href: "https://www.instagram.com/hmehtrust/",
                },
                {
                  icon: ThreadsIcon,
                  label: "Threads",
                  href: "https://www.threads.com/@hmehtrust",
                },
                {
                  icon: TiktokIcon,
                  label: "TikTok",
                  href: "https://www.tiktok.com/@hmehtrust",
                },
                {
                  icon: YoutubeIcon,
                  label: "YouTube",
                  href: "https://www.youtube.com/@HMEHTrust",
                },
              ].map((social, idx) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={idx}
                    variants={socialVariants}
                    whileHover="hover"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit our ${social.label} page`}
                    className="w-10 h-10 rounded-full bg-white text-[var(--ink)] hover:bg-[var(--iris)] hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                  >
                    <IconComponent className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Home", href: "/" },
                { label: "Specialty Services", href: "/services" },
                { label: "Medical Surgeons", href: "/doctors" },
                { label: "Clinic Equipment", href: "/technologies" },
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm font-semibold text-white/70 hover:text-[var(--iris)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Column - Dynamic Firestore List */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">
              <Link href="/services" className="hover:text-[var(--iris)] transition-colors">
                Ophthalmic Services
              </Link>
            </h4>
            <ul className="space-y-2.5">
              {services.map((serv) => (
                <li key={serv.id || serv.title}>
                  <Link
                    href="/services"
                    className="text-xs sm:text-sm font-semibold text-white/70 hover:text-[var(--iris)] transition-colors block truncate"
                  >
                    {serv.title || serv.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details Column - Dynamic Firestore Info */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">
              Immediate Help
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/70 font-medium">
              <li>
                UAN:{" "}
                <a
                  href={`tel:${(contactInfo.uanNumber || contactInfo.mainDeskNumber)?.replace(/\s+/g, "")}`}
                  className="text-white font-extrabold hover:text-[var(--iris)] transition-colors"
                >
                  {contactInfo.uanNumber || contactInfo.mainDeskNumber}
                </a>
              </li>
              <li>
                Call #:{" "}
                <a
                  href={`tel:${(contactInfo.callNumber || contactInfo.emergencyNumber)?.replace(/\s+/g, "")}`}
                  className="text-rose-400 font-extrabold hover:underline"
                >
                  {contactInfo.callNumber || contactInfo.emergencyNumber}
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-white font-extrabold hover:text-[var(--iris)] transition-colors"
                >
                  info@HMEHT.com
                </a>
              </li>
              <li className="leading-relaxed">
                Address: {contactInfo.address}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex items-center justify-center text-center text-xs sm:text-sm text-white/70 font-medium">
          <p className="text-center">
            Copyright © {new Date().getFullYear()} {profile.hospitalName} | Developed By:{" "}
            <a
              href="https://bizdevit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[var(--iris)] font-bold hover:underline transition-colors"
            >
              Biz Dev IT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
