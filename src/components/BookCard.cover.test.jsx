import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BookCard from "@/components/BookCard";
describe("BookCard — cover rendering", () => {
    it("renders an img element with correct src when a cover_id is provided", () => {
        render(<BookCard book={{
                key: "/works/OL1W",
                title: "Dune",
                cover_id: 12345,
                authors: [{ name: "Frank Herbert" }],
            }}/>);
        const img = screen.getByRole("img", { name: /cover of dune/i });
        expect(img).toBeInTheDocument();
        expect(img.src).toContain("12345");
    });
    it("renders an img element using cover_i (search shape)", () => {
        render(<BookCard book={{
                key: "/works/OL2W",
                title: "1984",
                cover_i: 99999,
                author_name: ["George Orwell"],
            }}/>);
        const img = screen.getByRole("img", { name: /cover of 1984/i });
        expect(img).toBeInTheDocument();
        expect(img.src).toContain("99999");
    });
    it("renders 'No Cover' div when both cover_id and cover_i are absent", () => {
        render(<BookCard book={{ key: "/works/OL3W", title: "Mystery Book" }}/>);
        expect(screen.getByText("No Cover")).toBeInTheDocument();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
    it("normalises a /works/ key when building the href", () => {
        render(<BookCard book={{ key: "/works/OL99W", title: "Test Book" }}/>);
        expect(screen.getByRole("link")).toHaveAttribute("href", "/books/OL99W");
    });
    it("renders a bare key (no /works/ prefix) correctly", () => {
        render(<BookCard book={{ key: "OL99W", title: "Test Book" }}/>);
        expect(screen.getByRole("link")).toHaveAttribute("href", "/books/OL99W");
    });
    it("prefers authors[0].name over author_name[0]", () => {
        render(<BookCard book={{
                key: "/works/OL5W",
                title: "Ambiguous Author",
                cover_id: null,
                authors: [{ name: "Canonical Author" }],
                author_name: ["Other Author"],
            }}/>);
        expect(screen.getByText("Canonical Author")).toBeInTheDocument();
        expect(screen.queryByText("Other Author")).not.toBeInTheDocument();
    });
});
