export function PublicFooter() {
  return (
    <footer className="border-t border-[#17201f] bg-[#e84d31] text-[#17201f]">
      <div className="container grid gap-7 border-x border-[#17201f] py-7 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-xl font-bold tracking-[-0.055em]">clearcut</p>
          <p className="mt-2 max-w-sm font-mono text-[9px] uppercase leading-5 tracking-[0.1em]">A direct utility for turning a selected subject into a clean, usable image asset.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[9px] uppercase tracking-[0.1em] sm:text-right">
          <a className="hover:underline" href="/about">About</a>
          <a className="hover:underline" href="/contact">Contact</a>
          <a className="hover:underline" href="/privacy">Privacy</a>
          <a className="hover:underline" href="/terms">Terms</a>
        </div>
        <div className="border-t border-[#17201f] pt-3 font-mono text-[9px] uppercase tracking-[0.1em] sm:col-span-2 sm:flex sm:justify-between">
          <p>© 2026 Clearcut. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Support / contact page</p>
        </div>
      </div>
    </footer>
  );
}
