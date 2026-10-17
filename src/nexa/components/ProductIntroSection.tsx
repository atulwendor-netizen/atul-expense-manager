import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Terminal,
  Cpu,
  Sparkles,
  GitBranch,
  Workflow,
  Radio,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ProductIntroSectionProps {
  reducedMotion?: boolean;
}

export const ProductIntroSection: React.FC<ProductIntroSectionProps> = ({ reducedMotion = false }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRevealRef = useRef<HTMLDivElement>(null);
  const mockupContainerRef = useRef<HTMLDivElement>(null);
  const layerBackRef = useRef<HTMLDivElement>(null);
  const layerMidRef = useRef<HTMLDivElement>(null);
  const layerFrontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Staggered Text Reveal
      if (textRevealRef.current) {
        const words = textRevealRef.current.querySelectorAll('.reveal-word');
        gsap.fromTo(
          words,
          { opacity: 0.15, y: 15, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: textRevealRef.current,
              start: 'top 80%',
              end: 'bottom 45%',
              scrub: 0.8,
            },
          }
        );
      }

      // 2. Parallax Mockup Layers
      if (mockupContainerRef.current) {
        // Deep background layer moves slower
        if (layerBackRef.current) {
          gsap.to(layerBackRef.current, {
            y: -50,
            ease: 'none',
            scrollTrigger: {
              trigger: mockupContainerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        }

        // Midground dashboard container tilts smoothly
        if (layerMidRef.current) {
          gsap.fromTo(
            layerMidRef.current,
            { rotateX: 18, y: 60, opacity: 0.7 },
            {
              rotateX: 4,
              y: -20,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: mockupContainerRef.current,
                start: 'top 85%',
                end: 'center 45%',
                scrub: 1,
              },
            }
          );
        }

        // Foreground floating chips move faster for real depth
        if (layerFrontRef.current) {
          gsap.to(layerFrontRef.current, {
            y: -90,
            ease: 'none',
            scrollTrigger: {
              trigger: mockupContainerRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5,
            },
          });
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  const statement = [
    'Legacy', 'software', 'relies', 'on', 'brittle', 'scripts.',
    'First-generation', 'LLMs', 'suffer', 'from', 'context', 'drift',
    'and', 'unpredictable', 'hallucinations.', 'Nexa', 'engineers',
    'an', 'autonomous', 'cognitive', 'mesh', 'that', 'plans,',
    'executes,', 'and', 'self-verifies', 'at', 'hardware', 'speed.'
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-28 lg:py-36 bg-[#05070f] overflow-hidden"
    >
      {/* Background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-blue-600/10 via-violet-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header Tag */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-violet-500/30 text-violet-300 text-xs font-mono mb-4">
            <Workflow className="h-3.5 w-3.5 text-violet-400" />
            <span>THE COGNITIVE SHIFT</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl">
            From Static Prompts to Self-Orchestrating Swarms
          </h2>
        </div>

        {/* Kinetic Staggered Text Reveal */}
        <div
          ref={textRevealRef}
          className="max-w-4xl mx-auto text-center text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.3] mb-24 px-4 font-sans select-none"
        >
          {statement.map((word, idx) => {
            const isHighlight =
              word.includes('Nexa') ||
              word.includes('autonomous') ||
              word.includes('self-verifies') ||
              word.includes('hardware');
            return (
              <span
                key={idx}
                className={`reveal-word inline-block mr-2.5 transition-colors ${
                  isHighlight
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 font-bold'
                    : 'text-slate-200'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Parallax Perspective Layered Mockup */}
        <div
          ref={mockupContainerRef}
          className="relative max-w-5xl mx-auto perspective-container"
        >
          {/* Layer 1 (Back): Code matrix background */}
          <div
            ref={layerBackRef}
            className="absolute -top-12 -left-8 -right-8 h-48 rounded-3xl bg-gradient-to-r from-blue-900/20 via-violet-900/20 to-cyan-900/10 border border-white/5 blur-sm opacity-60 pointer-events-none hidden sm:block"
          />

          {/* Layer 2 (Mid): Main 3D Perspective Command Center */}
          <div
            ref={layerMidRef}
            className="preserve-3d relative rounded-3xl glass-panel border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-[11px] text-slate-400">
                  nexa-cluster://region-us-east/agent-mesh-v4.0
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REASONING ACTIVE
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Latency: 8.4ms
                </span>
              </div>
            </div>

            {/* Dashboard Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/80">
              {/* Left Panel: Real-Time Agent Stream */}
              <div className="md:col-span-7 space-y-4 font-mono text-xs">
                <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-white/5 pb-2">
                    <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <Terminal className="h-3.5 w-3.5" />
                      Agent Execution Pipeline
                    </span>
                    <span className="text-slate-500">Thread #8942-A</span>
                  </div>

                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400">&gt;</span>
                      <div>
                        <span className="text-violet-300">[Orchestrator]</span> Sub-agent swarm dispatched:
                        <span className="text-slate-400"> Architect, Verifier, Security-Enclave</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-400">
                      <span className="text-emerald-400">&gt;</span>
                      <div>
                        <span className="text-blue-300">[Architect]</span> Context memory resolved in{' '}
                        <span className="text-emerald-400 font-bold">2.1ms</span>. 1,024,000 tokens compressed with 0% loss.
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-400">
                      <span className="text-yellow-400">&gt;</span>
                      <div>
                        <span className="text-amber-300">[Security-Enclave]</span> Deterministic policy check: PASSED.{' '}
                        <span className="text-slate-500">Cryptographic audit root #e4f9b2</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-300 font-semibold">
                      <span className="text-emerald-400">✓</span>
                      <div>
                        <span>Autonomous Task Finalized in 11.2ms. Zero human interventions required.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-telemetry pills */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Throughput</div>
                    <div className="text-sm font-bold text-cyan-400 mt-0.5">4.2M tok/s</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">P99 Latency</div>
                    <div className="text-sm font-bold text-violet-400 mt-0.5">8.4ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">Audit Proof</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">100% Signed</div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Topology & Active Nodes */}
              <div className="md:col-span-5 rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 text-violet-400 font-semibold">
                    <GitBranch className="h-3.5 w-3.5" />
                    Neural Mesh Topology
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Visual Node Diagram */}
                <div className="relative py-6 flex items-center justify-center">
                  <div className="relative w-44 h-44 rounded-full border border-blue-500/30 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border border-violet-500/40 flex items-center justify-center animate-pulse-glow">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 shadow-[0_0_30px_#6366f1] flex items-center justify-center">
                        <Cpu className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    {/* Orbiting Satellite Nodes */}
                    <div className="absolute top-2 left-6 h-3.5 w-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                    <div className="absolute bottom-3 right-6 h-3.5 w-3.5 rounded-full bg-violet-400 shadow-[0_0_12px_#c084fc]" />
                    <div className="absolute top-1/2 -right-2 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center bg-white/[0.02] py-2 rounded-xl border border-white/5">
                  128 Nodes Connected • 0 Packet Loss
                </div>
              </div>
            </div>
          </div>

          {/* Layer 3 (Front): Foreground Floating Metric Card for Parallax Depth */}
          <div
            ref={layerFrontRef}
            className="absolute -bottom-8 -right-6 lg:-right-10 p-4 rounded-2xl glass-panel shadow-[0_15px_40px_rgba(0,0,0,0.7)] border border-cyan-500/40 hidden sm:flex items-center gap-3.5 pointer-events-auto"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Self-Correction Loop
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>0.0001% Drift Rate</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  OPTIMAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
