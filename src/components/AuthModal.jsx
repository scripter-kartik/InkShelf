"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
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
                setError(result.error === "Database not configured"
                    ? "Accounts require a database connection (set MONGODB_URI)."
                    : "Invalid email or password.");
                setLoading(false);
                return;
            }
            toast(isSignup ? "Welcome to InkShelf!" : "Logged in!", "success");
            onClose?.();
        }
        catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 text-gray-500 hover:text-black dark:hover:text-white">
          <X className="h-5 w-5"/>
        </button>

        <h2 className="mb-6 text-center text-2xl font-extrabold dark:text-white">
          {isSignup ? "Join InkShelf" : "Welcome back"}
        </h2>

        <button onClick={() => signIn("google")} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-black py-2.5 font-semibold hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
          
          <img className="h-5 w-5" src="/google.png" alt=""/>
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
          <span className="text-xs text-gray-400">or</span>
          <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isSignup && (<input type="text" placeholder="Name" value={form.name} onChange={update("name")} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"/>)}
          <input type="email" required placeholder="Email" value={form.email} onChange={update("email")} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"/>
          <input type="password" required minLength={isSignup ? 8 : undefined} placeholder={isSignup ? "Password (min 8 chars)" : "Password"} value={form.password} onChange={update("password")} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"/>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="mt-1 rounded-full bg-black py-2.5 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-green-500 dark:text-black">
            {loading
            ? "Please wait…"
            : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-300">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => onSwitch?.(isSignup ? "login" : "signup")} className="font-semibold text-green-600 hover:underline">
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>);
}
