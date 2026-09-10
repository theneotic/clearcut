import { Scissors } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#090d16] text-slate-400">
      <div className="container py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr] items-start pb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-sky-400">
                <Scissors className="size-3.5 rotate-[-45deg]" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Clearcut <span className="font-semibold text-sky-400">Studio</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
              Autonomous, client-refined image background separation utility. Extract clean subjects and export lossless transparent PNGs directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:justify-self-end font-mono text-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Navigation</p>
              <ul className="mt-2.5 space-y-2">
                <li><a className="transition hover:text-sky-400" href="/#studio">Studio</a></li>
                <li><a className="transition hover:text-sky-400" href="/#how-it-works">Method</a></li>
                <li><a className="transition hover:text-sky-400" href="/about">About</a></li>
                <li><a className="transition hover:text-sky-400" href="/contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">Legal & Source</p>
              <ul className="mt-2.5 space-y-2">
                <li><a className="transition hover:text-sky-400" href="/privacy">Privacy Policy</a></li>
                <li><a className="transition hover:text-sky-400" href="/terms">Terms of Service</a></li>
                <li><a className="transition hover:text-sky-400" href="https://github.com/theneotic/clearcut" target="_blank" rel="noreferrer">GitHub Repository</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
          <p>© 2026 Clearcut. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400"></span>
            <span>Zero telemetry tracking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

