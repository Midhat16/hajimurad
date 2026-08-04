"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserCheck, Quote, ShieldCheck, HeartPulse, Award } from "lucide-react";
import { motion } from "framer-motion";

const DEFAULT_FULL_MESSAGE = `Right from the very childhood, whenever I happened to pass near some welfare institution, I was inspired by an intense desire to pray to God to enable me to build such an institution as may prove memorable till eternity. I am grateful to Almighty Allah from the core of my heart for the fulfillment of my desire i.e., the completion of a welfare eye hospital.

I do not find words to thank Almighty Allah, who enabled me to find and purchase the best possible piece of land for the construction of the hospital. I visited different places and saw many pieces of land but none could satisfy my aesthetic sense. While going and coming from Lahore and crossing the canal bridge, I prayed to Almighty Allah to enable me to purchase it.

One day, while I was sitting in my factory, suddenly a property dealer rang me up to inform that a suitable piece of land, adjacent to the canal, was available for purchase. I left all business affairs and rang up Late Haji Manzoor Hussain, a close friend of mine, to accompany me to the property dealer.

Accompanying him, I contacted the owner of the land. The deal was settled there with some advance. This is how the seed for the construction of the hospital was sown. Then I called a meeting of my brothers, members of my family and friends, and placed before them the plan for the construction of the hospital. I told them that I wanted to build a centrally air conditioned Eye Hospital, equipped with the latest surgical instruments and other equipment for the treatment of eye disease. The basic object of this hospital would be to treat the poor patients. It would be a hospital where the poor patients will not only be operated upon and treated free but medicine will also be provided to them free of all cost. It would be a hospital where no preference would be shown to any patient whatever be his social status. It would be a hospital where no employee would receive any bribe or tip from the patients. In this hospital even the trustees and their relatives would receive the same treatment as an ordinary patient, on one's turn and absolutely no preference would be shown to them. In this hospital meticulous arrangement would be made for maintaining cleanliness round the clock.

All the people gathered there, not only appreciated the plan whole heartedly but also promised and assured me of their full and complete co-operation and help.

On Feb, 28, 1980 the foundation stone of the hospital was laid by Maryam Bibi, the respectable mother of Haji Murad Ali. Thereafter, the trustees worked day and night to complete the building and by the grace of Almighty Allah the Opening Ceremony of the hospital was performed by Maryam Bibi (May her soul rest in eternal peace) on 1st September, 1982.

All the members of family and trustees extended their whole hearted co-operation in the construction of the building of the hospital. However, my special thanks are due to Mr. Muhammad Saleem and Mr. Muhammad Naseem who were always in the forefront to complete this noble task. After the Opening Ceremony of the hospital Haji Muhammad Amin Shaikh, the ex-president of the Chamber of Commerce and Industries Gujranwala, was appointed General Secretary of the hospital who not only contributed generously on the financial side but also took active and keen interest in the administration of the hospital. Later on, when the construction of residential flats for the doctors became necessary, a large number of friends including Sh. Muhammad Younas, Haji Muhammad Amin, Haji Muhammad Saeed and Seth Siddique Bahrain Wale played a prominent role to accomplish this project.

By the grace of God, the hospital began to treat a large number of patients from the very first day. This number went on increasing day by day. It is a matter of great satisfaction for me that God Almighty has fulfilled my cherished dream and the hospital is performing the function that it was constructed for.

I am fully satisfied with the working of the hospital. The whole staff is hardworking, honest and experienced. These qualities of the staff have enhanced the reputation of the hospital. Every patient who comes for the treatment leaves the hospital satisfied and contented. This working and reputation of the hospital is proving to be the greatest spiritual treasure for me and the trustees of the hospital. I pray from the core of my heart that this hospital may progress and prosper forever and more and more patients should get benefit from it.

I do not find words to express my deepest sense of gratitude and thanks to Almighty Allah for granting me the strength and courage to complete this gigantic task for the service of the suffering humanity.

While concluding, I would love to record my deepest sense of appreciation and gratitude for all those who joined hands in this noble cause and extended their co-operation for the completion of this hospital.`;

export default function ChairmanMessagePage() {
  const [chairmanData, setChairmanData] = useState({
    name: "Haji Murad Ali (Late)",
    designation: "Chairman, Haji Murad Trust Eye Hospital",
    message: DEFAULT_FULL_MESSAGE,
    imageUrl: "/images/chairman.jpg",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "siteContent", "chairmanMessage"),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const hasFullMessage = data.message && data.message.includes("Right from the very childhood");
            const finalMessage = hasFullMessage ? data.message : DEFAULT_FULL_MESSAGE;

            setChairmanData({
              name: data.name || "Haji Murad Ali (Late)",
              designation: data.designation || "Chairman, Haji Murad Trust Eye Hospital",
              message: finalMessage,
              imageUrl: data.imageUrl || "/images/chairman.jpg",
            });

            // Automatically sync full text to Firestore if it had the old short message
            if (!hasFullMessage) {
              setDoc(
                doc(db, "siteContent", "chairmanMessage"),
                {
                  name: data.name || "Haji Murad Ali (Late)",
                  designation: data.designation || "Chairman, Haji Murad Trust Eye Hospital",
                  message: DEFAULT_FULL_MESSAGE,
                  imageUrl: data.imageUrl || "/images/chairman.jpg",
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch((e) => console.warn("Auto-sync chairman message notice:", e));
            }
          } else {
            setChairmanData({
              name: "Haji Murad Ali (Late)",
              designation: "Chairman, Haji Murad Trust Eye Hospital",
              message: DEFAULT_FULL_MESSAGE,
              imageUrl: "/images/chairman.jpg",
            });
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore chairmanMessage notice:", err);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching chairman message:", err);
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-12 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <UserCheck className="w-4 h-4" /> Leadership Vision
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Chairman's Message
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            The inspiring journey, founding vision, and dedication to serving humanity.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">Loading Chairman Message...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl border border-[var(--line)] p-6 sm:p-10 shadow-xl space-y-8 overflow-hidden relative"
          >
            {/* Top Row: Centered Portrait */}
            <div className="flex flex-col items-center text-center space-y-4 border-b border-slate-100 pb-8">
              <div className="relative w-44 h-56 sm:w-52 sm:h-64 rounded-3xl overflow-hidden border-4 border-red-600 ring-4 ring-red-100 shadow-2xl group flex-shrink-0">
                <img
                  src="/images/chairman.jpg"
                  alt={chairmanData.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
                  {chairmanData.name}
                </h2>
                <span className="text-xs font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-3.5 py-1 rounded-full border border-[var(--line)] inline-block">
                  {chairmanData.designation}
                </span>
              </div>
            </div>

            {/* Quote Icon & Message */}
            <div className="relative space-y-4">
              <Quote className="w-12 h-12 text-[var(--iris)]/15 absolute -top-4 -left-2 -z-0 pointer-events-none" />
              <div className="relative z-10 text-xs sm:text-sm md:text-base text-slate-700 font-semibold leading-relaxed space-y-4 whitespace-pre-line text-justify">
                {chairmanData.message}
              </div>

              {/* Red Signature Block on the Right */}
              <div className="pt-6 flex flex-col items-end text-right space-y-0.5">
                <p className="text-base sm:text-lg font-extrabold text-red-600 tracking-tight">
                  {chairmanData.name || "Haji Murad Ali (Late)"}
                </p>
                <p className="text-xs sm:text-sm font-bold text-red-600">
                  Chairman
                </p>
                <p className="text-sm sm:text-base font-extrabold text-red-600 tracking-tight">
                  Haji Murad Trust Eye Hospital
                </p>
              </div>
            </div>

            {/* Core Values Strip */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-[var(--line)]/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-[var(--ink)] block">Hospital Gold-Standard</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Uncompromising safety</span>
                </div>
              </div>

              <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-[var(--line)]/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--iris)]/10 text-[var(--iris)] flex items-center justify-center font-bold">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-[var(--ink)] block">Patient Compassion</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Free treatment for the needy</span>
                </div>
              </div>

              <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-[var(--line)]/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-[var(--ink)] block">Since 1980</span>
                  <span className="text-[10px] text-slate-500 font-medium block">40+ Years of Service</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
