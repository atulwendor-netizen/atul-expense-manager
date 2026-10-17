import React from 'react';
import { DriveFolderFile } from '../types/index';
import {
  X,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  HardDrive,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { formatFileSize, isImageFile, isPdfFile, getDriveEmbedUrl, getDriveWebLink } from '../utils/googleDrive';

interface DriveFileViewerModalProps {
  file: DriveFolderFile | null;
  isOpen: boolean;
  onClose: () => void;
  onLinkToProof?: (file: DriveFolderFile) => void;
}

export const DriveFileViewerModal: React.FC<DriveFileViewerModalProps> = ({
  file,
  isOpen,
  onClose,
  onLinkToProof,
}) => {
  if (!isOpen || !file) return null;

  const isImg = isImageFile(file.mimeType, file.name);
  const isPdf = isPdfFile(file.mimeType, file.name);
  const driveWebLink = file.webViewLink || getDriveWebLink(file.id);
  const driveEmbedUrl = getDriveEmbedUrl(file.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isPdf ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
            }`}>
              {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {file.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{file.mimeType}</span>
                {file.modifiedTime && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={driveWebLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in Google Drive</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50 dark:bg-slate-950/50 flex flex-col items-center justify-center min-h-[420px]">
          {isImg ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <img
                src={file.thumbnailLink || driveEmbedUrl}
                alt={file.name}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200 dark:border-slate-800 bg-white"
                onError={(e) => {
                  // Fallback if direct image preview fails
                  const target = e.target as HTMLImageElement;
                  if (file.thumbnailLink && target.src !== file.thumbnailLink) {
                    target.src = file.thumbnailLink;
                  }
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[62vh] flex flex-col items-center justify-center rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
              {file.thumbnailLink && !file.thumbnailLink.includes('drive.google.com') ? (
                // SVG / High-res generated ticket/receipt preview
                <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-auto">
                  <img
                    src={file.thumbnailLink}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                // Official Google Drive PDF Embed Frame
                <iframe
                  src={driveEmbedUrl}
                  title={file.name}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-slate-400 mb-3" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                File Preview Not Available Inline
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-4">
                This file type ({file.mimeType}) can be viewed directly in your Google Drive storage.
              </p>
              <a
                href={driveWebLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Original File in Drive</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HardDrive className="h-3.5 w-3.5 text-blue-500" />
            <span>Stored in Google Drive • ID: {file.id}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {onLinkToProof && (
              <button
                type="button"
                onClick={() => {
                  onLinkToProof(file);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <FileCheck className="h-4 w-4" />
                <span>Import / Link to Expense</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
