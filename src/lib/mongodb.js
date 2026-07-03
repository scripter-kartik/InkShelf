import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;
export function isDbConfigured() {
    return Boolean(MONGODB_URI);
}
let cached = global._mongoose;
if (!cached) {
    cached = global._mongoose = { conn: null, promise: null };
}
export async function connectToDatabase() {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not set. Add it to .env to enable database features.");
    }
    if (cached.conn)
        return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, { bufferCommands: false })
            .then((m) => m);
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (err) {
        cached.promise = null;
        throw err;
    }
    return cached.conn;
}
