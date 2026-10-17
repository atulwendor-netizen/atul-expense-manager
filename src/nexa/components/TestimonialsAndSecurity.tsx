import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  Server, 
  EyeOff, 
  BarChart3, 
  Check, 
  Star, 
  Quote, 
  Sparkles
} from 'lucide-react';

interface BenchmarkRow {
  model: string;
  isNexa?: boolean;
  ttft: string;
  throughput: string;
  context: string;
  costPrompt: string;
  guardrailsLatency: string;
  zdrGuarantee: boolean;
}

const BENCHMARKS: BenchmarkRow[] = [
  {
    model: 'Nexa Ultra-2.5',
    isNexa: true,
    ttft: '42 ms',
    throughput: '215 t/s',
    context: '2.5M tokens',
    costPrompt: '$0.80 / 1M',
    guardrailsLatency: '< 4 ms',
    zdrGuarantee: true
  },
  {
    model: 'GPT-4o Enterprise',
    ttft: '190 ms',
    throughput: '110 t/s',
    context: '128K tokens',
    costPrompt: '$2.50 / 1M',
    guardrailsLatency: '45 ms',
    zdrGuarantee: true
  },
  {
    model: 'Claude 3.5 Sonnet',
    ttft: '210 ms',
    throughput: '95 t/s',
    context: '200K tokens',
    costPrompt: '$3.00 / 1M',
    guardrailsLatency: '55 ms',
    zdrGuarantee: false
  },
  {
    model: 'Gemini 1.5 Pro',
    ttft: '320 ms',
    throughput: '85 t/s',
    context: '2.0M tokens',
    costPrompt: '$1.25 / 1M',
    guardrailsLatency: '60 ms',
    zdrGuarantee: true
  }
];

const COMPLIANCE_ITEMS = [
  {
    title: 'SOC 2 Type II Certified',
    code: 'AICPA SOC2',
    desc: 'Audited annually across Security, Availability, and Confidentiality trust principles with continuous automated evidence collection.',
    icon: ShieldCheck,
    tag: 'Verified'
  },
  {
    title: 'ISO/IEC 27001:2022',
    code: 'BSI CERTIFIED',
    desc: 'Global benchmark for information security management systems covering infrastructure, code repositories, and runtime models.',
    icon: Lock,
    tag: 'Global'
  },
  {
    title: 'HIPAA & BAA Ready',
    code: 'HEALTH DATA SECURE',
    desc: 'Full compliance for processing protected health information (PHI) with dedicated isolated key management and Business Associate Agreements.',
    icon: FileCheck2,
    tag: 'Healthcare'
  },
  {
    title: 'Zero-Retention Enclaves',
    code: 'CONFIDENTIAL COMPUTE',
    desc: 'Inference queries are processed entirely in cryptographically sealed AMD SEV-SNP enclaves with zero ephemeral disk caching.',
    icon: EyeOff,
    tag: 'Zero-Leakage'
  },
  {
    title: 'Dedicated VPC & Airgap',
    code: 'AIRGAPPED READY',
    desc: 'Deploy Nexa inference clusters inside your AWS, GCP, Azure, or on-premises Kubernetes infrastructure without internet ingress.',
    icon: Server,
    tag: 'Custom VPC'
  },
  {
    title: 'EU AI Act & GDPR Aligned',
    code: 'REGULATORY COMPLIANT',
    desc: 'Deterministic provenance tracking, explainability trees, and model weight hashing complying with EU AI Act high-risk classification.',
    icon: Sparkles,
    tag: 'Governance'
  }
];

const TESTIMONIALS = [
  {
    quote: "Switching to Nexa dropped our mission-critical query latency from 420ms to 58ms while slicing model spend by 64%. The autonomous swarm routing is easily 2 years ahead of anything else on the market.",
    author: "Dr. Elena Rostova",
    role: "VP of Artificial Intelligence",
    company: "Synapse Global Technologies",
    stats: "64% Cost Reduction"
  },
  {
    quote: "For fintech, zero data retention isn't optional—it's statutory. Nexa's confidential enclaves and real-time PII masking gave our compliance committee immediate peace of mind to deploy autonomous agents in production.",
    author: "Marcus Vance",
    role: "Head of Core Infrastructure",
    company: "FinCore Capital",
    stats: "Sub-4ms Guardrails"
  },
  {
    quote: "We execute over 80 million tokens daily for genomics research. Nexa's multi-model consensus and stateful memory have reduced hallucination rates to near-zero across our complex molecular pipelines.",
    author: "Dr. Priya Nair",
    role: "Chief Bioinformatics Architect",
    company: "Helix BioSystems",
    stats: "99.999% Execution Reliability"
  }
];

export const TestimonialsAndSecurity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'security'>('benchmarks');

  return (
    <section id="benchmarks" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background radial highlight */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[500px] bg-gradient-to-b from-blue-600/10 via-purple-600/10 to-transparent blur-[140px] -z-10 pointer-events-none rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-4 tracking-wider uppercase">
          <BarChart3 className="w-3.5 h-3.5" />
          Empirical Validation & Trust
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Uncompromised Throughput. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Enterprise Zero-Trust Security.
          </span>
        </h2>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          See how Nexa outperforms traditional monolithic LLM endpoints in speed, throughput, cost-efficiency, and institutional compliance.
        </p>

        {/* Tab Switcher */}
        <div className="mt-8 inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'benchmarks'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Performance Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Security & Governance
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'benchmarks' ? (
        <div className="space-y-12">
          {/* Benchmarks Table */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Model Architecture</th>
                    <th className="py-4 px-6">TTFT (Time to First Token)</th>
                    <th className="py-4 px-6">Throughput</th>
                    <th className="py-4 px-6">Effective Context</th>
                    <th className="py-4 px-6">Cost / 1M Tokens</th>
                    <th className="py-4 px-6">Guardrail Latency</th>
                    <th className="py-4 px-6 text-center">Zero Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-mono">
                  {BENCHMARKS.map((b, idx) => (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        b.isNexa
                          ? 'bg-blue-600/[0.08] hover:bg-blue-600/[0.12] text-white font-medium'
                          : 'hover:bg-white/[0.02] text-slate-300'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {b.isNexa && (
                            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                          )}
                          <span className={b.isNexa ? 'text-blue-300 font-bold' : 'text-slate-200'}>
                            {b.model}
                          </span>
                          {b.isNexa && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              Top Performer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-emerald-400 font-bold">{b.ttft}</td>
                      <td className="py-4 px-6 text-blue-300">{b.throughput}</td>
                      <td className="py-4 px-6 text-slate-300">{b.context}</td>
                      <td className="py-4 px-6 text-purple-300">{b.costPrompt}</td>
                      <td className="py-4 px-6 text-emerald-400">{b.guardrailsLatency}</td>
                      <td className="py-4 px-6 text-center">
                        {b.zdrGuarantee ? (
                          <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="glass-card p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-amber-400 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {t.stats}
                    </span>
                  </div>
                  <Quote className="w-6 h-6 text-blue-400/40 mb-3" />
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {t.author.charAt(3) || t.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white">{t.author}</div>
                    <div className="text-[11px] text-slate-400">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Security Grid */
        <div id="security" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPLIANCE_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-[10px] font-mono text-slate-500 mb-3 uppercase tracking-wider">
                    {item.code}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Zero-Knowledge Proof</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Enforced
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
