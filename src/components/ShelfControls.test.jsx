import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";
import ShelfControls from "@/components/ShelfControls";
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));
vi.mock("@/components/ToastProvider", () => ({
    useToast: vi.fn(),
}));
const mockFetch = vi.fn();
const mockBook = {
    id: "OL45804W",
    title: "Dune",
    coverId: 12345,
    author: "Frank Herbert",
};
describe("ShelfControls", () => {
    const mockToast = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        useToast.mockReturnValue({ toast: mockToast });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("renders a login prompt when unauthenticated", () => {
        useSession.mockReturnValue({ status: "unauthenticated", data: null });
        render(<ShelfControls book={mockBook}/>);
        expect(screen.getByText(/log in to add this book/i)).toBeInTheDocument();
    });
    it("does not render interactive controls when unauthenticated", () => {
        useSession.mockReturnValue({ status: "unauthenticated", data: null });
        render(<ShelfControls book={mockBook}/>);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
    it("renders favorite and status controls when authenticated", async () => {
        useSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user1" } },
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [] }),
        });
        render(<ShelfControls book={mockBook}/>);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /favorite/i })).toBeInTheDocument();
            expect(screen.getByRole("combobox")).toBeInTheDocument();
        });
    });
    it("loads existing shelf state on mount", async () => {
        useSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user1" } },
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    { bookKey: "OL45804W", favorite: true, status: "reading", progress: 42 },
                ],
            }),
        });
        render(<ShelfControls book={mockBook}/>);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /favorited/i })).toBeInTheDocument();
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("bookKey=OL45804W"));
    });
    it("shows progress slider when status is 'reading'", async () => {
        useSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user1" } },
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [{ bookKey: "OL45804W", favorite: false, status: "reading", progress: 30 }],
            }),
        });
        render(<ShelfControls book={mockBook}/>);
        await waitFor(() => {
            expect(screen.getByLabelText(/reading progress/i)).toBeInTheDocument();
        });
    });
    it("does not show progress slider when status is not 'reading'", async () => {
        useSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user1" } },
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [{ bookKey: "OL45804W", favorite: false, status: "want", progress: 0 }],
            }),
        });
        render(<ShelfControls book={mockBook}/>);
        await waitFor(() => {
            expect(screen.getByRole("combobox")).toHaveValue("want");
        });
        expect(screen.queryByLabelText(/reading progress/i)).not.toBeInTheDocument();
    });
    it("shows rating and notes input when book is added to shelf", async () => {
        useSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user1" } },
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [{ bookKey: "OL45804W", favorite: false, status: "want", rating: 4, notes: "Excellent book!" }],
            }),
        });
        render(<ShelfControls book={mockBook}/>);
        await waitFor(() => {
            expect(screen.getByLabelText(/personal notes/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/personal notes/i)).toHaveValue("Excellent book!");
        });
    });
    it("toggles favorite and calls the API", async () => {
        useSession.mockReturnValue({
            status: "authenticated",
            data: { user: { id: "user1" } },
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [] }),
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ item: {} }),
        });
        render(<ShelfControls book={mockBook}/>);
        const favoriteBtn = await screen.findByRole("button", { name: /favorite/i });
        fireEvent.click(favoriteBtn);
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith("/api/shelf", expect.objectContaining({ method: "POST" }));
        });
        expect(mockToast).toHaveBeenCalledWith("Added to favorites", "success");
    });
});
