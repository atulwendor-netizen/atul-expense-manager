# Google Drive Payment Proof Integration Guide

## 1. Overview
Atul Expense Manager integrates directly with Google Drive to manage, browse, map, and audit payment receipts, invoices, and bank statements without storing duplicate copies on the application server.

Authorized Finance and Manager users can audit payment proofs side-by-side against expense records and approve or request clarifications with complete audit trail logging.

---

## 2. Google Cloud Console OAuth 2.0 Setup

To connect your Google Drive account, follow these steps in Google Cloud Console:

1. **Create or Select a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a project named `Atul Expense Manager` or select an existing project.

2. **Enable Google Drive API**:
   - Navigate to **APIs & Services > Library**.
   - Search for **Google Drive API** and click **Enable**.

3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Select **Internal** (for Netizen / Google Workspace) or **External** with test users.
   - App Name: `Atul Expense Manager`
   - User Support Email: `Atul.wendor@gmail.com`
   - Add Authorized Domain: `localhost` and your production domain.
   - Click **Save and Continue**.

4. **Add Minimum Required Scope (Least Privilege)**:
   - Scopes required:
     ```
     https://www.googleapis.com/auth/drive.readonly
     ```
   - *Security Note*: Atul Expense Manager requests **read-only** file metadata and content access. It does not request write, delete, or full drive scopes. Never share or store OAuth client secrets on frontend applications.

5. **Create OAuth 2.0 Client ID**:
   - Navigate to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Atul Expense Manager Web Client`.
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://your-production-domain.com`
   - Authorized redirect URIs:
     - `http://localhost:5173/payment-proofs`
     - `https://your-production-domain.com/payment-proofs`
   - Copy the generated **Client ID** (e.g. `78291038472-atul-expense-drive.apps.googleusercontent.com`).

6. **Configure Client in Atul Expense Manager**:
   - Go to **Payment Proofs > Drive Settings** in the application.
   - Enter your Client ID and verify the folder name: `Expense Manager Payment Proofs`.
   - Click **Save Configuration**.

---

## 3. Dedicated Folder Organization

Create a folder in Google Drive named:
```
Expense Manager Payment Proofs
```

Inside this folder, you can organize receipts into virtual categories:
- `Service Visit` (Recommended for service visit tickets, dorms, and food allowance receipts)
- `Mumbai & Pune` (Historical transit and local transport receipts)
- `Local Operations` (Supplies, local dispatches, and emergency courier bills)
- `Other Trips` (Ad-hoc travel and off-site operations)

> [!NOTE]
> The application uses **virtual categories**. You do not need to create nested folders if you prefer flat file naming; the system automatically detects keywords (e.g. `IRCTC`, `Hotel`, `Dorm`, `UPI`, `Dispatch`) and provides Smart OCR suggestions.

---

## 4. Google Drive Link Import & Viewer Workflow

### 4.1 Simple Folder Link Import
1. Upload payment screenshots, images, PDFs, or other supported records to Google Drive.
2. Copy the Google Drive folder link (e.g. `https://drive.google.com/drive/folders/1A2B3C...`) or individual file link.
3. Paste the link into the **Google Drive Folder Link Import** input at the top of the **Payment Proofs** page.
4. Click **Import / View**:
   - The application parses the folder ID and queries Google Drive API v3.
   - For authorized folders, all images (receipts, UPI screenshots) and PDF documents are immediately listed in the folder gallery.
5. **Interactive File Previews**:
   - Click **Preview** on any image to open the high-resolution image preview.
   - Click **View PDF** on any PDF document to open the embedded Google Drive PDF viewer.
   - Click **Drive** (`Open in Google Drive`) to open the original file directly in Google Drive.
6. **Refreshing Newly Added Files**:
   - Click **Refresh Folder** at any time. The application re-queries the folder link to display newly uploaded files without creating duplicate entries.
   - Use the **Simulate New Upload** button to test instant discovery of newly added receipts.

### 4.2 Batch Import & Expense Mapping
1. Click **Import Proofs** or **Map to Proof**.
2. Assign the proof to a trip (`Service Visit`) and an associated expense record.
3. Click **Import Selected Proofs** to link the proof to the official audit ledger.

---

## 5. Finance & Manager Side-by-Side Audit

Both the **Account Owner** and **Managers in Audit mode** have access to the side-by-side audit tool:

- **Preview Document**: High-resolution receipt vector/image preview and direct link to source in Google Drive.
- **Discrepancy Matrix**:
  - Highlights amount mismatches in red (e.g., proof says ₹640 but expense record has ₹700).
  - Highlights date discrepancies in amber.
  - Verifies work scope and trip associations.
- **Audit Decision Controls**:
  - **Verify & Approve** (Green): Marks proof as audited and verified.
  - **Needs Clarification** (Amber): Flags proof for follow-up or additional documentation.
  - **Reject** (Red): Rejects non-compliant proof.
- **Audit Logging**: Every review action, timestamp, reviewer name, role, and note are immutably logged to the workspace audit log.

---

## 6. Duplicate Detection

The system automatically checks for duplicate payment submissions:
1. **Drive File ID check**: Prevents importing the same Google Drive file multiple times.
2. **Transaction Reference / UTR check**: Flags different files that claim the same payment reference (e.g. duplicate UPI UTR or ticket PNR).
3. **Amount + Date + Trip match**: Warns reviewers if multiple receipts match the identical amount and date within the same trip.

---

## 7. Security & Compliance Guarantee

- **No Passwords Stored**: Authentication happens directly through Google OAuth with temporary scoped tokens.
- **Zero Token Leakage**: Tokens are never logged to console or persisted to insecure storage.
- **Owner-Controlled Mutations**: Only the Account Owner can delete payment proofs or change integration credentials. Managers operate in verified audit mode.
