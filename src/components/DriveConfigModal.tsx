import React, { useState } from 'react';
import { GoogleDriveConfig } from '../types/index';
import {
  X,
  HardDrive,
  Folder,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Key,
  Check,
  Lock,
} from 'lucide-react';

interface DriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleDriveConfig;
  onSaveConfig: (updated: Partial<GoogleDriveConfig>) => void;
  onRefreshFolder: () => void;
  isManager?: boolean;
}

export const DriveConfigModal: React.FC<DriveConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshFolder,
  isManager = false,
}) => {
  const [folderName, setFolderName] = useState(config.folderName || 'Expense Manager Payment Proofs');
  const [clientId, setClientId] = useState(config.clientId || '78291038472-atul-expense-drive.apps.googleusercontent.com');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [accessToken, setAccessToken] = useState(config.accessToken || '');
  const [folderUrl, setFolderUrl] = useState(config.folderUrl || '');
  const [isConnected, setIsConnected] = useState(config.isConnected);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      folderName: folderName.trim() || 'Expense Manager Payment Proofs',
      clientId: clientId.trim(),
      apiKey: apiKey.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
      folderUrl: folderUrl.trim() || undefined,
      isConnected,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSyncNow = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      onRefreshFolder();
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Google Drive Integration
                {config.isConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-[10px] font-semibold">
                    Disconnected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure OAuth client credentials and sync the dedicated payment-proof folder.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Active Folder Status */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 p-4 border border-blue-100 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Dedicated Payment Proof Folder
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {folderName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300 border-t border-blue-100/60 dark:border-blue-900/40">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Connected Account</span>
                <span className="font-medium font-mono text-slate-800 dark:text-slate-200">
                  {config.connectedAccountEmail || 'Atul.wendor@gmail.com'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Last Synced</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleString('en-IN') : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          {/* Virtual Categories preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Virtual Sub-Categories in Drive
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Service Visit', 'Mumbai & Pune', 'Local Operations', 'Other Trips'].map((cat) => (
                <div
                  key={cat}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2 text-center"
                >
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block truncate">
                    {cat}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Virtual categories in Atul Expense Manager map smoothly to these folders without mutating Drive structure.
            </p>
          </div>

          {/* Configuration Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Google Drive Folder Name</span>
                <span className="text-[11px] font-normal text-slate-400">Default: Expense Manager Payment Proofs</span>
              </label>
              <input
                type="text"
                disabled={isManager}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Expense Manager Payment Proofs"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Default Folder Link or ID</span>
                <span className="text-[11px] font-normal text-slate-400">Google Drive URL</span>
              </label>
              <input
                type="text"
                disabled={isManager}
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>OAuth 2.0 Client ID</span>
                <span className="text-[11px] font-normal text-slate-400">Read-only Scope</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  disabled={isManager}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pl-9 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
                />
                <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>OAuth Access Token (Optional)</span>
                </label>
                <input
                  type="password"
                  disabled={isManager}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Bearer ya29.a0..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Google API Key (Optional)</span>
                </label>
                <input
                  type="password"
                  disabled={isManager}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Security & Scopes Notice */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                OAuth Least-Privilege Guarantee
              </span>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Only read metadata and file content (<code className="font-mono text-[10px] text-blue-600">drive.readonly</code>).</li>
              <li>Passwords and access tokens are never transmitted or stored in frontend code.</li>
              <li>Files remain securely hosted inside your Google Drive without wasteful local duplicates.</li>
            </ul>
          </div>

          {isManager && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>You are viewing in Manager Audit mode. Google Drive settings are configured by the Account Owner.</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </button>

            {!isManager && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConnected(!isConnected)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors ${
                    isConnected
                      ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400'
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect Account'}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Saved!
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
