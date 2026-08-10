"use client";

import React, { useRef } from "react";

export default function TiltCard({ children, className = "", style = {} }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Position of cursor relative to element
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Center point of element
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Direct 3D rotation degrees
    const rotateYVal = ((x - centerX) / centerX) * 8; // yaw
    const rotateXVal = -((y - centerY) / centerY) * 8; // pitch

    // Instant direct DOM style mutation with zero React state re-renders
    card.style.transform = `perspective(1000px) rotateX(${rotateXVal}deg) rotateY(${rotateYVal}deg) translateY(-4px)`;
    card.style.transition = "transform 0.05s ease-out";
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    // Instant reset on leave
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    card.style.transition = "transform 0.2s ease-out";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...style,
      }}
      className={className}
    >
      <div className="h-full flex flex-col justify-between flex-1" style={{ transform: "translateZ(15px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  );
}
