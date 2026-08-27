import { describe, expect, it } from "vitest";
import { contactSubmissionSchema } from "./contact";

describe("contactSubmissionSchema", () => {
  const validSubmission = {
    name: "Ari Lee",
    email: "ari@example.com",
    topic: "support" as const,
    message: "I need help exporting a product image for a listing.",
  };

  it("accepts a complete contact request", () => {
    expect(contactSubmissionSchema.safeParse(validSubmission).success).toBe(true);
  });

  it("rejects a malformed contact address and short message", () => {
    expect(contactSubmissionSchema.safeParse({ ...validSubmission, email: "not-an-email", message: "Help" }).success).toBe(false);
  });
});
