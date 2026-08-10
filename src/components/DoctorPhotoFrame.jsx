"use client";

import React, { useState, useEffect } from "react";
import { Stethoscope } from "lucide-react";

export function DoctorPhotoAvatar({ doctor }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [objectPosition, setObjectPosition] = useState("center 20%");
  const photo = doctor?.photoUrl || doctor?.photo || doctor?.imageUrl;

  useEffect(() => {
    setImgFailed(false);
    setObjectPosition("center 20%");
  }, [photo]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalHeight > 0 && naturalWidth > 0) {
      const ratio = naturalHeight / naturalWidth;
      if (ratio > 1.2) {
        setObjectPosition("center 12%");
      } else if (ratio < 0.85) {
        setObjectPosition("center center");
      } else {
        setObjectPosition("center 18%");
      }
    }
  };

  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={doctor?.name || "Doctor"}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-all duration-300"
        style={{ objectPosition }}
        onLoad={handleImageLoad}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full bg-gradient-to-tr ${
        doctor?.gradient || "from-sky-400 to-blue-500"
      } flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-inner`}
    >
      {doctor?.initials || doctor?.name?.charAt(0) || "D"}
    </div>
  );
}

export default function DoctorPhotoFrame({ doctor, size = "md", className = "" }) {
  // Dimension presets for different contexts (e.g. grid cards, modals, detail views)
  const sizeClasses = {
    sm: "w-36 h-36",
    md: "w-44 h-44 sm:w-48 sm:h-48",
    lg: "w-52 h-52 sm:w-56 sm:h-56",
  }[size] || "w-44 h-44 sm:w-48 sm:h-48";

  return (
    <div className={`relative ${sizeClasses} mx-auto flex items-center justify-center shrink-0 ${className}`}>
      {/* 1. Doctor Photo Layer (Positioned precisely inside the Caduceus square opening) */}
      <div
        className="absolute overflow-hidden bg-slate-100 flex items-center justify-center z-10 shadow-xs"
        style={{
          top: "32.6%",
          left: "27.8%",
          width: "43.6%",
          height: "45.6%",
          borderRadius: "3px",
        }}
      >
        <DoctorPhotoAvatar doctor={doctor} />
      </div>

      {/* 2. Decorative Caduceus Medical Emblem Overlay (Positioned on top) */}
      <img
        src="/images/caduceus-frame.png"
        alt="Medical Caduceus Frame"
        className="w-full h-full object-contain relative z-20 pointer-events-none drop-shadow-xs"
      />
    </div>
  );
}
