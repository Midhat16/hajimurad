"use client";

import React, { useState, useEffect } from "react";
import { PhoneCall, Calendar, MapPin } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MobileBottomBar() {
  const [contactInfo, setContactInfo] = useState({
    uanNumber: "111 333 456",
    address: "Upper Chanab, Canal Bank, G.T Road, Gujranwala",
  });

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "siteContent", "contactInfo"),
        (docSnap) => {
          if (docSnap.exists()) {
            setContactInfo((prev) => ({ ...prev, ...docSnap.data() }));
          }
        },
        (err) => console.warn("MobileBottomBar contactInfo error:", err)
      );
      return () => unsub();
    } catch (e) {
      console.warn("MobileBottomBar subscription error:", e);
    }
  }, []);

  const handleOpenAppointment = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-appointment-modal"));
    }
  };

  const cleanUan = (contactInfo.uanNumber || "111 333 456").replace(/\s+/g, "");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E1433]/95 backdrop-blur-md border-t border-white/15 text-white shadow-2xl select-none px-2 py-2">
      <div className="grid grid-cols-3 gap-1.5 max-w-md mx-auto items-center">
        
        {/* Button 1: Call UAN */}
        <a
          href={`tel:${cleanUan}`}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-center group cursor-pointer border border-white/10"
          title={`Call UAN: ${contactInfo.uanNumber || "111 333 456"}`}
        >
          <PhoneCall className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform mb-0.5" />
          <span className="text-[10px] font-black tracking-tight text-white leading-none uppercase">
            Call UAN
          </span>
          <span className="text-[9px] font-semibold text-slate-300 leading-none mt-0.5 truncate max-w-full">
            {contactInfo.uanNumber || "111 333 456"}
          </span>
        </a>

        {/* Button 2: Book Appointment */}
        <button
          type="button"
          onClick={handleOpenAppointment}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#C4232C] hover:bg-[#a81c24] hover:opacity-95 active:scale-95 transition-all text-center shadow-md cursor-pointer border border-white/20"
        >
          <Calendar className="w-4 h-4 text-white mb-0.5" />
          <span className="text-[10px] font-black tracking-tight text-white leading-none uppercase">
            Appointment
          </span>
          <span className="text-[9px] font-medium text-white/90 leading-none mt-0.5">
            Book Slot
          </span>
        </button>

        {/* Button 3: Google Maps Directions */}
        <a
          href="https://maps.google.com/?q=Haji+Murad+Eye+Hospital+Trust+Gujranwala"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-center group cursor-pointer border border-white/10"
          title="Get Directions on Google Maps"
        >
          <MapPin className="w-4 h-4 text-[#5EEAD4] group-hover:scale-110 transition-transform mb-0.5" />
          <span className="text-[10px] font-black tracking-tight text-white leading-none uppercase">
            Directions
          </span>
          <span className="text-[9px] font-semibold text-slate-300 leading-none mt-0.5">
            Google Maps
          </span>
        </a>

      </div>
    </div>
  );
}
