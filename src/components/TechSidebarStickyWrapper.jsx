"use client";

import React from "react";

export default function TechSidebarStickyWrapper({ children }) {
  return (
    <aside className="hidden lg:block lg:col-span-3 self-stretch">
      <div className="sticky top-[85px] z-30 max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
        {children}
      </div>
    </aside>
  );
}