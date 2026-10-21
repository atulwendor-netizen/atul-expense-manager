/**
 * Verification Script: Scrolling Across Sections & Modal Viewport Integrity
 * Tests reference-counted scroll locking, modal viewport constraints,
 * tab navigation window repositioning, and ChatPage auto-scrolling containment.
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

console.log('================================================================');
console.log('🧪 VERIFYING SCROLLING BEHAVIOR & MODAL VIEWPORT REPAIR');
console.log('================================================================\n');

// -------------------------------------------------------------
// Section 1: Reference-Counted Scroll Lock Logic Unit Test
// -------------------------------------------------------------
console.log('Section 1: Reference-Counted Scroll Lock Unit Tests...');

// Simulate DOM document.body
const mockBody = {
  style: {
    overflow: ''
  }
};
globalThis.document = {
  body: mockBody
};

// Replicate the useModalA11y reference-counted logic in pure JS
let activeLockCount = 0;
let previousBodyOverflow = '';

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (activeLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeLockCount++;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  activeLockCount = Math.max(0, activeLockCount - 1);
  if (activeLockCount === 0) {
    document.body.style.overflow =
      previousBodyOverflow && previousBodyOverflow !== 'hidden' ? previousBodyOverflow : '';
    previousBodyOverflow = '';
  }
}

// Initial state
mockBody.style.overflow = '';
assert(mockBody.style.overflow === '', 'Initial body overflow is empty string (scrolling enabled)');

// Modal 1 opens
lockBodyScroll();
assert(mockBody.style.overflow === 'hidden', 'Modal 1 opens: body overflow locked to "hidden"');
assert(activeLockCount === 1, 'Active lock count is 1');

// Modal 2 opens (e.g. DetailsModal -> EditModal transition or nested confirm)
lockBodyScroll();
assert(mockBody.style.overflow === 'hidden', 'Modal 2 opens concurrently: body overflow stays "hidden"');
assert(activeLockCount === 2, 'Active lock count incremented to 2');

// Modal 1 closes while Modal 2 is still open
unlockBodyScroll();
assert(mockBody.style.overflow === 'hidden', 'Modal 1 closes: body overflow remains "hidden" for Modal 2');
assert(activeLockCount === 1, 'Active lock count is 1');

// Modal 2 closes
unlockBodyScroll();
assert(mockBody.style.overflow === '', 'Modal 2 closes: body overflow restored to empty string (scrolling restored)');
assert(activeLockCount === 0, 'Active lock count is 0');

// Excess unlock call safety
unlockBodyScroll();
assert(activeLockCount === 0, 'Excess unlock calls safely clamp at 0');
assert(mockBody.style.overflow === '', 'Excess unlock maintains empty string overflow');


// -------------------------------------------------------------
// Section 2: Code Inspection: useModalA11y.ts
// -------------------------------------------------------------
console.log('\nSection 2: Code Inspection of useModalA11y.ts...');
const useModalA11ySrc = fs.readFileSync(path.join(process.cwd(), 'src/hooks/useModalA11y.ts'), 'utf8');

assert(useModalA11ySrc.includes('export function lockBodyScroll()'), 'useModalA11y exports lockBodyScroll');
assert(useModalA11ySrc.includes('export function unlockBodyScroll()'), 'useModalA11y exports unlockBodyScroll');
assert(useModalA11ySrc.includes('let activeLockCount = 0;'), 'Uses module-level activeLockCount counter');
assert(useModalA11ySrc.includes('lockBodyScroll();'), 'useModalA11y calls lockBodyScroll when modal opens');
assert(useModalA11ySrc.includes('unlockBodyScroll();'), 'useModalA11y calls unlockBodyScroll on unmount/close');


// -------------------------------------------------------------
// Section 3: Code Inspection: ExpenseDetailsModal.tsx
// -------------------------------------------------------------
console.log('\nSection 3: Code Inspection of ExpenseDetailsModal.tsx...');
const detailsModalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/ExpenseDetailsModal.tsx'), 'utf8');

assert(!detailsModalSrc.includes('fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto'),
  'Outer overlay no longer has unconstrained overflow-y-auto');
assert(detailsModalSrc.includes('max-h-[calc(100dvh-1.5rem)]'), 'Card has viewport-bounded max-height (100dvh)');
assert(detailsModalSrc.includes('flex flex-col'), 'Card structured as vertical flexbox');
assert(detailsModalSrc.includes('shrink-0 bg-white dark:bg-slate-900 z-10'), 'Header is shrink-0 and pinned at top');
assert(detailsModalSrc.includes('overflow-y-auto flex-1 overscroll-contain'), 'Content section is independently scrollable with overscroll-contain');
assert(detailsModalSrc.includes('shrink-0') && detailsModalSrc.includes('border-t border-slate-100'), 'Footer actions are pinned at bottom with shrink-0');
assert(detailsModalSrc.includes('useModalA11y'), 'Uses useModalA11y hook for escape key and scroll locking');


// -------------------------------------------------------------
// Section 4: Code Inspection: ExpenseModal.tsx & ReimbursementModal.tsx
// -------------------------------------------------------------
console.log('\nSection 4: Code Inspection of ExpenseModal.tsx & ReimbursementModal.tsx...');
const expenseModalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/ExpenseModal.tsx'), 'utf8');
const reimbModalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/ReimbursementModal.tsx'), 'utf8');

assert(expenseModalSrc.includes('max-h-[calc(100dvh-1.5rem)]'), 'ExpenseModal card has viewport-bounded max-height');
assert(expenseModalSrc.includes('shrink-0 bg-white dark:bg-slate-900 z-10'), 'ExpenseModal header pinned with shrink-0');
assert(expenseModalSrc.includes('overflow-y-auto flex-1 overscroll-contain'), 'ExpenseModal form body is independently scrollable');
assert(expenseModalSrc.includes('shrink-0') && expenseModalSrc.includes('Modal Actions - Pinned'), 'ExpenseModal action buttons pinned with shrink-0');

assert(reimbModalSrc.includes('max-h-[calc(100dvh-1.5rem)]'), 'ReimbursementModal card has viewport-bounded max-height');
assert(reimbModalSrc.includes('shrink-0 bg-white dark:bg-slate-900 z-10'), 'ReimbursementModal header pinned with shrink-0');
assert(reimbModalSrc.includes('overflow-y-auto flex-1 overscroll-contain'), 'ReimbursementModal form body is independently scrollable');


// -------------------------------------------------------------
// Section 5: Code Inspection: AccountProfileModal.tsx & SignInModal.tsx
// -------------------------------------------------------------
console.log('\nSection 5: Code Inspection of AccountProfileModal.tsx & SignInModal.tsx...');
const profileModalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/AccountProfileModal.tsx'), 'utf8');
const signInModalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SignInModal.tsx'), 'utf8');

assert(profileModalSrc.includes('max-h-[calc(100dvh-1.5rem)]'), 'AccountProfileModal card has viewport-bounded max-height');
assert(profileModalSrc.includes('shrink-0') && profileModalSrc.includes('Modal Footer - Pinned'), 'AccountProfileModal footer is pinned with shrink-0');
assert(profileModalSrc.includes('overflow-y-auto') && profileModalSrc.includes('overscroll-contain'), 'AccountProfileModal body is independently scrollable');

assert(signInModalSrc.includes('max-h-[calc(100dvh-1.5rem)]'), 'SignInModal card has viewport-bounded max-height');
assert(signInModalSrc.includes('shrink-0 z-10'), 'SignInModal header is pinned with shrink-0');
assert(signInModalSrc.includes('overflow-y-auto overscroll-contain'), 'SignInModal body is independently scrollable');


// -------------------------------------------------------------
// Section 6: UserManagementSection & Sidebar Scroll Lock Integration
// -------------------------------------------------------------
console.log('\nSection 6: UserManagementSection & Sidebar Scroll Lock Integration...');
const userMgmtSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/UserManagementSection.tsx'), 'utf8');
const sidebarSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/Sidebar.tsx'), 'utf8');

assert(!userMgmtSrc.includes("document.body.style.overflow = 'hidden'"), 'UserManagementSection no longer directly mutates document.body.style.overflow');
assert(userMgmtSrc.includes('lockBodyScroll()') && userMgmtSrc.includes('unlockBodyScroll()'), 'UserManagementSection uses lockBodyScroll() and unlockBodyScroll()');

assert(!sidebarSrc.includes("document.body.style.overflow = 'hidden'"), 'Sidebar no longer directly mutates document.body.style.overflow');
assert(sidebarSrc.includes('lockBodyScroll()') && sidebarSrc.includes('unlockBodyScroll()'), 'Sidebar uses lockBodyScroll() and unlockBodyScroll()');
assert(sidebarSrc.includes('lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0'), 'Sidebar navigation uses sticky positioning on desktop');


// -------------------------------------------------------------
// Section 7: ChatPage Auto-Scroll Containment & App.tsx Tab Scroll Reset
// -------------------------------------------------------------
console.log('\nSection 7: ChatPage Auto-Scroll & Tab Navigation Scroll Reset...');
const chatPageSrc = fs.readFileSync(path.join(process.cwd(), 'src/pages/ChatPage.tsx'), 'utf8');
const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');

assert(!chatPageSrc.includes('scrollIntoView'), 'ChatPage no longer calls scrollIntoView() (which scrolls window and dislocates page layout)');
assert(chatPageSrc.includes('messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight'), 'ChatPage scrolls only its internal messages container');
assert(chatPageSrc.includes('ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain"'), 'Chat messages container has overscroll-contain to isolate wheel/touch scroll');

assert(appSrc.includes("window.scrollTo({ top: 0, left: 0, behavior: 'instant' })"), 'handleSelectTab resets window scroll position to top (0,0) instantly on tab change');


// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`Results: ${passCount} passed, ${failCount} failed`);
if (failCount === 0) {
  console.log('🎉 ALL SCROLLING & VIEWPORT REGRESSION TESTS PASSED (100%)');
  console.log('================================================================');
  process.exit(0);
} else {
  console.error('💥 SCROLLING REGRESSION TESTS FAILED');
  console.log('================================================================');
  process.exit(1);
}
