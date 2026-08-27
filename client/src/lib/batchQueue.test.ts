import { describe, expect, it } from "vitest";
import { toggleAllBatchQueueItems, toggleBatchQueueItem } from "./batchQueue";

describe("batch queue helpers", () => {
  it("adds and removes a single history entry without mutating the previous queue", () => {
    const initial = new Set(["one"]);
    expect([...toggleBatchQueueItem(initial, "two")]).toEqual(["one", "two"]);
    expect([...toggleBatchQueueItem(initial, "one")]).toEqual([]);
    expect([...initial]).toEqual(["one"]);
  });

  it("selects every entry and clears the queue on the next action", () => {
    expect([...toggleAllBatchQueueItems(new Set(), ["one", "two"])]).toEqual(["one", "two"]);
    expect([...toggleAllBatchQueueItems(new Set(["one", "two"]), ["one", "two"])]).toEqual([]);
  });
});
