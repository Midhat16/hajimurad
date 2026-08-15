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

export default function DoctorPhotoFrame({ doctor, frameColor, size = "md", className = "" }) {
  const selectedColor = (frameColor || doctor?.frameColor || doctor?.color || "black").toString().toLowerCase();
  const frameSrc = selectedColor === "red" ? "/images/caduceus-frame-red.png" : "/images/caduceus-frame.png";

  // Dimension presets for different contexts (e.g. grid cards, modals, detail views)
  const sizeClasses = {
    sm: "w-44 h-44",
    md: "w-56 h-56 sm:w-64 sm:h-64",
    lg: "w-64 h-64 sm:w-72 sm:h-72",
  }[size] || "w-56 h-56 sm:w-64 sm:h-64";

  // Precise positioning styles tailored strictly to the inner frame boundary of each variant
  const photoBoxStyle = selectedColor === "red"
    ? { top: "33.5%", left: "27.8%", width: "42.8%", height: "41.2%", borderRadius: "2px" }
    : { top: "33.2%", left: "27.5%", width: "43.0%", height: "41.5%", borderRadius: "2px" };

  return (
    <div className={`relative ${sizeClasses} mx-auto flex items-center justify-center shrink-0 ${className}`}>
      {/* 1. Doctor Photo Layer (Positioned precisely inside the Caduceus square opening) */}
      <div
        className="absolute overflow-hidden bg-slate-100 flex items-center justify-center z-10 shadow-xs"
        style={photoBoxStyle}
      >
        <DoctorPhotoAvatar doctor={doctor} />
      </div>

      {/* 2. Decorative Caduceus Medical Emblem Overlay (Positioned on top) */}
      <img
        src={frameSrc}
        alt={`${selectedColor === "red" ? "Red" : "Black"} Medical Caduceus Frame`}
        className="w-full h-full object-contain relative z-20 pointer-events-none drop-shadow-xs"
      />
    </div>
  );
}
