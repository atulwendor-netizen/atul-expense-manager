export type UserRole = 'owner' | 'manager';

export type UserStatus = 'active' | 'revoked' | 'disabled';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  workspaceId: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: UserRole;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: string;             // e.g. 'Created Expense', 'Edited Expense', 'Deleted Expense', 'Invited Manager', 'Revoked Access'
  recordType: 'expense' | 'reimbursement' | 'trip' | 'user' | 'system' | 'invitation' | 'chat';
  recordId: string;
  previousValue: string | null; // Formatted summary or null
  newValue: string | null;      // Formatted summary or null
  timestamp: string;          // ISO timestamp
}

// --- TEAM CHAT & EXPENSE COORDINATION TYPES ---

export type ConversationType = 'direct' | 'group' | 'expense' | 'trip' | 'reimbursement';

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string;
  type: ConversationType;
  relatedId?: string | null;  // expense_id, trip_id, or reimbursement_id
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: string[];          // userIds
  lastMessage?: {
    id: string;
    senderName: string;
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storagePath?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: UserRole;
  content: string;
  expenseId?: string | null;
  tripId?: string | null;
  reimbursementId?: string | null;
  replyToMessageId?: string | null;
  attachments?: MessageAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  message: string;
  linkTab: string;            // 'chat', 'expenses', 'trips', etc.
  linkId?: string;            // conversationId or expenseId
  isRead: boolean;
  createdAt: string;
}
