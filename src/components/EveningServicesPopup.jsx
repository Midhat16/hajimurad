"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Moon, Sparkles, ArrowRight } from "lucide-react";

export default function EveningServicesPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if popup has already been shown in the current browser session
    try {
      const hasBeenShown = sessionStorage.getItem("evening_services_popup_shown");
      if (!hasBeenShown) {
        // Small delay for a smooth entrance on initial site load
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback if sessionStorage is disabled or restricted
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("evening_services_popup_shown", "true");
    } catch {
      // Ignore storage errors
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[999999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-x-hidden overflow-y-auto min-h-screen w-screen max-w-full"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[calc(100vw-16px)] sm:max-w-md bg-white rounded-3xl p-3.5 sm:p-7 shadow-2xl border border-slate-200 max-h-[88vh] overflow-y-auto overflow-x-hidden text-center select-none my-auto flex flex-col items-center justify-between"
          >
            {/* Ambient Decorative Gradient Glows */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none z-0">
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-transparent rounded-full blur-2xl" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-gradient-to-tr from-indigo-500/20 via-teal-500/15 to-transparent rounded-full blur-2xl" />
            </div>

            {/* Top Close (X) Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer shadow-xs z-50 hover:scale-110 active:scale-95"
              aria-label="Close Announcement"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="w-full flex flex-col items-center pt-1.5 relative z-10">
              {/* Evening Icon Header */}
              <div className="w-11 h-11 sm:w-18 sm:h-18 rounded-2xl bg-[#1E1433] flex items-center justify-center text-white shadow-lg shadow-purple-950/20 mb-2.5 relative group">
                <Moon className="w-5.5 h-5.5 sm:w-9 sm:h-9 text-[#5EEAD4] transform group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 p-0.5 sm:p-1 rounded-full shadow-md border-2 border-white">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
              </div>

              {/* Announcement Badge */}
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-900 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                  <Clock className="w-3 h-3 text-purple-600" /> Special Announcement
                </span>
              </div>

              {/* Title & Announcement Body */}
              <h3 className="text-lg sm:text-2xl font-black text-[#0A192F] tracking-tight leading-snug mb-2 break-words max-w-full px-1">
                Evening Services <br />
                <span className="text-purple-600">
                  Coming Soon!
                </span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mb-4 sm:mb-5 w-full px-1 break-words">
                We are expanding our consultation hours for your convenience. Specialized evening OPD hospital services and diagnostic services will be launching soon at Haji Murad Eye Hospital Trust.
              </p>
            </div>

            {/* Action Button */}
            <div className="w-full pt-1 relative z-10">
              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-[#1E1433] hover:bg-[#2A1C47] text-white font-extrabold text-xs sm:text-sm py-3 px-5 rounded-xl shadow-md transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Got It, Thank You</span>
                <ArrowRight className="w-4 h-4 text-[#5EEAD4]" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
