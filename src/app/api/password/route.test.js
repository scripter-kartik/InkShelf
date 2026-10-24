import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongodb", () => ({
  isDbConfigured: () => true,
  connectToDatabase: async () => {},
}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => true) }));
vi.mock("@/models/User", () => ({
  default: { findOne: vi.fn(), findByIdAndUpdate: vi.fn() },
}));
vi.mock("@/models/PasswordResetToken", () => ({
  default: { deleteMany: vi.fn(), create: vi.fn(), findOne: vi.fn() },
}));

const { sendEmail } = await import("@/lib/email");
const User = (await import("@/models/User")).default;
const Token = (await import("@/models/PasswordResetToken")).default;
const { POST: forgot } = await import("./forgot/route.js");
const { POST: reset } = await import("./reset/route.js");

let ip = 0;
const req = (url, body) =>
  new Request(`http://test${url}`, {
    method: "POST",
    headers: { "x-forwarded-for": `192.0.2.${++ip}` },
    body: JSON.stringify(body),
  });

describe("password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__inkshelfStore?.clear();
  });

  it("gives the same answer whether or not the account exists", async () => {
    User.findOne.mockReturnValue({ select: async () => null });
    const unknown = await (await forgot(req("/api/password/forgot", { email: "nobody@example.com" }))).json();

    User.findOne.mockReturnValue({ select: async () => ({ _id: "u1", name: "Kim", password: "hash" }) });
    const known = await (await forgot(req("/api/password/forgot", { email: "kim@example.com" }))).json();

    expect(known).toEqual(unknown);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const stored = Token.create.mock.calls[0][0];
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sendEmail.mock.calls[0][0].text).not.toContain(stored.tokenHash);
  });

  it("does not send reset emails to Google-only accounts", async () => {
    User.findOne.mockReturnValue({ select: async () => ({ _id: "u2", name: "G", password: undefined }) });
    await forgot(req("/api/password/forgot", { email: "g@example.com" }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects malformed or expired tokens", async () => {
    expect((await reset(req("/api/password/reset", { token: "short", password: "longenough" }))).status).toBe(400);
    Token.findOne.mockResolvedValue(null);
    const res = await reset(req("/api/password/reset", { token: "a".repeat(64), password: "longenough" }));
    expect(res.status).toBe(400);
  });

  it("updates the password and consumes the token", async () => {
    Token.findOne.mockResolvedValue({ userId: "u1" });
    User.findByIdAndUpdate.mockResolvedValue({ email: "kim@example.com" });
    const res = await reset(req("/api/password/reset", { token: "b".repeat(64), password: "new-password" }));
    expect(res.status).toBe(200);
    const [, update] = User.findByIdAndUpdate.mock.calls[0];
    expect(update.password).toMatch(/^\$2[aby]\$/);
    expect(Token.deleteMany).toHaveBeenCalledWith({ userId: "u1" });
  });

  it("enforces a minimum password length", async () => {
    const res = await reset(req("/api/password/reset", { token: "c".repeat(64), password: "short" }));
    expect(res.status).toBe(400);
  });
});
