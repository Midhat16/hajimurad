"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get("doctorId") || "";

  const [activeMainTab, setActiveMainTab] = useState("doctor_chats"); // "doctor_chats" | "patient_inquiries"

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

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
  }, [activeDoctorThread]);

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
  const handleMarkInquiryRead = async (id) => {
    try {
      await updateDoc(doc(db, "messages", id), { read: true, is_read: true });
    } catch (err) {
      console.warn("Error marking inquiry read:", err);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5E5DD] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#3E8E6E] bg-[#E8F0EC] px-2.5 py-0.5 rounded-md border border-[#D5E5DD]">
              Communication Center
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight mt-1">
            Hospital Inbox & Messaging
          </h1>
          <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
            Manage private Doctor channels and public patient contact form inquiries.
          </p>
        </div>

        {/* Main Tab Toggle (Doctor Chats vs Patient Inquiries) */}
        <div className="bg-[#E8F0EC] p-1.5 rounded-2xl border border-[#D5E5DD] flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveMainTab("doctor_chats")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "doctor_chats"
                ? "bg-[#0B3D5C] text-white shadow-xs"
                : "text-[#3F4B4A] hover:bg-white/50"
            }`}
          >
            <Stethoscope className="w-4 h-4 text-[#5EEAD4]" />
            Doctor Direct Chats ({doctorsList.length})
          </button>
          <button
            onClick={() => setActiveMainTab("patient_inquiries")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === "patient_inquiries"
                ? "bg-[#0B3D5C] text-white shadow-xs"
                : "text-[#3F4B4A] hover:bg-white/50"
            }`}
          >
            <Users className="w-4 h-4 text-[#5EEAD4]" />
            Patient Inquiries ({patientInquiries.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: DOCTOR DIRECT CHATS */}
      {activeMainTab === "doctor_chats" && (
        <div className="bg-white rounded-3xl border border-[#D5E5DD] shadow-lg grid grid-cols-1 lg:grid-cols-12 min-h-[550px] overflow-hidden">
          {/* Left Sidebar: Per-Doctor Threads List */}
          <div className="lg:col-span-4 border-r border-[#D5E5DD] bg-[#FAFDFB] flex flex-col">
            <div className="p-4 border-b border-[#D5E5DD] bg-[#E8F0EC]">
              <h3 className="text-xs font-extrabold text-[#0B3D5C] uppercase tracking-wider">
                Doctor Inbox Threads ({doctorsList.length})
              </h3>
              <p className="text-[11px] text-[#3F4B4A] font-semibold mt-0.5">
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
                    (m) => m.sender_type === "doctor" && !m.is_read
                  ).length;

                  return (
                    <div
                      key={docItem.id}
                      onClick={() => setSelectedDoctorId(docItem.id)}
                      className={`p-4 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#0B3D5C] text-white"
                          : "hover:bg-[#E8F0EC]/60 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-[#3E8E6E] text-white"
                              : "bg-[#E8F0EC] text-[#0B3D5C]"
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
                <div className="p-4 border-b border-[#D5E5DD] bg-[#E8F0EC] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0B3D5C] text-white flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0B3D5C]">
                        {selectedDoctorObj.name || "Dr. Specialist"}
                      </h3>
                      <p className="text-xs font-semibold text-[#3F4B4A]">
                        {selectedDoctorObj.specialty || "Private Doctor Channel"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-[#3E8E6E] bg-white px-3 py-1 rounded-full border border-[#D5E5DD] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Isolated Thread
                  </span>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[500px] min-h-[380px] bg-[#FAFDFB]">
                  {activeDoctorThread.length === 0 ? (
                    <div className="py-20 text-center space-y-3 max-w-sm mx-auto">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-extrabold text-[#0B3D5C]">No Messages Yet</h4>
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
                                ? "bg-[#0B3D5C] text-white rounded-tr-xs"
                                : "bg-white text-slate-800 border border-[#D5E5DD] rounded-tl-xs shadow-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap font-medium">{msg.message}</p>
                            <div
                              className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] ${
                                isAdmin ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(msg.createdAt)}</span>
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
                  className="p-4 border-t border-[#D5E5DD] bg-white flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    placeholder={`Reply to ${selectedDoctorObj.name || "Doctor"}...`}
                    value={replyInputText}
                    onChange={(e) => setReplyInputText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#3E8E6E] bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={isReplying || !replyInputText.trim()}
                    className="px-5 py-3 rounded-2xl bg-[#3E8E6E] hover:bg-[#32755a] disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2"
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
        <div className="bg-white rounded-3xl border border-[#D5E5DD] shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0B3D5C]">
                Website Patient Inquiries ({patientInquiries.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Contact form messages submitted by patients on public pages.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-[#0B3D5C]">
              Loading Patient Inquiries...
            </div>
          ) : patientInquiries.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Mail className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No Patient Contact Messages Found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patientInquiries.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleMarkInquiryRead(msg.id)}
                  className={`p-5 rounded-2xl border transition-all space-y-3 cursor-pointer ${
                    !msg.read && !msg.is_read
                      ? "bg-amber-50/40 border-amber-200"
                      : "bg-[#FAFDFB] border-[#D5E5DD]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0B3D5C] text-white flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#0B3D5C]">
                          {msg.name || "Patient"}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold mt-0.5">
                          {msg.email && <span>{msg.email}</span>}
                          {msg.phone && <span>{msg.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 leading-relaxed pl-1">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
