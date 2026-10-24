import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/mongodb", () => ({
  isDbConfigured: vi.fn(() => true),
  connectToDatabase: vi.fn(async () => {}),
}));
vi.mock("@/models/ShelfItem", () => ({
  default: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

const { getServerSession } = await import("next-auth");
const { isDbConfigured } = await import("@/lib/mongodb");
const ShelfItem = (await import("@/models/ShelfItem")).default;
const { GET, POST, DELETE } = await import("./route.js");

const post = (body) =>
  POST(new Request("http://test/api/shelf", { method: "POST", body: JSON.stringify(body) }));

describe("/api/shelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDbConfigured.mockReturnValue(true);
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    ShelfItem.findOneAndUpdate.mockReturnValue({ lean: async () => ({ bookKey: "B1" }) });
  });

  it("returns 503 when no database is configured", async () => {
    isDbConfigured.mockReturnValue(false);
    const res = await GET(new Request("http://test/api/shelf"));
    expect(res.status).toBe(503);
  });

  it("returns 401 when not logged in", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await post({ bookKey: "B1", title: "Book" });
    expect(res.status).toBe(401);
  });

  it("requires bookKey and title", async () => {
    const res = await post({ bookKey: "B1" });
    expect(res.status).toBe(400);
  });

  it("upserts with schema validation enabled", async () => {
    const res = await post({ bookKey: "B1", title: "Book", status: "reading", progress: 40 });
    expect(res.status).toBe(200);
    const [filter, update, options] = ShelfItem.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ userId: "user-1", bookKey: "B1" });
    expect(update.$set).toMatchObject({ title: "Book", status: "reading", progress: 40 });
    expect(update.$unset).toBeUndefined();
    expect(options).toMatchObject({ upsert: true, runValidators: true });
  });

  it("clears the reading status when status is null, instead of keeping the old one", async () => {
    await post({ bookKey: "B1", title: "Book", status: null, favorite: true });
    const [, update] = ShelfItem.findOneAndUpdate.mock.calls[0];
    expect(update.$unset).toEqual({ status: "" });
    expect(update.$set.status).toBeUndefined();
    expect(update.$set.favorite).toBe(true);
  });

  it("maps validation errors to 400", async () => {
    ShelfItem.findOneAndUpdate.mockReturnValue({
      lean: async () => {
        throw Object.assign(new Error("bad"), { name: "ValidationError" });
      },
    });
    const res = await post({ bookKey: "B1", title: "Book", status: "banana" });
    expect(res.status).toBe(400);
  });

  it("only lets users read and delete their own items", async () => {
    ShelfItem.find.mockReturnValue({ sort: () => ({ lean: async () => [] }) });
    await GET(new Request("http://test/api/shelf?favorite=true"));
    expect(ShelfItem.find).toHaveBeenCalledWith({ userId: "user-1", favorite: true });

    ShelfItem.deleteOne.mockResolvedValue({});
    const res = await DELETE(new Request("http://test/api/shelf?bookKey=B1", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(ShelfItem.deleteOne).toHaveBeenCalledWith({ userId: "user-1", bookKey: "B1" });
  });
});
