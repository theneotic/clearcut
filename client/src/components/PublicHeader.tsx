import { ArrowRight, Scissors } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <a href="/" className="group flex items-center gap-3" aria-label="Clearcut Home">
          <div className="grid size-9 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-sky-400 shadow-sm transition group-hover:border-sky-500/50">
            <Scissors className="size-4 rotate-[-45deg]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">
              Clearcut <span className="font-semibold text-sky-400">Studio</span>
            </span>
            <span className="hidden rounded-md border border-slate-700/80 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-400 sm:inline">
              Alpha Engine
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-wider text-slate-400 md:flex" aria-label="Primary navigation">
          <a className="transition hover:text-white" href="/#studio">Studio</a>
          <a className="transition hover:text-white" href="/#how-it-works">Method</a>
          <a className="transition hover:text-white" href="/about">About</a>
          <a className="transition hover:text-white" href="/contact">Contact</a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-mono text-[11px] text-slate-300 sm:flex">
            <span className="size-2 rounded-full bg-emerald-400"></span>
            <span>Online</span>
          </div>
          <a
            href="/#studio"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-slate-950 transition hover:bg-sky-400 shadow-md shadow-sky-500/10"
          >
            Launch Studio <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

