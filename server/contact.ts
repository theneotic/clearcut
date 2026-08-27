import { z } from "zod";
import { notifyOwner } from "./_core/notification";

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(320, "Email is too long."),
  topic: z.enum(["general", "support", "privacy", "partnership"]),
  message: z.string().trim().min(10, "Add a little more detail so we can help.").max(2_000, "Message is too long."),
  website: z.string().max(0).optional(),
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export async function sendContactSubmission(input: ContactSubmission) {
  if (input.website) return { success: true, ignored: true } as const;
  const sent = await notifyOwner({
    title: `Clearcut contact: ${input.topic}`,
    content: `From: ${input.name}\nEmail: ${input.email}\nTopic: ${input.topic}\n\n${input.message}`,
  });
  if (!sent) throw new Error("Contact delivery is temporarily unavailable. Please try again shortly.");
  return { success: true, ignored: false } as const;
}
