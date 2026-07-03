import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StarRating from "@/components/StarRating";
describe("StarRating", () => {
    it("renders 5 stars", () => {
        render(<StarRating rating={0} onChange={() => { }}/>);
        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(5);
    });
    it("highlights stars based on rating", () => {
        const { container } = render(<StarRating rating={3} onChange={() => { }}/>);
        const filledStars = container.querySelectorAll(".fill-amber-400");
        expect(filledStars).toHaveLength(3);
    });
    it("calls onChange with the correct value when clicked", () => {
        const handleChange = vi.fn();
        render(<StarRating rating={2} onChange={handleChange}/>);
        const buttons = screen.getAllByRole("button");
        fireEvent.click(buttons[3]);
        expect(handleChange).toHaveBeenCalledWith(4);
    });
});
