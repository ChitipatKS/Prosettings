import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0F]/90 border-t border-t-zinc-800/40 relative overflow-hidden">
      {/* Subtle ambient glow inside footer */}
      <div className="absolute top-0 right-[15%] w-[350px] h-[350px] rounded-full bg-accent opacity-[0.015] blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
              <span className="text-xl font-bold tracking-tight text-white font-display">
                PRO<span className="text-accent transition-colors duration-300">SETTINGS</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:shadow-[0_0_10px_#F59E0B] transition-all duration-300"></span>
            </Link>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-sm">
              Discover and optimize your gaming setups, mouse settings, crosshairs, and specifications used by professional esports athletes and popular creators worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/players"
                  className="text-xs text-zinc-400 hover:text-white hover:underline transition-colors duration-150 font-mono"
                >
                  Pro Players
                </Link>
              </li>
              <li>
                <Link
                  href="/teams"
                  className="text-xs text-zinc-400 hover:text-white hover:underline transition-colors duration-150 font-mono"
                >
                  Esports Teams
                </Link>
              </li>
              <li>
                <Link
                  href="/sens-converter"
                  className="text-xs text-zinc-400 hover:text-white hover:underline transition-colors duration-150 font-mono"
                >
                  Sens Converter
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-xs text-zinc-400 hover:text-white hover:underline transition-colors duration-150 font-mono"
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Games Category */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Games Category
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/?game=valorant"
                  className="text-xs text-zinc-400 hover:text-white transition-colors duration-150 font-mono flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  VALORANT
                </Link>
              </li>
              <li>
                <Link
                  href="/?game=cs2"
                  className="text-xs text-zinc-400 hover:text-white transition-colors duration-150 font-mono flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Counter-Strike 2
                </Link>
              </li>
              <li className="text-xs text-zinc-500 font-mono flex items-center gap-2 cursor-default select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
                Apex Legends (TBD)
              </li>
              <li className="text-xs text-zinc-500 font-mono flex items-center gap-2 cursor-default select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
                Rainbow Six (TBD)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and social */}
        <div className="mt-12 pt-8 border-t border-t-zinc-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-500 font-mono">
            &copy; {new Date().getFullYear()} PROSETTINGS. All rights reserved. Not affiliated with Riot Games, Valve, or any game developer.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-zinc-400 hover:text-accent font-mono uppercase tracking-wider transition-colors duration-150 flex items-center gap-1"
            >
              <span>Discord</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
