import React, { useState } from 'react';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  ArrowUp,
  MessageSquare,
  Radio
} from 'lucide-react';

interface FinalCTAAndFooterProps {
  onOpenBookDemo: () => void;
  onLaunchPlatform: () => void;
}

export const FinalCTAAndFooter: React.FC<FinalCTAAndFooterProps> = ({ 
  onOpenBookDemo,
  onLaunchPlatform
}) => {
  const [email, setEmail] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsGenerating(true);
    setTimeout(() => {
      const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      setGeneratedKey(`nexa_live_${randomSuffix}`);
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-transparent via-[#030611] to-[#010206] border-t border-white/10">
      {/* Background Aurora / Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-blue-600/20 via-purple-600/15 to-transparent blur-[160px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[140px] -z-10 pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 blur-[140px] -z-10 pointer-events-none rounded-full" />

      {/* Main CTA Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden text-center">
          
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Nexa v2.5 Engine is Generally Available</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Architect the Next Era of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Autonomous Intelligence
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate model lock-in, slice inference latency to 42ms, and deploy zero-leakage agent swarms with enterprise cryptographic guarantees.
          </p>

          {/* Key Generator / Waitlist Form */}
          {!generatedKey ? (
            <div className="max-w-md mx-auto mb-8">
              <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your enterprise email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group whitespace-nowrap disabled:opacity-60"
                >
                  {isGenerating ? (
                    <span>Provisioning Key...</span>
                  ) : (
                    <>
                      <span>Generate API Key</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400 mt-3">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> 10,000 Free Inference Tokens
                </span>
                <span>•</span>
                <span>No Credit Card Required</span>
              </div>
            </div>
          ) : (
            /* Key Provisioned View */
            <div className="max-w-xl mx-auto mb-8 p-5 rounded-2xl bg-black/60 border border-blue-500/40 text-left animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    API Key Provisioned
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 hover:bg-white/15 transition-colors"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy Key'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-white/10 font-mono text-xs text-blue-300 break-all select-all mb-3">
                {generatedKey}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 overflow-x-auto">
                <span className="text-slate-500"># Quickstart cURL:</span>
                <br />
                curl https://api.nexa.ai/v1/swarm/chat \
                <br />
                &nbsp;&nbsp;-H "Authorization: Bearer {generatedKey}" \
                <br />
                &nbsp;&nbsp;-d '{'{"prompt": "Hello Nexa Swarm"}'}'
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onLaunchPlatform}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Launch Enterprise Platform</span>
            </button>
            <button
              onClick={onOpenBookDemo}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Schedule Architecture Review</span>
            </button>
          </div>

          {/* Live System Status Pill */}
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300">Global Mesh: 18 Edge Clusters Online</span>
            </div>
            <span>•</span>
            <div>P99 Ingress Latency: <span className="text-emerald-400 font-bold">14.2ms</span></div>
            <span>•</span>
            <div>Zero-Retention Enclaves: <span className="text-blue-400 font-bold">Enforced</span></div>
          </div>

        </div>
      </div>

      {/* Footer Navigation Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-16 border-b border-white/10 text-xs">
          
          {/* Brand Info */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">Nexa<span className="text-blue-400">.ai</span></span>
            </div>
            <p className="text-slate-400 max-w-sm mb-6 leading-relaxed">
              The high-performance autonomous intelligence layer for mission-critical enterprise workflows. Sub-150ms multi-agent reasoning, zero data retention enclaves, and verifiable guardrails.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors" aria-label="Twitter / X">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#playground" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors" aria-label="Discord / Community">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono text-slate-300 font-bold uppercase tracking-wider mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-slate-400 font-sans">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Multi-Agent Swarm</a></li>
              <li><a href="#story" className="hover:text-blue-400 transition-colors">Tree-of-Thought Prover</a></li>
              <li><a href="#showcase" className="hover:text-blue-400 transition-colors">Stateful Memory Graph</a></li>
              <li><a href="#showcase" className="hover:text-blue-400 transition-colors">Deterministic Guardrails</a></li>
              <li><a href="#video" className="hover:text-blue-400 transition-colors">Real-Time Core Engine</a></li>
              <li><a href="#playground" className="hover:text-blue-400 transition-colors">Interactive Sandbox</a></li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="font-mono text-slate-300 font-bold uppercase tracking-wider mb-4">Deployments</h4>
            <ul className="space-y-2.5 text-slate-400 font-sans">
              <li><a href="#security" className="hover:text-blue-400 transition-colors">Global Edge Clusters</a></li>
              <li><a href="#security" className="hover:text-blue-400 transition-colors">AWS PrivateLink</a></li>
              <li><a href="#security" className="hover:text-blue-400 transition-colors">GCP Cloud Interconnect</a></li>
              <li><a href="#security" className="hover:text-blue-400 transition-colors">Azure ExpressRoute</a></li>
              <li><a href="#security" className="hover:text-blue-400 transition-colors">Airgapped Kubernetes</a></li>
              <li><a href="#security" className="hover:text-blue-400 transition-colors">AMD SEV-SNP Enclaves</a></li>
            </ul>
          </div>

          {/* Governance & Trust */}
          <div>
            <h4 className="font-mono text-slate-300 font-bold uppercase tracking-wider mb-4">Trust & Compliance</h4>
            <ul className="space-y-2.5 text-slate-400 font-sans">
              <li><a href="#benchmarks" className="hover:text-blue-400 transition-colors">SOC 2 Type II Report</a></li>
              <li><a href="#benchmarks" className="hover:text-blue-400 transition-colors">ISO/IEC 27001 Certification</a></li>
              <li><a href="#benchmarks" className="hover:text-blue-400 transition-colors">HIPAA & BAA Agreement</a></li>
              <li><a href="#benchmarks" className="hover:text-blue-400 transition-colors">Zero-Retention Guarantee</a></li>
              <li><a href="#benchmarks" className="hover:text-blue-400 transition-colors">EU AI Act Transparency</a></li>
              <li><a href="#benchmarks" className="hover:text-blue-400 transition-colors">Responsible AI Charter</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} Nexa AI, Inc. All rights reserved. Distributed Autonomous Intelligence Kernel.
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onLaunchPlatform}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Enterprise Portal
            </button>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              aria-label="Scroll to top"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
