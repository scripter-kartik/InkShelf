import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BookCard from "@/components/BookCard";
describe("BookCard", () => {
    it("renders title and author from the subjects shape", () => {
        render(<BookCard book={{
                key: "/works/OL1W",
                title: "Dune",
                cover_id: 111,
                authors: [{ name: "Frank Herbert" }],
            }}/>);
        expect(screen.getByText("Dune")).toBeInTheDocument();
        expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    });
    it("supports the search shape (cover_i / author_name)", () => {
        render(<BookCard book={{
                key: "/works/OL2W",
                title: "1984",
                cover_i: 222,
                author_name: ["George Orwell"],
            }}/>);
        expect(screen.getByText("1984")).toBeInTheDocument();
        expect(screen.getByText("George Orwell")).toBeInTheDocument();
    });
    it("links to the internal detail page", () => {
        render(<BookCard book={{ key: "/works/OL3W", title: "Book" }}/>);
        expect(screen.getByRole("link")).toHaveAttribute("href", "/books/OL3W");
    });
    it("shows a fallback when there is no cover", () => {
        render(<BookCard book={{ key: "/works/OL4W", title: "No Cover Book" }}/>);
        expect(screen.getByText("No Cover")).toBeInTheDocument();
    });
    it("falls back to Unknown author", () => {
        render(<BookCard book={{ key: "/works/OL5W", title: "Anon" }}/>);
        expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
});
