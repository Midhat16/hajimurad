"use client";

import React from "react";
import { pdf } from "@react-pdf/renderer";
import AppointmentPDFDocument from "@/components/pdf/AppointmentPDFDocument";

/**
 * Shared utility to generate Appointment PDF Blob and open it in a new browser tab.
 * Works dynamically across all appointment booking forms in the hospital application.
 * @param {Object} appointmentData - Submitted appointment form data
 */
export async function generateAndOpenAppointmentPDF(appointmentData) {
  try {
    const pdfProps = {
      patientName: appointmentData?.name || appointmentData?.patientName || "Valued Patient",
      appointmentId: appointmentData?.appointmentId || appointmentData?.id || "HM-2026-0001",
      appointmentFor: appointmentData?.appointmentFor || "",
      age: appointmentData?.age || "",
      dob: appointmentData?.dob || "",
      gender: appointmentData?.gender || "",
      cnic: appointmentData?.patientCnic || appointmentData?.cnic || "",
      contact: appointmentData?.phone || appointmentData?.contact || "0324-1111692",
      email: appointmentData?.email || "",
      address: appointmentData?.patientAddress || appointmentData?.address || "",
      guardianName: appointmentData?.guardianName || "",
      guardianRelation: appointmentData?.guardianRelation || "",
      guardianPhone: appointmentData?.guardianPhone || "",
      guardianCnic: appointmentData?.guardianCnic || "",
      service: appointmentData?.service || "General Eye Care",
      selectedFeatures: appointmentData?.selectedFeatures || appointmentData?.treatments || [],
      doctor: appointmentData?.doctor || "Assigned Medical Officer",
      date: appointmentData?.date || new Date().toISOString().split("T")[0],
      time: appointmentData?.time || "Standard Slot",
      branch: appointmentData?.branch || "Main OPD Complex, Haji Murad Eye Hospital Trust",
      notes: appointmentData?.notes || appointmentData?.symptoms || appointmentData?.comments || "",
    };

    // Render PDF Document asynchronously into Blob
    const pdfInstance = pdf(<AppointmentPDFDocument {...pdfProps} />);
    const blob = await pdfInstance.toBlob();
    const blobUrl = URL.createObjectURL(blob);

    // Open PDF Blob URL in a new browser tab
    const newTab = window.open(blobUrl, "_blank");
    if (!newTab) {
      window.location.href = blobUrl;
    }
  } catch (err) {
    console.error("Error generating or opening PDF in new tab:", err);
  }
}

// Alias for backwards compatibility across all component invocations
export const openAppointmentPDFInNewTab = generateAndOpenAppointmentPDF;
