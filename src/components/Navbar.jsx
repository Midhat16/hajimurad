"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar, ChevronDown, GraduationCap, Info, UserCheck, Building2, PhoneCall, FileText, Newspaper, Image as ImageIcon, HeartHandshake, CalendarDays } from "lucide-react";
import { useHospitalProfile, formatBrandName } from "@/lib/useHospitalProfile";

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
    label: "About Us",
    href: "/about",
    key: "about",
    dropdown: [
      { label: "Messages", href: "/about/hospital-message", icon: UserCheck, subtitle: "Leadership & Management Vision" },
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-[#F7F3EA]/95 backdrop-blur-md shadow-md border-b border-[#2B1F1A]/10 py-1.5 sm:py-2.5"
          : "bg-[#F7F3EA] border-b border-[#2B1F1A]/10 py-2 sm:py-3.5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 xl:gap-4 min-w-0">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-2 xl:gap-3 group cursor-pointer flex-shrink min-w-0 overflow-hidden"
          >
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11 xl:h-13 xl:w-13 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
              <img
                src={profile.logoUrl}
                alt={profile.hospitalName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col flex-shrink min-w-0 overflow-hidden">
              <span className="text-[11px] sm:text-sm lg:text-base xl:text-lg 2xl:text-xl font-bold tracking-tight text-[#1A1A1A] leading-tight truncate">
                {brand.mainFirst}{" "}
                {brand.mainHighlight && (
                  <span className="text-[var(--iris)]">{brand.mainHighlight}</span>
                )}
              </span>
              {brand.sub && (
                <span className="text-[6.5px] sm:text-[8px] lg:text-[9px] xl:text-[10px] font-semibold text-[var(--iris)] tracking-widest uppercase truncate">
                  {brand.sub}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on 1280px+ screens) */}
          <nav className="hidden xl:flex items-center gap-0.5 xl:gap-1.5 2xl:gap-2 flex-shrink min-w-0">
            {NAV_LINKS.map((link) => {
              const isDropdown = !!link.dropdown;
              const isActive =
                pathname === link.href ||
                (link.key === "academics" && pathname.startsWith("/academics")) ||
                (link.key === "media" && pathname.startsWith("/media")) ||
                (link.key === "about" && (pathname === "/about" || pathname.startsWith("/about/") || pathname === "/contact"));

              if (isDropdown) {
                const isHovered = hoveredDropdown === link.key;
                return (
                  <div
                    key={link.label}
                    className="relative group flex-shrink-0"
                    onMouseEnter={() => setHoveredDropdown(link.key)}
                    onMouseLeave={() => setHoveredDropdown(null)}
                  >
                    {link.href ? (
                      <Link
                        href={link.href}
                        className={`relative px-2 xl:px-2.5 2xl:px-3.5 py-2 text-xs xl:text-[13px] 2xl:text-sm font-bold transition-colors duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap ${isActive
                            ? "text-[var(--ink)] font-extrabold"
                            : "text-[#2B1F1A]/85 hover:text-[var(--ink)]"
                          }`}
                      >
                        <span className="whitespace-nowrap">{link.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 flex-shrink-0 transition-transform duration-200 ${isHovered ? "rotate-180 text-[var(--ink)]" : "text-[#2B1F1A]/60"}`} />
                        {isActive && (
                          <motion.span
                            layoutId="navHoverUnderline"
                            className="absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--ink)] rounded-full"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHoveredDropdown((prev) => (prev === link.key ? null : link.key))}
                        className={`relative px-2 xl:px-2.5 2xl:px-3.5 py-2 text-xs xl:text-[13px] 2xl:text-sm font-bold transition-colors duration-200 flex items-center gap-1 cursor-pointer bg-transparent border-0 select-none whitespace-nowrap ${isActive
                            ? "text-[var(--ink)] font-extrabold"
                            : "text-[#2B1F1A]/85 hover:text-[var(--ink)]"
                          }`}
                      >
                        <span className="whitespace-nowrap">{link.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 flex-shrink-0 transition-transform duration-200 ${isHovered ? "rotate-180 text-[var(--ink)]" : "text-[#2B1F1A]/60"}`} />
                        {isActive && (
                          <motion.span
                            layoutId="navHoverUnderline"
                            className="absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--ink)] rounded-full"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl border border-[#2B1F1A]/10 shadow-2xl p-2 z-50 overflow-hidden"
                        >
                          {link.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon || Info;
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                onClick={() => setHoveredDropdown(null)}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F7F3EA] transition-colors group cursor-pointer text-[#1A1A1A]"
                              >
                                <div className="w-8 h-8 rounded-xl bg-[var(--ink)] text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-sm">
                                  <SubIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-bold truncate text-[#1A1A1A] group-hover:text-[var(--ink)] transition-colors">
                                  {subItem.label}
                                </span>
                              </Link>
                            );
                          })}
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
                  className={`relative px-2 xl:px-2.5 2xl:px-3.5 py-2 text-xs xl:text-[13px] 2xl:text-sm font-bold transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${isActive
                      ? "text-[var(--ink)] font-extrabold"
                      : "text-[#2B1F1A]/85 hover:text-[var(--ink)]"
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

          {/* CTA Button & Emergency Badge (Visible on 1280px+ screens) */}
          <div className="hidden xl:flex items-center gap-2.5 xl:gap-3.5 flex-shrink-0">
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
              className="flex items-center gap-1.5 xl:gap-2 bg-gradient-to-r from-[var(--iris)] to-[#E63946] text-white px-3.5 xl:px-5 py-2 xl:py-2.5 rounded-full text-xs xl:text-sm font-semibold shadow-md hover:opacity-95 transition-all cursor-pointer border border-white/10 whitespace-nowrap flex-shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 xl:w-4 xl:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Book Appointment</span>
            </motion.button>

            {/* 24/7 Emergency Service Badge (Clickable Call Link to 111 333 456) */}
            <a
              href="tel:111333456"
              title="Call 24/7 Emergency Helpline: 111 333 456"
              className="flex items-center flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <img
                src="/images/emergency-badge.png"
                alt="24/7 Emergency Service - Call 111 333 456"
                className="h-10 xl:h-13 w-auto object-contain drop-shadow-xs hover:drop-shadow-md transition-all"
              />
            </a>
          </div>

          {/* Mobile / Tablet Collapsed Header Actions (< 1280px screens) */}
          <div className="flex xl:hidden items-center gap-1 sm:gap-3 flex-shrink-0">
            <a
              href="tel:111333456"
              title="Call 24/7 Emergency Helpline: 111 333 456"
              className="flex items-center flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <img
                src="/images/emergency-badge.png"
                alt="24/7 Emergency Service - Call 111 333 456"
                className="h-7 sm:h-9 md:h-10 w-auto object-contain drop-shadow-xs hover:drop-shadow-md transition-all"
              />
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
            className="xl:hidden bg-[#F7F3EA] border-t border-[#2B1F1A]/10 overflow-y-auto max-h-[calc(100vh-70px)] shadow-lg"
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

              <div className="pt-4 border-t border-[#2B1F1A]/10 px-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--iris)] to-[#E63946] text-white py-3 rounded-xl text-base font-semibold shadow-md cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
