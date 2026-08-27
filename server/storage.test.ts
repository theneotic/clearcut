import { afterEach, describe, expect, it, vi } from "vitest";

const forgeUrl = process.env.BUILT_IN_FORGE_API_URL;
const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

afterEach(() => {
  vi.resetModules();
  if (forgeUrl === undefined) delete process.env.BUILT_IN_FORGE_API_URL;
  else process.env.BUILT_IN_FORGE_API_URL = forgeUrl;
  if (forgeKey === undefined) delete process.env.BUILT_IN_FORGE_API_KEY;
  else process.env.BUILT_IN_FORGE_API_KEY = forgeKey;
});

describe("storagePut standalone fallback", () => {
  it("returns a data URL when managed Forge storage is not configured", async () => {
    delete process.env.BUILT_IN_FORGE_API_URL;
    delete process.env.BUILT_IN_FORGE_API_KEY;
    vi.resetModules();

    const { storagePut } = await import("./storage");
    const output = await storagePut("background-remover/result.png", Buffer.from("clearcut"), "image/png");

    expect(output.key).toMatch(/^background-remover\/result_[a-z0-9]{8}\.png$/);
    expect(output.url).toBe("data:image/png;base64,Y2xlYXJjdXQ=");
  });
});
