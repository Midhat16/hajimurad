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
  X,
  CreditCard,
  MapPin,
  Info
} from "lucide-react";
import confetti from "canvas-confetti";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyOnAppointmentBooked } from "@/lib/notificationService";
import DatePicker from "react-datepicker";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatCNIC = (val) => {
  if (!val) return "";
  const digits = val.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
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

export default function AppointmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointmentFor, setAppointmentFor] = useState("Self"); // "Self" | "Someone Else"
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
    doctor: "",
    date: "",
    time: "",
  });

  const [errors, setErrors] = useState({});
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [servicesList, setServicesList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    // Listen for custom events to open appointment modal and pre-select doctor
    const handleOpenModal = (e) => {
      const docName = e?.detail?.doctorName || "";
      setFormData((prev) => ({
        ...prev,
        doctor: docName || prev.doctor,
      }));
      setIsSuccess(false);
      setIsOpen(true);
    };

    window.addEventListener("open-appointment-modal", handleOpenModal);
    window.addEventListener("select-doctor", handleOpenModal);

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
      (err) => console.warn("Services subscription notice:", err.message)
    );

    // Dynamic subscription to Firestore doctors collection
    const unsubDoctors = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDoctorsList(items);
      },
      (err) => console.warn("Doctors subscription notice:", err.message)
    );

    return () => {
      window.removeEventListener("open-appointment-modal", handleOpenModal);
      window.removeEventListener("select-doctor", handleOpenModal);
      unsubServices();
      unsubDoctors();
    };
  }, []);

  const activeDoctorObj = doctorsList.find(
    (d) => d.name === formData.doctor || d.id === formData.doctor
  );

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

    const phoneClean = formData.phone.replace(/[\s\-\(\)]/g, "");
    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (!/^(03\d{9}|\+923\d{9}|00923\d{9}|\+?\d{10,14})$/.test(phoneClean)) {
      tempErrors.phone = "Please enter a valid phone number (03XX-XXXXXXX)";
    }

    // Guardian details required if "Someone Else"
    if (appointmentFor === "Someone Else") {
      if (!formData.guardianName.trim()) {
        tempErrors.guardianName = "Guardian Full Name is required";
      }
      const gPhoneClean = formData.guardianPhone.replace(/[\s\-\(\)]/g, "");
      if (!formData.guardianPhone.trim()) {
        tempErrors.guardianPhone = "Guardian Phone number is required";
      } else if (!/^(03\d{9}|\+923\d{9}|00923\d{9}|\+?\d{10,14})$/.test(gPhoneClean)) {
        tempErrors.guardianPhone = "Please enter a valid phone number (03XX-XXXXXXX)";
      }

      if (formData.guardianCnic.trim() && formData.guardianCnic.length < 15) {
        tempErrors.guardianCnic = "CNIC format must be XXXXX-XXXXXXX-X (13 digits)";
      }
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!formData.date) {
      tempErrors.date = "Please choose a date";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const selectedServiceObject = servicesList.find(
    (s) => (s.title || s.name) === formData.service
  );

  const filteredDoctors = doctorsList.filter((docItem) => {
    if (
      selectedServiceObject &&
      selectedServiceObject.doctorIds &&
      Array.isArray(selectedServiceObject.doctorIds) &&
      selectedServiceObject.doctorIds.length > 0
    ) {
      return selectedServiceObject.doctorIds.includes(docItem.id);
    }
    return true;
  });

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "dob") {
      const calculatedAge = calculateAgeFromDOB(value);
      setFormData((prev) => ({
        ...prev,
        dob: value,
        age: calculatedAge,
      }));
      return;
    }
    if (name === "patientCnic" || name === "guardianCnic") {
      value = formatCNIC(value);
    }
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "service") {
        updated.doctor = "";
      }
      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (noticeMessage) setNoticeMessage("");
  };

  const handleDoctorChange = (e) => {
    const newDocVal = e.target.value;
    const newDocObj = doctorsList.find((d) => d.name === newDocVal || d.id === newDocVal);

    let shouldReset = false;

    // Check date compatibility if already selected
    if (formData.date) {
      const dateObj = new Date(formData.date + "T00:00:00");
      const dayIndex = dateObj.getDay();
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
        ? "Not Sure / Let Admin Decide"
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
        service: formData.service,
        doctor: doctorNameToSave,
        doctorId: doctorIdToSave,
        date: formData.date,
        time: formData.time,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "appointments"), apptDoc);

      // Trigger automatic dual notifications for Doctor & Admin
      await notifyOnAppointmentBooked(apptDoc, docRef.id);

      setIsSubmitting(false);
      setIsSuccess(true);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2E86FF", "#5EEAD4", "#38BDF8", "#60A5FA", "#FFFFFF"],
      });
    } catch (error) {
      console.warn("Firestore Appointment addDoc warning:", error);
      setIsSubmitting(false);
      setIsSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2E86FF", "#5EEAD4", "#38BDF8", "#60A5FA", "#FFFFFF"],
      });
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-[var(--line)] max-h-[90vh] overflow-y-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top colored indicator bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] absolute top-0 left-0 right-0 z-20" />
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-[var(--fog)] text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center max-w-lg mx-auto mb-6 sm:mb-8">
            <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-[var(--fog)] px-3 py-1 rounded-full border border-[var(--line)]">
              Appointment Desk
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              Book Doctor Consultation
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--slate)] font-medium">
              Submit your request. Our clinic coordinator will verify the slot and notify the surgeon.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="modal-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* ================= TOP TOGGLE: SELF / SOMEONE ELSE ================= */}
                <div className="bg-[var(--fog)] p-2 rounded-2xl border border-[var(--line)]">
                  <label className="text-[11px] font-bold text-[var(--slate)] uppercase tracking-wider block mb-1 px-1">
                    Who is this appointment for?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAppointmentFor("Self");
                        setErrors((prev) => ({ ...prev, guardianPhone: "" }));
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        appointmentFor === "Self"
                          ? "bg-white text-[var(--iris)] shadow-md border border-[var(--iris)]/20"
                          : "text-[var(--slate)] hover:bg-white/60"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Self</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentFor("Someone Else")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        appointmentFor === "Someone Else"
                          ? "bg-white text-[var(--iris)] shadow-md border border-[var(--iris)]/20"
                          : "text-[var(--slate)] hover:bg-white/60"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Someone Else</span>
                    </button>
                  </div>
                </div>

                {/* Reset Notice Banner */}
                {noticeMessage && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{noticeMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ================= PORTION 1: PATIENT INFORMATION ================= */}
                  <div className="md:col-span-2 pt-1 pb-1 border-b border-[var(--line)] flex items-center justify-between">
                    <span className="text-[11px] font-extrabold tracking-wider text-[var(--iris)] uppercase flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> 1. Patient Details
                    </span>
                  </div>

                  {/* Patient Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Patient Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter patient full name"
                        required
                        className={`w-full bg-[var(--fog)] border ${
                          errors.name
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>
                    )}
                  </div>

                  {/* Patient Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="03xx-xxxxxxx"
                        required
                        className={`w-full bg-[var(--fog)] border ${
                          errors.phone
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.phone}</p>
                    )}
                  </div>

                  {/* Patient Residential Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Residential Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="patientAddress"
                        value={formData.patientAddress}
                        onChange={handleChange}
                        placeholder="Street, City, Area"
                        className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
                      />
                    </div>
                  </div>

                  {/* Patient Date of Birth & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Date of Birth Calendar */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                        Date of Birth {formData.age ? `(${formData.age} Yrs)` : ""}
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          name="dob"
                          max={new Date().toISOString().split("T")[0]}
                          value={formData.dob}
                          onChange={handleChange}
                          className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-10 pr-2 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">Gender</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-10 pr-2 py-3.5 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Patient CNIC / B-Form Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Patient CNIC / B-Form No.
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="patientCnic"
                        value={formData.patientCnic}
                        onChange={handleChange}
                        maxLength={15}
                        placeholder="xxxxx-xxxxxxx-x"
                        className={`w-full bg-[var(--fog)] border ${
                          errors.patientCnic
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all font-mono`}
                      />
                    </div>
                    {errors.patientCnic && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.patientCnic}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className={`w-full bg-[var(--fog)] border ${
                          errors.email
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.email}</p>
                    )}
                  </div>

                  {/* ================= PORTION 2: GUARDIAN DETAILS (ONLY IF SOMEONE ELSE) ================= */}
                  {appointmentFor === "Someone Else" && (
                    <>
                      <div className="md:col-span-2 pt-3 pb-1 border-b border-[var(--line)] flex items-center justify-between">
                        <span className="text-[11px] font-extrabold tracking-wider text-[var(--iris)] uppercase flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> 2. Guardian Details
                        </span>
                      </div>

                      {/* Guardian Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                          Guardian Full Name *
                        </label>
                        <div className="relative">
                          <Users className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            name="guardianName"
                            value={formData.guardianName}
                            onChange={handleChange}
                            placeholder="Enter guardian name"
                            required
                            className={`w-full bg-[var(--fog)] border ${
                              errors.guardianName
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.guardianName && (
                          <p className="text-[11px] text-red-500 font-semibold">{errors.guardianName}</p>
                        )}
                      </div>

                      {/* Guardian Phone Number (REQUIRED) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                          Guardian Phone *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            name="guardianPhone"
                            value={formData.guardianPhone}
                            onChange={handleChange}
                            placeholder="03xx-xxxxxxx"
                            required
                            className={`w-full bg-[var(--fog)] border ${
                              errors.guardianPhone
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.guardianPhone && (
                          <p className="text-[11px] text-red-500 font-semibold">{errors.guardianPhone}</p>
                        )}
                      </div>

                      {/* Guardian Address */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                          Guardian Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            name="guardianAddress"
                            value={formData.guardianAddress}
                            onChange={handleChange}
                            placeholder="Guardian street/city address"
                            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
                          />
                        </div>
                      </div>

                      {/* Guardian Relation */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                          Guardian Relation
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <select
                            name="guardianRelation"
                            value={formData.guardianRelation}
                            onChange={handleChange}
                            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none"
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
                        <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                          Guardian CNIC Number
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            name="guardianCnic"
                            value={formData.guardianCnic}
                            onChange={handleChange}
                            maxLength={15}
                            placeholder="xxxxx-xxxxxxx-x"
                            className={`w-full bg-[var(--fog)] border ${
                              errors.guardianCnic
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all font-mono`}
                          />
                        </div>
                        {errors.guardianCnic && (
                          <p className="text-[11px] text-red-500 font-semibold">{errors.guardianCnic}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* ================= PORTION 3: APPOINTMENT DETAILS (ALWAYS VISIBLE) ================= */}
                  <div className="md:col-span-2 pt-3 pb-1 border-b border-[var(--line)] flex items-center justify-between">
                    <span className="text-[11px] font-extrabold tracking-wider text-[var(--iris)] uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {appointmentFor === "Someone Else" ? "3." : "2."} Appointment Details
                    </span>
                  </div>

                  {/* Eye Treatment / Service */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Eye Treatment / Service
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className={`w-full bg-[var(--fog)] border ${
                          errors.service
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        <option value="">Select Treatment</option>
                        {servicesList.map((s) => (
                          <option key={s.id || s.title} value={s.title || s.name}>
                            {s.title || s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.service && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.service}</p>
                    )}
                  </div>

                  {/* Preferred Doctor with NOT SURE option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Selected Doctor / Surgeon
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleDoctorChange}
                        className={`w-full bg-[var(--fog)] border ${
                          errors.doctor
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        <option value="">Select Doctor</option>
                        <option value="not_sure" className="font-bold text-[var(--iris)]">
                          Not Sure / Let Admin Decide
                        </option>
                        {filteredDoctors.map((d) => (
                          <option key={d.id || d.name} value={d.name}>
                            {d.name} {d.specialty ? `(${d.specialty})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.doctor && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.doctor}</p>
                    )}
                  </div>

                  {/* Date & Time Slot */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Preferred Date * (Mon - Sat)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <DatePicker
                        selected={formData.date ? new Date(formData.date + "T00:00:00") : null}
                        onChange={(date) => {
                          if (!date) {
                            setFormData((prev) => ({ ...prev, date: "" }));
                            return;
                          }
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, "0");
                          const dd = String(date.getDate()).padStart(2, "0");
                          const dateStr = `${yyyy}-${mm}-${dd}`;
                          setFormData((prev) => ({ ...prev, date: dateStr }));
                          if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                          if (noticeMessage) setNoticeMessage("");
                        }}
                        filterDate={filterAvailableDates}
                        minDate={new Date()}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select available date"
                        required
                        className={`w-full bg-[var(--fog)] border ${
                          errors.date
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.date}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                      Preferred Slot (Optional)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full bg-[var(--fog)] border ${
                          errors.time
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        <option value="">Time Slot</option>
                        {availableTimeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.time && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.time}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white py-3.5 rounded-xl font-extrabold text-sm shadow-md shadow-[var(--ink)]/15 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Appointment...
                      </>
                    ) : (
                      <>
                        Request for Appointment
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              /* Success View */
              <motion.div
                key="modal-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-5 max-w-md mx-auto"
              >
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto border-2 border-teal-100 shadow-md">
                  <CheckCircle2 className="w-10 h-10 text-teal-500" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Appointment Request Sent!
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Thank you, <strong className="text-slate-800">{formData.name}</strong>. Your request for{" "}
                    <strong>{formData.doctor === "not_sure" ? "Assigned Specialist (Admin Decision)" : formData.doctor}</strong> on <strong>{formData.date} ({formData.time})</strong> has been logged.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="bg-[var(--ink)] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs hover:bg-[var(--iris-dark)] transition-colors cursor-pointer"
                >
                  Done & Close Window
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
