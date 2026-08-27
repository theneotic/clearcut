import { describe, expect, it } from "vitest";
import { appendHistoryItem, renameHistoryItem, type ProcessingHistoryItem } from "./processingHistory";

function item(id: string): ProcessingHistoryItem {
  return { id, url: `/manus-storage/${id}.png`, downloadName: `${id}.png`, label: id, createdAt: 1 };
}

describe("appendHistoryItem", () => {
  it("places the latest processed output first", () => {
    expect(appendHistoryItem([item("older")], item("newer"))).toEqual([item("newer"), item("older")]);
  });

  it("keeps processing history compact and removes duplicate URLs", () => {
    const entries = [item("one"), item("two"), item("three"), item("four"), item("five"), item("six")];
    const updated = appendHistoryItem(entries, { ...item("two"), createdAt: 2 });
    expect(updated).toHaveLength(6);
    expect(updated[0]).toEqual({ ...item("two"), createdAt: 2 });
    expect(updated.filter(entry => entry.url === item("two").url)).toHaveLength(1);
  });
});

describe("renameHistoryItem", () => {
  it("persists a concise user-facing label without changing the download reference", () => {
    expect(renameHistoryItem([item("portrait")], "portrait", "  Campaign portrait  ")).toEqual([
      { ...item("portrait"), label: "Campaign portrait" },
    ]);
  });
});
