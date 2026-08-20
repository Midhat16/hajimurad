"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Search,
  X,
  PhoneCall,
  Calendar,
  Sparkles,
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_FAQS } from "@/lib/defaultFaqs";

export default function FaqsClient() {
  const [faqsList, setFaqsList] = useState(DEFAULT_FAQS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFaqId, setOpenFaqId] = useState("faq-1"); // First item open by default
  const [contactInfo, setContactInfo] = useState({
    uanNumber: "111 333 456",
    callNumber: "0324-1111691",
    address: "Upper Chanab, Canal Bank, G.T Road, Gujranwala",
  });

  // Subscribe to live Firestore contactInfo & faqs collection
  useEffect(() => {
    try {
      const unsubContact = onSnapshot(
        doc(db, "siteContent", "contactInfo"),
        (docSnap) => {
          if (docSnap.exists()) {
            setContactInfo((prev) => ({ ...prev, ...docSnap.data() }));
          }
        },
        (err) => console.warn("FAQs contactInfo notice:", err)
      );

      const q = query(collection(db, "faqs"), orderBy("order", "asc"));
      const unsubFaqs = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((item) => item.isActive !== false);

            if (list.length > 0) {
              setFaqsList(list);
            }
          }
        },
        (err) => console.warn("faqs listener notice:", err)
      );

      return () => {
        unsubContact();
        unsubFaqs();
      };
    } catch (e) {
      console.warn("FAQs subscription error:", e);
    }
  }, []);

  // Filter categories
  const categories = ["All", ...Array.from(new Set(faqsList.map((f) => f.category || "General")))];

  // Process FAQs & replace dynamic address for Question 10 if present
  const processedFaqs = faqsList.map((faq) => {
    if (faq.question.toLowerCase().includes("where is haji murad")) {
      return {
        ...faq,
        answer: `Haji Murad Eye Hospital Trust is conveniently located at ${contactInfo.address || "Upper Chanab, Canal Bank, G.T Road, Gujranwala"}. We are easily accessible from all major routes in Gujranwala with dedicated parking and OPD registration desks.`,
      };
    }
    return faq;
  });

  // Filter by search & category
  const filteredFaqs = processedFaqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAccordion = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="min-h-screen bg-[#A8C0D6] pt-6 sm:pt-8 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">

        {/* Page Hero Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-purple-50 text-purple-900 px-4 py-1.5 rounded-full border border-purple-200 shadow-2xs"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-extrabold tracking-wider uppercase">Help Center & Information</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight leading-tight"
          >
            Frequently Asked <span className="text-[var(--ink)]">Questions</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Find clear, quick answers to common questions regarding eye consultations, cataract surgery, OPD schedules, diagnostics, and patient care.
          </motion.p>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-4 bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-md"
        >
          {/* Keyword Search Input */}
          <div className="relative w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword (e.g., cataract, appointment, timings, cost)..."
              className="w-full pl-11 pr-10 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--ink)] transition-all shadow-inner placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                        ? "bg-[var(--ink)] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* FAQs Accordion Container */}
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden mb-[10px] ${isOpen
                        ? "bg-white border-[var(--ink)]/40 shadow-lg ring-1 ring-[var(--ink)]/10"
                        : "bg-white/90 border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs"
                      }`}
                  >
                    {/* Question Row */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-sm flex-shrink-0 transition-colors ${isOpen ? "bg-[var(--ink)] text-white shadow-xs" : "bg-slate-100 text-slate-600"
                          }`}>
                          Q{index + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-[#1A1A1A] tracking-tight leading-snug">
                          {faq.question}
                        </h3>
                      </div>

                      <div className={`p-1.5 rounded-full transition-transform duration-300 flex-shrink-0 ${isOpen ? "bg-[var(--ink)]/10 text-[var(--ink)] rotate-180" : "bg-slate-100 text-slate-500"
                        }`}>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </button>

                    {/* Answer Collapsible Body */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 pt-1 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100/80 space-y-2">
                            <p className="whitespace-pre-line">{faq.answer}</p>

                            {faq.category && (
                              <div className="pt-2 flex items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                  Category: {faq.category}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-3"
              >
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No matching questions found</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  We couldn't find any questions matching "{searchQuery}". Try clearing your search or contact our team directly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Still Have Questions Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-[#1E1433] rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 mb-[10px]"
        >
          {/* Decorative ambient backdrop light */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1.5 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-[#5EEAD4] px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Direct Assistance
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Still Have Questions?</h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md">
              Our hospital coordinators are available to answer your specific queries or guide you through appointment booking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto z-10 flex-shrink-0">
            <a
              href={`tel:${(contactInfo.uanNumber || contactInfo.callNumber || "111333456")?.replace(/\s+/g, "")}`}
              className="flex items-center justify-center gap-2 bg-white text-[#1A1A1A] hover:bg-slate-100 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <PhoneCall className="w-4 h-4 text-red-600" />
              <span>Call Helpline ({contactInfo.uanNumber || "111 333 456"})</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-appointment-modal"));
                }
              }}
              className="flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap border border-white/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
