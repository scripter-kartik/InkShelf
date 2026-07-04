"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext({ toast: () => {} });
let idCounter = 0;

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLORS = {
  success: "bg-emerald-600 border-emerald-500",
  error: "bg-red-600 border-red-500",
  info: "bg-gray-800 border-gray-700",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info") => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.85, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                role="status"
                className={`pointer-events-auto flex items-center gap-3 min-w-[220px] max-w-xs rounded-xl border px-4 py-3 text-sm font-medium text-white shadow-2xl ${COLORS[t.type]}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0 opacity-90" />
                <span className="flex-1">{t.message}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
