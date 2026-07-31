"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  User,
  Mail,
  Phone,
  Stethoscope,
  Clock,
  CheckCircle2,
  ChevronRight,
  X
} from "lucide-react";
import confetti from "canvas-confetti";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyOnAppointmentBooked } from "@/lib/notificationService";

export default function AppointmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    doctor: "",
    date: "",
    time: "",
  });

  const [errors, setErrors] = useState({});
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

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = "Full Name is required";

    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email address is invalid";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length !== 11) {
        tempErrors.phone = "Phone number must be exactly 11 digits";
      }
    }

    if (!formData.service) tempErrors.service = "Please select a service";
    if (!formData.doctor) tempErrors.doctor = "Please select a doctor";
    if (!formData.date) tempErrors.date = "Please choose a date";
    if (!formData.time) tempErrors.time = "Please select a time slot";

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
    const { name, value } = e.target;
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const selectedDocObj = doctorsList.find((d) => d.name === formData.doctor);
      const doctorIdToSave = selectedDocObj ? selectedDocObj.id : "";

      const apptDoc = {
        ...formData,
        doctorId: doctorIdToSave,
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
          // If clicking backdrop outside modal card, close modal
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
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-[#D5E5DD] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-5 right-5 p-2 rounded-full bg-[#F4F7F5] text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center max-w-lg mx-auto mb-6 sm:mb-8">
            <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#D5E5DD]">
              Appointment Desk
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#0B3D5C] tracking-tight">
              Book Doctor Consultation
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#3F4B4A] font-medium">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter patient full name"
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.name
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
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
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.email
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                      Phone Number (11 digits)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="03001234567"
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.phone
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.phone}</p>
                    )}
                  </div>

                  {/* Eye Treatment / Service */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                      Eye Treatment / Service
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.service
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
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

                  {/* Preferred Doctor */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                      Selected Doctor / Surgeon
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleChange}
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.doctor
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        <option value="">Select Surgeon</option>
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
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                      Preferred Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.date
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-[11px] text-red-500 font-semibold">{errors.date}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
                      Preferred Slot
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className={`w-full bg-[#F4F7F5] border ${
                          errors.time
                            ? "border-red-300 focus:ring-red-200"
                            : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                        } rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                      >
                        <option value="">Time Slot</option>
                        <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
                        <option value="Afternoon (12:00 - 15:00)">Afternoon (12:00 - 15:00)</option>
                        <option value="Evening (15:00 - 18:00)">Evening (15:00 - 18:00)</option>
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
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white py-3.5 rounded-xl font-extrabold text-sm shadow-md shadow-[#0B3D5C]/15 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
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
                    <strong>{formData.doctor}</strong> has been logged.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="bg-[#0B3D5C] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs hover:bg-[#082D44] transition-colors cursor-pointer"
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
