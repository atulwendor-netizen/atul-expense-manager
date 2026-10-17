import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Cpu,
  Layers,
  Terminal,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';

interface NexaNavbarProps {
  onLaunchPlatform: () => void;
  onOpenBookDemo?: () => void;
}

export const NexaNavbar: React.FC<NexaNavbarProps> = ({
  onLaunchPlatform,
  onOpenBookDemo,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsScrolled(scrollPos > 40);

      // Simple active section detection
      const sections = ['features', 'story', 'showcase', 'video', 'benefits', 'playground', 'pricing'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
      if (scrollPos < 200) {
        setActiveSection('hero');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Architecture', href: '#features', id: 'features', icon: Cpu },
    { name: 'Agent Story', href: '#story', id: 'story', icon: Layers },
    { name: 'Showcase', href: '#showcase', id: 'showcase', icon: Activity },
    { name: 'Cinematic Engine', href: '#video', id: 'video', icon: Zap },
    { name: 'Use Cases', href: '#benefits', id: 'benefits', icon: Shield },
    { name: 'Neural Lab', href: '#playground', id: 'playground', icon: Terminal },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#05070f]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3'
            : 'bg-transparent border-b border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
                <div className="absolute inset-0 rounded-xl bg-white/20 blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                  NEXA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">AI</span>
                </span>
                <span className="text-[10px] tracking-widest font-mono uppercase text-slate-400 font-semibold">
                  Autonomous Core
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-full px-4 py-1.5 backdrop-blur-md shadow-inner">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-blue-600/30 to-violet-600/30 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
            </nav>

            {/* Right Action CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenBookDemo}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Book Demo
              </button>

              <button
                type="button"
                onClick={onLaunchPlatform}
                className="relative group overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 active:scale-95"
              >
                <div className="flex items-center gap-2 rounded-full bg-[#05070f] px-4 py-2 transition-all duration-300 group-hover:bg-opacity-0">
                  <span className="text-xs font-bold text-white tracking-wide">
                    Launch Platform
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </button>
            </div>

            {/* Mobile Menu Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={onLaunchPlatform}
                className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                Launch
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-[#05070f]/95 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-8 border-b border-white/10 animate-in fade-in duration-200">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-2">
              Navigation Menu
            </span>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                  <Icon className="h-5 w-5 text-blue-400" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenBookDemo) onOpenBookDemo();
              }}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white text-center hover:bg-white/10 transition-colors"
            >
              Book Live Architecture Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchPlatform();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-sm font-bold text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
            >
              <span>Launch Enterprise App</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
