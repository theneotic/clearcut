import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { createBatchArchive } from "./batchArchive";

describe("createBatchArchive", () => {
  it("creates a readable ZIP containing every selected history download", async () => {
    const archiveBlob = await createBatchArchive([
      { name: "portrait.png", blob: new Blob(["portrait"], { type: "image/png" }) },
      { name: "product.webp", blob: new Blob(["product"], { type: "image/webp" }) },
    ]);
    const archive = await JSZip.loadAsync(await archiveBlob.arrayBuffer());

    expect(Object.keys(archive.files).sort()).toEqual(["portrait.png", "product.webp"]);
    await expect(archive.file("portrait.png")?.async("string")).resolves.toBe("portrait");
  });
});
