/**
 * Persistent Receipt Storage Service
 * 
 * Provides robust, persistent storage for receipt images and PDF documents:
 * - Uses client-side IndexedDB ('AtulReceiptsDB') for high-capacity binary & base64 storage (no 5MB quota trap).
 * - Graceful fallback to namespaced localStorage & memory cache for SSR/Node/test environments.
 * - Secure workspace-level partitioning: each receipt key is scoped to workspaceId:expenseId.
 * - Supports PNG, JPG, JPEG, WebP, and PDF up to 10MB.
 */

import { ReceiptMetadata } from '../types/index';

export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
];

export const ALLOWED_RECEIPT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];

export interface StoredReceiptRecord {
  storageRef: string;
  expenseId: string;
  workspaceId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  uploadedAt: string;
  updatedAt: string;
}

class ReceiptStorageService {
  private memCache = new Map<string, StoredReceiptRecord>();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
      this.initIndexedDB();
    }
  }

  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open('AtulReceiptsDB', 1);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains('receipts')) {
            const store = db.createObjectStore('receipts', { keyPath: 'storageRef' });
            store.createIndex('expenseId', 'expenseId', { unique: false });
            store.createIndex('workspaceId', 'workspaceId', { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB open error; falling back to memory/local storage');
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB initialization failed:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  public getStorageRef(workspaceId: string, expenseId: string): string {
    const cleanWs = (workspaceId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanExp = (expenseId || 'new').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `rcpt_${cleanWs}_${cleanExp}`;
  }

  public validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${mbSize}MB) exceeds the 10MB limit. Please upload a smaller file or compressed PDF.`,
      };
    }

    const lowerName = file.name.toLowerCase();
    const hasAllowedExt = ALLOWED_RECEIPT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const isAllowedType = ALLOWED_RECEIPT_MIME_TYPES.includes(file.type.toLowerCase()) || hasAllowedExt;

    if (!isAllowedType) {
      return {
        valid: false,
        error: 'Unsupported file type. Supported formats are PNG, JPG, JPEG, WebP, and PDF.',
      };
    }

    return { valid: true };
  }

  public async readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to Data URL.'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Error reading receipt file.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Securely saves a receipt file into persistent storage linked to expenseId and workspaceId.
   */
  public async saveReceipt(
    expenseId: string,
    workspaceId: string,
    fileData: {
      fileName: string;
      fileType: string;
      fileSize: number;
      dataUrl: string;
    }
  ): Promise<{ storageRef: string; metadata: ReceiptMetadata }> {
    const storageRef = this.getStorageRef(workspaceId, expenseId);
    const now = new Date().toISOString();

    const record: StoredReceiptRecord = {
      storageRef,
      expenseId,
      workspaceId,
      fileName: fileData.fileName,
      fileType: fileData.fileType || 'application/octet-stream',
      fileSize: fileData.fileSize,
      dataUrl: fileData.dataUrl,
      uploadedAt: now,
      updatedAt: now,
    };

    // 1. Keep memory cache for instant synchronous retrieval
    this.memCache.set(storageRef, record);

    // 2. Persist to IndexedDB
    try {
      const db = await this.initIndexedDB();
      if (db) {
        await new Promise<void>((resolve, reject) => {
          try {
            const tx = db.transaction('receipts', 'readwrite');
            const store = tx.objectStore('receipts');
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          } catch (e) {
            reject(e);
          }
        });
      } else {
        // Fallback to localStorage if data is within reasonable quota
        this.saveToLocalStorageFallback(storageRef, record);
      }
    } catch (err) {
      console.warn('Failed to write receipt to IndexedDB, trying localStorage fallback:', err);
      this.saveToLocalStorageFallback(storageRef, record);
    }

    const metadata: ReceiptMetadata = {
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      uploadedAt: now,
      storageRef,
      verificationStatus: 'receipt_attached',
    };

    return { storageRef, metadata };
  }

  /**
   * Retrieves the receipt document for an expense.
   */
  public async getReceipt(
    storageRefOrExpenseId: string,
    workspaceId?: string
  ): Promise<StoredReceiptRecord | null> {
    const storageRef = storageRefOrExpenseId.startsWith('rcpt_')
      ? storageRefOrExpenseId
      : this.getStorageRef(workspaceId || 'default', storageRefOrExpenseId);

    // 1. Check memory cache first
    if (this.memCache.has(storageRef)) {
      return this.memCache.get(storageRef)!;
    }

    // 2. Query IndexedDB
    try {
      const db = await this.initIndexedDB();
      if (db) {
        const record = await new Promise<StoredReceiptRecord | null>((resolve) => {
          try {
            const tx = db.transaction('receipts', 'readonly');
            const store = tx.objectStore('receipts');
            const req = store.get(storageRef);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        });

        if (record) {
          this.memCache.set(storageRef, record);
          return record;
        }
      }
    } catch (e) {
      console.warn('IndexedDB read error:', e);
    }

    // 3. Fallback to localStorage
    const local = this.getFromLocalStorageFallback(storageRef);
    if (local) {
      this.memCache.set(storageRef, local);
      return local;
    }

    return null;
  }

  /**
   * Deletes a receipt from persistent storage.
   */
  public async deleteReceipt(storageRefOrExpenseId: string, workspaceId?: string): Promise<boolean> {
    const storageRef = storageRefOrExpenseId.startsWith('rcpt_')
      ? storageRefOrExpenseId
      : this.getStorageRef(workspaceId || 'default', storageRefOrExpenseId);

    this.memCache.delete(storageRef);

    try {
      const db = await this.initIndexedDB();
      if (db) {
        await new Promise<void>((resolve) => {
          try {
            const tx = db.transaction('receipts', 'readwrite');
            const store = tx.objectStore('receipts');
            const req = store.delete(storageRef);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          } catch {
            resolve();
          }
        });
      }
    } catch {
      // Ignore
    }

    this.removeFromLocalStorageFallback(storageRef);
    return true;
  }

  private saveToLocalStorageFallback(storageRef: string, record: StoredReceiptRecord) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(`atul_receipt_${storageRef}`, JSON.stringify(record));
    } catch {
      // Quota exceeded: keep in memory cache
    }
  }

  private getFromLocalStorageFallback(storageRef: string): StoredReceiptRecord | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(`atul_receipt_${storageRef}`);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return null;
  }

  private removeFromLocalStorageFallback(storageRef: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(`atul_receipt_${storageRef}`);
    } catch {
      // Ignore
    }
  }
}

export const receiptStorage = new ReceiptStorageService();
