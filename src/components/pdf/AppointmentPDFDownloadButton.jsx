"use client";

import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import AppointmentPDFDocument from "./AppointmentPDFDocument";

export default function AppointmentPDFDownloadButton({ appointmentData, className = "" }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 bg-slate-200 text-slate-500 px-4 py-2.5 rounded-xl font-bold text-xs cursor-not-allowed ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Preparing PDF...</span>
      </button>
    );
  }

  const pdfProps = {
    patientName: appointmentData?.name || "Valued Patient",
    appointmentId: appointmentData?.appointmentId || appointmentData?.id || "HM-2026-0001",
    service: appointmentData?.service || "General Eye Care",
    doctor: appointmentData?.doctor || "Consultant Eye Specialist",
    date: appointmentData?.date || new Date().toISOString().split("T")[0],
    time: appointmentData?.time || "Standard Slot",
    branch: appointmentData?.branch || "Main OPD Complex, Haji Murad Eye Hospital Trust",
    contact: appointmentData?.phone || "0324-1111692",
    email: appointmentData?.email || "",
  };

  const fileName = `Appointment_Confirmation_${pdfProps.appointmentId}.pdf`;

  return (
    <PDFDownloadLink
      document={<AppointmentPDFDocument {...pdfProps} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          type="button"
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] hover:opacity-95 text-white px-5 py-3 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer disabled:opacity-50 ${className}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Slip...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Confirmation PDF</span>
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
