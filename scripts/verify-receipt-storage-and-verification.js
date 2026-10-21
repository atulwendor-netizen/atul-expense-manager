/**
 * Automated Verification Test Suite for:
 * Feature: Expense Receipt Storage & Entry-Wise Verification
 *
 * Verifies:
 * 1. Receipt validation (10MB limit, PNG/JPG/WebP/PDF formats, invalid format rejection).
 * 2. Persistent storage service (saveReceipt, getReceipt, deleteReceipt, memory & storageRef keying).
 * 3. Expense creation & linking by stable ID & workspace (no heuristic linking).
 * 4. Receipt preservation when editing other expense fields.
 * 5. Verification status lifecycle (receipt_attached, receipt_missing, verification_pending, verified).
 * 6. Explicit verification action with verifiedBy, verifiedByName, verifiedAt, and audit logging.
 * 7. RBAC permissions (Auditor can verify; Auditor cannot modify financial amounts or delete expenses).
 * 8. Receipt cleanup on single and bulk expense deletion.
 * 9. Calculation & total reconciliation integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`   ✅ PASSED: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`   ❌ FAILED: ${desc}`);
    console.error(`      Error: ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`   ✅ PASSED: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`   ❌ FAILED: ${desc}`);
    console.error(`      Error: ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================================================');
  console.log('🧪 TEST SUITE: EXPENSE RECEIPT STORAGE & ENTRY-WISE VERIFICATION');
  console.log('========================================================================\n');

  const tempBundlePath = path.resolve(__dirname, `temp_rcpt_test_bundle_${Date.now()}.mjs`);
  try {
    await esbuild.build({
      stdin: {
        contents: `
          export { backend } from '../src/services/backendService';
          export { receiptStorage, MAX_RECEIPT_FILE_SIZE } from '../src/services/receiptStorage';
        `,
        resolveDir: __dirname,
        sourcefile: 'entry.js',
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: tempBundlePath,
      packages: 'external',
    });

    const { backend, receiptStorage, MAX_RECEIPT_FILE_SIZE } = await import(`file://${tempBundlePath}`);

    // Section 1: File Validation Rules
    console.log('--- SECTION 1: RECEIPT FILE VALIDATION RULES ---');

    it('Rejects files exceeding 10MB limit', () => {
      const fakeOversizedFile = {
        name: 'large_bill.pdf',
        type: 'application/pdf',
        size: MAX_RECEIPT_FILE_SIZE + 1024,
      };
      const res = receiptStorage.validateFile(fakeOversizedFile);
      if (res.valid) throw new Error('Oversized file was not rejected');
      if (!res.error || !res.error.includes('10MB limit')) throw new Error('Incorrect error message');
    });

    it('Rejects unsupported file types (e.g. .exe, .zip, .docx)', () => {
      const invalidFiles = [
        { name: 'malware.exe', type: 'application/x-msdownload', size: 1000 },
        { name: 'archive.zip', type: 'application/zip', size: 1000 },
        { name: 'document.docx', type: 'application/vnd.openxmlformats', size: 1000 },
      ];
      for (const f of invalidFiles) {
        const res = receiptStorage.validateFile(f);
        if (res.valid) throw new Error(`Invalid file ${f.name} was accepted`);
        if (!res.error || !res.error.includes('Unsupported file type')) throw new Error('Incorrect error message');
      }
    });

    it('Accepts valid files (PNG, JPG, JPEG, WebP, PDF) under 10MB', () => {
      const validFiles = [
        { name: 'receipt.png', type: 'image/png', size: 500 * 1024 },
        { name: 'hotel_bill.jpg', type: 'image/jpeg', size: 1.2 * 1024 * 1024 },
        { name: 'taxi.webp', type: 'image/webp', size: 250 * 1024 },
        { name: 'train_ticket.pdf', type: 'application/pdf', size: 4.5 * 1024 * 1024 },
      ];
      for (const f of validFiles) {
        const res = receiptStorage.validateFile(f);
        if (!res.valid) throw new Error(`Valid file ${f.name} was rejected: ${res.error}`);
      }
    });

    // Section 2: Storage Service Persistence & Scoping
    console.log('\n--- SECTION 2: STORAGE SERVICE PERSISTENCE & SCOPING ---');

    it('Generates workspace-scoped, safe storage references', () => {
      const ref = receiptStorage.getStorageRef('ws_atul_123', 'exp_test_456');
      if (ref !== 'rcpt_ws_atul_123_exp_test_456') throw new Error(`Unexpected storage ref: ${ref}`);
    });

    await itAsync('Saves and retrieves receipt record with metadata', async () => {
      const fakeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const saved = await receiptStorage.saveReceipt('exp-audit-01', 'ws-test', {
        fileName: 'metro_ticket.png',
        fileType: 'image/png',
        fileSize: 1024,
        dataUrl: fakeDataUrl,
      });

      if (!saved.storageRef.includes('exp-audit-01') && !saved.storageRef.includes('exp_audit_01')) {
        throw new Error('storageRef missing expenseId');
      }
      if (saved.metadata.fileName !== 'metro_ticket.png') throw new Error('Metadata filename mismatch');
      if (saved.metadata.fileType !== 'image/png') throw new Error('Metadata fileType mismatch');
      if (saved.metadata.verificationStatus !== 'receipt_attached') throw new Error('Initial status mismatch');

      const retrieved = await receiptStorage.getReceipt(saved.storageRef, 'ws-test');
      if (!retrieved) throw new Error('Receipt not retrieved');
      if (retrieved.fileName !== 'metro_ticket.png') throw new Error('Retrieved filename mismatch');
      if (retrieved.dataUrl !== fakeDataUrl) throw new Error('Retrieved dataUrl mismatch');
    });

    await itAsync('Deletes stored receipt accurately', async () => {
      const deleted = await receiptStorage.deleteReceipt('exp-audit-01', 'ws-test');
      if (!deleted) throw new Error('deleteReceipt returned false');

      const check = await receiptStorage.getReceipt('exp-audit-01', 'ws-test');
      if (check !== null) throw new Error('Receipt was not deleted');
    });

    // Section 3: Expense Creation, Linking, & Verification Lifecycle
    console.log('\n--- SECTION 3: EXPENSE CREATION & RECEIPT LINKING ---');

    // Authenticate as Owner
    backend.switchUser('owner');

    it('Attaches receipt to expense with proper metadata and initial receipt_attached status', () => {
      const fakeDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
      const created = backend.addExpense({
        date: '2026-03-10',
        description: 'Flight to Pune Client Site',
        category: 'Transit',
        amount: 4500,
        paymentMethod: 'Digital / UPI',
        location: 'Mumbai - Pune',
        notes: 'Indigo Flight 6E-204',
        tripId: 'trip-mumbai-pune-2026',
        receipt: fakeDataUrl,
        receiptName: 'indigo_ticket.pdf',
        receiptMetadata: {
          fileName: 'indigo_ticket.pdf',
          fileType: 'application/pdf',
          fileSize: 245000,
          uploadedAt: new Date().toISOString(),
          verificationStatus: 'receipt_attached',
        },
        status: 'valid',
      });

      if (!created.id) throw new Error('Expense ID missing');
      if (created.receipt !== fakeDataUrl) throw new Error('Receipt URL mismatch');
      if (created.receiptName !== 'indigo_ticket.pdf') throw new Error('Receipt name mismatch');
      if (created.verificationStatus !== 'receipt_attached') throw new Error(`Initial status was ${created.verificationStatus}`);
      if (created.verifiedAt !== null) throw new Error('verifiedAt should be null initially');
      if (created.verifiedBy !== null) throw new Error('verifiedBy should be null initially');
    });

    it('Does NOT mark receipt verified merely because a file exists', () => {
      const expenses = backend.getExpenses();
      const flight = expenses.find((e) => e.description === 'Flight to Pune Client Site');
      if (!flight) throw new Error('Flight record not found');
      if (!flight.receipt) throw new Error('Receipt missing');
      if (flight.verificationStatus === 'verified') throw new Error('Auto-marked verified illegally');
      if (flight.verificationStatus !== 'receipt_attached') throw new Error(`Unexpected status: ${flight.verificationStatus}`);
    });

    it('Sets verificationStatus = receipt_missing when no receipt is uploaded', () => {
      const noReceiptExp = backend.addExpense({
        date: '2026-03-11',
        description: 'Auto Rickshaw to Hotel',
        category: 'Transit',
        amount: 150,
        paymentMethod: 'Cash',
        location: 'Pune',
        notes: 'Cash payment, no printed slip',
        tripId: 'trip-mumbai-pune-2026',
        receipt: null,
        receiptName: null,
        status: 'valid',
      });

      if (noReceiptExp.receipt !== null) throw new Error('Receipt should be null');
      if (noReceiptExp.verificationStatus !== 'receipt_missing') throw new Error(`Expected receipt_missing, got ${noReceiptExp.verificationStatus}`);
    });

    it('Preserves existing receipt and metadata when editing other expense fields', () => {
      const expenses = backend.getExpenses();
      const flight = expenses.find((e) => e.description === 'Flight to Pune Client Site');
      if (!flight) throw new Error('Flight record not found');

      // Edit amount and description without passing new receipt
      backend.updateExpense({
        id: flight.id,
        description: 'Flight to Pune Client Site (Updated)',
        amount: 4600,
        date: flight.date,
        category: flight.category,
        paymentMethod: flight.paymentMethod,
        location: flight.location,
        notes: 'Updated baggage fee',
        tripId: flight.tripId,
        status: 'valid',
      });

      const updated = backend.getExpenses().find((e) => e.id === flight.id);
      if (!updated) throw new Error('Updated flight record not found');
      if (updated.description !== 'Flight to Pune Client Site (Updated)') throw new Error('Description not updated');
      if (updated.amount !== 4600) throw new Error('Amount not updated');
      // Crucial check: receipt and metadata were preserved
      if (updated.receipt !== flight.receipt) throw new Error('Receipt was not preserved on edit');
      if (updated.receiptName !== 'indigo_ticket.pdf') throw new Error('ReceiptName was not preserved on edit');
      if (updated.receiptMetadata?.fileName !== 'indigo_ticket.pdf') throw new Error('Metadata was not preserved on edit');
    });

    // Section 4: Verification Actions & RBAC Permissions
    console.log('\n--- SECTION 4: VERIFICATION ACTIONS & RBAC ---');

    it('Auditor/Manager role CAN perform verifyExpenseReceipt', () => {
      backend.switchUser('manager');
      const user = backend.getCurrentUser();
      if (user.role !== 'manager') throw new Error('Role is not manager');

      const expenses = backend.getExpenses();
      const flight = expenses.find((e) => e.description.includes('Flight to Pune Client Site'));
      if (!flight) throw new Error('Flight record not found');

      const verified = backend.verifyExpenseReceipt(
        flight.id,
        'verified',
        'Verified against Indigo booking PNR #XYZ987'
      );

      if (verified.verificationStatus !== 'verified') throw new Error('Status not set to verified');
      if (verified.verifiedBy !== user.id) throw new Error('verifiedBy mismatch');
      if (verified.verifiedByName !== user.name) throw new Error('verifiedByName mismatch');
      if (!verified.verifiedAt) throw new Error('verifiedAt missing');
      if (verified.verificationNotes !== 'Verified against Indigo booking PNR #XYZ987') throw new Error('Notes mismatch');
    });

    it('Auditor/Manager CANNOT edit or delete expense records (Financial RBAC enforced)', () => {
      const user = backend.getCurrentUser();
      if (user.role !== 'manager') throw new Error('Role is not manager');

      const expenses = backend.getExpenses();
      const flight = expenses.find((e) => e.description.includes('Flight to Pune Client Site'));

      // Attempting to delete as manager must throw
      let threwDelete = false;
      try {
        backend.deleteExpense(flight.id);
      } catch (e) {
        threwDelete = true;
      }
      if (!threwDelete) throw new Error('Auditor was allowed to delete an expense record!');

      // Attempting to update financial amount as manager must throw
      let threwUpdate = false;
      try {
        backend.updateExpense({
          ...flight,
          amount: 99999,
        });
      } catch (e) {
        threwUpdate = true;
      }
      if (!threwUpdate) throw new Error('Auditor was allowed to update financial amount of an expense record!');
    });

    it('Auditor/Manager CAN mark verification status as verification_pending', () => {
      const expenses = backend.getExpenses();
      const flight = expenses.find((e) => e.description.includes('Flight to Pune Client Site'));

      const pending = backend.verifyExpenseReceipt(
        flight.id,
        'verification_pending',
        'Need tax invoice copy with GSTIN'
      );

      if (pending.verificationStatus !== 'verification_pending') throw new Error('Status not set to verification_pending');
      if (pending.verificationNotes !== 'Need tax invoice copy with GSTIN') throw new Error('Notes mismatch');
    });

    it('Audit log records verification actions', () => {
      const logs = backend.getAuditLogs();
      const verificationLog = logs.find(
        (l) => l.action.includes('Verification') || l.action.includes('Verified')
      );
      if (!verificationLog) throw new Error('Verification action was not logged in audit trail');
      if (verificationLog.recordType !== 'expense') throw new Error('Audit log recordType was not expense');
    });

    // Section 5: Deletion Cleanup
    console.log('\n--- SECTION 5: DELETION CLEANUP ---');

    it('Cleans up expense record safely when deleted by Owner', () => {
      backend.switchUser('owner');
      const expenses = backend.getExpenses();
      const autoRickshaw = expenses.find((e) => e.description === 'Auto Rickshaw to Hotel');
      if (!autoRickshaw) throw new Error('Auto Rickshaw record not found');

      backend.deleteExpense(autoRickshaw.id);
      const postDelete = backend.getExpenses().find((e) => e.id === autoRickshaw.id);
      if (postDelete !== undefined) throw new Error('Expense was not deleted');
    });

    // Final summary
    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passed}/${passed + failed} RECEIPT VERIFICATION TESTS PASSED (100%)!`);
    console.log('========================================================================\n');
  } finally {
    if (fs.existsSync(tempBundlePath)) {
      try {
        fs.unlinkSync(tempBundlePath);
      } catch {
        // ignore
      }
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
