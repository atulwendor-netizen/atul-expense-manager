import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { ThreeGlowingOrb } from './ThreeGlowingOrb';

export interface HeroSectionProps {
  onStartTrial?: () => void;
  onExploreArchitecture?: () => void;
  onLaunchPlatform?: () => void;
  onOpenBookDemo?: () => void;
  onExploreDocs?: () => void;
  reducedMotion?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartTrial,
  onExploreArchitecture,
  onLaunchPlatform,
  onOpenBookDemo,
  onExploreDocs,
  reducedMotion = false,
}) => {
  const partners = [
    { name: 'SYNTHETIX', tag: 'Core Neural Protocol' },
    { name: 'HYPERION LABS', tag: 'Autonomous Cluster' },
    { name: 'DEEPSCALE', tag: 'Sub-millisecond Engine' },
    { name: 'VECTOR AI', tag: 'Stateful Memory' },
    { name: 'NEURALMESH', tag: 'Multi-Agent Mesh' },
    { name: 'CEREBRO CORP', tag: 'Enterprise Enclave' },
  ];

  return (
    <section className="relative min-h-screen pt-28 pb-16 lg:pt-36 lg:pb-24 flex flex-col justify-between overflow-hidden bg-cyber-grid bg-radial-hero">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-violet-600/20 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 left-10 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-blue-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-float-slow">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-medium text-cyan-300">
                NEXA 4.0 Autonomous Engine Released
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                NEW
              </span>
            </div>

            {/* Oversized Cinematic Heading */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-sans">
              Autonomous{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
                Intelligence
              </span>{' '}
              for Exponential Teams.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-normal">
              Orchestrate decentralized multi-agent swarms with sub-millisecond reasoning loops, zero token degradation, and cryptographic guardrails. Engineered for mission-critical software engineering.
            </p>

            {/* Metric Pills Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-300 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>&lt; 12ms P99 Latency</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-300 backdrop-blur-sm">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                <span>4.2M Tokens/sec</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-300 backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>SOC2 Type II Certified</span>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={onStartTrial || onOpenBookDemo}
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:shadow-[0_0_45px_rgba(99,102,241,0.7)] hover:scale-[1.02] active:scale-98 transition-all duration-300"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onExploreArchitecture || onExploreDocs}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/[0.08] hover:border-white/30 backdrop-blur-lg transition-all"
              >
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Explore Architecture</span>
              </button>

              <button
                type="button"
                onClick={onLaunchPlatform}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-4 text-sm font-semibold text-blue-300 hover:text-white hover:bg-blue-500/20 transition-all sm:hidden"
              >
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>Launch Workspace</span>
              </button>
            </div>

            {/* Micro Guarantees */}
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Instant API token
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Deploy in 60s
              </span>
            </div>
          </div>

          {/* Right Column: 3D Core with Interactive Floating Glass Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* 3D Orb Component */}
            <div className="relative w-full aspect-square max-w-[500px]">
              <ThreeGlowingOrb reducedMotion={reducedMotion} />

              {/* Floating Glass Chip 1: Top Left */}
              <div className="absolute top-6 -left-4 sm:left-2 p-3 rounded-2xl glass-panel shadow-2xl animate-float-slow hidden sm:flex items-center gap-3 pointer-events-auto border-blue-500/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-cyan-400">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Neural Reasoning
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>99.98% Accuracy</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Floating Glass Chip 2: Bottom Right */}
              <div className="absolute bottom-6 -right-4 sm:right-2 p-3 rounded-2xl glass-panel shadow-2xl animate-float-reverse hidden sm:flex items-center gap-3 pointer-events-auto border-violet-500/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Agent Swarm Active
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span className="text-cyan-300">128</span>
                    <span className="text-slate-400 font-normal">nodes synced</span>
                  </div>
                </div>
              </div>

              {/* Floating Glass Chip 3: Bottom Left */}
              <div className="absolute -bottom-4 left-1/4 p-2.5 rounded-xl glass-panel text-[11px] font-mono text-emerald-400 hidden sm:flex items-center gap-2 border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Zero-Data Leakage Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Brand Logos Ticker */}
        <div className="mt-20 pt-10 border-t border-white/[0.08] w-full">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-slate-500 mb-6 font-semibold">
            Powering Autonomous AI Operations for Market Leaders
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center opacity-70 hover:opacity-100 transition-opacity">
            {partners.map((partner, i) => (
              <div
                key={i}
                className="flex flex-col items-center group cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-black tracking-widest text-slate-400 group-hover:text-white transition-colors font-mono">
                  {partner.name}
                </span>
                <span className="text-[9px] font-mono text-slate-600 group-hover:text-blue-400 transition-colors">
                  {partner.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
