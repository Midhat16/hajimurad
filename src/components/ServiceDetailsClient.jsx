"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sortDoctors } from "@/lib/doctorUtils";
import { getServiceBySlug, getCanonicalSlug } from "@/data/servicesData";
import DoctorPhotoFrame from "@/components/DoctorPhotoFrame";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Stethoscope,
  Activity,
  Sun,
  Eye,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  UserCheck,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  Stethoscope,
  Eye,
  Activity,
  Sun,
  ShieldAlert,
  Sparkles,
};

function ServiceFaqItem({ faq, isOpen, onToggle, index }) {
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-[var(--iris)] transition-colors cursor-pointer"
      >
        <span className="text-sm sm:text-base leading-snug">
          {faq.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[var(--iris)] shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceDetailsContent({ slug: propSlug }) {
  const searchParams = useSearchParams();
  const params = useParams();

  const rawParam =
    propSlug ||
    (params ? params.slug : null) ||
    (searchParams ? searchParams.get("slug") || searchParams.get("id") : null);

  const targetSlug = getCanonicalSlug(null, rawParam);
  const service = getServiceBySlug(targetSlug);
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    if (!service) {
      setLoadingDoctors(false);
      return;
    }
    setLoadingDoctors(true);

    let firestoreServices = [];
    let firestoreDoctors = [];
    let servicesLoaded = false;
    let doctorsLoaded = false;

    const processAssignedDoctors = () => {
      if (!servicesLoaded || !doctorsLoaded) return;

      const matchedSvc = firestoreServices.find((s) => {
        const canonical = getCanonicalSlug(s, s.id);
        return canonical === targetSlug;
      });

      const assignedIdsSet = new Set();
      const svcSource = matchedSvc || service;

      const requestedFeature = searchParams ? (searchParams.get("feature") || searchParams.get("type")) : null;

      if (svcSource) {
        if (requestedFeature && Array.isArray(svcSource.featureDoctorMappings)) {
          const featLower = requestedFeature.toLowerCase();
          const featMapping = svcSource.featureDoctorMappings.find((m) => {
            const name = (m.featureName || "").toLowerCase();
            return (
              name === featLower ||
              name.includes(featLower) ||
              featLower.includes(name) ||
              (name.includes("iridotomy") && featLower.includes("iridotomy")) ||
              (name.includes("capsulotomy") && featLower.includes("capsulotomy")) ||
              (name.includes("lasik") && featLower.includes("lasik")) ||
              (name.includes("prk") && featLower.includes("prk"))
            );
          });

          if (featMapping) {
            if (Array.isArray(featMapping.assignedDoctorIds)) {
              featMapping.assignedDoctorIds.forEach((id) => id && assignedIdsSet.add(id));
            }
            if (Array.isArray(featMapping.assignedDoctors)) {
              featMapping.assignedDoctors.forEach((d) => d?.doctorId && assignedIdsSet.add(d.doctorId));
            }
            if (featMapping.doctorOverrides) {
              Object.keys(featMapping.doctorOverrides).forEach((id) => id && assignedIdsSet.add(id));
            }
          }
        }

        if (assignedIdsSet.size === 0) {
          if (Array.isArray(svcSource.doctorIds)) {
            svcSource.doctorIds.forEach((id) => id && assignedIdsSet.add(id));
          }
          if (Array.isArray(svcSource.featureDoctorMappings)) {
            svcSource.featureDoctorMappings.forEach((mapping) => {
              if (Array.isArray(mapping.assignedDoctorIds)) {
                mapping.assignedDoctorIds.forEach((id) => id && assignedIdsSet.add(id));
              }
              if (Array.isArray(mapping.assignedDoctors)) {
                mapping.assignedDoctors.forEach((d) => d?.doctorId && assignedIdsSet.add(d.doctorId));
              }
              if (mapping.doctorOverrides) {
                Object.keys(mapping.doctorOverrides).forEach((id) => id && assignedIdsSet.add(id));
              }
            });
          }
        }
      }

      if (assignedIdsSet.size > 0) {
        const matchedDocs = firestoreDoctors.filter((doc) => assignedIdsSet.has(doc.id));
        setAssignedDoctors(sortDoctors(matchedDocs));
      } else {
        setAssignedDoctors([]);
      }

      setLoadingDoctors(false);
    };

    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        firestoreServices = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        servicesLoaded = true;
        processAssignedDoctors();
      },
      (err) => {
        console.warn("Services subscription warning:", err);
        servicesLoaded = true;
        processAssignedDoctors();
      }
    );

    const unsubDoctors = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        firestoreDoctors = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        doctorsLoaded = true;
        processAssignedDoctors();
      },
      (err) => {
        console.warn("Doctors subscription warning:", err);
        doctorsLoaded = true;
        processAssignedDoctors();
      }
    );

    return () => {
      unsubServices();
      unsubDoctors();
    };
  }, [service, targetSlug]);

  if (!service) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-slate-800">Service Not Found</h2>
          <p className="text-xs text-slate-500 font-semibold">
            The requested service details page could not be located.
          </p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Services
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = iconMap[service.icon] || Sparkles;

  const handleBookAppointment = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-appointment-modal", {
          detail: { preSelectedService: service },
        })
      );
    }
  };

  return (
    <div className="pb-20 bg-slate-50/50 min-h-screen">
      {/* Hero Banner Section */}
      <section className="bg-[#1E1433] text-white py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-xl mb-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 space-y-4">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#5EEAD4] hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Services
          </Link>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-white/15 text-white px-3.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
              <IconComponent className="w-3.5 h-3.5 text-[#5EEAD4]" /> {service.patientTitle}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {service.patientTitle} in Gujranwala
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-medium max-w-3xl leading-relaxed">
            {service.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-10">

          {/* Section 1: What is this Service? */}
          <div className="space-y-3 border-b border-slate-100 pb-8">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <IconComponent className="w-5 h-5 text-[var(--iris)] shrink-0" />
              What is {service.patientTitle}?
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              {service.whatIsIt}
            </p>
          </div>

          {/* Section 2: Symptoms / Signs You May Need This */}
          <div className="space-y-4 border-b border-slate-100 pb-8">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              Symptoms & Signs You May Need This
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {service.symptoms.map((symptom, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80 text-xs sm:text-sm text-slate-800 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: When is this Recommended? */}
          <div className="space-y-3 border-b border-slate-100 pb-8">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--iris)] shrink-0" />
              When is this Recommended?
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-blue-50/40 p-5 rounded-2xl border border-blue-100/80">
              {service.whenRecommended}
            </p>
          </div>

          {/* Section 4: Process & How it Works */}
          <div className="space-y-4 border-b border-slate-100 pb-8">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--iris)] shrink-0" />
              What Happens During the Consultation & Procedure?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {service.howItWorks.map((stepObj) => (
                <div
                  key={stepObj.step}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative"
                >
                  <div className="w-7 h-7 rounded-xl bg-[var(--iris)] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {stepObj.step}
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#2B1F1A]">
                    {stepObj.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {stepObj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Types / Sub-options (If applicable) */}
          {service.typesOptions && service.typesOptions.length > 0 && (
            <div className="space-y-4 border-b border-slate-100 pb-8">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                Available Treatment Types & Options
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.typesOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5"
                  >
                    <h3 className="text-xs sm:text-sm font-extrabold text-purple-900">
                      {opt.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 8: Doctors Offering This Service */}
          <div className="space-y-4 border-b border-slate-100 pb-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[var(--iris)] shrink-0" />
                Assigned Specialists Offering This Service
              </h2>
              <Link
                href="/doctors"
                className="text-xs font-bold text-[var(--iris)] hover:underline inline-flex items-center gap-1"
              >
                View All Doctors <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingDoctors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-pulse space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-8 bg-slate-200 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : assignedDoctors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-2">
                {assignedDoctors.map((doc) => {
                  const isConsultant = doc.isConsultant === true;

                  return (
                    <div
                      key={doc.id}
                      className="bg-slate-50 hover:bg-slate-100/80 p-5 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <DoctorPhotoFrame doctor={doc} size="xs" className="mx-auto sm:mx-0 shrink-0" />
                        <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
                          <h3 className="text-sm font-black text-[#2B1F1A] leading-snug break-words">
                            {doc.name}
                          </h3>
                          <p className="text-xs font-bold text-slate-600 leading-normal break-words">
                            {doc.specialty || doc.role}
                          </p>
                          <div className="pt-1">
                            {isConsultant ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-black border border-emerald-300">
                                Consultant Doctor
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-bold">
                                Medical Team
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                        {/* Book Consult Button - ONLY if doc.isConsultant === true */}
                        {isConsultant && (
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                window.dispatchEvent(
                                  new CustomEvent("open-appointment-modal", {
                                    detail: {
                                      doctorId: doc.id,
                                      doctorName: doc.name,
                                      serviceName: service.patientTitle || service.medicalTitle,
                                    },
                                  })
                                );
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#C4232C] hover:bg-[#a81c24] text-white text-[11px] font-extrabold py-2 px-3 rounded-xl shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#5EEAD4]" />
                            <span>Book Consult</span>
                          </button>
                        )}

                        {/* View Profile Link */}
                        <Link
                          href={`/doctors/details?id=${doc.id}`}
                          className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-[11px] transition-colors cursor-pointer ${
                            isConsultant ? "" : "w-full"
                          }`}
                        >
                          <span>View Profile</span>
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-2xl text-center border border-slate-200">
                <p className="text-xs font-semibold text-slate-500">
                  Doctor information for this service will be updated soon.
                </p>
              </div>
            )}
          </div>

          {/* Section 9: Book Appointment Pre-Selected Banner */}
          <div className="bg-[#1E1433] text-white p-6 sm:p-8 rounded-3xl text-center space-y-4 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Schedule Your {service.patientTitle} Visit
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto font-medium">
              Book a consultation with our experienced eye specialists at Haji Murad Eye Hospital Trust in Gujranwala today.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleBookAppointment}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg hover:shadow-xl border border-white/20 transition-all cursor-pointer"
              >
                <Calendar className="w-4.5 h-4.5 text-white" />
                <span>Book Appointment</span>
              </button>
              <a
                href="tel:111333456"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm border border-white/20 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#5EEAD4]" />
                <span>Call Helpline (111 333 456)</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailsClient({ slug }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[65vh] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
              Loading Service Information...
            </p>
          </div>
        </div>
      }
    >
      <ServiceDetailsContent slug={slug} />
    </Suspense>
  );
}
