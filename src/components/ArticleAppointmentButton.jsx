"use client";

import React from "react";
import { Calendar } from "lucide-react";

export default function ArticleAppointmentButton({ className = "" }) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-appointment-modal"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white font-black py-3.5 px-7 rounded-2xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer border border-white/20 ${className}`}
    >
      <Calendar className="w-4 h-4 text-white" />
      <span>Book Appointment Online</span>
    </button>
  );
}
