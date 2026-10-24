import mongoose from "mongoose";
const PasswordResetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.models.PasswordResetToken ||
    mongoose.model("PasswordResetToken", PasswordResetTokenSchema);
