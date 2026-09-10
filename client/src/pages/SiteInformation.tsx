import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";

type InformationPage = "about" | "privacy" | "terms" | "contact";

const informationCopy = {
  about: {
    label: "About Clearcut",
    title: "A deterministic tool for clean image separation.",
    intro: "Clearcut is an engineering-grade web utility designed to isolate subjects from image backgrounds and produce export-ready assets. The pipeline provides transparent feedback at every step: upload an image, inspect the alpha channel, apply fine-tuning adjustments, and export in your required format.",
    sections: [
      ["What it is", "A client-refined image background-removal workflow featuring zoom/pan framing, dynamic drop shadows, background mattes, custom export dimensions, multi-format encoding, and local session history."],
      ["What it is not", "Clearcut is not a social network, generative hallucination gallery, or an opaque black-box service. Edge quality is determined by contrast, lighting, and subject boundaries in the uploaded photo."],
      ["How to use it", "Upload any JPG, PNG, or WebP photo, review the segmented cutout on the dark transparency grid, fine-tune framing or shadows if desired, then download the lossless PNG or batch ZIP archive."],
    ],
  },
  privacy: {
    label: "Privacy Policy",
    title: "Plain language about your data and images.",
    intro: "This notice explains how Clearcut processes images and handles browser data. We believe privacy should be simple, transparent, and verifiable.",
    sections: [
      ["Image processing", "Uploaded images are streamed to an isolated temporary worker solely for background removal and export operations. Temporary files are pruned automatically after processing. Downloads are served via secure temporary tokens."],
      ["Local history", "Your recent cutouts and export names are stored exclusively within your browser's local storage (`localStorage`). No session history or personal browsing records are sent to external analytics."],
      ["Zero telemetry", "Clearcut operates without third-party tracking beacons, cross-site profiling cookies, or invasive tracking scripts. We do not sell, license, or monetize any user content."],
      ["Contact inquiries", "When sending a message via our contact form, your name, email, topic, and message content are transmitted securely to the project owner to answer your inquiry."],
    ],
  },
  terms: {
    label: "Terms of Service",
    title: "Fair terms for responsible tool usage.",
    intro: "These terms govern the use of the Clearcut website. By uploading images or using our export features, you agree to these standard operating conditions.",
    sections: [
      ["Content ownership", "You retain full ownership and copyrights to any images you upload. You are responsible for having lawful rights to process and export the content you submit."],
      ["Acceptable use", "You agree not to use Clearcut for unlawful, infringing, abusive, or malicious purposes, nor to attempt to reverse-engineer or overwhelm the processing infrastructure."],
      ["Service availability", "Background separation and export utilities are automated. While we aim for high uptime and precision, the tool is provided on an as-is basis without warranties of uninterrupted availability."],
      ["Support & contact", "For questions regarding these terms or feature requests, submit a note through our contact page."],
    ],
  },
} as const;

function InformationLayout({ page }: { page: Exclude<InformationPage, "contact"> }) {
  const content = informationCopy[page];
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      <PublicHeader />
      <main className="container border-x border-slate-800/80 py-12 sm:py-16">
        <section className="border-b border-slate-800 pb-10">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sky-400">
            <span>{content.label}</span>
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold text-white tracking-tight">
            {content.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-400">
            {content.intro}
          </p>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.sections.map(([heading, body], index) => (
            <article key={heading} className="rounded-xl border border-slate-800 bg-[#101623] p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Section 0{index + 1}
                </span>
                <h2 className="mt-4 text-xl font-bold text-white tracking-tight">
                  {heading}
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

export function AboutPage() { return <InformationLayout page="about" />; }
export function PrivacyPage() { return <InformationLayout page="privacy" />; }
export function TermsPage() { return <InformationLayout page="terms" />; }

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<"general" | "support" | "privacy" | "partnership">("general");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [notice, setNotice] = useState("");

  const contact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setNotice("Message delivered successfully. We will review and respond shortly.");
      setMessage("");
    },
    onError: error => setNotice(error.message || "Message delivery is temporarily unavailable. Please try again later."),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    contact.mutate({ name, email, topic, message, website });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      <PublicHeader />
      <main className="container border-x border-slate-800/80 py-12 sm:py-16">
        <section className="border-b border-slate-800 pb-10">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-sky-400">
            <span>Contact Studio</span>
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Send a direct note.
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400">
            Have a question, feedback on cutout accuracy, or a partnership inquiry? Reach out directly using the form below.
          </p>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.4fr_0.6fr]">
          <aside className="rounded-xl border border-slate-800 bg-[#101623] p-6 space-y-4">
            <span className="font-mono text-xs uppercase tracking-wider text-sky-400 block">
              Inquiry Guidelines
            </span>
            <p className="text-xs leading-relaxed text-slate-400">
              For technical inquiries regarding a specific cutout, mention the input file type, image dimensions, and desired export preset.
            </p>
            <div className="border-t border-slate-800 pt-4 space-y-2 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400" />
                <span>Encrypted transmission</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-emerald-400" />
                <span>Zero spam policy</span>
              </div>
            </div>
          </aside>

          <div className="rounded-xl border border-slate-800 bg-[#101623] p-6 sm:p-8">
            <form onSubmit={submit} className="space-y-5">
              <input
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={event => setWebsite(event.target.value)}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-400 transition"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-300 mb-2">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={event => setTopic(event.target.value as typeof topic)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400 transition"
                >
                  <option value="general">General Inquiries</option>
                  <option value="support">Technical Support</option>
                  <option value="privacy">Privacy & Data Handling</option>
                  <option value="partnership">Partnership & API Access</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  minLength={10}
                  rows={5}
                  placeholder="How can we assist you?"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-400 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={contact.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 disabled:opacity-60 shadow-md shadow-sky-500/10"
                >
                  {contact.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </button>

                {notice && (
                  <p className={`text-xs font-mono ${contact.isError ? "text-rose-400" : "text-emerald-400"}`} role="status">
                    {notice}
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
