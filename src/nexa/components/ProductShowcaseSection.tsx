import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Gauge,
  Zap,
  ArrowUpRight,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ProductShowcaseSectionProps {
  reducedMotion?: boolean;
}

export const ProductShowcaseSection: React.FC<ProductShowcaseSectionProps> = ({
  reducedMotion = false,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardGridRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'arbitrage' | 'memory' | 'guardrails'>('arbitrage');

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      if (cardGridRef.current) {
        const cards = cardGridRef.current.querySelectorAll('.showcase-card');
        gsap.fromTo(
          cards,
          { y: 50, opacity: 0, rotateX: 10 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardGridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative py-28 lg:py-36 bg-[#05070f] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>ARCHITECTURAL DEPTH & SHOWCASE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Engineered for Million-Token Systems Without Degradation
          </h2>

          <p className="text-slate-400 text-base sm:text-lg mt-4 leading-relaxed font-normal">
            Explore the three foundational pillars powering Nexa’s cognitive engine. Built from bare-metal C++ and WebAssembly to eliminate latency bottlenecks.
          </p>

          {/* Interactive Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 p-1.5 rounded-full glass-panel border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab('arbitrage')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'arbitrage'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Multi-Model Arbitrage</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('memory')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'memory'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Stateful Vector Memory</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guardrails')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'guardrails'
                  ? 'bg-gradient-to-r from-violet-600 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Deterministic Guardrails</span>
            </button>
          </div>
        </div>

        {/* Dynamic 3D Layered Perspective Cards Grid */}
        <div ref={cardGridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Card 1: Primary Feature Deep-Dive */}
          <div className="showcase-card lg:col-span-2 rounded-3xl glass-panel p-8 relative overflow-hidden flex flex-col justify-between border border-white/10 hover:border-blue-500/40 transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Live Routing Engine
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                  P99: 8.2ms
                </span>
              </div>

              {activeTab === 'arbitrage' && (
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Dynamic Sub-Millisecond Model Arbitrage
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    Nexa automatically benchmarks incoming prompt complexities and intelligently routes tokens to the optimal model—slashing enterprise inference costs by up to 88% while guaranteeing peak reasoning performance.
                  </p>

                  {/* Benchmark Visualization Comparison */}
                  <div className="pt-4 space-y-3 font-mono text-xs">
                    {[
                      { model: 'Claude 3.7 Sonnet (Complex Reasoning)', speed: '98%', latency: '14ms', cost: '$3.00/1M' },
                      { model: 'GPT-4.5 Ultra (System Synthesis)', speed: '94%', latency: '22ms', cost: '$5.00/1M' },
                      { model: 'Gemini 2.5 Pro (Multimodal Vector)', speed: '99%', latency: '11ms', cost: '$1.25/1M' },
                      { model: 'Nexa Local Llama 3 70B (Edge Safe)', speed: '100%', latency: '3.4ms', cost: '$0.00/1M' },
                    ].map((m, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-black/50 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200">{m.model}</span>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span className="text-cyan-400 font-bold">{m.latency}</span>
                          <span className="text-emerald-400">{m.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Lossless Million-Token Context Fabric
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    Compress multi-gigabyte codebases and regulatory filings into stateful vector embeddings with instant semantic retrieval and zero degradation over multi-step agent trajectories.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-4 font-mono text-xs">
                    <div className="p-4 rounded-2xl bg-black/60 border border-violet-500/30">
                      <div className="text-slate-400 text-[10px] uppercase">Retrieval Latency</div>
                      <div className="text-xl font-black text-violet-400 mt-1">1.9ms</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30">
                      <div className="text-slate-400 text-[10px] uppercase">Compression Ratio</div>
                      <div className="text-xl font-black text-cyan-400 mt-1">64:1 Lossless</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'guardrails' && (
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Cryptographic Guardrails & Provenance
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    Real-time AST parsing, automated PII masking, and cryptographic execution signatures verify every line of code or analysis generated by autonomous agents before runtime.
                  </p>
                  <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-2 text-xs font-mono text-emerald-300">
                    <div>✓ Automated prompt injection firewall: ACTIVE</div>
                    <div>✓ Enterprise PII scrubbing: 100% Zero-Leakage</div>
                    <div>✓ Cryptographic SHA-256 state signature: ATTESTED</div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Validated on 100,000+ Production Codebases
              </span>
              <span className="text-blue-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Explore API Specs <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Interactive Real-Time Efficiency Telemetry */}
          <div className="showcase-card rounded-3xl glass-panel p-8 relative overflow-hidden flex flex-col justify-between border border-white/10 hover:border-violet-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-60 h-60 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />

            <div>
              <span className="text-xs font-mono font-bold text-violet-400 tracking-wider uppercase flex items-center gap-1.5 mb-6">
                <Gauge className="h-3.5 w-3.5" />
                Operational Impact
              </span>

              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      -88%
                    </span>
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5" /> Cost Reduction
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Compared to traditional monolithic model subscriptions
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-4xl sm:text-5xl font-black text-cyan-400 font-mono tracking-tight">
                      12.4x
                    </span>
                    <span className="text-xs font-mono text-cyan-300">
                      Faster Iterations
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous parallel verification over manual QA review
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                      0ms
                    </span>
                    <span className="text-xs font-mono text-emerald-300">
                      Cold Starts
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Always-warm globally distributed edge clusters
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3.5 text-center font-mono text-xs text-slate-400">
                Backed by 99.99% Financial SLA
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
