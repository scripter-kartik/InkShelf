"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
const ThemeContext = createContext({ theme: "light", toggleTheme: () => { } });
function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark")
        root.classList.add("dark");
    else
        root.classList.remove("dark");
}
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");
    useEffect(() => {
        const stored = localStorage.getItem("inkshelf-theme");
        const initial = stored ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light");
        setTheme(initial);
        applyTheme(initial);
    }, []);
    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("inkshelf-theme", next);
            applyTheme(next);
            return next;
        });
    }, []);
    return (<ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    return useContext(ThemeContext);
}
