import mongoose from "mongoose";
const ShelfItemSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    bookKey: { type: String, required: true },
    title: { type: String, required: true },
    coverId: { type: String, default: null },
    author: { type: String, default: "Unknown" },
    status: {
        type: String,
        enum: ["want", "reading", "read"],
        default: "want",
    },
    favorite: { type: Boolean, default: false },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    notes: { type: String, default: "" },
}, { timestamps: true });
ShelfItemSchema.index({ userId: 1, bookKey: 1 }, { unique: true });
export default mongoose.models.ShelfItem ||
    mongoose.model("ShelfItem", ShelfItemSchema);
