import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { identifier: string; token: string; expires: Date };
const rows = vi.hoisted(() => new Map<string, Row>());
vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
    verificationToken: {
      deleteMany: async ({ where }: { where: { identifier: string } }) => {
        for (const [k, v] of rows) if (v.identifier === where.identifier) rows.delete(k);
      },
      create: async ({ data }: { data: Row }) => { rows.set(data.token, data); return data; },
      findUnique: async ({ where }: { where: { token: string } }) => rows.get(where.token) ?? null,
      delete: async ({ where }: { where: { token: string } }) => { rows.delete(where.token); },
    },
  },
}));

import { consumeToken, issueToken } from "@/app/lib/tokens";

describe("one-time tokens", () => {
  beforeEach(() => rows.clear());

  it("stores only a hash and returns the user id once", async () => {
    const raw = await issueToken("reset-password", "user-1", 3600);
    expect(rows.has(raw)).toBe(false);
    expect(await consumeToken("reset-password", raw)).toBe("user-1");
    expect(await consumeToken("reset-password", raw)).toBeNull();
  });

  it("can't be used for a different purpose", async () => {
    const raw = await issueToken("verify-email", "user-1", 3600);
    expect(await consumeToken("reset-password", raw)).toBeNull();
  });

  it("revokes the previous token when a new one is issued", async () => {
    const first = await issueToken("reset-password", "user-1", 3600);
    const second = await issueToken("reset-password", "user-1", 3600);
    expect(await consumeToken("reset-password", first)).toBeNull();
    expect(await consumeToken("reset-password", second)).toBe("user-1");
  });

  it("rejects expired tokens", async () => {
    const raw = await issueToken("verify-email", "user-1", -1);
    expect(await consumeToken("verify-email", raw)).toBeNull();
  });
});
