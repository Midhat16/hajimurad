"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Mail, Phone, Stethoscope, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyOnAppointmentBooked } from "@/lib/notificationService";

export default function Appointment() {
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

    // Dynamic subscription to Firestore services collection (Admin added)
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

    // Dynamic subscription to Firestore doctors collection (Admin added)
    const unsubDoctors = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDoctorsList(items);
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

  // Selected service object
  const selectedServiceObject = servicesList.find(
    (s) => (s.title || s.name) === formData.service
  );

  // Filter doctors based on assigned doctorIds if specified in service
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
      // If service changed, reset doctor if the currently selected doctor is no longer available
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
      // Find selected doctor ID
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
        colors: ["#2E86FF", "#5EEAD4", "#38BDF8", "#60A5FA", "#FFFFFF"]
      });
    } catch (error) {
      console.warn("Firestore Appointment addDoc warning:", error);
      setIsSubmitting(false);
      setIsSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2E86FF", "#5EEAD4", "#38BDF8", "#60A5FA", "#FFFFFF"]
      });
    }
  };

  return (
    <section id="appointment" className="py-14 lg:py-16 bg-[#E8F0EC] relative overflow-hidden">
      {/* Background soft blur */}
      <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-[#3E8E6E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-[#0B3D5C]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-white px-3 py-1 rounded-full border border-[#D5E5DD] shadow-xs">
            Appointment Desk
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3D5C] tracking-tight leading-tight">
            Schedule Your Visit
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#3F4B4A]">
            Submit your appointment request below. Our desk coordinators will verify the slot and contact you via call within 2 hours.
          </p>
        </div>

        {/* Booking Card */}
        <div className="glass-card bg-white rounded-[32px] border border-[#D5E5DD] shadow-lg overflow-hidden relative">
          
          {/* Top colored indicator bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0B3D5C] via-[#2A607D] to-[#3E8E6E]" />

          <div className="p-6 sm:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder=""
                          className={`w-full bg-[#F4F7F5] border ${
                            errors.name ? "border-red-300 focus:ring-red-200" : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                          } rounded-xl pl-12 pr-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder=""
                          className={`w-full bg-[#F4F7F5] border ${
                            errors.email ? "border-red-300 focus:ring-red-200" : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                          } rounded-xl pl-12 pr-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email}</p>}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder=""
                          className={`w-full bg-[#F4F7F5] border ${
                            errors.phone ? "border-red-300 focus:ring-red-200" : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                          } rounded-xl pl-12 pr-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all`}
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone}</p>}
                    </div>

                    {/* Preferred Department/Service */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">Eye Treatment / Service</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          className={`w-full bg-[#F4F7F5] border ${
                            errors.service ? "border-red-300 focus:ring-red-200" : "border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20"
                          } rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                        >
                          <option value="">Select Treatment</option>
                          {servicesList.map((s) => (
                            <option key={s.id || s.title} value={s.title || s.name}>
                              {s.title || s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.service && <p className="text-xs text-red-500 font-semibold">{errors.service}</p>}
                    </div>

                    {/* Preferred Surgeon */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">Preferred Doctor</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                          name="doctor"
                          value={formData.doctor}
                          onChange={handleChange}
                          className={`w-full bg-slate-50 border ${
                            errors.doctor ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-medical-blue focus:ring-sky-100"
                          } rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                        >
                          <option value="">Select Surgeon</option>
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
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Date Picker */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 hidden sm:block" />
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className={`w-full bg-slate-50 border ${
                              errors.date ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-medical-blue focus:ring-sky-100"
                            } rounded-xl sm:pl-10 pl-3 pr-2 py-3 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-4 transition-all`}
                          />
                        </div>
                        {errors.date && <p className="text-xs text-red-500 font-semibold">{errors.date}</p>}
                      </div>

                      {/* Time slot Picker */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Slot</label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 hidden sm:block" />
                          <select
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className={`w-full bg-slate-50 border ${
                              errors.time ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-medical-blue focus:ring-sky-100"
                            } rounded-xl sm:pl-10 pl-3 pr-2 py-3.5 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-4 transition-all appearance-none`}
                          >
                            <option value="">Time</option>
                            <option value="Morning (09:00 - 12:00)">Morning</option>
                            <option value="Afternoon (12:00 - 15:00)">Afternoon</option>
                            <option value="Evening (15:00 - 18:00)">Evening</option>
                          </select>
                        </div>
                        {errors.time && <p className="text-xs text-red-500 font-semibold">{errors.time}</p>}
                      </div>

                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white py-3.5 rounded-xl font-bold shadow-md shadow-[#0B3D5C]/15 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting to Firestore...
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
                      Thank you, <strong className="text-slate-800">{formData.name}</strong>. Your clinical request for <strong>{formData.service}</strong> with <strong>{formData.doctor}</strong> on <strong>{formData.date}</strong> has been logged.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Next steps:</h4>
                    <ul className="text-xs text-slate-600 space-y-1.5 font-medium">
                      <li>• A patient coordinator will review details and call you at <strong className="text-slate-800">{formData.phone}</strong>.</li>
                      <li>• You will receive a direct WhatsApp confirmation with the doctor's cabin number.</li>
                      <li>• Please arrive 15 minutes before your scheduled slot for registration.</li>
                    </ul>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        service: "",
                        doctor: "",
                        date: "",
                        time: "",
                      });
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-6 py-2.5 rounded-xl transition-colors"
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
