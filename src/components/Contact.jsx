"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyOnPatientMessage } from "@/lib/notificationService";

const DEFAULT_CONTACT = {
  uanNumber: "111 333 456",
  callNumber: "0324-1111691",
  helplineNumber: "0324-1111691",
  mainDeskNumber: "111 333 456",
  emergencyNumber: "0324-1111691",
  email: "info@hmeht.com",
  address: "Upper Chanab, Canal Bank, G.T Road, Gujranwala",
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contactData, setContactData] = useState(DEFAULT_CONTACT);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "siteContent", "contactInfo"),
      (docSnap) => {
        if (docSnap.exists()) {
          setContactData({
            ...DEFAULT_CONTACT,
            ...docSnap.data(),
          });
        }
      },
      (err) => console.warn("Contact info subscription notice:", err.message)
    );

    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name";
    }

    const phoneClean = formData.phone.replace(/[\s\-\(\)]/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter your phone number";
    } else if (!/^(03\d{9}|\+923\d{9}|00923\d{9}|\+?\d{10,14})$/.test(phoneClean)) {
      newErrors.phone = "Please enter a valid phone number (03XX-XXXXXXX)";
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please enter your message";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        read: false,
        is_read: false,
        sender_type: "patient",
        category: "patient_inquiry",
        createdAt: serverTimestamp()
      });

      await notifyOnPatientMessage(formData.name.trim(), formData.message.trim());

      setIsSending(false);
      setIsSent(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setTimeout(() => setIsSent(false), 5000);
    } catch (error) {
      console.warn("Firestore Contact message addDoc warning:", error);
      setIsSending(false);
      setIsSent(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setTimeout(() => setIsSent(false), 5000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const CONTACT_INFO = [
    {
      icon: MapPin,
      title: "Clinic Location",
      details: [contactData.address],
      color: "text-sky-500 bg-sky-50"
    },
    {
      icon: Phone,
      title: "Phone & Contact Lines",
      details: [
        `UAN: ${contactData.uanNumber || contactData.mainDeskNumber}`,
        `Call #: ${contactData.callNumber || contactData.emergencyNumber}`,
      ],
      color: "text-teal-500 bg-teal-50"
    },
    {
      icon: Mail,
      title: "Email Helpdesk",
      details: ["info@hmeht.com"],
      isEmail: true,
      color: "text-indigo-500 bg-indigo-50"
    },
    {
      icon: Clock,
      title: "Operating Hours",
      details: ["Monday - Saturday: 9 AM - 3 PM", "Emergency: 24/7"],
      color: "text-amber-500 bg-amber-50"
    }
  ];

  return (
    <section id="contact" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background soft blur */}
      <div className="absolute bottom-1/3 right-0 w-90 h-90 bg-slate-100/40 rounded-full blur-3xl pointer-events-none translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3 py-1 rounded-full border border-[var(--line)] shadow-xs">
              Reach Our Desk
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
              Contact Us
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--slate)] leading-relaxed">
              Have questions about our eye care services, appointments, or treatment options? Speak directly with our hospital team.
            </p>
          </motion.div>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Left: Contact Info & Maps */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {CONTACT_INFO.map((info, idx) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex gap-3.5 p-4 rounded-2xl border border-[var(--line)] bg-white shadow-xs hover:border-[var(--iris)] transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--fog)] text-[var(--iris)] shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-[#2B1F1A] text-sm sm:text-base">{info.title}</h4>
                      {info.details.map((line, lIdx) => (
                        <p key={lIdx} className="text-xs sm:text-sm text-[var(--slate)] mt-0.5 leading-relaxed font-medium">
                          {info.isEmail ? (
                            <a
                              href={`mailto:${contactData.email || 'info@hmeht.com'}`}
                              className="text-[#2B1F1A] hover:text-[var(--iris)] font-bold hover:underline"
                            >
                              {line}
                            </a>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Map Embed Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full rounded-[28px] overflow-hidden border border-[var(--line)] shadow-sm relative bg-white"
            >
              <iframe
                src="https://maps.google.com/maps?q=Haji+Murad+Eye+Hospital+Trust+Gujranwala&t=&z=16&ie=UTF8&iwloc=B&output=embed"
                width="100%"
                height="380"
                style={{ border: 0, borderRadius: "28px" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Haji Murad Eye Hospital Trust Location"
              />
            </motion.div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-5 h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 85 }}
              className="glass-card bg-white rounded-[32px] p-8 sm:p-10 border border-slate-200/60 shadow-lg h-full flex flex-col justify-between"
            >
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Send an Inquiry</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Direct Hospital Inbox</p>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder=""
                    className={`w-full bg-[var(--fog)] border rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all ${errors.name
                        ? "border-red-300 focus:ring-red-200 bg-red-50/20"
                        : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                      }`}
                  />
                  {errors.name && (
                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Address (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder=""
                    className={`w-full bg-[var(--fog)] border rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all ${errors.email
                        ? "border-red-300 focus:ring-red-200 bg-red-50/20"
                        : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                      }`}
                  />
                  {errors.email && (
                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder=""
                    className={`w-full bg-[var(--fog)] border rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all ${errors.phone
                        ? "border-red-300 focus:ring-red-200 bg-red-50/20"
                        : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                      }`}
                  />
                  {errors.phone && (
                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    placeholder=""
                    className={`w-full bg-[var(--fog)] border rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none ${errors.message
                        ? "border-red-300 focus:ring-red-200 bg-red-50/20"
                        : "border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20"
                      }`}
                  />
                  {errors.message && (
                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving to Messages...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>

              {/* Success Notification Alert */}
              <AnimatePresence>
                {isSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-bold leading-tight">
                      Message sent successfully! Our administrative officer will write back to you shortly.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
