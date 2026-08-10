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
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sortDoctors } from "@/lib/doctorUtils";
import { notifyOnAppointmentBooked } from "@/lib/notificationService";
import { triggerEmailApi } from "@/lib/clientEmailHelper";
import DatePicker from "react-datepicker";
import { generateAndOpenAppointmentPDF, openAppointmentPDFInNewTab } from "@/lib/pdfUtil";

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

// Helper to determine active schedule/timing (including feature-level overrides) for a doctor
const getActiveDoctorTiming = (docObj, serviceObj, selectedFeatures = []) => {
  if (!docObj) return null;

  const mappings = serviceObj?.featureDoctorMappings || [];

  if (selectedFeatures && selectedFeatures.length > 0 && mappings.length > 0) {
    for (const featName of selectedFeatures) {
      const mapping = mappings.find((m) => m.featureName === featName);
      if (mapping) {
        // Check structured assignedDoctors list first
        const assignedDocs = mapping.assignedDoctors || [];
        const docEntry = assignedDocs.find((d) => d.doctorId === docObj.id);

        if (docEntry && docEntry.timing) {
          const { start, end, days, isOverride } = docEntry.timing;
          if (isOverride) {
            return {
              isOverride: true,
              days: days && days.length > 0 ? days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              startTime: start || serviceObj?.serviceStartTime || "09:00",
              endTime: end || serviceObj?.serviceEndTime || "17:00",
            };
          } else {
            return {
              isOverride: false,
              days: days && days.length > 0 ? days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              startTime: serviceObj?.serviceStartTime || "09:00",
              endTime: serviceObj?.serviceEndTime || "17:00",
            };
          }
        }

        // Fallback check legacy doctorOverrides map
        if (mapping.doctorOverrides && mapping.doctorOverrides[docObj.id]) {
          const override = mapping.doctorOverrides[docObj.id];
          if (override.enabled) {
            return {
              isOverride: true,
              days: override.days && override.days.length > 0 ? override.days : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              startTime: override.startTime || serviceObj?.serviceStartTime || "09:00",
              endTime: override.endTime || serviceObj?.serviceEndTime || "17:00",
            };
          }
        }
      }
    }
  }

  // If service has overall timing set, use service timing
  if (serviceObj?.serviceStartTime || serviceObj?.serviceEndTime) {
    return {
      isOverride: false,
      days: docObj.workingDays && docObj.workingDays.length > 0
        ? docObj.workingDays
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      startTime: serviceObj?.serviceStartTime || "09:00",
      endTime: serviceObj?.serviceEndTime || "17:00",
    };
  }

  return {
    isOverride: false,
    days: docObj.workingDays && docObj.workingDays.length > 0
      ? docObj.workingDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    startTime: docObj.workingHours?.start || "09:00",
    endTime: docObj.workingHours?.end || "17:00",
  };
};

const generateSlotsForDoctor = (doctorObj, activeTiming = null) => {
  const startTimeStr = activeTiming ? activeTiming.startTime : doctorObj?.workingHours?.start;
  const endTimeStr = activeTiming ? activeTiming.endTime : doctorObj?.workingHours?.end;

  const startM = parseTimeToMinutes(startTimeStr, 540); // 9:00 AM
  const endM = parseTimeToMinutes(endTimeStr, 900);     // 3:00 PM (15:00)

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

export default function AppointmentModal({ preSelectedService: propPreSelectedService, isOpen: propIsOpen, onClose }) {
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
    selectedFeatures: [],
    doctor: "",
    date: "",
    time: "",
  });

  const [errors, setErrors] = useState({});
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSubmittedAppt, setLastSubmittedAppt] = useState(null);

  const [servicesList, setServicesList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [eventContext, setEventContext] = useState({
    isEvent: false,
    eventTitle: "",
    eventDate: "",
    eventTime: "",
    assignedDoctors: [],
  });

  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
    if (propPreSelectedService) {
      const sName = propPreSelectedService.title || propPreSelectedService.name || "";
      setFormData((prev) => ({
        ...prev,
        service: sName,
        selectedFeatures: [],
      }));
    }
  }, [propIsOpen, propPreSelectedService]);

  useEffect(() => {
    // Listen for custom events to open appointment modal and pre-select doctor or service
    const handleOpenModal = (e) => {
      const isEvt = !!(e?.detail?.isEvent || (e?.detail?.assignedDoctors && e.detail.assignedDoctors.length > 0));
      const evtTitle = e?.detail?.eventTitle || e?.detail?.serviceName || "";
      const evtDocs = e?.detail?.assignedDoctors || [];
      const evtDate = e?.detail?.eventDate || "";
      const evtTime = e?.detail?.eventTime || "";

      if (isEvt) {
        setEventContext({
          isEvent: true,
          eventTitle: evtTitle,
          eventDate: evtDate,
          eventTime: evtTime,
          assignedDoctors: evtDocs,
        });
      } else {
        setEventContext({
          isEvent: false,
          eventTitle: "",
          eventDate: "",
          eventTime: "",
          assignedDoctors: [],
        });
      }

      const docName = e?.detail?.doctorName || "";
      const serviceObj = e?.detail?.preSelectedService || e?.detail?.serviceObj || null;
      const serviceName = evtTitle || (serviceObj ? (serviceObj.title || serviceObj.name) : (e?.detail?.serviceName || ""));

      setFormData((prev) => ({
        ...prev,
        doctor: docName || (evtDocs.length === 1 ? evtDocs[0] : prev.doctor),
        service: serviceName || prev.service,
        date: evtDate || prev.date,
        time: evtTime || prev.time,
        selectedFeatures: [],
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
        setDoctorsList(sortDoctors(items));
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

  const selectedServiceObject = servicesList.find(
    (s) => (s.title || s.name) === formData.service || s.id === formData.service
  );

  const activeDoctorTiming = getActiveDoctorTiming(
    activeDoctorObj,
    selectedServiceObject,
    formData.selectedFeatures
  );

  const minBookingDays = selectedServiceObject && selectedServiceObject.minBookingDays !== undefined && selectedServiceObject.minBookingDays !== null
    ? Math.max(0, Number(selectedServiceObject.minBookingDays))
    : 0;

  const rawMaxBookingDays = selectedServiceObject && selectedServiceObject.maxBookingDays !== undefined && selectedServiceObject.maxBookingDays !== null && selectedServiceObject.maxBookingDays !== ""
    ? Number(selectedServiceObject.maxBookingDays)
    : null;

  const getSelectableDateRange = () => {
    const getNormalizedToday = () => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return t;
    };

    const docWorkingDays = activeDoctorTiming
      ? activeDoctorTiming.days
      : (activeDoctorObj?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);

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
    console.log("🔍 DIAGNOSTIC -> Doctor Active Timing (Override/Default):", activeDoctorTiming);
  }

  const availableTimeSlots = generateSlotsForDoctor(
    formData.doctor === "not_sure" ? null : activeDoctorObj,
    activeDoctorTiming
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
      tempErrors.date = "Please choose a date";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const availableServiceFeatures = selectedServiceObject?.features || [];

  const filteredDoctors = doctorsList.filter((docItem) => {
    if (
      formData.doctor &&
      (docItem.name === formData.doctor || docItem.id === formData.doctor)
    ) {
      return true;
    }

    const mappings = selectedServiceObject?.featureDoctorMappings || [];

    // If specific feature(s) selected by patient and mappings exist
    if (formData.selectedFeatures && formData.selectedFeatures.length > 0 && mappings.length > 0) {
      const allowedDocIds = new Set();
      formData.selectedFeatures.forEach((featName) => {
        const m = mappings.find((item) => item.featureName === featName);
        if (m && Array.isArray(m.assignedDoctorIds)) {
          m.assignedDoctorIds.forEach((id) => allowedDocIds.add(id));
        }
      });

      if (allowedDocIds.size > 0) {
        return allowedDocIds.has(docItem.id);
      }
    }

    // Fallback: If service has general doctorIds list
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
    if (name === "service") {
      setFormData((prev) => ({
        ...prev,
        service: value,
        selectedFeatures: [],
      }));
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

      // Auto-validate current doctor selection when feature selection changes
      const mappings = selectedServiceObject?.featureDoctorMappings || [];
      let newDoctor = prev.doctor;

      if (updated.length > 0 && mappings.length > 0 && prev.doctor && prev.doctor !== "not_sure") {
        const docObj = doctorsList.find((d) => d.name === prev.doctor || d.id === prev.doctor);
        if (docObj) {
          const allowedDocIds = new Set();
          updated.forEach((featName) => {
            const m = mappings.find((item) => item.featureName === featName);
            if (m && Array.isArray(m.assignedDoctorIds)) {
              m.assignedDoctorIds.forEach((id) => allowedDocIds.add(id));
            }
          });

          if (allowedDocIds.size > 0 && !allowedDocIds.has(docObj.id)) {
            newDoctor = ""; // reset doctor if current doctor doesn't cover selected features
            setNoticeMessage(`Doctor selection reset: ${docObj.name} does not perform the selected treatment feature.`);
          }
        }
      }

      return {
        ...prev,
        selectedFeatures: updated,
        doctor: newDoctor,
      };
    });
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
        const timing = getActiveDoctorTiming(newDocObj, selectedServiceObject, formData.selectedFeatures);
        const newDays = timing?.days || newDocObj.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if (!newDays.includes(WEEKDAYS[dayIndex])) {
          shouldReset = true;
        }
      }
    }

    // Check time slot compatibility if already selected
    if (formData.time) {
      const timing = getActiveDoctorTiming(newDocObj, selectedServiceObject, formData.selectedFeatures);
      const newSlots = generateSlotsForDoctor(newDocVal === "not_sure" ? null : newDocObj, timing);
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
    const docDays = activeDoctorTiming?.days || activeDoctorObj?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
      setLastSubmittedAppt(finalApptData);

      // Automatically generate PDF and open in a new browser tab
      openAppointmentPDFInNewTab(finalApptData);

      // Trigger automatic dual notifications for Doctor & Admin
      await notifyOnAppointmentBooked(apptDoc, docRef.id);

      // Trigger automatic dual emails to User & Admin via SMTP
      triggerEmailApi({
        type: "BOOKING_RECEIVED",
        data: finalApptData,
      }).catch((err) => console.warn("Booking email trigger notice:", err));

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.warn("Firestore Appointment addDoc warning:", error);
      const fallbackAppt = {
        ...formData,
        id: "HM-2026-DEMO",
        appointmentId: "HM-2026-DEMO",
      };
      setLastSubmittedAppt(fallbackAppt);
      openAppointmentPDFInNewTab(fallbackAppt);
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    if (onClose) onClose();
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
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] tracking-tight">
              Book Doctor Consultation
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--slate)] font-medium">
              Submit your request. Our hospital coordinator will verify the slot and notify the surgeon.
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
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${appointmentFor === "Self"
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
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${appointmentFor === "Someone Else"
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
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                        className={`w-full bg-[var(--fog)] border ${errors.name
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>
                    )}
                  </div>

                  {/* Patient Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                        maxLength={12}
                        required
                        className={`w-full bg-[var(--fog)] border ${errors.phone
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.phone}</p>
                    )}
                  </div>

                  {/* Patient Residential Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                        className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
                      />
                    </div>
                  </div>

                  {/* Patient Date of Birth & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Date of Birth Calendar */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                        Date of Birth * {formData.age ? `(${formData.age} Yrs)` : ""}
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          name="dob"
                          max={new Date().toISOString().split("T")[0]}
                          value={formData.dob}
                          onChange={handleChange}
                          required
                          className={`w-full bg-[var(--fog)] border ${errors.dob
                              ? "border-red-300 focus:ring-red-200"
                              : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-10 pr-2 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.dob && (
                        <p className="text-[11px] text-red-500 font-semibold">{errors.dob}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Gender</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          required
                          className={`w-full bg-[var(--fog)] border ${errors.gender
                              ? "border-red-300 focus:ring-red-200"
                              : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-10 pr-2 py-3.5 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {errors.gender && (
                        <p className="text-[11px] text-red-500 font-semibold">{errors.gender}</p>
                      )}
                    </div>
                  </div>

                  {/* Patient CNIC / B-Form Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                        className={`w-full bg-[var(--fog)] border ${errors.patientCnic
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all font-mono`}
                      />
                    </div>
                    {errors.patientCnic && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.patientCnic}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className={`w-full bg-[var(--fog)] border ${errors.email
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
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
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                            className={`w-full bg-[var(--fog)] border ${errors.guardianName
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.guardianName && (
                          <p className="text-[11px] text-red-500 font-semibold">{errors.guardianName}</p>
                        )}
                      </div>

                      {/* Guardian Phone Number (REQUIRED) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                            maxLength={12}
                            required
                            className={`w-full bg-[var(--fog)] border ${errors.guardianPhone
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.guardianPhone && (
                          <p className="text-[11px] text-red-500 font-semibold">{errors.guardianPhone}</p>
                        )}
                      </div>

                      {/* Guardian Address */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
                          />
                        </div>
                      </div>

                      {/* Guardian Relation */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                          Guardian Relation
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                          <select
                            name="guardianRelation"
                            value={formData.guardianRelation}
                            onChange={handleChange}
                            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none"
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
                        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                            className={`w-full bg-[var(--fog)] border ${errors.guardianCnic
                                ? "border-red-300 focus:ring-red-200"
                                : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                              } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all font-mono`}
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
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                      Eye Treatment / Service
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className={`w-full bg-[var(--fog)] border ${errors.service
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        {eventContext.isEvent && eventContext.eventTitle ? (
                          <option value={eventContext.eventTitle}>
                            {eventContext.eventTitle}
                          </option>
                        ) : (
                          <>
                            <option value="">Select Treatment</option>
                            <option value="not_sure" className="font-bold text-[var(--iris)]">
                              Not Sure / Let Front Desk Decide
                            </option>
                            {servicesList.map((s) => (
                              <option key={s.id || s.title} value={s.title || s.name}>
                                {s.title || s.name}
                              </option>
                            ))}
                          </>
                        )}
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
                    {errors.service && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.service}</p>
                    )}
                  </div>

                  {/* Specific Service Features Multi-Select Section */}
                  {availableServiceFeatures && availableServiceFeatures.length > 0 && (
                    <div className="md:col-span-2 bg-[var(--fog)] border border-[var(--line)] rounded-2xl p-3.5 sm:p-4 space-y-2.5 my-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-[var(--iris)] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[var(--iris)]" /> Select Specific Treatment(s)
                        </label>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-[var(--line)]">
                          Optional / Multi-select
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                    </div>
                  )}

                  {/* Preferred Doctor with NOT SURE option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                      Selected Doctor / Surgeon
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleDoctorChange}
                        className={`w-full bg-[var(--fog)] border ${errors.doctor
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        <option value="">Select Doctor</option>
                        <option value="not_sure" className="font-bold text-[var(--iris)]">
                          Not Sure / Let Front Desk Decide
                        </option>
                        {eventContext.isEvent && eventContext.assignedDoctors && eventContext.assignedDoctors.length > 0 ? (
                          doctorsList
                            .filter((d) => eventContext.assignedDoctors.includes(d.name) || eventContext.assignedDoctors.includes(d.id))
                            .map((d) => (
                              <option key={d.id || d.name} value={d.name}>
                                {d.name} {d.specialty ? `(${d.specialty})` : ""}
                              </option>
                            ))
                        ) : (
                          filteredDoctors.map((d) => (
                            <option key={d.id || d.name} value={d.name}>
                              {d.name} {d.specialty ? `(${d.specialty})` : ""}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    {errors.doctor && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.doctor}</p>
                    )}
                  </div>

                  {/* Date & Time Slot */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                      {eventContext.isEvent ? "Event Date (Fixed)" : "Preferred Date * (Mon - Sat)"}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      {eventContext.isEvent && (eventContext.eventDate || formData.date) ? (
                        <input
                          type="text"
                          readOnly
                          value={formData.date || eventContext.eventDate}
                          className="w-full bg-[var(--fog)] border border-[var(--iris)]/40 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--iris)] font-extrabold cursor-not-allowed select-none"
                        />
                      ) : (
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
                          minDate={minSelectableDate}
                          maxDate={maxSelectableDate || undefined}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Date Slot"
                          required
                          className={`w-full bg-[var(--fog)] border ${errors.date
                              ? "border-red-300 focus:ring-red-200"
                              : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                            } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-black font-semibold placeholder:text-black placeholder:font-medium focus:outline-none focus:ring-4 transition-all`}
                        />
                      )}
                    </div>
                    {errors.date && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.date}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                      {eventContext.isEvent ? "Event Time Slot" : "Preferred Slot (Optional)"}
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full bg-[var(--fog)] border ${errors.time
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                          } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        {eventContext.isEvent && eventContext.eventTime ? (
                          <option value={eventContext.eventTime}>
                            {eventContext.eventTime}
                          </option>
                        ) : (
                          <>
                            <option value="">Time Slot</option>
                            {availableTimeSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </>
                        )}
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
                    <strong>{formData.doctor === "not_sure" ? "Assigned Specialist (Front Desk Decision)" : formData.doctor}</strong> on <strong>{formData.date} ({formData.time})</strong> has been logged.
                  </p>
                </div>

                <div className="pt-3 flex items-center justify-center">
                  <button
                    onClick={closeModal}
                    className="bg-[var(--ink)] text-white hover:bg-[#1A1310] text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Close Window
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
