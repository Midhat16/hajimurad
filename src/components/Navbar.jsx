"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar, ChevronDown, GraduationCap, Info, UserCheck, PhoneCall, FileText, Newspaper, Image as ImageIcon, HeartHandshake } from "lucide-react";
import { useHospitalProfile, formatBrandName } from "@/lib/useHospitalProfile";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Doctors", href: "/doctors" },
  { label: "Technologies", href: "/technologies" },
  {
    label: "Academics",
    href: "/academics/internships",
    key: "academics",
    dropdown: [
      { label: "Get Internship", href: "/academics/internships", icon: GraduationCap, subtitle: "Internship Program" }
    ]
  },
  {
    label: "Media",
    href: "/media/gallery",
    key: "media",
    dropdown: [
      { label: "Annual Reports", href: "/media/annual-reports", icon: FileText, subtitle: "PDF Publications" },
      { label: "Newsletters", href: "/media/newsletters", icon: Newspaper, subtitle: "Latest Updates" },
      { label: "Gallery", href: "/media/gallery", icon: ImageIcon, subtitle: "Photos & Moments" },
      { label: "Success Stories", href: "/media/success-stories", icon: HeartHandshake, subtitle: "Patient Testimonials" },
    ]
  },
  {
    label: "About Us",
    href: "/about",
    key: "about",
    dropdown: [
      { label: "Chairman's Message", href: "/about/chairman-message", icon: UserCheck, subtitle: "Leadership Vision" },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--ink)]/95 backdrop-blur-md shadow-md border-b border-white/10 py-2.5"
          : "bg-[var(--ink)] border-b border-white/10 py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative h-13 w-13 sm:h-14 sm:w-14 md:h-15 md:w-15 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
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
                    className="relative group"
                    onMouseEnter={() => setHoveredDropdown(link.key)}
                    onMouseLeave={() => setHoveredDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className={`relative px-4 py-2 text-sm sm:text-base font-bold transition-colors duration-200 flex items-center gap-1 cursor-pointer ${
                        isActive
                          ? "text-white"
                          : "text-white/85 hover:text-[var(--iris)]"
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHovered ? "rotate-180 text-[var(--iris)]" : "text-white/70"}`} />
                      {isActive && (
                        <motion.span
                          layoutId="navHoverUnderline"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--iris)] rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 w-56 bg-[#1E1512] rounded-2xl border border-white/10 shadow-2xl p-2 z-50 overflow-hidden"
                        >
                          {link.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon || Info;
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                onClick={() => setHoveredDropdown(null)}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer !text-white"
                                style={{ color: "#FFFFFF" }}
                              >
                                <div className="w-8 h-8 rounded-xl bg-[var(--iris)] text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-sm">
                                  <SubIcon className="w-4 h-4 text-white" />
                                </div>
                                <span
                                  className="text-sm font-bold truncate !text-white group-hover:text-[var(--iris)] transition-colors"
                                  style={{ color: "#FFFFFF" }}
                                >
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
                  className={`relative px-4 py-2 text-sm sm:text-base font-bold transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-white/85 hover:text-[var(--iris)]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="navHoverUnderline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--iris)] rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-[var(--iris)] to-[#E63946] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md hover:opacity-95 transition-all cursor-pointer border border-white/10"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--iris)]"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-[var(--ink)] border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                          isActive
                            ? "text-white bg-white/10 font-bold"
                            : "text-white/85 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isMobileOpen ? "rotate-180 text-[var(--iris)]" : "text-white/70"}`} />
                      </button>

                      {isMobileOpen && (
                        <div className="pl-4 space-y-1">
                          {link.dropdown.map((subItem) => {
                            const SubIcon = subItem.icon || Info;
                            return (
                              <Link
                                key={subItem.label}
                                href={subItem.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold !text-white hover:text-[var(--iris)] hover:bg-white/10"
                                style={{ color: "#FFFFFF" }}
                              >
                                <SubIcon className="w-4 h-4 text-[var(--iris)]" />
                                <span>{subItem.label}</span>
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
                    className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? "text-white bg-white/10 font-bold"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-white/10 px-3">
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
