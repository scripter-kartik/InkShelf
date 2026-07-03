import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    image: { type: String },
    password: { type: String, select: false },
    provider: { type: String, default: "credentials" },
}, { timestamps: true });
export default mongoose.models.User || mongoose.model("User", UserSchema);
