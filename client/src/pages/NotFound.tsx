import { Scissors } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16] text-slate-100 p-4 font-sans">
      <div className="max-w-md w-full text-center bg-[#101623] border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-2xl font-mono">
          404
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Endpoint Not Found</h1>

        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
          The requested path does not exist or has been relocated within the Clearcut workspace.
        </p>

        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs font-mono uppercase tracking-wider transition shadow-lg shadow-sky-500/10"
        >
          <Scissors className="size-3.5 rotate-[-45deg]" />
          Return to Studio
        </button>
      </div>
    </div>
  );
}
