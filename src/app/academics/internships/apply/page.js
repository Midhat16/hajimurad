"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, GraduationCap, Clock, Users, Building2, CheckCircle2, Send, AlertCircle, FileText, User, Mail, Phone, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

function ApplyFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverMessage, setCoverMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchInternship() {
      try {
        const docRef = doc(db, "internships", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInternship({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Internship program not found.");
        }
      } catch (err) {
        console.warn("Error fetching internship details:", err);
        setError("Failed to load internship details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInternship();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!applicantName.trim() || !email.trim() || !phone.trim()) {
      setError("Please complete all required fields (Name, Email, Phone).");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create document in internshipApplications collection
      const appRef = await addDoc(collection(db, "internshipApplications"), {
        applicantName: applicantName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        coverMessage: coverMessage.trim(),
        internshipId: id || "",
        internshipTitle: internship?.title || "General Internship",
        department: internship?.department || "General",
        status: "pending",
        read: false,
        createdAt: serverTimestamp(),
      });

      // 2. Add real-time notification document for Admin
      await addDoc(collection(db, "notifications"), {
        title: `New Internship Application: ${applicantName.trim()}`,
        message: `Applied for ${internship?.title || "Internship"} (${internship?.department || "General"})`,
        type: "internship_application",
        applicationId: appRef.id,
        recipient_type: "admin",
        is_read: false,
        read: false,
        createdAt: serverTimestamp(),
      });

      // 3. Log to activityLog
      await addDoc(collection(db, "activityLog"), {
        action: "internship_application_submitted",
        applicantName: applicantName.trim(),
        internshipTitle: internship?.title || "",
        department: internship?.department || "",
        message: `${applicantName.trim()} submitted an internship application for ${internship?.title || "Internship"}`,
        read: false,
        timestamp: serverTimestamp(),
      });

      setSubmittedSuccess(true);
    } catch (err) {
      console.error("Submit application error:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">Loading Program Specs...</p>
        </div>
      </div>
    );
  }

  if (error || (!internship && !loading)) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-[var(--line)] text-center space-y-4 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-[#2B1F1A]">Program Not Found</h2>
          <p className="text-xs text-[var(--slate)] font-semibold">
            {error || "The internship program you are looking for does not exist or has been removed."}
          </p>
          <Link
            href="/academics/internships"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris-dark)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Internships
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        href="/academics/internships"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[#2B1F1A] hover:text-[var(--iris)] transition-colors bg-white px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Internships
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Program Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--fog)] text-[var(--iris)] px-3 py-1 rounded-full border border-[var(--line)] flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {internship.department || "Medical"}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {internship.duration || "3 Months"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] tracking-tight">
                {internship.title}
              </h1>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-800 uppercase block">Available Seats</span>
                <span className="font-black text-[#2B1F1A] text-sm flex items-center gap-1 mt-0.5">
                  <Users className="w-4 h-4 text-[var(--iris)] shrink-0" /> {internship.seatsAvailable || "Limited"} Positions
                </span>
              </div>
              <div className="bg-[var(--fog)] p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-800 uppercase block">Certificate</span>
                <span className="font-black text-emerald-950 text-sm flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> Official Award
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--iris)] flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <FileText className="w-4 h-4" /> Program Overview & Responsibilities
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                {internship.description}
              </p>
            </div>

            {/* Requirements */}
            {internship.requirements && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--iris)] flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <CheckCircle2 className="w-4 h-4" /> Eligibility & Skills Required
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                  {internship.requirements}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Application Form */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-xl space-y-6 sticky top-28">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-3 py-1 rounded-full border border-[var(--line)]">
                Application Form
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-2">
                Apply For This Program
              </h2>
              <p className="text-xs font-semibold text-[var(--slate)] mt-1">
                Fill in your candidate information below. Our academic board will review your profile.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold text-emerald-900">Application Submitted!</h3>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Thank you for applying for <strong>{internship.title}</strong>. Our academic team has received your application and will contact you via email/phone shortly.
                </p>
                <div className="pt-2">
                  <Link
                    href="/academics/internships"
                    className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--iris-dark)] transition-colors"
                  >
                    Explore Other Internships
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Candidate Name */}
                <div>
                  <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="03xx-xxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                    />
                  </div>
                </div>

                {/* Cover Message / Experience */}
                <div>
                  <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                    Statement of Purpose / Cover Message
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      rows={4}
                      placeholder="Briefly describe your educational background, experience, and why you wish to join this program..."
                      value={coverMessage}
                      onChange={(e) => setCoverMessage(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] hover:opacity-95 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Application Now</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InternshipApplyPage() {
  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm">
              <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">Loading Application Form...</p>
            </div>
          </div>
        }
      >
        <ApplyFormContent />
      </Suspense>
    </main>
  );
}
