"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, Calendar, ArrowRight } from "lucide-react";

function ActionSuccessContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const name = searchParams.get("name") || "Patient";
  const id = searchParams.get("id") || "";
  const error = searchParams.get("error");

  const isConfirmed = status === "confirmed";
  const isCancelled = status === "cancelled";

  return (
    <div className="min-h-screen bg-[var(--fog)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[var(--line)] shadow-xl p-6 sm:p-8 text-center">
        
        {/* Header Icon */}
        {isConfirmed ? (
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : isCancelled ? (
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
            <XCircle className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertCircle className="w-10 h-10" />
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-[#2B1F1A]">
          {isConfirmed
            ? "Appointment Confirmed! ✅"
            : isCancelled
            ? "Appointment Cancelled"
            : error
            ? "Action Notice"
            : "Status Updated"}
        </h1>

        {/* Subtitle / Details */}
        <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">
          {isConfirmed ? (
            <>
              The appointment request for <strong className="text-slate-800">{name}</strong> {id && `(#${id})`} has been <strong>CONFIRMED</strong>. Instant WhatsApp & Email notifications have been dispatched to the patient.
            </>
          ) : isCancelled ? (
            <>
              The appointment request for <strong className="text-slate-800">{name}</strong> {id && `(#${id})`} has been <strong>CANCELLED</strong>. A cancellation email and WhatsApp update have been sent to the patient.
            </>
          ) : (
            error || "The appointment action has been recorded in the hospital system."
          )}
        </p>

        {/* Action Button */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <Link
            href="/admin/appointments"
            className="w-full inline-flex items-center justify-center gap-2 bg-[var(--ink)] hover:bg-[#1A1310] text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Go to Admin Appointments Desk
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--fog)] flex items-center justify-center text-xs font-bold text-slate-600">Loading confirmation page...</div>}>
      <ActionSuccessContent />
    </Suspense>
  );
}
