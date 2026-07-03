"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
export default function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";
    return (<button type="button" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Light mode" : "Dark mode"} className={`flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:bg-black/10 dark:text-white dark:hover:bg-white/10 ${className}`}>
      {isDark ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
    </button>);
}
