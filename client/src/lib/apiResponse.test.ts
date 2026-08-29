import { describe, expect, it } from "vitest";
import { parseApiResponse } from "./apiResponse";

describe("parseApiResponse", () => {
  it("parses a JSON API response", async () => {
    const response = new Response(JSON.stringify({ url: "data:image/png;base64,abc" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    await expect(parseApiResponse<{ url: string }>(response)).resolves.toEqual({
      url: "data:image/png;base64,abc",
    });
  });

  it("explains an HTML 404 fallback", async () => {
    const response = new Response("<!doctype html><html><body>Not found</body></html>", {
      status: 404,
      headers: { "content-type": "text/html" },
    });

    await expect(parseApiResponse(response)).rejects.toThrow(
      "The Clearcut API route was not found. Redeploy the project with the container deployment enabled.",
    );
  });

  it("rejects malformed non-HTML responses", async () => {
    const response = new Response("not-json", {
      status: 500,
      headers: { "content-type": "text/plain" },
    });

    await expect(parseApiResponse(response)).rejects.toThrow(
      "The Clearcut API returned an invalid response. Please try again.",
    );
  });
});
