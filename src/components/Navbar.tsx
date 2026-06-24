import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0A0F]/80 backdrop-blur-md border-b border-border-custom">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Left: Logo & Navigation Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md px-1 py-0.5">
            <span className="text-xl font-bold tracking-tight text-white font-display">
              PRO<span className="text-accent transition-colors duration-300">SETTINGS</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:shadow-[0_0_10px_#F59E0B] transition-all duration-300"></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/players" 
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-mono"
            >
              Players
            </Link>
            <Link 
              href="/#games" 
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-mono"
            >
              Games
            </Link>
            <Link 
              href="/sens-converter" 
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-mono"
            >
              Sens Convert
            </Link>
            <Link 
              href="/teams" 
              className="text-xs font-semibold tracking-wide uppercase text-zinc-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:text-accent font-mono"
            >
              Teams
            </Link>
          </nav>
        </div>

        {/* Right: Login & Sign Up */}
        <div className="flex items-center gap-5">
          <Link 
            href="/login" 
            className="text-xs font-bold text-white hover:text-accent transition-colors duration-200 font-mono uppercase tracking-wider"
          >
            Log in
          </Link>
          <Link 
            href="/register" 
            className="h-9 px-4 flex items-center justify-center rounded-lg bg-accent text-accent-fg hover:bg-accent/90 text-xs font-bold transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] uppercase tracking-wider font-mono"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
