import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  AlertTriangle,
} from 'lucide-react';
import {
  checkGoogleAuthStatus,
  getGoogleAuthUrl,
  disconnectGoogleAccount,
  GoogleAuthStatus,
} from '../utils/googleDrive';
import { useModalA11y } from '../hooks/useModalA11y';

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
  const { handleBackdropClick } = useModalA11y({ isOpen, onClose });
  const [folderName, setFolderName] = useState(config.folderName || 'Expense Manager Payment Proofs');
  const [clientId, setClientId] = useState(config.clientId || '78291038472-atul-expense-drive.apps.googleusercontent.com');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [accessToken, setAccessToken] = useState(config.accessToken || '');
  const [folderUrl, setFolderUrl] = useState(config.folderUrl || '');
  const [isConnected, setIsConnected] = useState(config.isConnected);
  const [connectedEmail, setConnectedEmail] = useState(config.connectedAccountEmail || 'Atul.wendor@gmail.com');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [serverAuthStatus, setServerAuthStatus] = useState<GoogleAuthStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkGoogleAuthStatus().then((status) => {
        setServerAuthStatus(status);
        if (status.isConnected) {
          setIsConnected(true);
          if (status.connectedEmail) {
            setConnectedEmail(status.connectedEmail);
          }
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectOAuth = async () => {
    setIsConnecting(true);
    setActionError(null);
    try {
      const authInfo = await getGoogleAuthUrl(window.location.pathname);
      if (authInfo.isConfigured && authInfo.url) {
        window.location.href = authInfo.url;
      } else {
        const missing = authInfo.missing?.join(', ') || 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET';
        setActionError(`Server missing required Google Cloud credentials: ${missing}. Please add them to your .env file.`);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error connecting to Google OAuth.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    setIsDisconnecting(true);
    setActionError(null);
    try {
      await disconnectGoogleAccount();
      setIsConnected(false);
      setConnectedEmail('');
      onSaveConfig({ isConnected: false, connectedAccountEmail: undefined });
      onRefreshFolder();
    } catch (err: any) {
      setActionError(err?.message || 'Error disconnecting account.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      folderName: folderName.trim() || 'Expense Manager Payment Proofs',
      clientId: clientId.trim(),
      apiKey: apiKey.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
      folderUrl: folderUrl.trim() || undefined,
      isConnected,
      connectedAccountEmail: connectedEmail || undefined,
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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-config-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 id="drive-config-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Action Error Banner if any */}
          {actionError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{actionError}</p>
              </div>
            </div>
          )}

          {/* Configuration Required Banner if server is missing env credentials */}
          {serverAuthStatus && !serverAuthStatus.isConfigured && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 space-y-2.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Google Cloud OAuth Setup Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300">
                To connect your Google Drive account, provide your Google Cloud OAuth credentials in your local <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env</code> file or server environment:
              </p>
              <div className="rounded-lg bg-amber-100/80 dark:bg-amber-900/40 p-2.5 font-mono text-[11px] text-amber-950 dark:text-amber-100 space-y-1 select-all">
                <div>GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</div>
                <div>GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret</div>
                <div>GOOGLE_REDIRECT_URI={serverAuthStatus.redirectUri || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google/callback`}</div>
              </div>
              <div className="text-[11px] text-amber-800/90 dark:text-amber-300">
                <span className="font-semibold">Google Cloud Redirect URI: </span>
                <code className="font-mono text-[11px] text-amber-950 dark:text-amber-100 bg-white/60 dark:bg-black/20 px-1 rounded">
                  {serverAuthStatus.redirectUri || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google/callback`}
                </code>
              </div>
            </div>
          )}

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
                  {connectedEmail || config.connectedAccountEmail || 'Not Connected'}
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
              <label htmlFor="drive-folder-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Google Drive Folder Name</span>
                <span className="text-[11px] font-normal text-slate-400">Default: Expense Manager Payment Proofs</span>
              </label>
              <input
                id="drive-folder-name"
                type="text"
                disabled={isManager}
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Expense Manager Payment Proofs"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="drive-folder-url" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Default Folder Link or ID</span>
                <span className="text-[11px] font-normal text-slate-400">Google Drive URL</span>
              </label>
              <input
                id="drive-folder-url"
                type="text"
                disabled={isManager}
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="drive-client-id" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>OAuth 2.0 Client ID</span>
                <span className="text-[11px] font-normal text-slate-400">Read-only Scope</span>
              </label>
              <div className="relative mt-1">
                <input
                  id="drive-client-id"
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
                <label htmlFor="drive-access-token" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>OAuth Access Token (Optional)</span>
                </label>
                <input
                  id="drive-access-token"
                  type="password"
                  disabled={isManager}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Bearer ya29.a0..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="drive-api-key" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Google API Key (Optional)</span>
                </label>
                <input
                  id="drive-api-key"
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
                {isConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectOAuth}
                    disabled={isDisconnecting}
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 disabled:opacity-50 transition-colors"
                  >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectOAuth}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>{isConnecting ? 'Connecting...' : 'Authorize with Google'}</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-xs transition-colors"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
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

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
