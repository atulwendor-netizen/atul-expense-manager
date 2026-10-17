-- ==============================================================================
-- ATUL EXPENSE MANAGER — SUPABASE POSTGRES SCHEMA & ROW LEVEL SECURITY (RLS)
-- Multi-Tenant Account Boundaries, Role-Based Access Control (RBAC),
-- Audit Provenance Logging & Team Coordination Chat
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. WORKSPACES & PROFILES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Atul Expense Workspace',
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Maps directly to auth.users.id
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Workspace Membership & Role Matrix
CREATE TYPE user_role_type AS ENUM ('owner', 'manager');
CREATE TYPE user_status_type AS ENUM ('active', 'revoked', 'disabled');

CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'manager',
    status user_status_type NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, user_id)
);

-- Workspace Invitations (Sent by Owner to invite Managers)
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'manager',
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'revoked'
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days')
);

-- ==============================================================================
-- 3. CORE FINANCIAL ENTITIES (TRIPS, EXPENSES, REIMBURSEMENTS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    locations TEXT[] DEFAULT '{}',
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    date TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2), -- NULL for incomplete records (e.g. Row #80)
    payment_method TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    notes TEXT DEFAULT '',
    receipt TEXT, -- Supabase Storage URL or base64 preview
    receipt_name TEXT,
    trip_id TEXT REFERENCES public.trips(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'valid', -- 'valid' | 'incomplete'
    raw_original JSONB, -- Preserves raw spreadsheet row metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.reimbursements (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reference TEXT NOT NULL,
    notes TEXT DEFAULT '',
    trip_id TEXT REFERENCES public.trips(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. AUDIT LOGGING SYSTEM (IMMUTABLE AUDIT TRAIL)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role user_role_type NOT NULL,
    action TEXT NOT NULL, -- 'Created Expense', 'Edited Expense', 'Deleted Expense', etc.
    record_type TEXT NOT NULL, -- 'expense', 'reimbursement', 'trip', 'user', 'chat', 'system'
    record_id TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create indexes for fast audit search
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ==============================================================================
-- 5. TEAM CHAT & EXPENSE COORDINATION TABLES
-- ==============================================================================

CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'expense', 'trip', 'reimbursement');

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type conversation_type NOT NULL DEFAULT 'group',
    related_id TEXT, -- expense_id, trip_id, or reimbursement_id
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_role user_role_type NOT NULL,
    content TEXT NOT NULL,
    expense_id TEXT REFERENCES public.expenses(id) ON DELETE SET NULL,
    trip_id TEXT REFERENCES public.trips(id) ON DELETE SET NULL,
    reimbursement_id TEXT REFERENCES public.reimbursements(id) ON DELETE SET NULL,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_tab TEXT NOT NULL DEFAULT 'chat',
    link_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES — DATABASE LEVEL ENFORCEMENT
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check User's Active Role in a Workspace
CREATE OR REPLACE FUNCTION public.get_workspace_user_role(target_workspace_id UUID)
RETURNS user_role_type AS $$
    SELECT wm.role
    FROM public.workspace_members wm
    WHERE wm.workspace_id = target_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper Function: Check if User is Active Member of Workspace
CREATE OR REPLACE FUNCTION public.is_active_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = target_workspace_id
          AND wm.user_id = auth.uid()
          AND wm.status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper Function: Check if User is Workspace Owner
CREATE OR REPLACE FUNCTION public.is_workspace_owner(target_workspace_id UUID)
RETURNS BOOLEAN AS $$
    SELECT (public.get_workspace_user_role(target_workspace_id) = 'owner');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- RLS: WORKSPACES & PROFILES
-- ------------------------------------------------------------------------------

CREATE POLICY "Workspaces: Members can view workspace"
ON public.workspaces FOR SELECT
USING (public.is_active_workspace_member(id));

CREATE POLICY "Workspaces: Owner can update workspace"
ON public.workspaces FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Profiles: Users can view profiles in their workspace"
ON public.profiles FOR SELECT
USING (public.is_active_workspace_member(workspace_id) OR id = auth.uid());

CREATE POLICY "Profiles: Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- RLS: WORKSPACE MEMBERS & INVITATIONS
-- ------------------------------------------------------------------------------

CREATE POLICY "Workspace Members: Active members can view member list"
ON public.workspace_members FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Workspace Members: Only Owner can insert/modify/revoke members"
ON public.workspace_members FOR ALL
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Invitations: Active members can view invitations"
ON public.workspace_invitations FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Invitations: Only Owner can create or revoke invitations"
ON public.workspace_invitations FOR ALL
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

-- ------------------------------------------------------------------------------
-- RLS: FINANCIAL TABLES (EXPENSES, REIMBURSEMENTS, TRIPS)
-- STRICT RULE:
-- OWNER: Full CRUD
-- MANAGER/AUDITOR: SELECT only. Zero INSERT, UPDATE, or DELETE!
-- ------------------------------------------------------------------------------

-- Expenses
CREATE POLICY "Expenses: Members can view workspace expenses"
ON public.expenses FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Expenses: Only Owner can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Expenses: Only Owner can update expenses"
ON public.expenses FOR UPDATE
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Expenses: Only Owner can delete expenses"
ON public.expenses FOR DELETE
USING (public.is_workspace_owner(workspace_id));

-- Reimbursements
CREATE POLICY "Reimbursements: Members can view workspace reimbursements"
ON public.reimbursements FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Reimbursements: Only Owner can insert reimbursements"
ON public.reimbursements FOR INSERT
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Reimbursements: Only Owner can update reimbursements"
ON public.reimbursements FOR UPDATE
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Reimbursements: Only Owner can delete reimbursements"
ON public.reimbursements FOR DELETE
USING (public.is_workspace_owner(workspace_id));

-- Trips
CREATE POLICY "Trips: Members can view workspace trips"
ON public.trips FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Trips: Only Owner can insert trips"
ON public.trips FOR INSERT
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Trips: Only Owner can update trips"
ON public.trips FOR UPDATE
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Trips: Only Owner can delete trips"
ON public.trips FOR DELETE
USING (public.is_workspace_owner(workspace_id));

-- ------------------------------------------------------------------------------
-- RLS: AUDIT LOGS (READABLE BY OWNER & MANAGER, IMMUTABLE)
-- ------------------------------------------------------------------------------

CREATE POLICY "Audit Logs: Members can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Audit Logs: Insertable by authenticated members"
ON public.audit_logs FOR INSERT
WITH CHECK (public.is_active_workspace_member(workspace_id));

-- No UPDATE or DELETE policies: Audit records cannot be modified or purged!

-- ------------------------------------------------------------------------------
-- RLS: CHAT & COMMUNICATIONS
-- Owner & Manager can communicate in conversations they belong to
-- ------------------------------------------------------------------------------

CREATE POLICY "Conversations: Members can view conversations they participate in"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
    ) OR public.is_workspace_owner(workspace_id)
);

CREATE POLICY "Conversations: Members can create conversations in workspace"
ON public.conversations FOR INSERT
WITH CHECK (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Messages: Conversation members can read messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    ) OR (
        SELECT public.is_workspace_owner(c.workspace_id)
        FROM public.conversations c WHERE c.id = conversation_id
    )
);

CREATE POLICY "Messages: Authorized members can send messages"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
    ) OR (
        SELECT public.is_workspace_owner(c.workspace_id)
        FROM public.conversations c WHERE c.id = conversation_id
    )
);

CREATE POLICY "Notifications: Users can read own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Notifications: Users can update own notifications (mark read)"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- ==============================================================================
-- 5. GOOGLE DRIVE INTEGRATION & PAYMENT PROOFS AUDIT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.google_drive_configs (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    folder_id TEXT NOT NULL DEFAULT 'Expense Manager Payment Proofs',
    folder_name TEXT NOT NULL DEFAULT 'Expense Manager Payment Proofs',
    is_connected BOOLEAN NOT NULL DEFAULT true,
    connected_account_email TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id TEXT PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    drive_file_id TEXT,
    drive_link TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    preview_url TEXT,
    thumbnail_url TEXT,
    trip_id TEXT REFERENCES public.trips(id) ON DELETE SET NULL,
    trip_name TEXT,
    expense_id TEXT REFERENCES public.expenses(id) ON DELETE SET NULL,
    expense_description TEXT,
    reimbursement_id TEXT REFERENCES public.reimbursements(id) ON DELETE SET NULL,
    proof_type TEXT NOT NULL DEFAULT 'UPI Receipt',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    transaction_reference TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'needs_clarification'
    imported_by UUID NOT NULL REFERENCES public.profiles(id),
    imported_by_name TEXT NOT NULL DEFAULT 'Atul',
    imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_by_name TEXT,
    reviewed_by_role TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    is_flagged_duplicate BOOLEAN NOT NULL DEFAULT false,
    duplicate_reason TEXT,
    ocr_extracted_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast audit lookups and duplicate detection
CREATE INDEX IF NOT EXISTS idx_payment_proofs_workspace ON public.payment_proofs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_expense ON public.payment_proofs(expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_trip ON public.payment_proofs(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_drive_file ON public.payment_proofs(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_ref ON public.payment_proofs(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);

-- ------------------------------------------------------------------------------
-- RLS POLICIES: GOOGLE DRIVE & PAYMENT PROOFS
-- ------------------------------------------------------------------------------

ALTER TABLE public.google_drive_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Google Drive Config: Readable by all active members, configurable only by Owner
CREATE POLICY "Drive Config: Members can view configuration"
ON public.google_drive_configs FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

CREATE POLICY "Drive Config: Owner has full management access"
ON public.google_drive_configs FOR ALL
USING (public.is_workspace_owner(workspace_id));

-- Payment Proofs:
-- 1. All active workspace members (Owner & Manager) can read proofs
CREATE POLICY "Payment Proofs: Active members can view proofs"
ON public.payment_proofs FOR SELECT
USING (public.is_active_workspace_member(workspace_id));

-- 2. Authenticated members can import proofs
CREATE POLICY "Payment Proofs: Active members can import proofs"
ON public.payment_proofs FOR INSERT
WITH CHECK (public.is_active_workspace_member(workspace_id));

-- 3. Both Owner and Manager (in Audit mode) can review/verify/reject proofs
CREATE POLICY "Payment Proofs: Active members can audit and review proofs"
ON public.payment_proofs FOR UPDATE
USING (public.is_active_workspace_member(workspace_id));

-- 4. Only Owner can permanently delete payment proof records
CREATE POLICY "Payment Proofs: Only Owner can delete proofs"
ON public.payment_proofs FOR DELETE
USING (public.is_workspace_owner(workspace_id));
