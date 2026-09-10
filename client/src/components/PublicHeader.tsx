import { ArrowDownRight } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="border-b border-[#17201f] bg-[#f4f1e8]">
      <div className="container flex h-[74px] items-center justify-between gap-5">
        <a href="/" className="flex items-center gap-3" aria-label="Clearcut home">
          <span className="grid size-8 place-items-center bg-[#e84d31] text-sm font-bold text-[#17201f]">C</span>
          <span className="text-lg font-bold tracking-[-0.06em]">clearcut</span>
          <span className="hidden font-mono text-[10px] tracking-[0.12em] text-[#63706b] sm:inline">/ IMAGE UTILITY</span>
        </a>
        <nav className="hidden items-center gap-6 font-mono text-[10px] uppercase tracking-[0.12em] lg:flex" aria-label="Primary navigation">
          <a className="hover:text-[#e84d31]" href="/#studio">Tool</a>
          <a className="hover:text-[#e84d31]" href="/#how-it-works">Method</a>
          <a className="hover:text-[#e84d31]" href="/about">About</a>
          <a className="hover:text-[#e84d31]" href="/contact">Contact</a>
        </nav>
        <a href="/#studio" className="group flex items-center gap-3 border-b border-[#17201f] pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition hover:border-[#e84d31] hover:text-[#e84d31]">Open tool <ArrowDownRight className="size-3 transition-transform group-hover:translate-y-0.5" /></a>
      </div>
    </header>
  );
}
