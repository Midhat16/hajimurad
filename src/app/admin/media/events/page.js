"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CalendarDays, Plus, Trash2, Edit, Calendar, MapPin, Clock, Tag, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
              console.warn("Events fallback notice:", e);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching events:", err);
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event.");
    }
  };

  const handleToggleStar = async (evt) => {
    try {
      await updateDoc(doc(db, "events", evt.id), {
        isStarred: !evt.isStarred,
      });
    } catch (err) {
      console.error("Error toggling star:", err);
      alert("Failed to update star status.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Media & Outreach
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            Upcoming Events Manager
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Create and manage hospital eye camps, seminars, awareness drives, and surgical workshops.
          </p>
        </div>

        <Link
          href="/admin/media/events/new"
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Event
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-4 max-w-lg mx-auto">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-[#2B1F1A]">No Events Added Yet</h3>
          <p className="text-xs text-slate-500 font-medium">
            Click "Add Event" to publish your first hospital eye camp, awareness drive, or seminar.
          </p>
          <Link
            href="/admin/media/events/new"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add Event Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl overflow-hidden border border-[var(--line)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Event Image Banner */}
              <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                {evt.imageUrl && typeof evt.imageUrl === "string" && evt.imageUrl.trim() ? (
                  <Image
                    src={evt.imageUrl.trim()}
                    alt={evt.title || "Event Banner"}
                    width={400}
                    height={176}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0F172A] flex items-center justify-center p-6 text-white text-center">
                    <CalendarDays className="w-12 h-12 opacity-40" />
                  </div>
                )}
                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[var(--iris)] border border-black/10 shadow-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {evt.category || "Event"}
                </div>
                {/* Status Badge */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
                  evt.status === "Completed" || evt.status === "Past" ? "bg-slate-700" : (evt.status === "Upcoming" ? "bg-emerald-600" : "bg-amber-600")
                }`}>
                  {evt.status === "Completed" ? "Past" : (evt.status || "Upcoming")}
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-[#2B1F1A] leading-snug">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
                  {evt.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[var(--iris)] flex-shrink-0" />
                      <span>{evt.date}</span>
                    </div>
                  )}
                  {evt.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[var(--iris)] flex-shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                  )}
                  {evt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[var(--iris)] flex-shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Order: {evt.order || 99}</span>
                    {evt.isStarred && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> Starred
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStar(evt)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        evt.isStarred
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-500"
                      }`}
                      title={evt.isStarred ? "Unstar Event" : "Star / Pin Event Permanently"}
                    >
                      <Star className={`w-4 h-4 ${evt.isStarred ? "fill-amber-400 text-amber-500" : ""}`} />
                    </button>
                    <Link
                      href={`/admin/media/events/edit?id=${evt.id}`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(evt.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
