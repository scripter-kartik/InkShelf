import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";
import MyBooks from "@/components/MyBooks";
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));
vi.mock("@/components/ToastProvider", () => ({
    useToast: vi.fn(),
}));
vi.mock("@/app/components/Navbar", () => ({
    default: () => <nav data-testid="navbar"/>,
}));
vi.mock("@/lib/openlibrary", () => ({
    coverUrl: (coverId) => (coverId ? `https://covers.example.com/${coverId}` : null),
}));
const mockFetch = vi.fn();
const mockToast = vi.fn();
const shelfItem = {
    bookKey: "OL45804W",
    title: "Dune",
    coverId: 111,
    author: "Frank Herbert",
    status: "reading",
    favorite: true,
    progress: 55,
};
describe("MyBooks — shelf mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        useToast.mockReturnValue({ toast: mockToast });
    });
    it("shows login prompt when unauthenticated", () => {
        useSession.mockReturnValue({ status: "unauthenticated" });
        render(<MyBooks mode="shelf"/>);
        expect(screen.getByText(/log in to see your saved books/i)).toBeInTheDocument();
    });
    it("shows loading skeleton while fetching", () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockReturnValue(new Promise(() => { }));
        render(<MyBooks mode="shelf"/>);
        // Loading state renders skeleton cards with animate-pulse, not a text node
        const skeletons = document.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
    });
    it("shows DB-missing message on 503 response", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({ status: 503, ok: false });
        render(<MyBooks mode="shelf"/>);
        await waitFor(() => {
            expect(screen.getByText(/connect a database/i)).toBeInTheDocument();
        });
    });
    it("shows empty state when shelf is empty", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ items: [] }) });
        render(<MyBooks mode="shelf"/>);
        await waitFor(() => {
            expect(screen.getByText(/your shelf is empty/i)).toBeInTheDocument();
        });
    });
    it("renders shelf items with title and author", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [shelfItem] }),
        });
        render(<MyBooks mode="shelf"/>);
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
            expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
        });
    });
    it("shows reading progress bar for 'reading' status items", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [shelfItem] }),
        });
        render(<MyBooks mode="shelf"/>);
        await waitFor(() => {
            expect(screen.getByText("55%")).toBeInTheDocument();
            expect(screen.getByText("Progress")).toBeInTheDocument();
        });
    });
    it("does not show progress bar for 'want' status items", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        const wantItem = { ...shelfItem, status: "want", progress: 0 };
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [wantItem] }),
        });
        render(<MyBooks mode="shelf"/>);
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
        });
        expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    });
    it("renders status tabs when in shelf mode", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [shelfItem] }),
        });
        render(<MyBooks mode="shelf"/>);
        await screen.findByText("Dune");
        expect(screen.getByText("All")).toBeInTheDocument();
        expect(screen.getByText("Want to Read")).toBeInTheDocument();
        expect(screen.getAllByText("Currently Reading").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Read")).toBeInTheDocument();
        expect(screen.getByText("Notes & Reviews")).toBeInTheDocument();
    });
    it("removes a book from the shelf optimistically", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch
            .mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [shelfItem] }),
        })
            .mockResolvedValueOnce({ ok: true });
        render(<MyBooks mode="shelf"/>);
        const removeBtn = await screen.findByRole("button", { name: /remove/i });
        fireEvent.click(removeBtn);
        await waitFor(() => {
            expect(screen.queryByText("Dune")).not.toBeInTheDocument();
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("bookKey=OL45804W"), expect.objectContaining({ method: "DELETE" }));
        expect(mockToast).toHaveBeenCalledWith("Removed from shelf", "success");
    });
});
describe("MyBooks — favorites mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        useToast.mockReturnValue({ toast: mockToast });
    });
    it("fetches favorites-only items", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [] }),
        });
        render(<MyBooks mode="favorites"/>);
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("favorite=true"));
        });
    });
    it("shows 'no favorites' empty state", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [] }),
        });
        render(<MyBooks mode="favorites"/>);
        await waitFor(() => {
            expect(screen.getByText(/haven't favorited any books/i)).toBeInTheDocument();
        });
    });
    it("does not show status tabs in favorites mode", async () => {
        useSession.mockReturnValue({ status: "authenticated" });
        mockFetch.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({ items: [{ ...shelfItem }] }),
        });
        render(<MyBooks mode="favorites"/>);
        await waitFor(() => {
            expect(screen.getByText("Dune")).toBeInTheDocument();
        });
        expect(screen.queryByRole("button", { name: /want to read/i })).not.toBeInTheDocument();
    });
});
