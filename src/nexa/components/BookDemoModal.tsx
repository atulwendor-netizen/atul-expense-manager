import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, ShieldCheck, Building, Mail, User, Layers, ArrowRight } from 'lucide-react';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [tokenVolume, setTokenVolume] = useState('10M - 100M');
  const [deploymentMode, setDeploymentMode] = useState('Dedicated VPC (AWS / GCP / Azure)');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFullName('');
    setEmail('');
    setCompany('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-white/15 p-6 sm:p-8 shadow-2xl z-10 bg-slate-950/95 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-600/30 via-purple-600/20 to-transparent blur-3xl -z-10 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono w-fit mb-4">
              <Calendar className="w-3.5 h-3.5" />
              Direct Engineering Consultation
            </div>

            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Schedule an Enterprise Architecture Review
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              Meet with our core distributed systems architects to benchmark your token throughput, map custom guardrails, or plan an airgapped deployment.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-mono text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Julian Croft"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> Enterprise Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" /> Company / Organization
                </label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp, Scale AI, etc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" /> Daily Token Volume
                  </label>
                  <select
                    value={tokenVolume}
                    onChange={(e) => setTokenVolume(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="< 10M tokens">&lt; 10M tokens / day</option>
                    <option value="10M - 100M">10M - 100M tokens / day</option>
                    <option value="100M - 1B">100M - 1B tokens / day</option>
                    <option value="1B+ tokens">1B+ tokens / day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Deployment Mode
                  </label>
                  <select
                    value={deploymentMode}
                    onChange={(e) => setDeploymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Dedicated VPC (AWS / GCP / Azure)">Dedicated VPC (Cloud)</option>
                    <option value="Multi-tenant Enterprise">Multi-tenant Fast Cloud</option>
                    <option value="On-Premises Airgap">On-Premises Airgap</option>
                    <option value="Confidential Compute Enclave">Confidential AMD SEV-SNP</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Reserving Engineering Slot...</span>
                  ) : (
                    <>
                      <span>Confirm Consultation Request</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400 pt-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> NDA Covered
                </span>
                <span>•</span>
                <span>Sub-2 Hour Response</span>
                <span>•</span>
                <span>No Sales Quota Pitch</span>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Success State */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">
              Consultation Scheduled!
            </h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed">
              Thank you, <span className="text-blue-400 font-semibold">{fullName}</span>. An invitation and benchmark kit has been dispatched to <span className="text-white font-mono">{email}</span> for <span className="text-white font-semibold">{company}</span>.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left text-xs font-mono text-slate-300 space-y-1.5 mb-6">
              <div><span className="text-slate-500">Tier:</span> Enterprise Architecture Session (45 min)</div>
              <div><span className="text-slate-500">Deployment Target:</span> {deploymentMode}</div>
              <div><span className="text-slate-500">Volume Profile:</span> {tokenVolume}</div>
              <div><span className="text-slate-500">Assigned Architect:</span> Principal AI Systems Engineer</div>
            </div>
            <button
              onClick={handleReset}
              className="py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
            >
              Return to Landing Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
