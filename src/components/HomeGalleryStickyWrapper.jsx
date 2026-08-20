"use client";

import React, { useEffect, useRef } from "react";
import Hero from "@/components/Hero";
import EyeGallery from "@/components/EyeGallery";
import WhyChooseUs from "@/components/WhyChooseUs";

export default function HomeGalleryStickyWrapper() {
  const containerRef = useRef(null);
  const galleryBoxRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    let lastState = null;
    let lastRight = null;
    let lastTop = null;

    const updateGalleryPosition = () => {
      if (!containerRef.current || !galleryBoxRef.current) return;
      if (window.innerWidth < 1024) return; // Desktop only

      const containerRect = containerRef.current.getBoundingClientRect();
      const galleryHeight = galleryBoxRef.current.offsetHeight || 380;
      const headerHeight = 85; // Fixed navbar height offset

      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;

      // Calculate exact right margin alignment with max-w-7xl
      const windowWidth = window.innerWidth;
      const containerMaxWidth = 1280;
      let targetRight = "1.5rem";
      if (windowWidth > containerMaxWidth) {
        const sideMargin = (windowWidth - containerMaxWidth) / 2;
        targetRight = `${sideMargin + 24}px`;
      }

      let newState = "top";
      let newTop = "85px";
      let newPosition = "absolute";

      // 1. Before scrolling past header
      if (containerTop > headerHeight) {
        newState = "top";
        newPosition = "absolute";
        newTop = "85px";
      }
      // 2. Fixed/Frozen Range: Scrolling through Hero AND WhyChooseUs combined
      else if (containerBottom > headerHeight + galleryHeight + 20) {
        newState = "fixed";
        newPosition = "fixed";
        newTop = "105px";
      }
      // 3. Reached end of WhyChooseUs (right before Helpline banner): Unfreeze
      else {
        newState = "bottom";
        newPosition = "absolute";
        const bottomOffset = Math.max(0, containerRect.height - galleryHeight - 20);
        newTop = `${bottomOffset}px`;
      }

      // Direct DOM style updates for zero-lag 60fps/120fps performance
      const element = galleryBoxRef.current;
      if (
        lastState !== newState ||
        lastRight !== targetRight ||
        lastTop !== newTop
      ) {
        element.style.transition = "none";
        element.style.position = newPosition;
        element.style.top = newTop;
        element.style.right = targetRight;

        lastState = newState;
        lastRight = targetRight;
        lastTop = newTop;
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateGalleryPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial positioning check
    updateGalleryPosition();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      {/* Desktop JS-controlled EyeGallery with GPU acceleration & zero transition jitter */}
      <div
        ref={galleryBoxRef}
        className="hidden lg:block z-30 w-[360px] pointer-events-auto transition-none will-change-[top,position,right]"
        style={{
          position: "absolute",
          top: "85px",
          right: "1.5rem",
          transition: "none",
        }}
      >
        <EyeGallery />
      </div>

      <Hero />
      <WhyChooseUs />
    </div>
  );
}
