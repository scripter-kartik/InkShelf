import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}));
vi.mock("@/components/AuthModal", () => ({
    default: ({ mode, onClose }) => (<div data-testid="auth-modal" data-mode={mode}>
      <button onClick={onClose}>Close</button>
    </div>),
}));
vi.mock("@/components/ThemeToggle", () => ({
    default: () => <button aria-label="Toggle theme"/>,
}));
vi.mock("@/lib/openlibrary", () => ({
    fetchSuggestions: vi.fn(() => Promise.resolve([])),
}));
const mockPush = vi.fn();
describe("Navbar", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush });
    });
    describe("unauthenticated state", () => {
        beforeEach(() => {
            useSession.mockReturnValue({ data: null });
        });
        it("renders the InkShelf logo", () => {
            render(<Navbar />);
            expect(screen.getByText("InkShelf")).toBeInTheDocument();
        });
        it("shows Log In and Sign Up buttons on desktop", () => {
            render(<Navbar />);
            expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
        });
        it("opens the login modal when Log In is clicked", async () => {
            render(<Navbar />);
            fireEvent.click(screen.getByRole("button", { name: /log in/i }));
            await waitFor(() => {
                expect(screen.getByTestId("auth-modal")).toHaveAttribute("data-mode", "login");
            });
        });
        it("opens the signup modal when Sign Up is clicked", async () => {
            render(<Navbar />);
            fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
            await waitFor(() => {
                expect(screen.getByTestId("auth-modal")).toHaveAttribute("data-mode", "signup");
            });
        });
        it("closes the modal when close is triggered", async () => {
            render(<Navbar />);
            fireEvent.click(screen.getByRole("button", { name: /log in/i }));
            await waitFor(() => expect(screen.getByTestId("auth-modal")).toBeInTheDocument());
            fireEvent.click(screen.getByText("Close"));
            await waitFor(() => expect(screen.queryByTestId("auth-modal")).not.toBeInTheDocument());
        });
    });
    describe("authenticated state", () => {
        beforeEach(() => {
            useSession.mockReturnValue({
                data: {
                    user: { name: "Jane Reader", email: "jane@example.com", image: null },
                },
            });
        });
        it("does not show Log In / Sign Up buttons when authenticated", () => {
            render(<Navbar />);
            expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /sign up/i })).not.toBeInTheDocument();
        });
        it("renders the account avatar button", () => {
            render(<Navbar />);
            expect(screen.getByRole("button", { name: /account menu/i })).toBeInTheDocument();
        });
    });
    describe("search", () => {
        beforeEach(() => {
            useSession.mockReturnValue({ data: null });
        });
        it("navigates to searchedBooks on Enter", () => {
            render(<Navbar />);
            const input = screen.getByPlaceholderText(/search books/i);
            fireEvent.change(input, { target: { value: "harry potter" } });
            fireEvent.keyDown(input, { key: "Enter" });
            expect(mockPush).toHaveBeenCalledWith("/searchedBooks?q=harry%20potter");
        });
    });
});
