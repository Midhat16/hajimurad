"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar, ChevronDown, GraduationCap, Info, UserCheck, Building2, PhoneCall, FileText, Newspaper, Image as ImageIcon, HeartHandshake, CalendarDays, Phone, HelpCircle, BookOpen } from "lucide-react";
import { useHospitalProfile, formatBrandName } from "@/lib/useHospitalProfile";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Doctors", href: "/doctors" },
  { label: "Technologies", href: "/technologies" },
  {
    label: "Academics",
    key: "academics",
    dropdown: [
      { label: "Get Internship", href: "/academics/internships", icon: GraduationCap, subtitle: "Internship Program" }
    ]
  },
  {
    label: "Media",
    key: "media",
    dropdown: [
      { label: "Annual Reports", href: "/media/annual-reports", icon: FileText, subtitle: "PDF Publications" },
      { label: "Newsletters", href: "/media/newsletters", icon: Newspaper, subtitle: "Latest Updates" },
      { label: "Gallery", href: "/media/gallery", icon: ImageIcon, subtitle: "Photos & Moments" },
      { label: "Success Stories", href: "/media/success-stories", icon: HeartHandshake, subtitle: "Patient Testimonials" },
      { label: "Upcoming Events", href: "/media/upcoming-events", icon: CalendarDays, subtitle: "Camps & Seminars" },
    ]
  },
  {
    label: "About",
    key: "about",
    dropdown: [
      { label: "About Hospital", href: "/about", icon: Building2, subtitle: "Our History, Vision & Mission" },
      { label: "Blog & Articles", href: "/patient-education", icon: BookOpen, subtitle: "Eye Care Guides & Articles" },
      { label: "Messages", href: "/about/hospital-message", icon: UserCheck, subtitle: "Leadership & Management Vision" },
      { label: "FAQs", href: "/about/faqs", icon: HelpCircle, subtitle: "Frequently Asked Questions" },
      { label: "Contact Us", href: "/contact", icon: PhoneCall, subtitle: "Get In Touch & Location" }
    ]
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(null);
  const pathname = usePathname();
  const { profile } = useHospitalProfile();
  const brand = formatBrandName(profile.hospitalName);

  const [contactInfo, setContactInfo] = useState({
    uanNumber: "111 333 456",
    callNumber: "0324-1111691",
    emergencyNumber: "0324-1111691",
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    const unsubContact = onSnapshot(
      doc(db, "siteContent", "contactInfo"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactInfo((prev) => ({
            ...prev,
            ...data,
          }));
        }
      },
      (err) => console.warn("Navbar contactInfo subscription error:", err)
    );

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubContact();
    };
  }, []);

  return (
    <header
      suppressHydrationWarning
      className={`sticky top-0 left-0 right-0 w-full z-50 transition-all duration-300 bg-[#F7F3EA] border-b border-[#2B1F1A]/10 py-2.5 sm:py-3 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 xl:gap-4 min-w-0">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-2 xl:gap-3 group cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 xl:h-13 xl:w-13 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
              <Image
                src={profile.logoUrl}
                alt={`${profile.hospitalName || "Haji Murad Eye Hospital"} - Best Eye Hospital in Gujranwala`}
                fill
                priority
                sizes="(max-width: 640px) 32px, (max-width: 1024px) 40px, 52px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col flex-shrink-0 whitespace-nowrap leading-none">
              <span className="text-xs sm:text-sm lg:text-base xl:text-lg font-black tracking-tight text-[#1A1A1A] leading-tight whitespace-nowrap">
                {brand.mainFirst}{" "}
                {brand.mainHighlight && (
                  <span className="text-[var(--iris)]">{brand.mainHighlight}</span>
                )}
              </span>
              {brand.sub && (
                <span className="text-[7.5px] sm:text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-[var(--iris)] tracking-wider uppercase whitespace-nowrap leading-tight mt-0.5">
                  {brand.sub}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on 1024px+ laptop screens) */}
          <nav className="hidden lg:flex items-center gap-0 lg:gap-0.5 xl:gap-1.5 2xl:gap-2 flex-shrink-0">
            {NAV_LINKS.map((link) => {
              const isDropdown = !!link.dropdown;
              const isActive =
                pathname === link.href ||
                (link.href && link.href !== "#" && link.href !== "/" && pathname?.startsWith(link.href)) ||
                (link.key === "academics" && pathname?.startsWith("/academics")) ||
                (link.key === "media" && pathname?.startsWith("/media")) ||
                (link.key === "about" && (pathname === "/about" || pathname?.startsWith("/about/") || pathname?.startsWith("/patient-education") || pathname === "/contact" || pathname === "/faqs"));

              if (isDropdown) {
                return (
                  <div
                    key={link.key}
                    className="relative flex-shrink-0"
                    onMouseEnter={() => setHoveredDropdown(link.key)}
                    onMouseLeave={() => setHoveredDropdown(null)}
                  >
                    <Link
                      href={link.href || "#"}
                      className={`relative flex items-center gap-0.5 lg:gap-1 px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-1.5 xl:py-2 text-xs lg:text-[11.5px] xl:text-sm font-bold transition-colors rounded-xl cursor-pointer whitespace-nowrap flex-shrink-0 ${isActive
                          ? "text-[var(--ink)] font-extrabold bg-[#2B1F1A]/5"
                          : "text-[#2B1F1A]/80 hover:text-[var(--ink)] hover:bg-[#2B1F1A]/5"
                        }`}
                    >
                      <span className="whitespace-nowrap">{link.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 xl:w-3.5 xl:h-3.5 flex-shrink-0 transition-transform duration-200 ${hoveredDropdown === link.key ? "rotate-180 text-[var(--ink)]" : ""
                          }`}
                      />
                      {isActive && (
                        <motion.span
                          layoutId="navHoverUnderline"
                          className="absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--ink)] rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {hoveredDropdown === link.key && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute left-0 top-full pt-2 w-56 sm:w-64 z-50 select-none"
                        >
                          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-[#2B1F1A]/10 ring-1 ring-black/5">
                            {link.dropdown.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = pathname === subItem.href;

                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isSubActive
                                      ? "bg-[var(--ink)] text-white shadow-sm"
                                      : "hover:bg-[#F7F3EA] text-[#2B1F1A] group"
                                    }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSubActive
                                        ? "bg-white/20 text-white"
                                        : "bg-[#2B1F1A]/5 text-[var(--iris)] group-hover:bg-[var(--ink)] group-hover:text-white"
                                      }`}
                                  >
                                    <SubIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs sm:text-sm font-bold leading-snug truncate">
                                      {subItem.label}
                                    </span>
                                    {subItem.subtitle && (
                                      <span
                                        className={`text-[10px] font-medium leading-tight truncate ${isSubActive ? "text-white/80" : "text-[#4A4A4A]"
                                          }`}
                                      >
                                        {subItem.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-1.5 xl:py-2 text-xs lg:text-[11.5px] xl:text-sm font-bold transition-colors rounded-xl whitespace-nowrap flex-shrink-0 ${isActive
                      ? "text-[var(--ink)] font-extrabold bg-[#2B1F1A]/5"
                      : "text-[#2B1F1A]/80 hover:text-[var(--ink)] hover:bg-[#2B1F1A]/5"
                    }`}
                >
                  <span className="whitespace-nowrap">{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="navHoverUnderline"
                      className="absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--ink)] rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA Button & Integrated 24/7 Call Now Badge (Visible on 1024px+ laptop screens) */}
          <div className="hidden lg:flex items-center gap-1.5 lg:gap-2 xl:gap-3 flex-shrink-0">
            {/* Book Appointment CTA Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                }
              }}
              className="flex items-center gap-1 lg:gap-1.5 xl:gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white px-2.5 lg:px-3 xl:px-4.5 py-1.5 lg:py-2 xl:py-2.5 rounded-full text-xs lg:text-[11px] xl:text-sm font-semibold shadow-md hover:opacity-95 transition-all cursor-pointer border border-white/10 whitespace-nowrap flex-shrink-0"
            >
              <Calendar className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Book Appointment</span>
            </motion.button>

            {/* Combined 24/7 Emergency Badge with "Call Now" Text */}
            <a
              href={`tel:${(contactInfo.uanNumber || contactInfo.callNumber || contactInfo.emergencyNumber || "111333456")?.replace(/\s+/g, "")}`}
              title={`Call Hospital 24/7: ${contactInfo.uanNumber || contactInfo.callNumber || "111 333 456"}`}
              className="flex items-center gap-1 lg:gap-1.5 p-0.5 pr-2 lg:pr-2.5 xl:pr-3 rounded-full bg-white border border-red-200 shadow-2xs hover:shadow-md hover:border-red-500 transition-all duration-200 group cursor-pointer flex-shrink-0"
            >
              <Image
                src="/images/emergency-badge.png"
                alt="24/7 Emergency Service"
                width={32}
                height={32}
                loading="lazy"
                className="h-5.5 lg:h-6.5 xl:h-7.5 w-auto object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[7.5px] lg:text-[8px] xl:text-[9px] font-extrabold text-red-600 tracking-wider uppercase">
                  Call Now
                </span>
                <span className="text-[9.5px] lg:text-[10px] xl:text-[11px] font-bold text-slate-900 tracking-tight">
                  {contactInfo.uanNumber || contactInfo.callNumber || "111 333 456"}
                </span>
              </div>
            </a>
          </div>

          {/* Mobile / Tablet Collapsed Header Actions (< 1024px screens) */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2 flex-shrink-0">
            <a
              href={`tel:${(contactInfo.uanNumber || contactInfo.callNumber || contactInfo.emergencyNumber || "111333456")?.replace(/\s+/g, "")}`}
              title={`Call Hospital 24/7: ${contactInfo.uanNumber || contactInfo.callNumber || "111 333 456"}`}
              className="flex items-center gap-1 p-0.5 pr-2 rounded-full bg-white border border-red-200 shadow-2xs cursor-pointer"
            >
              <Image
                src="/images/emergency-badge.png"
                alt="24/7 Emergency Service"
                width={26}
                height={26}
                loading="lazy"
                className="h-5 sm:h-6 w-auto object-contain flex-shrink-0"
              />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] font-extrabold text-red-600 uppercase">Call Now</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-900">{contactInfo.uanNumber || "111 333 456"}</span>
              </div>
            </a>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 sm:p-2 rounded-xl text-[#1A1A1A] hover:bg-[#2B1F1A]/5 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5.5 h-5.5 sm:w-7 sm:h-7" /> : <Menu className="w-5.5 h-5.5 sm:w-7 sm:h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-[#F7F3EA] border-t border-[#2B1F1A]/10 overflow-y-auto max-h-[calc(100vh-70px)] shadow-lg"
          >
            <div className="px-4 pt-3 pb-6 space-y-2 max-w-2xl mx-auto">
              {NAV_LINKS.map((link) => {
                const isDropdown = !!link.dropdown;
                const isActive =
                  pathname === link.href ||
                  (link.key === "academics" && pathname.startsWith("/academics")) ||
                  (link.key === "media" && pathname.startsWith("/media")) ||
                  (link.key === "about" && (pathname === "/about" || pathname.startsWith("/about/") || pathname === "/contact"));
                const isMobileOpen = mobileDropdownOpen === link.key;

                if (isDropdown) {
                  return (
                    <div key={link.label} className="space-y-1">
                      <button
                        onClick={() => setMobileDropdownOpen(isMobileOpen ? null : link.key)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-bold transition-colors ${isActive
                            ? "text-[var(--ink)] bg-[#2B1F1A]/5 font-extrabold"
                            : "text-[#2B1F1A]/85 hover:text-[var(--ink)] hover:bg-[#2B1F1A]/5"
                          }`}
                      >
                        <span>{link.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMobileOpen ? "rotate-180 text-[var(--ink)]" : "text-[#2B1F1A]/60"}`} />
                      </button>

                      {isMobileOpen && (
                        <div className="pl-4 pr-2 space-y-1 border-l-2 border-[var(--iris)]/20 ml-3 my-1">
                          {link.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon || Info;
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-[#1A1A1A] hover:text-[var(--ink)] hover:bg-[#2B1F1A]/5 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-[var(--ink)] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                                  <SubIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span>{subItem.label}</span>
                                  {subItem.subtitle && (
                                    <span className="text-[11px] font-normal text-slate-500">{subItem.subtitle}</span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-xl text-base font-bold transition-colors ${isActive
                        ? "text-[var(--ink)] bg-[#2B1F1A]/5 font-extrabold"
                        : "text-[#2B1F1A]/85 hover:text-[var(--ink)] hover:bg-[#2B1F1A]/5"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-[#2B1F1A]/10 px-3 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white py-3 rounded-xl text-base font-semibold shadow-md cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </button>

                <a
                  href={`tel:${(contactInfo.uanNumber || contactInfo.callNumber || contactInfo.emergencyNumber || "111333456")?.replace(/\s+/g, "")}`}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] py-2.5 rounded-xl text-base font-extrabold shadow-xs cursor-pointer hover:bg-[#1A1A1A] hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5 text-red-600" />
                  Call Now ({contactInfo.uanNumber || "111 333 456"})
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
