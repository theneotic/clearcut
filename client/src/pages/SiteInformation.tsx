import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";

type InformationPage = "about" | "privacy" | "terms" | "contact";

const informationCopy = {
  about: {
    label: "About / Clearcut",
    title: "A practical desk for clean image separation.",
    intro: "Clearcut is a focused web utility for turning a selected subject into an export-ready image. It keeps the process visible: bring an image in, inspect the cutout, make a few production adjustments, and save the format you need.",
    sections: [
      ["What it is", "A browser-based image background-removal workflow with crop framing, shadow, solid backgrounds, size presets, multiple export formats, and a local download history."],
      ["What it is not", "Clearcut does not position itself as a social platform, a content library, or a promise of perfect results for every image. Edge quality depends on the uploaded image, including contrast, lighting, hair, and overlapping subjects."],
      ["How to use it", "Start at the tool, upload a JPG, PNG, or WebP image, review the cutout, adjust the export settings, then download a file or add saved results to a local batch ZIP."],
    ],
  },
  privacy: {
    label: "Privacy / Clearcut",
    title: "Plain language about your images and browser data.",
    intro: "This notice explains the information the Clearcut workflow uses, why it is used, and the choices available to visitors. It is written for the current version of this website and should be reviewed before production use in a jurisdiction with specific legal requirements.",
    sections: [
      ["Image processing", "An uploaded image is sent to the application server for background removal and optional export adjustments. The server uses a temporary working area during processing. Finished exports are stored by the application’s configured file-storage service so the website can provide a download link."],
      ["Local history", "Recent cutout labels and download references are retained in your browser’s local storage. This lets the history panel re-display your recent work on that device. You can clear browser storage through your browser settings."],
      ["Technical information", "The website may receive standard technical request information and platform analytics data used to operate, secure, and understand the service. Do not upload confidential, regulated, or sensitive images unless you have assessed the relevant storage and processing requirements."],
      ["Contact messages", "When you send the contact form, your name, email address, selected topic, and message are sent to the project owner through the configured notification service so they can respond."],
    ],
  },
  terms: {
    label: "Terms / Clearcut",
    title: "Use the tool with rights, care, and realistic expectations.",
    intro: "These terms govern use of the current Clearcut website. By uploading an image or using an export feature, you agree to use the service lawfully and in line with the rights attached to the content you submit.",
    sections: [
      ["Your content", "You are responsible for ensuring that you have permission to upload, process, modify, and export every image you use. Do not use the tool for unlawful, infringing, abusive, or privacy-violating activity."],
      ["Service limits", "Background removal and other adjustments are automated processes. Results can vary, and the service is provided without a guarantee that every cutout or export will meet a particular professional, commercial, or technical standard."],
      ["Availability", "The tool, storage links, formats, presets, and batch features may change, be limited, or be unavailable from time to time. Keep copies of any files that matter to you; download links and browser history are not a permanent archive."],
      ["Questions", "For questions about these terms or the site, use the contact page. For privacy-specific questions, select the Privacy topic in the contact form."],
    ],
  },
} as const;

function InformationLayout({ page }: { page: Exclude<InformationPage, "contact"> }) {
  const content = informationCopy[page];
  return <div className="min-h-screen bg-[#f4f1e8] text-[#17201f]"><PublicHeader /><main className="container border-x border-[#17201f]"><section className="grid gap-8 border-b border-[#17201f] px-1 py-12 sm:px-7 sm:py-20 lg:grid-cols-[0.65fr_1.35fr]"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#e84d31]">{content.label}</p><h1 className="mt-6 text-4xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">{content.title}</h1></div><p className="max-w-2xl self-end text-lg leading-8 text-[#43504c]">{content.intro}</p></section><section className="grid border-l border-[#17201f] sm:grid-cols-2">{content.sections.map(([heading, body], index) => <article key={heading} className="border-b border-r border-[#17201f] px-5 py-7 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#e84d31]">0{index + 1}</p><h2 className="mt-10 text-2xl font-semibold tracking-[-0.055em]">{heading}</h2><p className="mt-4 max-w-prose text-sm leading-7 text-[#43504c]">{body}</p></article>)}</section></main><PublicFooter /></div>;
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
    onSuccess: () => { setNotice("Message sent. The project owner has been notified."); setMessage(""); },
    onError: error => setNotice(error.message || "Message delivery is temporarily unavailable."),
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    contact.mutate({ name, email, topic, message, website });
  };
  return <div className="min-h-screen bg-[#f4f1e8] text-[#17201f]"><PublicHeader /><main className="container border-x border-[#17201f]"><section className="grid gap-8 border-b border-[#17201f] px-1 py-12 sm:px-7 sm:py-20 lg:grid-cols-[0.65fr_1.35fr]"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#e84d31]">Contact / Clearcut</p><h1 className="mt-6 text-4xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">Send a clear note.</h1></div><p className="max-w-xl self-end text-lg leading-8 text-[#43504c]">Use this form for product questions, technical support, privacy requests, or a relevant partnership inquiry. Your message goes to the project owner through the configured support channel.</p></section><section className="grid lg:grid-cols-[0.58fr_1.42fr]"><aside className="border-b border-[#17201f] px-5 py-8 lg:border-b-0 lg:border-r sm:px-7"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#e84d31]">What to include</p><p className="mt-5 text-sm leading-7 text-[#43504c]">For an export issue, mention the input format, selected export settings, and what happened. Do not include passwords, API keys, payment details, or confidential image content in a message.</p></aside><form onSubmit={submit} className="space-y-5 px-5 py-8 sm:p-10"><input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={event => setWebsite(event.target.value)} /><div className="grid gap-5 sm:grid-cols-2"><label className="block font-mono text-[10px] uppercase tracking-[0.1em]">Name<input required value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full border-b border-[#17201f] bg-transparent px-0 py-3 text-base outline-none focus:border-[#e84d31]" /></label><label className="block font-mono text-[10px] uppercase tracking-[0.1em]">Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full border-b border-[#17201f] bg-transparent px-0 py-3 text-base outline-none focus:border-[#e84d31]" /></label></div><label className="block font-mono text-[10px] uppercase tracking-[0.1em]">Topic<select value={topic} onChange={event => setTopic(event.target.value as typeof topic)} className="mt-2 w-full border-b border-[#17201f] bg-transparent px-0 py-3 text-base outline-none focus:border-[#e84d31]"><option value="general">General</option><option value="support">Support</option><option value="privacy">Privacy</option><option value="partnership">Partnership</option></select></label><label className="block font-mono text-[10px] uppercase tracking-[0.1em]">Message<textarea required value={message} onChange={event => setMessage(event.target.value)} minLength={10} rows={6} className="mt-2 w-full resize-y border border-[#17201f] bg-transparent p-3 text-base outline-none focus:border-[#e84d31]" /></label><div className="flex flex-wrap items-center gap-4"><button disabled={contact.isPending} className="inline-flex items-center gap-3 bg-[#17201f] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.11em] text-[#f4f1e8] transition hover:bg-[#e84d31] disabled:opacity-60">{contact.isPending ? <><Loader2 className="size-3 animate-spin" /> Sending</> : <>Send message <ArrowRight className="size-3" /></>}</button>{notice && <p className={`text-sm ${contact.isError ? "text-[#b33f29]" : "text-[#43504c]"}`} role="status">{notice}</p>}</div></form></section></main><PublicFooter /></div>;
}
