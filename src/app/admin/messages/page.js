"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyOnDirectMessage } from "@/lib/notificationService";
import {
  MessageSquare,
  Mail,
  User,
  Clock,
  Send,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Users,
  CheckCircle2,
  CornerDownRight,
  X,
  ExternalLink,
  FileText,
  Check,
  CheckCheck,
  AlertCircle,
  Phone,
  Search
} from "lucide-react";
import { getWhatsAppContactReplyUrl } from "@/lib/whatsappHelper";
import { motion, AnimatePresence } from "framer-motion";

function AdminMessagesContent() {
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get("doctorId") || "";
  const initialTab = searchParams.get("tab") === "patient_inquiries" ? "patient_inquiries" : "doctor_chats";

  const [activeMainTab, setActiveMainTab] = useState(initialTab); // "doctor_chats" | "patient_inquiries"

  // Doctor chats state
  const [doctorsList, setDoctorsList] = useState([]);
  const [docMsgsDocs, setDocMsgsDocs] = useState([]);
  const [genMsgsDocs, setGenMsgsDocs] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [replyInputText, setReplyInputText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Patient inquiries state
  const [patientInquiries, setPatientInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Patient Email Reply Modal State
  const [replyingInquiry, setReplyingInquiry] = useState(null);
  const [patientReplySubject, setPatientReplySubject] = useState("");
  const [patientReplyText, setPatientReplyText] = useState("");
  const [sendingPatientEmail, setSendingPatientEmail] = useState(false);
  const [emailStatusAlert, setEmailStatusAlert] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const doctorIdParam = searchParams.get("doctorId");

    if (tabParam === "patient_inquiries") {
      setActiveMainTab("patient_inquiries");
    } else if (tabParam === "doctor_chats" || doctorIdParam) {
      setActiveMainTab("doctor_chats");
      if (doctorIdParam) {
        setSelectedDoctorId(doctorIdParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // 1. Subscribe to doctors
    const unsubDoctors = onSnapshot(
      collection(db, "doctors"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDoctorsList(list);
        if (!selectedDoctorId && list.length > 0) {
          setSelectedDoctorId(list[0].id);
        }
      },
      (err) => console.warn("Doctors notice:", err)
    );

    // 2. Subscribe to doctor_messages
    const unsubDocMsgs = onSnapshot(
      collection(db, "doctor_messages"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "doctor_messages",
          rawTime: d.data().createdAt?.seconds ? d.data().createdAt.seconds * 1000 : Date.now(),
          ...d.data(),
        }));
        setDocMsgsDocs(list);
      },
      (err) => console.warn("Doctor messages notice:", err)
    );

    // 3. Subscribe to patient website inquiries & fallback doctor messages (messages collection)
    const unsubPatientMsgs = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "messages",
          rawTime: d.data().createdAt?.seconds ? d.data().createdAt.seconds * 1000 : Date.now(),
          ...d.data(),
        }));

        setGenMsgsDocs(list);
        // Filter out patient inquiries (items that don't have category == "doctor_chat")
        const inquiries = list.filter((m) => (m.category || "") !== "doctor_chat" && !m.doctorId);
        setPatientInquiries(inquiries);
        setLoading(false);
      },
      (err) => {
        console.warn("Patient msgs notice:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubDoctors();
      unsubDocMsgs();
      unsubPatientMsgs();
    };
  }, []);

  // Combine all doctor messages from both collections
  const allDoctorMessagesCombined = (() => {
    const combined = [...docMsgsDocs, ...genMsgsDocs.filter((m) => (m.category || "") === "doctor_chat" || m.doctorId)];
    const seen = new Set();
    const unique = [];
    combined.forEach((m) => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        unique.push(m);
      }
    });
    unique.sort((a, b) => (a.rawTime || 0) - (b.rawTime || 0));
    return unique;
  })();

  const selectedDoctorObj = doctorsList.find((d) => d.id === selectedDoctorId) || {
    id: selectedDoctorId,
    name: "Doctor",
    specialty: "Specialist",
  };

  const [contactInfo, setContactInfo] = useState({
    callNumber: "0324-1111691",
    helplineNumber: "0324-1111691",
  });

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "siteContent", "contactInfo"),
        (snap) => {
          if (snap.exists()) {
            setContactInfo((prev) => ({ ...prev, ...snap.data() }));
          }
        },
        (err) => console.warn("Admin messages contactInfo error:", err)
      );
      return () => unsub();
    } catch (e) {
      console.warn("Admin messages contactInfo subscription failed:", e);
    }
  }, []);

  // Filter messages belonging to selected doctor
  const activeDoctorThread = allDoctorMessagesCombined.filter((item) => {
    if (!selectedDoctorId) return false;
    if (item.doctorId && item.doctorId === selectedDoctorId) return true;
    if (item.doctorName && selectedDoctorObj.name) {
      const docClean = selectedDoctorObj.name.toLowerCase().trim();
      const itemDocClean = item.doctorName.toLowerCase().trim();
      return itemDocClean.includes(docClean) || docClean.includes(itemDocClean);
    }
    return false;
  });

  useEffect(() => {
    scrollToBottom();
    if (!selectedDoctorId || activeDoctorThread.length === 0) return;

    activeDoctorThread.forEach(async (m) => {
      if (m.sender_type === "doctor" && (m.is_read !== true || m.read !== true)) {
        try {
          await updateDoc(doc(db, m.collectionName || "doctor_messages", m.id), {
            is_read: true,
            read: true,
          });
        } catch (err) {
          console.warn("Notice marking doctor message read by admin:", err);
        }
      }
    });
  }, [activeDoctorThread, selectedDoctorId]);

  // Admin sends reply to selected Doctor
  const handleAdminReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyInputText.trim() || !selectedDoctorId) return;

    const textToSend = replyInputText.trim();
    setReplyInputText("");
    setIsReplying(true);

    const replyPayload = {
      doctorId: selectedDoctorId,
      doctorName: selectedDoctorObj.name || "Doctor",
      sender_type: "admin",
      message: textToSend,
      is_read: false,
      read: false,
      category: "doctor_chat",
      name: "Hospital Admin",
      createdAt: serverTimestamp(),
    };

    try {
      // 1. Write to doctor_messages
      await addDoc(collection(db, "doctor_messages"), replyPayload);

      // 2. Dual write to messages collection for fallback security
      try {
        await addDoc(collection(db, "messages"), replyPayload);
      } catch (e2) {
        console.warn("Secondary reply write notice:", e2);
      }

      // Send notification to Doctor
      await notifyOnDirectMessage({
        sender_type: "admin",
        doctorName: selectedDoctorObj.name || "Doctor",
        doctorId: selectedDoctorId,
        message: textToSend,
      });
    } catch (primaryErr) {
      console.warn("Primary admin reply failed, falling back to messages:", primaryErr);
      try {
        await addDoc(collection(db, "messages"), replyPayload);
        await notifyOnDirectMessage({
          sender_type: "admin",
          doctorName: selectedDoctorObj.name || "Doctor",
          doctorId: selectedDoctorId,
          message: textToSend,
        });
      } catch (fallbackErr) {
        alert("Could not deliver reply. Please check connection.");
      }
    } finally {
      setIsReplying(false);
    }
  };

  // Mark patient inquiry read
  const handleMarkInquiryRead = async (id, currentStatus = false) => {
    try {
      await updateDoc(doc(db, "messages", id), { read: !currentStatus, is_read: !currentStatus });
    } catch (err) {
      console.warn("Error marking inquiry read:", err);
    }
  };

  // Open Reply Modal for Patient Inquiry
  const openReplyModal = (msg) => {
    setReplyingInquiry(msg);
    setPatientReplySubject(`Re: Inquiry - Haji Murad Eye Hospital`);
    setPatientReplyText(
      `Dear ${msg.name || "Patient"},\n\nThank you for reaching out to Haji Murad Eye Hospital.\n\n`
    );
    setEmailStatusAlert(null);

    // Automatically mark read when opening reply modal
    if (!msg.read && !msg.is_read) {
      handleMarkInquiryRead(msg.id, false);
    }
  };

  // Apply predefined reply templates
  const applyTemplate = (type) => {
    if (!replyingInquiry) return;
    const name = replyingInquiry.name || "Patient";

    const callNum = contactInfo.callNumber || contactInfo.emergencyNumber || "0324-1111691";
    const helpNum = contactInfo.helplineNumber || "0324-1111691";

    if (type === "cataract") {
      setPatientReplySubject("Cataract Surgery Information & Charges - Haji Murad Eye Hospital Trust");
      setPatientReplyText(
        `Dear ${name},\n\nThank you for inquiring about Cataract Surgery at Haji Murad Eye Hospital Trust.\n\n` +
          `Cataract surgery charges depend on the type of intraocular lens (IOL) selected (e.g. Monofocal, Bifocal, or Premium Trifocal/Multifocal lenses).\n\n` +
          `Our consultation fee is nominal and surgical packages include pre-operative diagnostics & post-op checkups.\n\n` +
          `We welcome you to visit our clinic on GT Road Gujranwala for a detailed eye checkup. For appointment booking, call us at ${callNum}.\n\n` +
          `Best regards,\nHaji Murad Eye Hospital Trust Team`
      );
    } else if (type === "appointment") {
      setPatientReplySubject("Appointment Assistance - Haji Murad Eye Hospital Trust");
      setPatientReplyText(
        `Dear ${name},\n\nThank you for contacting Haji Murad Eye Hospital Trust.\n\n` +
          `To schedule an appointment with our specialist Ophthalmic surgeons, please call our helpline at ${helpNum} or reply with your preferred day and time.\n\n` +
          `Our OPD timing is Monday to Saturday: 9:00 AM to 8:00 PM.\n\n` +
          `Best regards,\nHaji Murad Eye Hospital Trust Team`
      );
    } else if (type === "general") {
      setPatientReplySubject(`Re: Inquiry Response - Haji Murad Eye Hospital Trust`);
      setPatientReplyText(
        `Dear ${name},\n\nThank you for reaching out to Haji Murad Eye Hospital Trust.\n\n` +
          `We have received your message and our administration team is happy to assist you. If you have specific questions or need immediate consultation, please feel free to call us at ${callNum}.\n\n` +
          `Best regards,\nHaji Murad Eye Hospital Trust Team`
      );
    }
  };

  // Send Email to Patient via API & update Firestore
  const handleSendPatientEmail = async (e) => {
    if (e) e.preventDefault();
    if (!replyingInquiry || !patientReplyText.trim()) return;

    if (!replyingInquiry.email) {
      setEmailStatusAlert({
        type: "error",
        message: "This patient inquiry does not have a valid email address.",
      });
      return;
    }

    setSendingPatientEmail(true);
    setEmailStatusAlert(null);

    try {
      // 1. Call email API
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyingInquiry.email,
          subject: patientReplySubject,
          message: patientReplyText,
          patientName: replyingInquiry.name,
          inquiryId: replyingInquiry.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email reply.");
      }

      // 2. Update Firestore record with reply details
      await updateDoc(doc(db, "messages", replyingInquiry.id), {
        replied: true,
        replyText: patientReplyText,
        repliedAt: serverTimestamp(),
        repliedBy: "Hospital Admin",
        read: true,
        is_read: true,
      });

      setEmailStatusAlert({
        type: "success",
        message: data.message || `Reply email successfully sent to ${replyingInquiry.email}!`,
      });

      setTimeout(() => {
        setReplyingInquiry(null);
      }, 2000);
    } catch (err) {
      console.error("Email send error:", err);
      setEmailStatusAlert({
        type: "error",
        message: err.message || "Could not dispatch email. Please check your connection or SMTP setup.",
      });
    } finally {
      setSendingPatientEmail(false);
    }
  };

  // Quick Mailto link generation
  const handleMailtoFallback = () => {
    if (!replyingInquiry || !replyingInquiry.email) return;
    const mailtoUrl = `mailto:${encodeURIComponent(replyingInquiry.email)}?subject=${encodeURIComponent(
      patientReplySubject
    )}&body=${encodeURIComponent(patientReplyText)}`;
    window.open(mailtoUrl, "_blank");

    // Also mark as replied in Firestore
    updateDoc(doc(db, "messages", replyingInquiry.id), {
      replied: true,
      replyText: patientReplyText,
      repliedAt: serverTimestamp(),
      repliedBy: "Hospital Admin (Mailto)",
      read: true,
      is_read: true,
    }).catch(console.warn);
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    return String(ts);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
              Communication Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            Hospital Inbox & Messaging
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage private Doctor channels and public patient contact form inquiries.
          </p>
        </div>

        {/* Main Tab Toggle (Doctor Chats vs Patient Inquiries) */}
        <div className="bg-[var(--fog)] p-1.5 rounded-2xl border border-[var(--line)] flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveMainTab("doctor_chats")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "doctor_chats"
                ? "bg-[var(--ink)] text-white shadow-xs"
                : "text-[var(--slate)] hover:bg-white/50"
            }`}
          >
            <Stethoscope className="w-4 h-4 text-[#5EEAD4]" />
            Doctor Direct Chats ({doctorsList.length})
          </button>
          <button
            onClick={() => setActiveMainTab("patient_inquiries")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "patient_inquiries"
                ? "bg-[var(--ink)] text-white shadow-xs"
                : "text-[var(--slate)] hover:bg-white/50"
            }`}
          >
            <Users className="w-4 h-4 text-[#5EEAD4]" />
            Patient Inquiries ({patientInquiries.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: DOCTOR DIRECT CHATS */}
      {activeMainTab === "doctor_chats" && (
        <div className="bg-white rounded-3xl border border-[var(--line)] shadow-lg grid grid-cols-1 lg:grid-cols-12 min-h-[550px] overflow-hidden">
          {/* Left Sidebar: Per-Doctor Threads List */}
          <div className="lg:col-span-4 border-r border-[var(--line)] bg-[#FAFDFB] flex flex-col">
            <div className="p-4 border-b border-[var(--line)] bg-[var(--fog)]">
              <h3 className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
                Doctor Inbox Threads ({doctorsList.length})
              </h3>
              <p className="text-[11px] text-[var(--slate)] font-semibold mt-0.5">
                Select a doctor to view their private thread
              </p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {doctorsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-semibold">
                  No doctors registered yet.
                </div>
              ) : (
                doctorsList.map((docItem) => {
                  const isSelected = selectedDoctorId === docItem.id;
                  const docClean = (docItem.name || "").toLowerCase().trim();

                  // Get last message in this thread
                  const threadMsgs = allDoctorMessagesCombined.filter((m) => {
                    if (m.doctorId && m.doctorId === docItem.id) return true;
                    if (m.doctorName && docClean) {
                      const itemDocClean = m.doctorName.toLowerCase().trim();
                      return itemDocClean.includes(docClean) || docClean.includes(itemDocClean);
                    }
                    return false;
                  });

                  const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
                  const unreadDoctorMsgs = threadMsgs.filter(
                    (m) => m.sender_type === "doctor" && m.is_read !== true && m.read !== true
                  ).length;

                  return (
                    <div
                      key={docItem.id}
                      onClick={() => setSelectedDoctorId(docItem.id)}
                      className={`p-4 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[var(--ink)] text-white"
                          : "hover:bg-[var(--fog)]/60 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-[var(--iris)] text-white"
                              : "bg-[var(--fog)] text-[#2B1F1A]"
                          }`}
                        >
                          <Stethoscope className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold truncate">
                            {docItem.name || "Dr. Specialist"}
                          </h4>
                          <p
                            className={`text-[11px] truncate ${
                              isSelected ? "text-slate-200" : "text-slate-500"
                            }`}
                          >
                            {lastMsg ? lastMsg.message : docItem.specialty || "Ophthalmic Surgeon"}
                          </p>
                        </div>
                      </div>

                      {unreadDoctorMsgs > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 animate-pulse">
                          {unreadDoctorMsgs}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Main Chat Window */}
          <div className="lg:col-span-8 flex flex-col bg-white">
            {selectedDoctorId ? (
              <>
                {/* Active Thread Subheader */}
                <div className="p-4 border-b border-[var(--line)] bg-[var(--fog)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--ink)] text-white flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#2B1F1A]">
                        {selectedDoctorObj.name || "Dr. Specialist"}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--slate)]">
                        {selectedDoctorObj.specialty || "Private Doctor Channel"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-[var(--iris)] bg-white px-3 py-1 rounded-full border border-[var(--line)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Isolated Thread
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[500px] min-h-[380px] bg-[#FAFDFB]">
                  {activeDoctorThread.length === 0 ? (
                    <div className="py-20 text-center space-y-3 max-w-sm mx-auto">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-extrabold text-[#2B1F1A]">No Messages Yet</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        There are no direct messages between you and {selectedDoctorObj.name} yet. Type a message below to start chatting.
                      </p>
                    </div>
                  ) : (
                    activeDoctorThread.map((msg) => {
                      const isAdmin = msg.sender_type === "admin";

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              {isAdmin ? "You (Hospital Admin)" : selectedDoctorObj.name}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl text-xs leading-relaxed ${
                              isAdmin
                                ? "bg-[var(--ink)] text-white rounded-tr-xs"
                                : "bg-white text-slate-800 border border-[var(--line)] rounded-tl-xs shadow-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap font-medium">{msg.message}</p>
                            <div
                              className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${
                                isAdmin ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(msg.createdAt)}</span>
                              {isAdmin && (
                                <span className="ml-1 inline-flex items-center">
                                  {msg.is_read === true || msg.read === true ? (
                                    <CheckCheck className="w-4 h-4 text-sky-400 font-extrabold" title="Read by Doctor" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-300" title="Sent (Unread)" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Reply Input Bar */}
                <form
                  onSubmit={handleAdminReplySubmit}
                  className="p-4 border-t border-[var(--line)] bg-white flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    placeholder={`Reply to ${selectedDoctorObj.name || "Doctor"}...`}
                    value={replyInputText}
                    onChange={(e) => setReplyInputText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isReplying || !replyInputText.trim()}
                    className="px-5 py-3 rounded-2xl bg-[var(--iris)] hover:bg-[var(--iris-dark)] disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <span>Reply</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-xs text-slate-500 font-semibold">
                Select a doctor thread from the left sidebar to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: PATIENT WEBSITE INQUIRIES */}
      {activeMainTab === "patient_inquiries" && (
        <div className="bg-white rounded-3xl border border-[var(--line)] shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#2B1F1A]">
                Website Patient Inquiries ({patientInquiries.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Contact form messages submitted by patients on public pages.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Unread ({patientInquiries.filter((m) => !m.read && !m.is_read).length})
              </span>
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-bold text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Replied ({patientInquiries.filter((m) => m.replied).length})
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-[#2B1F1A]">
              Loading Patient Inquiries...
            </div>
          ) : patientInquiries.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Mail className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No Patient Contact Messages Found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patientInquiries.map((msg) => {
                const isUnread = !msg.read && !msg.is_read;
                const isReplied = msg.replied;

                return (
                  <div
                    key={msg.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
                      isUnread
                        ? "bg-amber-50/30 border-amber-200 shadow-xs"
                        : isReplied
                        ? "bg-emerald-50/20 border-emerald-200"
                        : "bg-[#FAFDFB] border-[var(--line)]"
                    }`}
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                            isReplied
                              ? "bg-emerald-600 text-white"
                              : isUnread
                              ? "bg-amber-500 text-white"
                              : "bg-[var(--ink)] text-white"
                          }`}
                        >
                          <User className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-[#2B1F1A]">
                              {msg.name || "Patient"}
                            </h4>

                            {/* Status badges */}
                            {isReplied ? (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Replied via Email
                              </span>
                            ) : isUnread ? (
                              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 animate-pulse">
                                New Inquiry
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                Read
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-semibold mt-0.5">
                            {msg.email && (
                              <a
                                href={`mailto:${msg.email}`}
                                className="hover:text-[var(--iris)] underline decoration-slate-300 flex items-center gap-1"
                              >
                                <Mail className="w-3 h-3 text-slate-400" />
                                {msg.email}
                              </a>
                            )}
                            {msg.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400 inline" />
                                {msg.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Patient inquiry message text */}
                    <div className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-xs">
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed uppercase tracking-tight font-mono text-[11px] text-[#2B1F1A] mb-1">
                        INQUIRY MESSAGE:
                      </p>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>

                    {/* If Admin already replied, display the reply block */}
                    {isReplied && msg.replyText && (
                      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-800 border-b border-emerald-200/60 pb-1.5">
                          <span className="flex items-center gap-1.5">
                            <CornerDownRight className="w-4 h-4 text-emerald-600" />
                            Previous Admin Email Reply:
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {formatTime(msg.repliedAt)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap pl-5">
                          {msg.replyText}
                        </p>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Call Quick Action */}
                        {msg.phone && (
                          <a
                            href={`tel:${msg.phone}`}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200"
                            title="Call Patient Phone"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>Call</span>
                          </a>
                        )}

                        {/* WhatsApp Quick Action */}
                        {msg.phone && (
                          <a
                            href={getWhatsAppContactReplyUrl(msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-200"
                            title="Reply via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Email Quick Action - ONLY visible when msg.email exists & is non-empty */}
                        {msg.email && msg.email.trim() !== "" && (
                          <button
                            onClick={() => openReplyModal(msg)}
                            className="px-3 py-1.5 rounded-xl bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            title="Reply via Email"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#5EEAD4]" />
                            <span>{isReplied ? "Send Email" : "Email"}</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleMarkInquiryRead(msg.id, msg.read || msg.is_read)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100"
                      >
                        {isUnread ? "Mark as Read" : "Mark as Unread"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PATIENT EMAIL REPLY MODAL */}
      <AnimatePresence>
        {replyingInquiry && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[var(--line)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-[var(--ink)] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--iris)] text-white flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">Send Email Reply to Patient</h3>
                    <p className="text-[11px] text-[#5EEAD4] font-medium">
                      Recipient: {replyingInquiry.email || "No email address"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setReplyingInquiry(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Original inquiry recap box */}
                <div className="bg-[#FAFDFB] p-4 rounded-2xl border border-[var(--line)] space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-[#2B1F1A]">
                    <span>PATIENT: {replyingInquiry.name || "Unknown"}</span>
                    <span className="text-slate-400 font-normal">{formatTime(replyingInquiry.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium italic">
                    "{replyingInquiry.message}"
                  </p>
                </div>

                {/* Quick Templates Bar */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-[#2B1F1A] uppercase tracking-wider block">
                    Quick Reply Templates:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyTemplate("cataract")}
                      className="px-3 py-1.5 rounded-xl bg-[var(--fog)] hover:bg-[var(--iris)] hover:text-white text-[#2B1F1A] text-xs font-bold border border-[var(--line)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Cataract & Surgery Charges
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplate("appointment")}
                      className="px-3 py-1.5 rounded-xl bg-[var(--fog)] hover:bg-[var(--iris)] hover:text-white text-[#2B1F1A] text-xs font-bold border border-[var(--line)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      Appointment Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplate("general")}
                      className="px-3 py-1.5 rounded-xl bg-[var(--fog)] hover:bg-[var(--iris)] hover:text-white text-[#2B1F1A] text-xs font-bold border border-[var(--line)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      General Reply
                    </button>
                  </div>
                </div>

                {/* Subject Line */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-[#2B1F1A] uppercase tracking-wider block">
                    Email Subject:
                  </label>
                  <input
                    type="text"
                    value={patientReplySubject}
                    onChange={(e) => setPatientReplySubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white"
                  />
                </div>

                {/* Reply Message Body */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-[#2B1F1A] uppercase tracking-wider block">
                    Email Message Content:
                  </label>
                  <textarea
                    rows={8}
                    value={patientReplyText}
                    onChange={(e) => setPatientReplyText(e.target.value)}
                    placeholder="Type your official email reply to the patient here..."
                    className="w-full p-4 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[var(--iris)] bg-white leading-relaxed"
                  />
                </div>

                {/* Status Alert Banner */}
                {emailStatusAlert && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                      emailStatusAlert.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    {emailStatusAlert.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{emailStatusAlert.message}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleMailtoFallback}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Open Mail Client application"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Open in Mail App</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyingInquiry(null)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSendPatientEmail}
                    disabled={sendingPatientEmail || !patientReplyText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[var(--iris)] hover:bg-[var(--iris-dark)] disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    {sendingPatientEmail ? (
                      <span>Sending Email...</span>
                    ) : (
                      <>
                        <span>Send Email Reply</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-slate-500">Loading Admin Messages...</div>}>
      <AdminMessagesContent />
    </Suspense>
  );
}
