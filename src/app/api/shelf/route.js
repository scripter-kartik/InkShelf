import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, isDbConfigured } from "@/lib/mongodb";
import ShelfItem from "@/models/ShelfItem";
async function requireUser() {
    if (!isDbConfigured()) {
        return {
            response: NextResponse.json({ error: "Database not configured." }, { status: 503 }),
        };
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return {
            response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }),
        };
    }
    return { session };
}
export async function GET(request) {
    const { response, session } = await requireUser();
    if (response)
        return response;
    const { searchParams } = new URL(request.url);
    const query = { userId: session.user.id };
    if (searchParams.get("favorite") === "true")
        query.favorite = true;
    const status = searchParams.get("status");
    if (status)
        query.status = status;
    const bookKey = searchParams.get("bookKey");
    if (bookKey)
        query.bookKey = bookKey;
    try {
        await connectToDatabase();
        const items = await ShelfItem.find(query).sort({ updatedAt: -1 }).lean();
        return NextResponse.json({ items });
    }
    catch (err) {
        console.error("Shelf GET failed:", err.message);
        return NextResponse.json({ error: "Failed to load shelf." }, { status: 500 });
    }
}
export async function POST(request) {
    const { response, session } = await requireUser();
    if (response)
        return response;
    let body;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const { bookKey, title } = body;
    if (!bookKey || !title) {
        return NextResponse.json({ error: "bookKey and title are required." }, { status: 400 });
    }
    const update = { title };
    if (body.coverId !== undefined)
        update.coverId = body.coverId;
    if (body.author !== undefined)
        update.author = body.author;
    if (body.status !== undefined)
        update.status = body.status;
    if (body.favorite !== undefined)
        update.favorite = body.favorite;
    if (body.progress !== undefined)
        update.progress = body.progress;
    if (body.rating !== undefined)
        update.rating = body.rating;
    if (body.notes !== undefined)
        update.notes = body.notes;
    try {
        await connectToDatabase();
        const item = await ShelfItem.findOneAndUpdate({ userId: session.user.id, bookKey }, { $set: update, $setOnInsert: { userId: session.user.id, bookKey } }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
        return NextResponse.json({ item });
    }
    catch (err) {
        console.error("Shelf POST failed:", err.message);
        return NextResponse.json({ error: "Failed to save book." }, { status: 500 });
    }
}
export async function DELETE(request) {
    const { response, session } = await requireUser();
    if (response)
        return response;
    const { searchParams } = new URL(request.url);
    const bookKey = searchParams.get("bookKey");
    if (!bookKey) {
        return NextResponse.json({ error: "bookKey is required." }, { status: 400 });
    }
    try {
        await connectToDatabase();
        await ShelfItem.deleteOne({ userId: session.user.id, bookKey });
        return NextResponse.json({ ok: true });
    }
    catch (err) {
        console.error("Shelf DELETE failed:", err.message);
        return NextResponse.json({ error: "Failed to remove book." }, { status: 500 });
    }
}
