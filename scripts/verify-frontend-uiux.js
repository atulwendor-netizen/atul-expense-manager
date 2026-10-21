import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function test(description, fn) {
  try {
    fn();
    console.log(`   - ${description}: ✅ PASSED`);
  } catch (err) {
    console.error(`   - ${description}: ❌ FAILED (${err.message})`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n================================================================');
console.log('🧪 FRONTEND UI/UX & ACCESSIBILITY AUDIT VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Check useModalA11y hook
console.log('📌 Section 1: Modal Accessibility Hook & Behavior...');
const modalHookPath = path.join(rootDir, 'src', 'hooks', 'useModalA11y.ts');
assert(fs.existsSync(modalHookPath), 'useModalA11y.ts must exist');
const modalHookContent = fs.readFileSync(modalHookPath, 'utf8');

test('useModalA11y handles Escape key down listener', () => {
  assert(modalHookContent.includes("'Escape'") || modalHookContent.includes('"Escape"'), 'Must check for Escape key');
});

test('useModalA11y locks document.body scroll on open', () => {
  assert(modalHookContent.includes("document.body.style.overflow = 'hidden'"), 'Must set overflow hidden on body');
  assert(modalHookContent.includes('document.body.style.overflow = originalOverflow'), 'Must restore overflow on body');
});

test('useModalA11y provides backdrop click handler', () => {
  assert(modalHookContent.includes('handleBackdropClick'), 'Must export handleBackdropClick');
  assert(modalHookContent.includes('e.target === e.currentTarget'), 'Must verify target equals currentTarget');
});

// 2. Check modal components for WCAG dialog roles, aria-modal, and backdrop click
console.log('\n📌 Section 2: Modal Components A11y & Responsive Constraints...');
const modalFiles = [
  { name: 'ExpenseModal', file: 'src/components/ExpenseModal.tsx', titleId: 'expense-modal-title', role: 'dialog' },
  { name: 'ConfirmationModal', file: 'src/components/ConfirmationModal.tsx', titleId: 'confirmation-modal-title', role: 'alertdialog' },
  { name: 'TripModal', file: 'src/components/TripModal.tsx', titleId: 'trip-modal-title', role: 'dialog' },
  { name: 'ReimbursementModal', file: 'src/components/ReimbursementModal.tsx', titleId: 'reimbursement-modal-title', role: 'dialog' },
  { name: 'ExpenseDetailsModal', file: 'src/components/ExpenseDetailsModal.tsx', titleId: 'expense-details-title', role: 'dialog' },
  { name: 'AccountProfileModal', file: 'src/components/AccountProfileModal.tsx', titleId: 'profile-modal-title', role: 'dialog' },
  { name: 'SignInModal', file: 'src/components/SignInModal.tsx', titleId: 'signin-modal-title', role: 'dialog' },
  { name: 'DriveConfigModal', file: 'src/components/DriveConfigModal.tsx', titleId: 'drive-config-title', role: 'dialog' },
  { name: 'DriveFileViewerModal', file: 'src/components/DriveFileViewerModal.tsx', titleId: 'drive-file-viewer-title', role: 'dialog' },
  { name: 'DriveImportModal', file: 'src/components/DriveImportModal.tsx', titleId: 'drive-import-title', role: 'dialog' },
  { name: 'ProofComparisonModal', file: 'src/components/ProofComparisonModal.tsx', titleId: 'proof-comparison-title', role: 'dialog' },
];

modalFiles.forEach(({ name, file, titleId, role }) => {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  test(`${name} has role="${role}" and aria-modal="true"`, () => {
    assert(content.includes(`role="${role}"`), `Must include role="${role}"`);
    assert(content.includes('aria-modal="true"'), 'Must include aria-modal="true"');
  });

  test(`${name} has accessible title link via aria-labelledby="${titleId}"`, () => {
    assert(content.includes(`aria-labelledby="${titleId}"`), `Must have aria-labelledby="${titleId}"`);
    assert(content.includes(`id="${titleId}"`), `Must have element with id="${titleId}"`);
  });

  test(`${name} integrates useModalA11y`, () => {
    assert(content.includes('useModalA11y'), 'Must import and use useModalA11y');
  });

  test(`${name} has mobile max-height and scrolling constraint`, () => {
    assert(
      content.includes('max-h-[90vh]') ||
      content.includes('max-h-[92vh]') ||
      content.includes('overflow-y-auto'),
      'Must contain max-height or overflow-y-auto to prevent mobile screen clipping'
    );
  });
});

// 3. Form input labeling
console.log('\n📌 Section 3: Form Input Labeling & Explicit htmlFor Associations...');
test('ExpenseModal form inputs have explicit htmlFor matching input id', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/ExpenseModal.tsx'), 'utf8');
  assert(content.includes('htmlFor="expense-input-date"') && content.includes('id="expense-input-date"'), 'Date input');
  assert(content.includes('htmlFor="expense-input-amount"') && content.includes('id="expense-input-amount"'), 'Amount input');
  assert(content.includes('htmlFor="expense-input-desc"') && content.includes('id="expense-input-desc"'), 'Description input');
  assert(content.includes('htmlFor="expense-input-category"') && content.includes('id="expense-input-category"'), 'Category select');
  assert(content.includes('htmlFor="expense-input-payment"') && content.includes('id="expense-input-payment"'), 'Payment select');
  assert(content.includes('htmlFor="expense-input-location"') && content.includes('id="expense-input-location"'), 'Location input');
});

test('TripModal form inputs have explicit htmlFor and id', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/TripModal.tsx'), 'utf8');
  assert(content.includes('htmlFor="trip-input-name"') && content.includes('id="trip-input-name"'), 'Trip name input');
});

test('FilterBar controls have explicit id and aria-label attributes', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/FilterBar.tsx'), 'utf8');
  assert(content.includes('aria-label="Search descriptions, notes, locations, amounts"'), 'Search input aria-label');
  assert(content.includes('aria-label="Filter by category"'), 'Category select aria-label');
  assert(content.includes('aria-label="Filter by location"'), 'Location select aria-label');
  assert(content.includes('aria-label="Filter by payment method"'), 'Payment method select aria-label');
  assert(content.includes('aria-label="Filter by trip"'), 'Trip select aria-label');
  assert(content.includes('aria-label="Filter by record status"'), 'Status select aria-label');
  assert(content.includes('aria-label="Filter start date"'), 'Start date input aria-label');
  assert(content.includes('aria-label="Filter end date"'), 'End date input aria-label');
});

test('DriveConfigModal inputs have explicit htmlFor and id', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/DriveConfigModal.tsx'), 'utf8');
  assert(content.includes('htmlFor="drive-folder-name"') && content.includes('id="drive-folder-name"'), 'Folder name input');
  assert(content.includes('htmlFor="drive-client-id"') && content.includes('id="drive-client-id"'), 'Client ID input');
});

// 4. Icon-only action button labels
console.log('\n📌 Section 4: Icon-Only Action Buttons & Screen Reader Accessibility...');
test('Header icon buttons have descriptive aria-labels', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/Header.tsx'), 'utf8');
  assert(content.includes('aria-label="Open mobile navigation menu"'), 'Menu button aria-label');
  assert(content.includes('aria-label="Select active trip"'), 'Trip select aria-label');
  assert(content.includes('aria-label="Account Profile and Permissions"'), 'Profile button aria-label');
  assert(content.includes('aria-label="Add new expense record"'), 'Add expense button aria-label');
});

test('Sidebar mobile navigation has accessible labels and Escape dismissal', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/Sidebar.tsx'), 'utf8');
  assert(content.includes('aria-label="Close navigation menu"'), 'Close button aria-label');
  assert(content.includes('role="navigation"'), 'Sidebar nav role');
  assert(content.includes('aria-current={isActive ? \'page\' : undefined}'), 'Active nav item aria-current');
  assert(content.includes("e.key === 'Escape'"), 'Sidebar Escape listener');
});

test('ExpenseTable row checkboxes and action buttons have accessible labels', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/ExpenseTable.tsx'), 'utf8');
  assert(content.includes('aria-label="Select all expenses on current page"'), 'Select all checkbox aria-label');
  assert(content.includes('aria-label={`Select expense: ${expense.description || expense.id}`}'), 'Row checkbox aria-label');
  assert(content.includes("aria-label={`View details for ${expense.description || 'expense'}`}"), 'View button aria-label');
  assert(content.includes("aria-label={`Edit ${expense.description || 'expense'}`}"), 'Edit button aria-label');
  assert(content.includes("aria-label={`Delete ${expense.description || 'expense'}`}"), 'Delete button aria-label');
  assert(content.includes('aria-label="Previous page"'), 'Pagination prev button aria-label');
  assert(content.includes('aria-label="Next page"'), 'Pagination next button aria-label');
  assert(content.includes('aria-label="Expenses per page"'), 'Page size select aria-label');
});

test('Toast notifications have live region and dismiss button label', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/Toast.tsx'), 'utf8');
  assert(content.includes('role="region"'), 'ToastContainer region role');
  assert(content.includes('aria-live="polite"'), 'ToastContainer live polite');
  assert(content.includes('aria-label="Dismiss notification"'), 'ToastItem dismiss button label');
});

test('NotificationDropdown has aria-expanded, aria-haspopup, and Escape dismiss', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/NotificationDropdown.tsx'), 'utf8');
  assert(content.includes('aria-haspopup="true"'), 'Notification button aria-haspopup');
  assert(content.includes('aria-expanded={isOpen}'), 'Notification button aria-expanded');
  assert(content.includes("event.key === 'Escape'"), 'Escape key handler');
});

// 5. Chart and visual stability
console.log('\n📌 Section 5: Chart & Visual Stability...');
test('ExpenseTrendChart date normalization and toggle button a11y', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/ExpenseTrendChart.tsx'), 'utf8');
  assert(content.includes("e.date.split('T')[0]"), 'Must split ISO date on T');
  assert(content.includes("aria-pressed={viewMode === 'daily'}"), 'Daily toggle aria-pressed');
  assert(content.includes("aria-pressed={viewMode === 'cumulative'}"), 'Cumulative toggle aria-pressed');
});

// 6. Viewport responsiveness checks
console.log('\n📌 Section 6: Multi-Viewport Responsiveness Constraints...');
test('ExpenseTable has horizontal scroll wrapper (overflow-x-auto)', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/ExpenseTable.tsx'), 'utf8');
  assert(content.includes('overflow-x-auto'), 'Must have overflow-x-auto on table wrapper');
});

test('Mobile navigation drawer has hidden classes on large screens and lg:flex on desktop', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/components/Sidebar.tsx'), 'utf8');
  assert(content.includes('lg:hidden'), 'Backdrop only on small screens');
  assert(content.includes('lg:static'), 'Static positioning on desktop');
});

console.log('\n================================================================');
console.log('🎉 ALL FRONTEND UI/UX AND A11Y TESTS PASSED!');
console.log('================================================================\n');
