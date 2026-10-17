import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Cpu,
  GitFork,
  Database,
  ShieldCheck,
  Check,
  ArrowRight,
  Zap,
  Sparkles,
  Lock,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PinnedStorySectionProps {
  reducedMotion?: boolean;
}

export const PinnedStorySection: React.FC<PinnedStorySectionProps> = ({ reducedMotion = false }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const pinContainerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'swarm',
      number: '01',
      title: 'Autonomous Multi-Agent Mesh',
      badge: 'Decentralized Swarm',
      description:
        'Instead of sequential monolithic prompting, Nexa decomposes enterprise tasks into specialized autonomous sub-agents—Architect, Coder, Auditor, and Runtime Verifier—collaborating in sub-millisecond parallel loops.',
      metrics: [
        { label: 'Parallel Swarm Concurrency', value: '1,024 Nodes' },
        { label: 'Inter-Agent Latency', value: '< 1.4ms' },
        { label: 'Autonomous Delegation', value: '100% Machine-Driven' },
      ],
      icon: Cpu,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'reasoning',
      number: '02',
      title: 'Neural Tree-of-Thought Reasoning',
      badge: 'Deep Hypothesis Search',
      description:
        'Nexa evaluates problem spaces through branched probabilistic search trees. It simulates potential architectural outcomes, detects edge-case failures, and prunes flawed logic before committing code.',
      metrics: [
        { label: 'Search Space Exploration', value: '64 Branches/s' },
        { label: 'Hallucination Suppression', value: '99.98%' },
        { label: 'Self-Correction Rate', value: '100% Deterministic' },
      ],
      icon: GitFork,
      color: 'from-indigo-500 to-violet-600',
    },
    {
      id: 'memory',
      number: '03',
      title: 'Sub-Millisecond Vector Memory Fabric',
      badge: 'Stateful Persistence',
      description:
        'Context windows are no longer bottlenecked. Nexa preserves unified long-term organizational knowledge through hardware-accelerated vector indexing with zero token degradation across multi-year project histories.',
      metrics: [
        { label: 'Memory Retrieval Speed', value: '2.8ms' },
        { label: 'Context Compression Ratio', value: '64:1 Lossless' },
        { label: 'Knowledge Graph Scope', value: '10M+ Entities' },
      ],
      icon: Database,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'security',
      number: '04',
      title: 'Enterprise Cryptographic Enclave',
      badge: 'Zero-Trust Guardrails',
      description:
        'Every single token, agent execution, and tool call is signed with cryptographic provenance. Automated PII scrubbing, role-based boundary verification, and audit logs keep proprietary intellectual property hermetically sealed.',
      metrics: [
        { label: 'Cryptographic Audit Proof', value: 'Ed25519 Signed' },
        { label: 'PII Leakage Prevention', value: 'Zero Residuals' },
        { label: 'Compliance Attestation', value: 'SOC2 Type II / HIPAA' },
      ],
      icon: ShieldCheck,
      color: 'from-violet-500 to-emerald-500',
    },
  ];

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      if (pinContainerRef.current && sectionRef.current) {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: pinContainerRef.current,
          pinSpacing: false,
          scrub: 0.5,
          onUpdate: (self) => {
            const progress = self.progress;
            const newIndex = Math.min(
              steps.length - 1,
              Math.floor(progress * steps.length)
            );
            setActiveStep(newIndex);
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion, steps.length]);

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative bg-[#03050a] min-h-[320vh] w-full"
    >
      {/* Sticky Pinned Viewport */}
      <div
        ref={pinContainerRef}
        className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden bg-cyber-grid"
      >
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-8">
          {/* Section Header */}
          <div className="flex flex-col items-start mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-blue-500/30 text-blue-300 text-xs font-mono mb-2">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>THE ARCHITECTURAL LIFECYCLE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Nexa Solves Exponential Engineering Problems
            </h2>
          </div>

          {/* Main 2-Column Storytelling Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Progress Timeline & Active Chapter Narrative */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              {/* Step Navigation Pill Indicator */}
              <div className="flex items-center gap-2">
                {steps.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeStep === idx
                        ? 'w-10 bg-gradient-to-r from-blue-400 to-violet-400 shadow-[0_0_12px_#38bdf8]'
                        : 'w-3 bg-white/10 hover:bg-white/20'
                    }`}
                    aria-label={`Jump to chapter ${step.number}`}
                  />
                ))}
                <span className="font-mono text-xs text-slate-500 ml-2">
                  0{activeStep + 1} / 0{steps.length}
                </span>
              </div>

              {/* Dynamic Chapter Text */}
              <div className="space-y-4 min-h-[220px]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-cyan-300">
                  <span>CHAPTER {steps[activeStep].number}</span>
                  <span>•</span>
                  <span>{steps[activeStep].badge}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {steps[activeStep].title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {steps[activeStep].description}
                </p>
              </div>

              {/* Key Metrics for Active Step */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                {steps[activeStep].metrics.map((metric, i) => (
                  <div key={i} className="p-3 rounded-2xl glass-card text-left">
                    <div className="text-[10px] font-mono text-slate-400 uppercase leading-tight">
                      {metric.label}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-1 font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-violet-300">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Dynamic Interactive Visual Card */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl glass-panel border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden min-h-[380px] sm:min-h-[460px] flex flex-col justify-between">
                {/* Background Ambient Radial Gradient inside card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-violet-600/15 pointer-events-none" />

                {/* Card Top Chrome */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white shadow-lg">
                      {React.createElement(steps[activeStep].icon, { className: 'h-5 w-5' })}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-sans">
                        {steps[activeStep].title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Live Simulation Engine • Sub-system Status: ONLINE
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    SYNCED
                  </span>
                </div>

                {/* Dynamic Content based on Active Step */}
                <div className="py-6 relative z-10 flex-1 flex flex-col justify-center">
                  {/* Visual 1: Autonomous Agent Swarm */}
                  {activeStep === 0 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        {[
                          { role: 'Architect', status: 'Decomposing PRD', color: 'border-blue-500/40 text-blue-400' },
                          { role: 'Coder Swarm', status: 'AST Generation', color: 'border-cyan-500/40 text-cyan-400' },
                          { role: 'Auditor', status: 'Security Scan', color: 'border-violet-500/40 text-violet-400' },
                          { role: 'Verifier', status: 'E2E Test Run', color: 'border-emerald-500/40 text-emerald-400' },
                        ].map((agent, i) => (
                          <div
                            key={i}
                            className={`p-3.5 rounded-2xl bg-black/50 border ${agent.color} shadow-sm backdrop-blur-sm`}
                          >
                            <div className="text-xs font-bold text-white">{agent.role}</div>
                            <div className="text-[10px] font-mono mt-1 opacity-80">{agent.status}</div>
                            <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse"
                                style={{ width: `${80 + i * 5}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs space-y-1.5 text-slate-300">
                        <div className="text-cyan-400 flex items-center gap-1.5">
                          <Zap className="h-3 w-3" />
                          <span>Swarm Consensus Achieved: Sub-task #481 partitioned in 0.9ms</span>
                        </div>
                        <div className="text-slate-400">
                          &gt; All 1,024 worker threads synchronized across 4 multi-region clusters.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual 2: Neural Tree-of-Thought Reasoning */}
                  {activeStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-3">
                        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                          <span className="text-violet-400 font-bold">Branching Hypothesis Search</span>
                          <span className="text-cyan-400">Depth: 4 | Beam Width: 8</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                            <span>Branch A: Async Event Loop + Zero-Copy I/O</span>
                            <span className="font-bold text-emerald-400">Score: 0.998 [SELECTED]</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300/80 line-through">
                            <span>Branch B: Thread Pool Contention Risk</span>
                            <span className="text-rose-400">[PRUNED]</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300/80 line-through">
                            <span>Branch C: Distributed Lock Bottleneck</span>
                            <span className="text-rose-400">[PRUNED]</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2">
                        <span>Self-Validation Verification: 100% Passed</span>
                        <span className="text-emerald-400">0 Logic Errors Committed</span>
                      </div>
                    </div>
                  )}

                  {/* Visual 3: Sub-Millisecond Vector Memory Fabric */}
                  {activeStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30">
                          <div className="text-2xl font-black text-cyan-400 font-mono">1.8ms</div>
                          <div className="text-[11px] text-slate-400 mt-1 uppercase font-mono">HNSW Vector Query</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/60 border border-blue-500/30">
                          <div className="text-2xl font-black text-blue-400 font-mono">1M Tokens</div>
                          <div className="text-[11px] text-slate-400 mt-1 uppercase font-mono">Active Context Window</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/60 border border-violet-500/30">
                          <div className="text-2xl font-black text-violet-400 font-mono">0.00%</div>
                          <div className="text-[11px] text-slate-400 mt-1 uppercase font-mono">Semantic Degradation</div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-black/50 border border-white/10 p-4 font-mono text-xs text-slate-300 space-y-1">
                        <span className="text-cyan-400">&gt; Memory Vector Cluster:</span>{' '}
                        <span>Indexed 4.8M codebase symbols & commit historical diffs with hardware quantization.</span>
                      </div>
                    </div>
                  )}

                  {/* Visual 4: Enterprise Cryptographic Enclave */}
                  {activeStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                            <Lock className="h-4 w-4" />
                            Hermetic Enclave Active
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Hash: #f89a-0012-c9</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>Zero Data Ingestion for Training</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>AES-256 GCM In-Flight Encryption</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>Full Role-Based Access Control</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>Tamper-Proof Audit Logging</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center text-xs font-mono text-emerald-300">
                        Enterprise Guarantee: 100% Deterministic Execution Boundary Enforced.
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Progress Bar */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Scroll to Advance Chapter</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{steps[activeStep].title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
