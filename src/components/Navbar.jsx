"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calendar } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Doctors", href: "/doctors" },
  { label: "Technologies", href: "/technologies" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll to add background opacity / shadow effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-navbar shadow-sm py-2.5"
          : "bg-white/90 backdrop-blur-md border-b border-[#D5E5DD] py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative h-13 w-13 sm:h-14 sm:w-14 md:h-15 md:w-15 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/images/logo.png"
                alt="Haji Murad Trust Eye Hospital Logo"
                width={60}
                height={60}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#0B3D5C] leading-tight">
                Haji <span className="text-[#3E8E6E]">Murad</span>
              </span>
              <span className="text-[10px] font-semibold text-[#3E8E6E] tracking-widest uppercase">
                Eye Hospital
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm sm:text-base font-bold transition-colors duration-200 ${
                    isActive
                      ? "text-[#0B3D5C]"
                      : "text-[#3F4B4A] hover:text-[#0B3D5C]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="navHoverUnderline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <motion.div
              whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(11, 61, 92, 0.25)" }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-[#0B3D5C]/15 hover:opacity-95 transition-opacity cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3E8E6E]"
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
            className="md:hidden glass-navbar border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? "text-[#0B3D5C] bg-[#E8F0EC] font-bold"
                        : "text-slate-700 hover:text-[#0B3D5C] hover:bg-[#E8F0EC]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="pt-4 border-t border-slate-100 px-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white py-3 rounded-xl text-base font-semibold shadow-md cursor-pointer"
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
