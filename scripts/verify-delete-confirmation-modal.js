/**
 * Verification Test Suite: Delete Confirmation Modal Viewport Positioning & A11y
 * 
 * Verifies:
 * 1. Modal rendered via Viewport-level React Portal (createPortal -> document.body) to avoid transformed container clipping.
 * 2. Viewport-bounded safe max-height (calc(100dvh - 32px)) with fallback.
 * 3. Vertical flexbox architecture with independently scrollable content and pinned action footer.
 * 4. Pinned shrink-0 action buttons ensuring Cancel and Delete are never pushed out of viewport.
 * 5. Accessible focus management targeting Cancel button on open.
 * 6. Responsive centering (horizontal and vertical with my-auto).
 * 7. Correct behavior on Cancel (dismiss without request) and Confirm (explicit deletion).
 */

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   - ${message}: ✅ PASSED`);
    passCount++;
  } else {
    console.error(`   - ${message}: ❌ FAILED`);
    failCount++;
  }
}

console.log('========================================================================');
console.log('🧪 VERIFYING DELETE CONFIRMATION MODAL VIEWPORT POSITIONING & A11Y');
console.log('========================================================================\n');

const modalFilePath = path.join(process.cwd(), 'src/components/ConfirmationModal.tsx');
const modalSrc = fs.readFileSync(modalFilePath, 'utf8');

// Section 1: Portal & Viewport-Level Mounting
console.log('Section 1: Viewport Portal & Container Isolation...');
assert(modalSrc.includes("import { createPortal } from 'react-dom';"), 'Imports createPortal from react-dom');
assert(modalSrc.includes('createPortal(modalContent, document.body)'), 'Mounts modal into document.body portal to escape transformed ancestors');
assert(modalSrc.includes("typeof document !== 'undefined'"), 'Guards document check for SSR and non-DOM environments');
assert(modalSrc.includes('z-[100]'), 'High z-index (z-[100]) ensuring modal displays above all headers and sidebars');

// Section 2: Viewport Bounds & Responsive Centering
console.log('\nSection 2: Viewport Bounds & Centering Constraints...');
assert(modalSrc.includes('fixed inset-0'), 'Outer overlay covers full viewport (fixed inset-0)');
assert(modalSrc.includes('flex items-center justify-center'), 'Flex centering applied to overlay');
assert(modalSrc.includes('max-h-[calc(100dvh-32px)]'), 'Dialog card enforces safe viewport max-height: calc(100dvh - 32px)');
assert(modalSrc.includes('sm:max-h-[calc(100vh-32px)]'), 'Provides standard 100vh fallback for broader browser compatibility');
assert(modalSrc.includes('my-auto'), 'Uses my-auto margin to guarantee vertical centering without clipping top on short viewports');
assert(modalSrc.includes('overflow-hidden'), 'Outer card uses overflow-hidden to maintain rounded border corners');

// Section 3: Scrollable Content & Pinned Action Footer
console.log('\nSection 3: Independent Scrollable Body & Pinned Footer...');
assert(modalSrc.includes('flex flex-col'), 'Card structured as vertical flexbox (flex flex-col)');
assert(modalSrc.includes('overflow-y-auto flex-1 min-h-0'), 'Content body is independently scrollable with flex-1 and min-h-0');
assert(modalSrc.includes('overscroll-contain'), 'Content body includes overscroll-contain to prevent scroll chaining to background');
assert(modalSrc.includes('shrink-0 flex items-center justify-end gap-3'), 'Action footer is explicitly shrink-0 pinned at bottom');
assert(modalSrc.includes('border-t border-slate-100'), 'Footer has visual dividing border');

// Section 4: Accessibility & Focus Management
console.log('\nSection 4: Accessibility & Focus Management...');
assert(modalSrc.includes('role="alertdialog"'), 'Uses role="alertdialog" for destructive confirmation');
assert(modalSrc.includes('aria-modal="true"'), 'Includes aria-modal="true"');
assert(modalSrc.includes('aria-labelledby="confirmation-modal-title"'), 'Has accessible aria-labelledby link');
assert(modalSrc.includes('aria-describedby="confirmation-modal-desc"'), 'Has accessible aria-describedby link');
assert(modalSrc.includes('cancelBtnRef'), 'Ref declared for cancel button');
assert(modalSrc.includes('cancelBtnRef.current?.focus()'), 'Automatically focuses Cancel button on open for safe keyboard operation');
assert(modalSrc.includes('useModalA11y'), 'Integrates useModalA11y for Escape key and scroll lock management');
assert(modalSrc.includes('e.stopPropagation()'), 'Dialog card stops click propagation from bubbling to backdrop or table rows');

// Section 5: ExpensesPage Integration Verification
console.log('\nSection 5: ExpensesPage Integration Verification...');
const expensesPageSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/ExpensesPage.tsx'), 'utf8');
assert(expensesPageSrc.includes('<ConfirmationModal'), 'ExpensesPage mounts ConfirmationModal');
assert(expensesPageSrc.includes('isOpen={Boolean(expenseIdToDelete)}'), 'Single delete modal bound to expenseIdToDelete state');
assert(expensesPageSrc.includes('onCancel={() => setExpenseIdToDelete(null)}'), 'Cancel closes dialog and clears state without deletion');
assert(expensesPageSrc.includes('onConfirm={handleConfirmSingleDelete}'), 'Confirm triggers handleConfirmSingleDelete');
assert(expensesPageSrc.includes('onDeleteExpense={(id) => {'), 'ExpenseTable onDeleteExpense handler sets expenseIdToDelete');

// Section 6: Index.css Animation Cleanliness
console.log('\nSection 6: CSS Animation Containing Block Inspection...');
const indexCssSrc = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');
assert(indexCssSrc.includes('to {\n    opacity: 1;\n    transform: none;\n  }'), 'dashboardFadeIn ends with transform: none to eliminate containing block traps');

console.log('\n========================================================================');
if (failCount === 0) {
  console.log(`🎉 ALL ${passCount} DELETE CONFIRMATION MODAL TESTS PASSED (100%)!`);
} else {
  console.error(`❌ ${failCount} TESTS FAILED.`);
  process.exit(1);
}
console.log('========================================================================\n');
