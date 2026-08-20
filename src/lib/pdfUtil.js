"use client";

import { PDF_BANNER_BASE64 } from "@/lib/pdfAssets";

/**
 * Pre-processes an image via HTML5 Canvas blur filter for react-pdf background layers
 */
export async function getBlurredBase64Image(dataUri, blurPx = 16) {
  if (typeof window === "undefined" || !dataUri || typeof dataUri !== "string") {
    return dataUri;
  }
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const w = img.width || 600;
          const h = img.height || 200;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.filter = `blur(${blurPx}px)`;
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
            return;
          }
        } catch (e) {
          console.warn("Canvas blur filter warning:", e);
        }
        resolve(dataUri);
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    } catch (e) {
      resolve(dataUri);
    }
  });
}

/**
 * Shared utility to generate Appointment PDF Blob and open it in a new browser tab.
 * Works dynamically across all appointment booking forms in the hospital application.
 * @param {Object} appointmentData - Submitted appointment form data
 */
export async function generateAndOpenAppointmentPDF(appointmentData) {
  try {
    const [{ pdf }, { default: AppointmentPDFDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/AppointmentPDFDocument"),
    ]);

    const rawBanner = appointmentData?.bannerBgUrl || PDF_BANNER_BASE64;

    const pdfProps = {
      patientName: appointmentData?.name || appointmentData?.patientName || "Valued Patient",
      appointmentId: appointmentData?.appointmentId || appointmentData?.id || "HM-2026-0001",
      appointmentFor: appointmentData?.appointmentFor || "",
      age: appointmentData?.age || "",
      dob: appointmentData?.dob || "",
      gender: appointmentData?.gender || "",
      cnic: appointmentData?.patientCnic || appointmentData?.cnic || "",
      contact: appointmentData?.phone || appointmentData?.contact || "0324-1111691",
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
      bannerBgUrl: rawBanner,
    };

    // Render PDF Document asynchronously into Blob
    const pdfInstance = pdf(<AppointmentPDFDocument {...pdfProps} />);
    const blob = await pdfInstance.toBlob();
    const blobUrl = URL.createObjectURL(blob);

    const fileName = `Appointment_Confirmation_${pdfProps.appointmentId}.pdf`;

    // 1. Programmatically trigger auto-download to user's device Downloads folder
    if (typeof document !== "undefined") {
      try {
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          if (document.body.contains(downloadLink)) {
            document.body.removeChild(downloadLink);
          }
        }, 1000);
      } catch (dlErr) {
        console.warn("Auto-download link click warning:", dlErr);
      }
    }

    // 2. Open PDF Blob URL in a new browser tab for instant viewing
    if (typeof window !== "undefined") {
      const newTab = window.open(blobUrl, "_blank");
      if (!newTab) {
        window.location.href = blobUrl;
      }
    }
  } catch (err) {
    console.error("Error generating, downloading, or opening PDF:", err);
  }
}

// Alias for backwards compatibility across all component invocations
export const openAppointmentPDFInNewTab = generateAndOpenAppointmentPDF;
