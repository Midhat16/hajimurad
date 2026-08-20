"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle, Trash2, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  type = "warning", // 'accept' | 'reject' | 'delete' | 'warning'
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  const iconMap = {
    accept: <CheckCircle2 className="w-10 h-10 text-emerald-600" />,
    reject: <XCircle className="w-10 h-10 text-rose-600" />,
    delete: <Trash2 className="w-10 h-10 text-rose-600" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500" />,
  };

  const btnBgMap = {
    accept: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
    reject: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
    delete: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
    warning: "bg-[var(--iris)] hover:bg-[var(--iris-dark)] text-white shadow-[var(--iris)]/20",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center"
        >
          {/* Close Icon Button */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto shadow-inner">
            {iconMap[type] || iconMap.warning}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold font-serif text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${btnBgMap[type] || btnBgMap.warning}`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
