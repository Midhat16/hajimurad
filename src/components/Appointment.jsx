"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  User,
  Users,
  Mail,
  Phone,
  Stethoscope,
  Clock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  MapPin,
  Info
} from "lucide-react";
import { collection, addDoc, serverTimestamp, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sortDoctors, getAvailableDoctorsForFeatures, getIntersectedDoctorTiming } from "@/lib/doctorUtils";
import { notifyOnAppointmentBooked } from "@/lib/notificationService";
import { triggerEmailApi } from "@/lib/clientEmailHelper";
import { sendWhatsAppMessage } from "@/lib/whatsappApi";
import DatePicker from "react-datepicker";
import { generateAndOpenAppointmentPDF } from "@/lib/pdfUtil";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatCNIC = (val) => {
  if (!val) return "";
  const digits = val.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

// Formats a local Date object into "YYYY-MM-DD" without UTC shift
const formatLocalDateToYYYYMMDD = (d) => {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Parses "YYYY-MM-DD" string into local Date object without UTC shift
const parseYYYYMMDDToLocalDate = (str) => {
  if (!str || typeof str !== "string") return null;
  const parts = str.split("-");
  if (parts.length === 3) {
    const yyyy = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10) - 1;
    const dd = parseInt(parts[2], 10);
    if (!isNaN(yyyy) && !isNaN(mm) && !isNaN(dd)) {
      return new Date(yyyy, mm, dd);
    }
  }
  return null;
};

const calculateAgeFromDOB = (dobStr) => {
  if (!dobStr) return "";
  const birthDate = new Date(dobStr);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return "";
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : "0";
};

// Auto-formats and clamps user typed date as DD/MM/YYYY
const formatDateInputString = (val, maxYearLimit = new Date().getFullYear()) => {
  if (!val) return "";
  let digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";

  let ddStr = "";
  let mmStr = "";
  let yyyyStr = "";

  // 1. Day Part (first 2 digits, max 31)
  if (digits.length >= 1) {
    if (digits.length === 1) {
      ddStr = digits;
    } else {
      let dd = parseInt(digits.slice(0, 2), 10);
      if (isNaN(dd) || dd < 1) dd = 1;
      if (dd > 31) dd = 31;
      ddStr = String(dd).padStart(2, "0");
    }
  }

  // 2. Month Part (digits 3-4, max 12)
  if (digits.length >= 3) {
    if (digits.length === 3) {
      mmStr = digits.slice(2, 3);
    } else {
      let mm = parseInt(digits.slice(2, 4), 10);
      if (isNaN(mm) || mm < 1) mm = 1;
      if (mm > 12) mm = 12;
      mmStr = String(mm).padStart(2, "0");
    }
  }

  // 3. Year Part (digits 5-8, max maxYearLimit)
  if (digits.length >= 5) {
    yyyyStr = digits.slice(4);
    if (yyyyStr.length === 4) {
      let yyyy = parseInt(yyyyStr, 10);
      if (isNaN(yyyy) || yyyy < 1900) yyyy = 1900;
      if (yyyy > maxYearLimit) yyyy = maxYearLimit;
      yyyyStr = String(yyyy);
    }
  }

  if (digits.length > 4) {
    return `${ddStr}/${mmStr}/${yyyyStr}`;
  }
  if (digits.length > 2) {
    return `${ddStr}/${mmStr}`;
  }
  return ddStr;
};

// Parses typed DD/MM/YYYY into YYYY-MM-DD with strict boundary checks
const parseDDMMYYYYToYYYYMMDD = (str, maxYearLimit = new Date().getFullYear()) => {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    let dd = parseInt(parts[0], 10);
    let mm = parseInt(parts[1], 10);
    let yyyy = parseInt(parts[2], 10);

    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return null;

    if (mm < 1) mm = 1;
    if (mm > 12) mm = 12;

    if (yyyy < 1900) yyyy = 1900;
    if (yyyy > maxYearLimit) yyyy = maxYearLimit;

    // Check max days in that month
    const maxDaysInMonth = new Date(yyyy, mm, 0).getDate();
    if (dd < 1) dd = 1;
    if (dd > maxDaysInMonth) dd = maxDaysInMonth;

    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return null;
};

const parseTimeToMinutes = (timeStr, defaultMinutes) => {
  if (!timeStr || typeof timeStr !== "string") return defaultMinutes;
  const str = timeStr.trim();
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);
  const cleanStr = str.replace(/(am|pm)/i, "").trim();
  const parts = cleanStr.split(":");
  let hours = parseInt(parts[0], 10);
  let minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  if (isNaN(hours)) return defaultMinutes;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const generateSlotsForDoctor = (doctorObj) => {
  const startM = parseTimeToMinutes(doctorObj?.workingHours?.start, 540); // 9:00 AM
  const endM = parseTimeToMinutes(doctorObj?.workingHours?.end, 900);     // 3:00 PM (15:00)

  let slots = [];
  let currentM = startM;

  while (currentM + 60 <= endM) {
    const nextM = currentM + 60;
    const formatTimeM = (totalM) => {
      let h = Math.floor(totalM / 60) % 24;
      let m = totalM % 60;
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
    };
    slots.push(`${formatTimeM(currentM)} - ${formatTimeM(nextM)}`);
    currentM += 60;
  }

  if (slots.length === 0) {
    return [
      "09:00 AM - 10:00 AM",
      "10:00 AM - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "12:00 PM - 01:00 PM",
      "01:00 PM - 02:00 PM",
      "02:00 PM - 03:00 PM",
    ];
  }
  return slots;
};

export default function Appointment() {
  const [appointmentFor, setAppointmentFor] = useState("Self"); // "Self" | "Someone Else"
  const [contactInfo, setContactInfo] = useState({
    uanNumber: "111 333 456",
    callNumber: "0324-1111691",
    emergencyNumber: "0324-1111691",
  });

  useEffect(() => {
    try {
      const unsubContact = onSnapshot(
        doc(db, "siteContent", "contactInfo"),
        (docSnap) => {
          if (docSnap.exists()) {
            setContactInfo((prev) => ({ ...prev, ...docSnap.data() }));
          }
        },
        (err) => console.warn("Appointment contactInfo error:", err)
      );
      return () => unsubContact();
    } catch (e) {
      console.warn("Appointment contactInfo error:", e);
    }
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    age: "",
    gender: "Male",
    patientCnic: "",
    email: "",
    phone: "",
    patientAddress: "",
    guardianName: "",
    guardianRelation: "Father",
    guardianCnic: "",
    guardianPhone: "",
    guardianAddress: "",
    service: "",
    selectedFeatures: [],
    doctor: "",
    date: "",
    time: "",
  });

  const [errors, setErrors] = useState({});
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const [servicesList, setServicesList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    // Check URL params on mount for doctor pre-selection
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const doctorParam = params.get("doctor");
      if (doctorParam) {
        setFormData((prev) => ({ ...prev, doctor: doctorParam }));
      }
    }

    // Listen to custom select-doctor event from doctor cards
    const handleSelectDoctor = (e) => {
      if (e.detail?.doctorName) {
        setFormData((prev) => ({ ...prev, doctor: e.detail.doctorName }));
      }
    };

    window.addEventListener("select-doctor", handleSelectDoctor);

    // Dynamic subscription to Firestore services collection
    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setServicesList(items);
      },
      (err) => {
        console.warn("Services subscription notice for Appointment:", err.message);
      }
    );

    // Dynamic subscription to Firestore doctors collection
    const unsubDoctors = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDoctorsList(sortDoctors(items));
      },
      (err) => {
        console.warn("Doctors subscription notice for Appointment:", err.message);
      }
    );

    return () => {
      window.removeEventListener("select-doctor", handleSelectDoctor);
      unsubServices();
      unsubDoctors();
    };
  }, []);

  const activeDoctorObj = doctorsList.find(
    (d) => d.name === formData.doctor || d.id === formData.doctor
  );

  const selectedServiceObj = servicesList.find(
    (s) => (s.title || s.name) === formData.service || s.id === formData.service
  );

  const minBookingDays = selectedServiceObj && selectedServiceObj.minBookingDays !== undefined && selectedServiceObj.minBookingDays !== null
    ? Math.max(0, Number(selectedServiceObj.minBookingDays))
    : 0;

  const rawMaxBookingDays = selectedServiceObj && selectedServiceObj.maxBookingDays !== undefined && selectedServiceObj.maxBookingDays !== null && selectedServiceObj.maxBookingDays !== ""
    ? Number(selectedServiceObj.maxBookingDays)
    : null;

  const getSelectableDateRange = () => {
    const getNormalizedToday = () => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return t;
    };

    const docWorkingDays = activeDoctorObj?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const isValidWorkingDay = (d) => {
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      if (dayName === "Sunday") return false;
      return docWorkingDays.includes(dayName);
    };

    const today = getNormalizedToday();
    let current = new Date(today);
    current.setDate(current.getDate() + minBookingDays);

    while (!isValidWorkingDay(current)) {
      current.setDate(current.getDate() + 1);
    }
    const minSelectableDate = new Date(current);

    let maxSelectableDate = null;
    if (rawMaxBookingDays && rawMaxBookingDays > 0) {
      let validCount = 0;
      let maxRunner = new Date(minSelectableDate);
      let lastValid = new Date(minSelectableDate);

      while (validCount < rawMaxBookingDays && maxRunner.getFullYear() <= today.getFullYear() + 2) {
        if (isValidWorkingDay(maxRunner)) {
          validCount++;
          lastValid = new Date(maxRunner);
        }
        if (validCount < rawMaxBookingDays) {
          maxRunner.setDate(maxRunner.getDate() + 1);
        }
      }
      lastValid.setHours(23, 59, 59, 999);
      maxSelectableDate = lastValid;
    }

    return { minSelectableDate, maxSelectableDate };
  };

  const { minSelectableDate, maxSelectableDate } = getSelectableDateRange();

  useEffect(() => {
    if (formData.date) {
      const selectedDateObj = new Date(formData.date + "T00:00:00");
      selectedDateObj.setHours(0, 0, 0, 0);
      if (!isNaN(selectedDateObj.getTime())) {
        if (selectedDateObj < minSelectableDate || (maxSelectableDate && selectedDateObj > maxSelectableDate)) {
          setFormData((prev) => ({ ...prev, date: "" }));
          const serviceName = formData.service === "not_sure" ? "General OPD" : (formData.service || "Selected service");
          setNoticeMessage(
            `Date reset: ${serviceName} is bookable starting from ${minSelectableDate.toLocaleDateString("en-GB")}.`
          );
        }
      }
    }
  }, [formData.service]);

  if (formData.doctor) {
    console.log("🔍 DIAGNOSTIC -> Selected Doctor in Form:", formData.doctor);
    console.log("🔍 DIAGNOSTIC -> Matched Doctor Object:", activeDoctorObj);
    console.log("🔍 DIAGNOSTIC -> Doctor workingHours from Firestore:", activeDoctorObj?.workingHours);
  }

  const availableTimeSlots = generateSlotsForDoctor(
    formData.doctor === "not_sure" ? null : activeDoctorObj
  );

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Patient Full Name is required";

    if (formData.patientCnic.trim() && formData.patientCnic.length < 15) {
      tempErrors.patientCnic = "CNIC format must be XXXXX-XXXXXXX-X (13 digits)";
    }

    const phoneClean = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (phoneClean.length !== 11) {
      tempErrors.phone = "Phone number must be exactly 11 digits (e.g. 03XX-XXXXXXX)";
    }

    // Guardian details required if "Someone Else"
    if (appointmentFor === "Someone Else") {
      if (!formData.guardianName.trim()) {
        tempErrors.guardianName = "Guardian Full Name is required";
      }
      const gPhoneClean = formData.guardianPhone.replace(/\D/g, "");
      if (!formData.guardianPhone.trim()) {
        tempErrors.guardianPhone = "Guardian Phone number is required";
      } else if (gPhoneClean.length !== 11) {
        tempErrors.guardianPhone = "Guardian Phone number must be exactly 11 digits (e.g. 03XX-XXXXXXX)";
      }

      if (formData.guardianCnic.trim() && formData.guardianCnic.length < 15) {
        tempErrors.guardianCnic = "CNIC format must be XXXXX-XXXXXXX-X (13 digits)";
      }
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!formData.dob) {
      tempErrors.dob = "Date of Birth is required";
    }

    if (!formData.gender) {
      tempErrors.gender = "Gender is required";
    }

    if (!formData.date) {
      tempErrors.date = "Please choose an appointment date";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Selected service object
  const selectedServiceObject = servicesList.find(
    (s) => (s.title || s.name) === formData.service
  );

  const availableServiceFeatures = selectedServiceObject?.features || [];

  // Filter doctors using getAvailableDoctorsForFeatures (enforces service/feature assignment AND isConsultant: true)
  const filteredDoctors = getAvailableDoctorsForFeatures(
    formData.selectedFeatures,
    selectedServiceObject?.featureDoctorMappings,
    doctorsList,
    selectedServiceObject?.doctorIds
  );

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "service") {
      setFormData((prev) => ({
        ...prev,
        service: value,
        selectedFeatures: [],
      }));
      setShowFeatures(false);
      if (errors.service) setErrors((prev) => ({ ...prev, service: "" }));
      if (noticeMessage) setNoticeMessage("");
      return;
    }
    if (name === "dob") {
      const calculatedAge = calculateAgeFromDOB(value);
      setFormData((prev) => ({
        ...prev,
        dob: value,
        age: calculatedAge,
      }));
      return;
    }
    if (name === "phone" || name === "guardianPhone") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      if (digits.length > 4) {
        value = `${digits.slice(0, 4)}-${digits.slice(4)}`;
      } else {
        value = digits;
      }
    }
    if (name === "patientCnic" || name === "guardianCnic") {
      value = formatCNIC(value);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (noticeMessage) setNoticeMessage("");
  };

  const handleFeatureToggle = (featureTitle) => {
    setFormData((prev) => {
      const current = prev.selectedFeatures || [];
      const exists = current.includes(featureTitle);
      const updated = exists
        ? current.filter((f) => f !== featureTitle)
        : [...current, featureTitle];
      return {
        ...prev,
        selectedFeatures: updated,
      };
    });
  };

  const handleDoctorChange = (e) => {
    const newDocVal = e.target.value;
    const newDocObj = doctorsList.find((d) => d.name === newDocVal || d.id === newDocVal);

    let shouldReset = false;

    // Check date compatibility if already selected
    if (formData.date) {
      const dateObj = parseYYYYMMDDToLocalDate(formData.date);
      const dayIndex = dateObj ? dateObj.getDay() : 0;
      if (dayIndex === 0) {
        shouldReset = true;
      } else if (newDocVal && newDocVal !== "not_sure" && newDocObj) {
        const newDays = newDocObj.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if (!newDays.includes(WEEKDAYS[dayIndex])) {
          shouldReset = true;
        }
      }
    }

    // Check time slot compatibility if already selected
    if (formData.time) {
      const newSlots = generateSlotsForDoctor(newDocVal === "not_sure" ? null : newDocObj);
      if (!newSlots.includes(formData.time)) {
        shouldReset = true;
      }
    }

    if (shouldReset && (formData.date || formData.time)) {
      setNoticeMessage("Please reselect date/time based on doctor's availability.");
      setFormData((prev) => ({
        ...prev,
        doctor: newDocVal,
        date: "",
        time: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        doctor: newDocVal,
      }));
    }

    if (errors.doctor) setErrors((prev) => ({ ...prev, doctor: "" }));
  };

  const filterAvailableDates = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < minSelectableDate) {
      return false;
    }

    if (maxSelectableDate) {
      const maxCutoff = new Date(maxSelectableDate);
      maxCutoff.setHours(23, 59, 59, 999);
      if (checkDate > maxCutoff) {
        return false;
      }
    }

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    if (dayName === "Sunday") return false;
    if (!formData.doctor || formData.doctor === "not_sure") return true;
    const docDays = activeDoctorObj?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return docDays.includes(dayName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const selectedDocObj = formData.doctor === "not_sure"
        ? null
        : doctorsList.find((d) => d.name === formData.doctor || d.id === formData.doctor);

      const doctorIdToSave = selectedDocObj ? selectedDocObj.id : "";
      const doctorNameToSave = formData.doctor === "not_sure"
        ? "Not Sure / Let Front Desk Decide"
        : (selectedDocObj?.name || formData.doctor || "General OPD");

      const apptDoc = {
        appointmentFor,
        name: formData.name.trim(),
        dob: formData.dob,
        age: formData.age,
        gender: formData.gender,
        patientCnic: formData.patientCnic,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        patientAddress: formData.patientAddress.trim(),
        guardianName: appointmentFor === "Someone Else" ? formData.guardianName.trim() : "",
        guardianRelation: appointmentFor === "Someone Else" ? formData.guardianRelation : "",
        guardianCnic: appointmentFor === "Someone Else" ? formData.guardianCnic : "",
        guardianPhone: appointmentFor === "Someone Else" ? formData.guardianPhone.trim() : "",
        guardianAddress: appointmentFor === "Someone Else" ? formData.guardianAddress.trim() : "",
        service: formData.service === "not_sure" ? "Not Sure / Let Front Desk Decide" : formData.service,
        selectedFeatures: formData.selectedFeatures || [],
        doctor: doctorNameToSave,
        doctorId: doctorIdToSave,
        date: formData.date,
        time: formData.time,
        status: "pending",
        actionToken: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "appointments"), apptDoc);
      const generatedId = docRef?.id ? docRef.id.slice(0, 8).toUpperCase() : "HM-2026";
      const finalApptData = {
        ...apptDoc,
        id: docRef?.id || "HM-2026-0001",
        firestoreId: docRef?.id || "HM-2026-0001",
        appointmentId: `HM-${generatedId}`,
        actionToken: apptDoc.actionToken,
      };

      // Automatically generate PDF and open in a new browser tab
      generateAndOpenAppointmentPDF(finalApptData);

      // Trigger automatic notifications for Doctor & Admin
      await notifyOnAppointmentBooked(apptDoc, docRef.id);

      // Trigger automatic dual emails to User & Admin via SMTP
      triggerEmailApi({
        type: "BOOKING_RECEIVED",
        data: finalApptData,
      }).catch((err) => console.warn("Booking email trigger notice:", err));

      // Trigger automatic WhatsApp notifications via Vercel backend API (Non-blocking)
      const patientPhone = formData.phone || apptDoc.phone || "";
      const patientName = formData.fullName || apptDoc.name || "Patient";
      const serviceName = apptDoc.service || "Ophthalmic Consultation";
      const doctorName = apptDoc.doctor || "Medical Specialist";
      const apptDate = formData.date || apptDoc.date || "Scheduled Date";
      const adminPhone = "923151477920";

      if (patientPhone) {
        sendWhatsAppMessage(patientPhone, "appointment_confirmation_pending", [
          patientName,
          serviceName,
          doctorName,
          apptDate,
        ]).catch((err) => console.error("WhatsApp patient send failed:", err));
      }

      sendWhatsAppMessage(adminPhone, "admin_new_appointment", [
        patientName,
        serviceName,
        doctorName,
        apptDate,
        patientPhone || "N/A",
      ]).catch((err) => console.error("WhatsApp admin send failed:", err));

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.warn("Firestore Appointment addDoc warning:", error);
      const fallbackAppt = {
        ...formData,
        id: "HM-2026-DEMO",
        appointmentId: "HM-2026-DEMO",
      };
      generateAndOpenAppointmentPDF(fallbackAppt);
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  return (
    <section id="appointment" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background soft blur */}
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3 py-1 rounded-full border border-[var(--line)] shadow-xs">
            Appointment Desk
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
            Schedule Your Visit
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--slate)]">
            Submit your appointment request below. Our desk coordinators will verify the slot and contact you via call within 2 hours.
          </p>
        </div>

        {/* Booking Card */}
        <div className="glass-card bg-white rounded-[32px] border border-[var(--line)] shadow-lg overflow-hidden relative">

          {/* Top colored indicator bar */}
          <div className="h-1.5 w-full bg-[#C4232C] hover:bg-[#a81c24]" />

          <div className="p-6 sm:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* ================= TOP TOGGLE: SELF / SOMEONE ELSE ================= */}
                  <div className="bg-[var(--fog)] p-2 rounded-2xl border border-[var(--line)]">
                    <label className="text-[11px] font-bold text-[var(--slate)] uppercase tracking-wider block mb-1.5 px-2">
                      Who is this appointment for?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAppointmentFor("Self");
                          setErrors((prev) => ({ ...prev, guardianPhone: "" }));
                        }}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${appointmentFor === "Self"
                            ? "bg-white text-[var(--iris)] shadow-md border border-[var(--iris)]/20"
                            : "text-[var(--slate)] hover:bg-white/60"
                          }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Appointment for Self</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppointmentFor("Someone Else")}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${appointmentFor === "Someone Else"
                            ? "bg-white text-[var(--iris)] shadow-md border border-[var(--iris)]/20"
                            : "text-[var(--slate)] hover:bg-white/60"
                          }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Appointment for Someone Else</span>
                      </button>
                    </div>
                  </div>

                  {/* Reset Notice Banner */}
                  {noticeMessage && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{noticeMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

                    {/* ================= PORTION 1: PATIENT INFORMATION ================= */}
                    <div className="md:col-span-2 pt-1 pb-1 border-b border-[var(--line)] flex items-center justify-between">
                      <span className="text-[11px] font-extrabold tracking-wider text-[var(--iris)] uppercase flex items-center gap-1.5">
                        <User className="w-4 h-4" /> 1. Patient Details
                      </span>
                    </div>

                    {/* Patient Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Patient Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                                 type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder=""
                          required
                          className={`w-full bg-[var(--fog)] border ${errors.name ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name}</p>}
                    </div>

                    {/* Patient Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Patient Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder=""
                          maxLength={12}
                          required
                          className={`w-full bg-[var(--fog)] border ${errors.phone ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone}</p>}
                    </div>

                    {/* Patient Address */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Patient Residential Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="patientAddress"
                          value={formData.patientAddress}
                          onChange={handleChange}
                          placeholder=""
                          className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
                        />
                      </div>
                    </div>

                    {/* Patient Date of Birth, Gender & CNIC */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:col-span-2">
                      {/* Date of Birth Calendar */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block whitespace-nowrap">
                          Date of Birth * {formData.age ? `(${formData.age} Yrs)` : ""}
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                          <DatePicker
                            selected={parseYYYYMMDDToLocalDate(formData.dob)}
                            onChange={(date) => {
                              if (!date) {
                                setFormData((prev) => ({ ...prev, dob: "", age: "" }));
                                if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
                                return;
                              }
                              const dateStr = formatLocalDateToYYYYMMDD(date);
                              const calculatedAge = calculateAgeFromDOB(dateStr);
                              setFormData((prev) => ({
                                ...prev,
                                dob: dateStr,
                                age: calculatedAge,
                              }));
                              if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
                            }}
                            onChangeRaw={(e) => {
                              const rawVal = e.target.value;
                              const currentYear = new Date().getFullYear();
                              const formatted = formatDateInputString(rawVal, currentYear);
                              e.target.value = formatted;
                              const validDate = parseDDMMYYYYToYYYYMMDD(formatted, currentYear);
                              if (validDate) {
                                const calculatedAge = calculateAgeFromDOB(validDate);
                                setFormData((prev) => ({
                                  ...prev,
                                  dob: validDate,
                                  age: calculatedAge,
                                }));
                                if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
                              }
                            }}
                            maxDate={new Date()}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                            yearDropdownItemNumber={100}
                            scrollableYearDropdown
                            dateFormat="dd MMMM yyyy"
                            placeholderText="Select date of birth"
                            required
                            className={`w-full bg-[var(--fog)] border ${errors.dob
                              ? "border-red-300 focus:ring-red-200"
                              : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-10 pr-2 py-3 text-xs sm:text-sm text-black font-semibold placeholder:text-black placeholder:font-medium focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.dob && <p className="text-xs text-red-500 font-semibold">{errors.dob}</p>}
                      </div>

                      {/* Gender */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Gender</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            className={`w-full bg-[var(--fog)] border ${errors.gender
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-10 pr-2 py-3.5 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {errors.gender && <p className="text-xs text-red-500 font-semibold">{errors.gender}</p>}
                      </div>

                      {/* Patient CNIC / B-Form Number */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Patient CNIC / B-Form No.</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            name="patientCnic"
                            value={formData.patientCnic}
                            onChange={handleChange}
                            maxLength={15}
                            placeholder=""
                            className={`w-full bg-[var(--fog)] border ${errors.patientCnic ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all font-mono`}
                          />
                        </div>
                        {errors.patientCnic && <p className="text-xs text-red-500 font-semibold">{errors.patientCnic}</p>}
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder=""
                          className={`w-full bg-[var(--fog)] border ${errors.email ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email}</p>}
                    </div>

                    {/* ================= PORTION 2: GUARDIAN DETAILS (ONLY IF SOMEONE ELSE) ================= */}
                    {appointmentFor === "Someone Else" && (
                      <>
                        <div className="md:col-span-2 pt-3 pb-1 border-b border-[var(--line)] flex items-center justify-between">
                          <span className="text-[11px] font-extrabold tracking-wider text-[var(--iris)] uppercase flex items-center gap-1.5">
                            <Users className="w-4 h-4" /> 2. Guardian Details
                          </span>
                        </div>

                        {/* Guardian Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Guardian Full Name *</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              name="guardianName"
                              value={formData.guardianName}
                              onChange={handleChange}
                              placeholder=""
                              required
                              className={`w-full bg-[var(--fog)] border ${errors.guardianName ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                                } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                            />
                          </div>
                          {errors.guardianName && <p className="text-xs text-red-500 font-semibold">{errors.guardianName}</p>}
                        </div>

                        {/* Guardian Phone Number (REQUIRED) */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Guardian Phone Number *</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                              type="tel"
                              name="guardianPhone"
                              value={formData.guardianPhone}
                              onChange={handleChange}
                              placeholder=""
                              maxLength={12}
                              required
                              className={`w-full bg-[var(--fog)] border ${errors.guardianPhone ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                                } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                            />
                          </div>
                          {errors.guardianPhone && <p className="text-xs text-red-500 font-semibold">{errors.guardianPhone}</p>}
                        </div>

                        {/* Guardian Address */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Guardian Residential Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              name="guardianAddress"
                              value={formData.guardianAddress}
                              onChange={handleChange}
                              placeholder=""
                              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
                            />
                          </div>
                        </div>

                        {/* Guardian Relation */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Guardian Relation</label>
                          <div className="relative">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <select
                              name="guardianRelation"
                              value={formData.guardianRelation}
                              onChange={handleChange}
                              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none"
                            >
                              <option value="Father">Father</option>
                              <option value="Husband">Husband</option>
                              <option value="Mother">Mother</option>
                              <option value="Brother/Sister">Brother / Sister</option>
                              <option value="Son/Daughter">Son / Daughter</option>
                              <option value="Legal Guardian">Legal Guardian</option>
                            </select>
                          </div>
                        </div>

                        {/* Guardian CNIC Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Guardian CNIC Number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              name="guardianCnic"
                              value={formData.guardianCnic}
                              onChange={handleChange}
                              maxLength={15}
                              placeholder=""
                              className={`w-full bg-[var(--fog)] border ${errors.guardianCnic ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                                } rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all font-mono`}
                            />
                          </div>
                          {errors.guardianCnic && <p className="text-xs text-red-500 font-semibold">{errors.guardianCnic}</p>}
                        </div>
                      </>
                    )}

                    {/* ================= PORTION 3: APPOINTMENT DETAILS (ALWAYS VISIBLE) ================= */}
                    <div className="md:col-span-2 pt-3 pb-1 border-b border-[var(--line)] flex items-center justify-between">
                      <span className="text-[11px] font-extrabold tracking-wider text-[var(--iris)] uppercase flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> {appointmentFor === "Someone Else" ? "3." : "2."} Appointment Details
                      </span>
                    </div>

                    {/* Preferred Department/Service */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Eye Treatment / Service</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          className={`w-full bg-[var(--fog)] border ${errors.service ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                        >
                          <option value="">Select Treatment</option>
                          <option value="not_sure" className="font-bold text-[var(--iris)]">
                            Not Sure / Let Front Desk Decide
                          </option>
                          {servicesList.map((s) => (
                            <option key={s.id || s.title} value={s.title || s.name}>
                              {s.title || s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.service && formData.service !== "not_sure" && (
                        <div className="mt-1.5 p-2 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-[11px] font-semibold flex items-center justify-between gap-2 shadow-xs">
                          <span className="flex items-center gap-1 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            Earliest Bookable Date:
                          </span>
                          <span className="font-black text-blue-700">
                            {minSelectableDate.toLocaleDateString("en-GB")}
                            {maxSelectableDate
                              ? ` — ${maxSelectableDate.toLocaleDateString("en-GB")} (${rawMaxBookingDays} total days)`
                              : " onwards"}
                          </span>
                        </div>
                      )}
                      {errors.service && <p className="text-xs text-red-500 font-semibold">{errors.service}</p>}
                    </div>

                    {/* Specific Service Features Multi-Select Section */}
                    {availableServiceFeatures && availableServiceFeatures.length > 0 && (
                      <div className="md:col-span-2 bg-[var(--fog)] border border-[var(--line)] rounded-2xl p-3.5 sm:p-4 space-y-2.5 my-1">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowFeatures((prev) => !prev)}
                            className="text-xs font-extrabold text-[var(--iris)] hover:text-[var(--ink)] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer focus:outline-none transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[var(--iris)]" />
                            <span>{showFeatures ? "Hide Treatment Options ▴" : "Select Specific Treatment(s) ▾"}</span>
                            {formData.selectedFeatures && formData.selectedFeatures.length > 0 && (
                              <span className="text-[10px] font-bold text-white bg-[var(--iris)] px-2 py-0.5 rounded-full ml-1 normal-case">
                                {formData.selectedFeatures.length} Selected
                              </span>
                            )}
                          </button>
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-[var(--line)]">
                            Optional / Multi-select
                          </span>
                        </div>
                        {showFeatures && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 transition-all">
                            {availableServiceFeatures.map((feat, fIdx) => {
                              const isChecked = (formData.selectedFeatures || []).includes(feat);
                              return (
                                <label
                                  key={fIdx}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer transition-all ${isChecked
                                      ? "bg-white border-[var(--iris)] text-[var(--iris)] shadow-xs ring-2 ring-[var(--iris)]/20"
                                      : "bg-white/70 border-[var(--line)] text-[#2B1F1A] hover:bg-white hover:border-slate-300"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleFeatureToggle(feat)}
                                    className="mt-0.5 rounded border-slate-300 text-[var(--iris)] focus:ring-[var(--iris)] cursor-pointer w-4 h-4"
                                  />
                                  <span className="leading-snug">{feat}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preferred Doctor with NOT SURE Option */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Preferred Doctor</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                          name="doctor"
                          value={formData.doctor}
                          onChange={handleDoctorChange}
                          className={`w-full bg-[var(--fog)] border ${errors.doctor ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                        >
                          <option value="">Select Doctor</option>
                          <option value="not_sure" className="font-bold text-[var(--iris)]">
                            Not Sure / Let Front Desk Decide
                          </option>
                          {filteredDoctors.map((d) => (
                            <option key={d.id || d.name} value={d.name}>
                              {d.name} {d.specialty ? `(${d.specialty})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.doctor && <p className="text-xs text-red-500 font-semibold">{errors.doctor}</p>}
                    </div>

                    {/* Date and Time slots */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">

                      {/* Date Picker (Required, Sunday disabled) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                          Appointment Date * (Mon - Sat)
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                          <DatePicker
                            selected={parseYYYYMMDDToLocalDate(formData.date)}
                            onChange={(date) => {
                              if (!date) {
                                setFormData((prev) => ({ ...prev, date: "" }));
                                return;
                              }
                              const dateStr = formatLocalDateToYYYYMMDD(date);
                              setFormData((prev) => ({ ...prev, date: dateStr }));
                              if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                              if (noticeMessage) setNoticeMessage("");
                            }}
                            onChangeRaw={(e) => {
                              const rawVal = e.target.value;
                              const maxBookingYear = new Date().getFullYear() + 2;
                              const formatted = formatDateInputString(rawVal, maxBookingYear);
                              e.target.value = formatted;
                              const validDate = parseDDMMYYYYToYYYYMMDD(formatted, maxBookingYear);
                              if (validDate) {
                                setFormData((prev) => ({ ...prev, date: validDate }));
                                if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                                if (noticeMessage) setNoticeMessage("");
                              }
                            }}
                            filterDate={filterAvailableDates}
                            minDate={minSelectableDate}
                            maxDate={maxSelectableDate || undefined}
                            dateFormat="dd MMMM yyyy"
                            placeholderText="Select appointment date"
                            required
                            className={`w-full bg-[var(--fog)] border ${errors.date ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-10 pr-2 py-3 text-xs sm:text-sm text-black font-semibold placeholder:text-black placeholder:font-medium focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.date && <p className="text-xs text-red-500 font-semibold">{errors.date}</p>}
                      </div>

                      {/* Time slot Picker (Optional) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                          Time Slot (Optional)
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                          <select
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className={`w-full bg-[var(--fog)] border ${errors.time ? "border-red-300 focus:ring-red-200" : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-10 pr-2 py-3.5 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                          >
                            <option value="">Select Available Slot</option>
                            {availableTimeSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.time && <p className="text-xs text-red-500 font-semibold">{errors.time}</p>}
                      </div>

                    </div>
                  </div>

                  {/* Action Buttons: Request for Appointment & Call Now (UAN) */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 w-full flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white py-3.5 rounded-xl font-bold shadow-md shadow-[var(--ink)]/15 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <span>Request for Appointment</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>

                    <a
                      href={`tel:${(contactInfo.uanNumber || contactInfo.callNumber || contactInfo.emergencyNumber || "111333456")?.replace(/\s+/g, "")}`}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl text-sm font-extrabold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                      title={`Call UAN Helpline: ${contactInfo.uanNumber || "111 333 456"}`}
                    >
                      <Phone className="w-4 h-4 text-red-600 group-hover:text-white flex-shrink-0" />
                      <span>Call Now</span>
                    </a>
                  </div>
                </motion.form>
              ) : (
                // SUCCESS NOTIFICATION
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="text-center py-8 space-y-6 max-w-lg mx-auto"
                >
                  <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto border-2 border-teal-100 shadow-md">
                    <CheckCircle2 className="w-12 h-12 text-teal-500" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-slate-800">Appointment Request Sent!</h3>
                    <p className="text-sm font-semibold text-teal-600 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">
                      ID: OPTI-{Math.floor(100000 + Math.random() * 900000)}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed pt-2">
                      Thank you, <strong className="text-slate-800">{formData.name}</strong>. Your appointment request for <strong>{formData.service || "Eye Consultation"}</strong> with <strong>{formData.doctor === "not_sure" ? "Assigned Specialist (Front Desk Decision)" : formData.doctor}</strong> on <strong>{formData.date} ({formData.time})</strong> has been logged.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Next steps:</h4>
                    <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                      <li>• A patient coordinator will review details and call you at <strong className="text-slate-800">{formData.phone}</strong>.</li>
                      <li>• You will receive a direct confirmation with doctor's cabin number.</li>
                      <li>• Please arrive 15 minutes before your scheduled slot for registration.</li>
                    </ul>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsSuccess(false);
                      setAppointmentFor("Self");
                      setFormData({
                        name: "",
                        dob: "",
                        age: "",
                        gender: "Male",
                        patientCnic: "",
                        email: "",
                        phone: "",
                        patientAddress: "",
                        guardianName: "",
                        guardianRelation: "Father",
                        guardianCnic: "",
                        guardianPhone: "",
                        guardianAddress: "",
                        service: "",
                        doctor: "",
                        date: "",
                        time: "",
                      });
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Request Another Appointment
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
