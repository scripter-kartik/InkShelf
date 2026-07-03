"use client";
import { createContext, useContext, useState, useCallback } from "react";
const ToastContext = createContext({ toast: () => { } });
let idCounter = 0;
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const toast = useCallback((message, type = "info") => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), 3500);
    }, [remove]);
    return (<ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (<div key={t.id} role="status" className={`min-w-[220px] max-w-xs rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === "error"
                ? "bg-red-600"
                : t.type === "success"
                    ? "bg-green-600"
                    : "bg-gray-800"}`}>
            {t.message}
          </div>))}
      </div>
    </ToastContext.Provider>);
}
export function useToast() {
    return useContext(ToastContext);
}
