import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/ToastProvider";

// Mock framer-motion so AnimatePresence removes children immediately on exit
// (no CSS transition delay) making fake-timer-based dismissal tests reliable.
vi.mock("framer-motion", () => {
    const React = require("react");
    return {
        motion: new Proxy({}, {
            get: (_, tag) => React.forwardRef((props, ref) => {
                const { children, initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props;
                return React.createElement(tag === "default" ? "div" : tag, { ...rest, ref }, children);
            }),
        }),
        AnimatePresence: ({ children }) => children,
    };
});

function ToastTrigger({ message, type }) {
    const { toast } = useToast();
    return <button onClick={() => toast(message, type)}>Show toast</button>;
}
describe("ToastProvider", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it("renders children normally", () => {
        render(<ToastProvider>
        <p>Hello</p>
      </ToastProvider>);
        expect(screen.getByText("Hello")).toBeInTheDocument();
    });
    it("shows a toast message when toast() is called", async () => {
        render(<ToastProvider>
        <ToastTrigger message="Book saved!" type="success"/>
      </ToastProvider>);
        const button = screen.getByRole("button");
        await act(async () => {
            button.click();
        });
        expect(screen.getByText("Book saved!")).toBeInTheDocument();
    });
    it("auto-dismisses the toast after 3.5s", async () => {
        render(<ToastProvider>
        <ToastTrigger message="Temporary message" type="info"/>
      </ToastProvider>);
        await act(async () => {
            screen.getByRole("button", { name: /show toast/i }).click();
        });
        expect(screen.getByText("Temporary message")).toBeInTheDocument();
        await act(async () => {
            vi.runAllTimers();
        });
        expect(screen.queryByText("Temporary message")).not.toBeInTheDocument();
    });
    it("can show multiple toasts simultaneously", async () => {
        render(<ToastProvider>
        <ToastTrigger message="First toast" type="success"/>
        <ToastTrigger message="Second toast" type="error"/>
      </ToastProvider>);
        const buttons = screen.getAllByRole("button");
        await act(async () => {
            buttons[0].click();
            buttons[1].click();
        });
        expect(screen.getByText("First toast")).toBeInTheDocument();
        expect(screen.getByText("Second toast")).toBeInTheDocument();
    });
});
