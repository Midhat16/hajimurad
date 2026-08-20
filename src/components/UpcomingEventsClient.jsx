"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, MapPin, Clock, Tag, UserCheck, ArrowRight, CalendarDays, Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

import EventCard from "@/components/EventCard";

function checkIsEventPassed(dateStr) {
  if (!dateStr) return false;
  let eventDate = null;
  const str = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    eventDate = new Date(str + "T23:59:59");
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    eventDate = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T23:59:59`);
  } else {
    eventDate = new Date(str);
  }

  if (!eventDate || isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return eventDate < today;
}

export default function UpcomingEventsClient() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    try {
      const q = query(collection(db, "events"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setEvents(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Events snapshot fallback notice:", err);
          const unsubFallback = onSnapshot(
            collection(db, "events"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setEvents(list);
              setLoading(false);
            },
            (e) => {
              console.warn("Events fallback error:", e);
              setEvents([]);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching events:", err);
      setEvents([]);
      setLoading(false);
    }
  }, []);

  // Compute status automatically if event date has passed today
  const processedEvents = events.map((e) => {
    const isPassed = checkIsEventPassed(e.date);
    let computedStatus = e.status || "Upcoming";
    if (computedStatus === "Completed") computedStatus = "Past";
    if (isPassed && computedStatus === "Upcoming") {
      computedStatus = "Past";
    }
    return {
      ...e,
      status: computedStatus,
      isPassed,
    };
  });

  const categories = ["All", ...Array.from(new Set(processedEvents.map((e) => e.category).filter(Boolean)))];

  const categoryFiltered = activeFilter === "All"
    ? processedEvents
    : processedEvents.filter((e) => e.category === activeFilter);

  // Separate upcoming vs past events
  const isPastOrCompleted = (st) => st === "Past" || st === "Completed";
  const upcomingList = categoryFiltered.filter((e) => !isPastOrCompleted(e.status));
  const completedList = categoryFiltered.filter((e) => isPastOrCompleted(e.status));

  // Rule: Starred completed events stay permanently, non-starred capped at maximum 4
  const starredCompleted = completedList.filter((e) => e.isStarred);
  const regularCompleted = completedList.filter((e) => !e.isStarred).slice(0, 4);
  const displayCompleted = [...starredCompleted, ...regularCompleted];

  const hasNoEvents = upcomingList.length === 0 && displayCompleted.length === 0;

  return (
    <main className="min-h-screen bg-[var(--fog)] pb-0 font-sans">
      {/* Hero Banner */}
      <section className="bg-[#1E1433] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-6 shadow-md">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <CalendarDays className="w-4 h-4" /> Hospital Media & Outreach
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Upcoming Events & Medical Camps
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Stay updated with our community eye screening camps, scientific seminars, awareness drives, and free surgical workshops.
          </p>
        </div>
      </section>

      {/* Sticky Category Header Bar (Flush with Navbar) */}
      {categories.length > 1 && (
        <div className="sticky top-[56px] sm:top-[64px] lg:top-[70px] z-40 bg-[var(--fog)]/95 backdrop-blur-md py-2 border-b border-[var(--line)] shadow-xs mb-6 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                  activeFilter === cat
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-md scale-105"
                    : "bg-white text-[#2B1F1A] border-[var(--line)] hover:bg-[#F7F3EA]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#2B1F1A]">Loading Hospital Events...</p>
          </div>
        ) : hasNoEvents ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-[#2B1F1A]">No Events Found</h3>
            <p className="text-xs text-slate-500 font-medium">There are currently no events matching your filter at the moment.</p>
          </div>
        ) : (
          <>
            {/* UPCOMING EVENTS SECTION */}
            {upcomingList.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                  <div className="w-3 h-8 rounded-full bg-[var(--iris)]" />
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
                      Upcoming Events ({upcomingList.length})
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Stay informed about our upcoming medical camps, community awareness drives, and hospital seminars.
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  {upcomingList.map((evt, idx) => (
                    <EventCard key={evt.id || idx} event={evt} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* PAST / COMPLETED EVENTS SECTION */}
            {displayCompleted.length > 0 && (
              <section className="space-y-8 pt-6">
                <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                  <div className="w-3 h-8 rounded-full bg-slate-400" />
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
                      Past Events & Outreach Archives ({displayCompleted.length})
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Explore photos and highlights from our successfully conducted eye camps and seminars.
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  {displayCompleted.map((evt, idx) => (
                    <EventCard key={evt.id || idx} event={evt} index={idx} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
