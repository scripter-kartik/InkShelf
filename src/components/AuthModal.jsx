"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ToastProvider";

const overlayVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 32 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 360, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 32,
    transition: { duration: 0.18 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AuthModal({ mode = "login", onClose, onSwitch }) {
  const isSignup = mode === "signup";
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Sign-up failed.");
          setLoading(false);
          return;
        }
      }
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError(
          result.error === "Database not configured"
            ? "Accounts require a database connection (set MONGODB_URI)."
            : "Invalid email or password."
        );
        setLoading(false);
        return;
      }
      toast(isSignup ? "Welcome to InkShelf! 🎉" : "Welcome back! 👋", "success");
      onClose?.();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const fields = isSignup
    ? [
        { type: "text", key: "name", placeholder: "Full Name" },
        { type: "email", key: "email", placeholder: "Email" },
        { type: "password", key: "password", placeholder: "Password (min 8 chars)" },
      ]
    : [
        { type: "email", key: "email", placeholder: "Email" },
        { type: "password", key: "password", placeholder: "Password" },
      ];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        variants={overlayVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          variants={panelVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-gray-400 hover:text-black dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
            className="mb-6 text-center"
          >
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <img src="/icon.png" alt="" className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white font-winky">
              {isSignup ? "Join InkShelf" : "Welcome back"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isSignup ? "Create your reading profile" : "Log in to your reading shelf"}
            </p>
          </motion.div>

          {/* Google */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("google")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 py-2.5 font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 transition-colors"
          >
            <img className="h-5 w-5" src="/google.png" alt="" />
            Continue with Google
          </motion.button>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="my-5 flex items-center gap-3"
          >
            <hr className="flex-grow border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-grow border-gray-200 dark:border-gray-700" />
          </motion.div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {fields.map((f, i) => (
              <motion.div
                key={f.key}
                custom={i}
                variants={fieldVariants}
                initial="hidden"
                animate="show"
              >
                <input
                  type={f.type}
                  required={f.key !== "name" || isSignup}
                  minLength={f.key === "password" && isSignup ? 8 : undefined}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={update(f.key)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-green-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 dark:focus:border-green-400"
                />
              </motion.div>
            ))}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="mt-2 rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-green-500 dark:text-black dark:hover:bg-green-400 relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full dark:border-black dark:border-t-transparent"
                  />
                  Please wait…
                </span>
              ) : isSignup ? (
                "Create account"
              ) : (
                "Log in"
              )}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-center text-sm text-gray-600 dark:text-gray-300"
          >
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => onSwitch?.(isSignup ? "login" : "signup")}
              className="font-semibold text-green-600 hover:underline dark:text-green-400"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
