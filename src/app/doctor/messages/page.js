"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDoctorAuth } from "@/context/DoctorAuthContext";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import DoctorNotificationBell from "@/components/doctor/DoctorNotificationBell";
import { notifyOnDirectMessage } from "@/lib/notificationService";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Clock,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  CheckCheck
} from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorDirectChatPage() {
  const { doctorProfile, doctorId, logoutDoctor, loading: authLoading } = useDoctorAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!doctorId && !doctorProfile?.name) return;

    const doctorNameClean = (doctorProfile?.name || "").toLowerCase().trim();
    let docMsgsList = [];
    let generalMsgsList = [];

    // Helper to merge and filter messages for this doctor
    const mergeAndSet = () => {
      const combined = [...docMsgsList, ...generalMsgsList];
      const seen = new Set();
      const unique = [];

      combined.forEach((msg) => {
        if (!seen.has(msg.id)) {
          seen.add(msg.id);

          // Check if message belongs to this doctor
          const matchesDocId = msg.doctorId && doctorId && msg.doctorId === doctorId;
          const matchesDocName =
            msg.doctorName &&
            doctorNameClean &&
            (msg.doctorName.toLowerCase().includes(doctorNameClean) ||
              doctorNameClean.includes(msg.doctorName.toLowerCase()));

          if (matchesDocId || matchesDocName) {
            unique.push(msg);
          }
        }
      });

      // Sort by createdAt ascending (oldest to newest)
      unique.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.rawTime || 0;
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.rawTime || 0;
        return timeA - timeB;
      });

      setMessages(unique);
      setLoadingMsgs(false);

      // Mark unread admin messages as read
      unique.forEach(async (m) => {
        if (m.sender_type === "admin" && !m.is_read) {
          try {
            await updateDoc(doc(db, m.collectionName || "doctor_messages", m.id), {
              is_read: true,
              read: true,
            });
          } catch (err) {
            console.warn("Notice marking chat read:", err);
          }
        }
      });
    };

    // 1. Subscribe to doctor_messages
    const unsubDoc = onSnapshot(
      collection(db, "doctor_messages"),
      (snap) => {
        docMsgsList = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "doctor_messages",
          rawTime: d.data().createdAt?.seconds ? d.data().createdAt.seconds * 1000 : Date.now(),
          ...d.data(),
        }));
        mergeAndSet();
      },
      (err) => {
        console.warn("doctor_messages listener notice:", err);
        setLoadingMsgs(false);
      }
    );

    // 2. Subscribe to general messages collection fallback
    const unsubGen = onSnapshot(
      collection(db, "messages"),
      (snap) => {
        generalMsgsList = snap.docs.map((d) => ({
          id: d.id,
          collectionName: "messages",
          rawTime: d.data().createdAt?.seconds ? d.data().createdAt.seconds * 1000 : Date.now(),
          ...d.data(),
        }));
        mergeAndSet();
      },
      (err) => console.warn("messages listener notice:", err)
    );

    return () => {
      unsubDoc();
      unsubGen();
    };
  }, [doctorId, doctorProfile, authLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    const msgPayload = {
      doctorId: doctorId || "doc_id",
      doctorName: doctorProfile?.name || "Doctor",
      sender_type: "doctor",
      message: textToSend,
      is_read: false,
      read: false,
      category: "doctor_chat",
      name: doctorProfile?.name || "Doctor",
      createdAt: serverTimestamp(),
    };

    try {
      // Write to doctor_messages collection
      await addDoc(collection(db, "doctor_messages"), msgPayload);

      // Dual write to messages collection for fallback permission security
      try {
        await addDoc(collection(db, "messages"), msgPayload);
      } catch (e2) {
        console.warn("Secondary messages write notice:", e2);
      }

      // Send notification to Admin
      await notifyOnDirectMessage({
        sender_type: "doctor",
        doctorName: doctorProfile?.name || "Doctor",
        doctorId: doctorId || "",
        message: textToSend,
      });
    } catch (primaryErr) {
      console.warn("Primary doctor_messages write failed, falling back to messages:", primaryErr);
      try {
        await addDoc(collection(db, "messages"), msgPayload);
        await notifyOnDirectMessage({
          sender_type: "doctor",
          doctorName: doctorProfile?.name || "Doctor",
          doctorId: doctorId || "",
          message: textToSend,
        });
      } catch (fallbackErr) {
        alert("Could not send message. Please check connection.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (typeof ts === "number") return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return String(ts);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] font-sans flex flex-col">
      {/* Top Bar Header */}
      <header className="bg-[#0B3D5C] text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">
                  Admin Direct Chat
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-[#5EEAD4] px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Private & Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dr. {doctorProfile?.name || "Specialist"} — Connected with Hospital Admin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DoctorNotificationBell />
            <button
              onClick={logoutDoctor}
              className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col">
        <div className="bg-white rounded-3xl border border-[#D5E5DD] shadow-lg flex-1 flex flex-col overflow-hidden min-h-[500px] max-h-[78vh]">
          {/* Chat Window Subheader */}
          <div className="bg-[#E8F0EC] px-6 py-4 border-b border-[#D5E5DD] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0B3D5C] text-white flex items-center justify-center font-black shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#5EEAD4]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0B3D5C]">
                  Hospital Administration Channel
                </h3>
                <p className="text-xs text-[#3F4B4A] font-semibold">
                  Direct communication thread with Head Administrator
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-[#3E8E6E] bg-white px-3 py-1 rounded-full border border-[#D5E5DD] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages Stream Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FAFDFB]">
            {loadingMsgs ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#0B3D5C]">Loading Secure Chat Thread...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-3xl bg-[#E8F0EC] text-[#3E8E6E] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-[#0B3D5C]">No Messages Yet</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Start a conversation with Admin below. Your thread is private to your account only.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isDoctor = msg.sender_type === "doctor";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isDoctor ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {isDoctor ? `Dr. ${doctorProfile?.name || "You"}` : "Hospital Admin"}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-xs text-xs leading-relaxed ${
                        isDoctor
                          ? "bg-[#0B3D5C] text-white rounded-tr-xs"
                          : "bg-white text-slate-800 border border-[#D5E5DD] rounded-tl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-medium">{msg.message}</p>

                      <div
                        className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] ${
                          isDoctor ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(msg.createdAt)}</span>
                        {isDoctor && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${
                              msg.is_read ? "text-[#5EEAD4]" : "text-slate-400"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Send Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-[#D5E5DD] flex items-center gap-2.5"
          >
            <input
              type="text"
              placeholder="Type your message to Hospital Admin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#3E8E6E] bg-slate-50/50"
            />

            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-5 py-3 rounded-2xl bg-[#3E8E6E] hover:bg-[#32755a] disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
