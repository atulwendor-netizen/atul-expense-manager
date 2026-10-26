import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { X, ShieldAlert, ShieldCheck, Mail, CheckCircle2, Lock, ArrowRight, Trash2 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalINR: number;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  totalINR,
  onRemoveItem,
  onClearCart,
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#090D18] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 id="checkout-dialog-title" className="text-base sm:text-lg font-bold text-white">
                Review Your Order & Checkout
              </h3>
              <p className="text-[11px] text-slate-400">Currency: Indian Rupee (INR - ₹)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 max-h-[75vh]">
          {/* Important Gateway Notice: Setup Mode */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-amber-300 block">
                  Payment Gateway Setup Mode (Razorpay / Stripe)
                </span>
                <p className="text-amber-200/90 leading-relaxed">
                  Live payment processing is currently in setup mode while server-side merchant credentials
                  and automated webhook delivery pipelines are connected.
                </p>
                <p className="text-amber-200/70 text-[11px]">
                  • No payment cards or bank details are requested here.
                  <br />
                  • Digital files are released strictly after verified server-side payment confirmation.
                </p>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              <span>Selected Digital Products ({items.length})</span>
              {items.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-red-400 hover:text-red-300 normal-case flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {product.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {product.format}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold font-mono text-white">
                        ₹{product.priceINR * quantity}
                      </span>

                      <button
                        onClick={() => onRemoveItem(product.id)}
                        aria-label={`Remove ${product.title}`}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Subtotal & Total Row */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Total Due (INR):</span>
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    ₹{totalINR}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400">
                Your cart is empty. Browse the product catalog to add digital resources.
              </div>
            )}
          </div>

          {/* Pre-Register / VIP Notification Form */}
          <div className="p-5 rounded-2xl bg-[#0F1527] border border-blue-500/20">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Get Notified on Live Launch + 10% Extra Off</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Drop your email to receive direct notification when server payment processing goes live,
              plus instant access to our free AI Quickstart Sample.
            </p>

            {isSubscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>You are on the VIP access list! We will notify you at {email}.</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Notify Me</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-white/[0.08] bg-[#070A12] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Server-Verified Digital Delivery</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    </div>
  );
};
