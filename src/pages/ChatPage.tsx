import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Conversation,
  ChatMessage,
  UserProfile,
  Expense,
  Trip,
  Reimbursement,
  MessageAttachment,
} from '../types/index';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Plus,
  Compass,
  Receipt,
  X,
  FileText,
  Download,
  ArrowLeft,
  DollarSign,
  Reply,
  ExternalLink,
} from 'lucide-react';

interface ChatPageProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  messages: ChatMessage[];
  onSendMessage: (params: {
    conversationId: string;
    content: string;
    expenseId?: string | null;
    tripId?: string | null;
    reimbursementId?: string | null;
    replyToMessageId?: string | null;
    attachments?: MessageAttachment[];
  }) => void;
  onCreateGroupChat: (title: string, memberIds: string[]) => void;
  currentUser: UserProfile;
  expenses: Expense[];
  trips: Trip[];
  reimbursements: Reimbursement[];
  onViewExpenseDetails: (expense: Expense) => void;
  onNotify: (type: 'success' | 'warning' | 'info' | 'error', text: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  messages,
  onSendMessage,
  onCreateGroupChat,
  currentUser,
  expenses,
  trips,
  reimbursements,
  onViewExpenseDetails,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedExpenseRef, setSelectedExpenseRef] = useState<string | null>(null);
  const [isExpensePickerOpen, setIsExpensePickerOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [mobileShowActiveChat, setMobileShowActiveChat] = useState(Boolean(activeConversationId));

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages container to bottom without scrolling window or parent ancestors
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, activeConversationId]);

  // When activeConversationId changes, switch to chat view on mobile
  useEffect(() => {
    if (activeConversationId) {
      setMobileShowActiveChat(true);
    }
  }, [activeConversationId]);

  // Find active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;
  }, [conversations, activeConversationId]);

  // Map expenses for fast lookup
  const expenseMap = useMemo(() => new Map(expenses.map((e) => [e.id, e])), [expenses]);
  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);
  const reimbMap = useMemo(() => new Map(reimbursements.map((r) => [r.id, r])), [reimbursements]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filterType !== 'all' && c.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchLast = c.lastMessage?.content.toLowerCase().includes(q);
        if (!matchTitle && !matchLast) return false;
      }
      return true;
    });
  }, [conversations, filterType, searchQuery]);

  // Handle file attachment upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onNotify('error', 'File size exceeds 10 MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newAttachment: MessageAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        messageId: '',
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileUrl: dataUrl,
        uploadedBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      setPendingAttachments((prev) => [...prev, newAttachment]);
      onNotify('success', `Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    if (!messageInput.trim() && !selectedExpenseRef && pendingAttachments.length === 0) return;

    onSendMessage({
      conversationId: activeConversation.id,
      content: messageInput.trim(),
      expenseId: selectedExpenseRef,
      replyToMessageId: replyingTo ? replyingTo.id : null,
      attachments: pendingAttachments,
    });

    setMessageInput('');
    setReplyingTo(null);
    setSelectedExpenseRef(null);
    setPendingAttachments([]);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    onCreateGroupChat(newGroupTitle.trim(), []);
    onNotify('success', `Created conversation "${newGroupTitle}"`);
    setNewGroupTitle('');
    setIsNewGroupModalOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900 overflow-hidden animate-dashboard-fade">
      {/* ------------------------------------------------------------- */}
      {/* LEFT PANEL: CONVERSATIONS LIST */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`w-full lg:w-80 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col shrink-0 ${
          mobileShowActiveChat ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Team Coordination
            </h2>
          </div>

          {currentUser.role === 'owner' && (
            <button
              onClick={() => setIsNewGroupModalOpen(true)}
              title="Create New Discussion"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
            {['all', 'group', 'expense', 'trip', 'reimbursement'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-lg px-2 py-0.5 font-semibold capitalize whitespace-nowrap transition-colors ${
                  filterType === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              let Icon = MessageSquare;
              if (conv.type === 'expense') Icon = Receipt;
              if (conv.type === 'trip') Icon = Compass;
              if (conv.type === 'reimbursement') Icon = DollarSign;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    setMobileShowActiveChat(true);
                  }}
                  className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                      conv.type === 'expense'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : conv.type === 'trip'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : conv.type === 'reimbursement'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {conv.title}
                      </p>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-1">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {conv.lastMessage ? (
                        <>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {conv.lastMessage.senderName}:{' '}
                          </span>
                          {conv.lastMessage.content}
                        </>
                      ) : (
                        'No messages yet'
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT PANEL: ACTIVE CONVERSATION & CHAT STREAM */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-900/50 ${
          mobileShowActiveChat ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Active Header */}
            <div className="h-14 border-b border-slate-200/80 bg-white px-4 dark:border-slate-800/80 dark:bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setMobileShowActiveChat(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {activeConversation.title}
                    </h3>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {activeConversation.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Participants: Atul (Owner), Auditor Manager
                  </p>
                </div>
              </div>

              {/* Context Links for Expense/Trip */}
              {activeConversation.type === 'expense' && activeConversation.relatedId && (
                (() => {
                  const exp = expenseMap.get(activeConversation.relatedId);
                  if (!exp) return null;
                  return (
                    <button
                      onClick={() => onViewExpenseDetails(exp)}
                      className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                    >
                      <span>{formatCurrency(exp.amount)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  );
                })()
              )}
            </div>

            {/* Context Sticky Banner if linked to Expense or Trip */}
            {activeConversation.type === 'expense' && activeConversation.relatedId && (
              (() => {
                const exp = expenseMap.get(activeConversation.relatedId);
                if (!exp) return null;
                return (
                  <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 text-xs flex items-center justify-between text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-200 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <Receipt className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        <strong>Expense Context:</strong> {exp.description} —{' '}
                        {formatCurrency(exp.amount)} ({exp.category}) on {formatDate(exp.date)}
                      </span>
                    </div>
                    <button
                      onClick={() => onViewExpenseDetails(exp)}
                      className="font-bold underline hover:text-amber-700 shrink-0 text-[11px]"
                    >
                      View Details
                    </button>
                  </div>
                );
              })()
            )}

            {/* Messages Scroll Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
              {messages.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No messages yet. Send an update or request audit verification below.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUser.id;
                  const referencedExp = msg.expenseId ? expenseMap.get(msg.expenseId) : null;
                  const referencedTrip = msg.tripId ? tripMap.get(msg.tripId) : null;
                  const referencedReimb = msg.reimbursementId ? reimbMap.get(msg.reimbursementId) : null;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {msg.senderName}
                        </span>
                        <span
                          className={`rounded px-1 text-[9px] font-bold uppercase tracking-wider ${
                            msg.senderRole === 'owner'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {msg.senderRole}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-md sm:max-w-lg rounded-2xl p-3.5 text-xs shadow-xs space-y-2.5 ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                        }`}
                      >
                        {/* Message Text */}
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Clickable Expense Reference Card inside message */}
                        {referencedExp && (
                          <div
                            onClick={() => onViewExpenseDetails(referencedExp)}
                            className={`rounded-xl p-2.5 flex items-center justify-between cursor-pointer border transition-colors ${
                              isOwn
                                ? 'bg-blue-700/60 border-blue-400/40 text-white hover:bg-blue-700'
                                : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <Receipt className="h-4 w-4 shrink-0 text-amber-400" />
                              <div className="truncate">
                                <p className="font-bold text-[11px] truncate">
                                  {referencedExp.description}
                                </p>
                                <p className="text-[10px] opacity-80">
                                  {formatDate(referencedExp.date)} • {referencedExp.category}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-xs shrink-0">
                              {formatCurrency(referencedExp.amount)}
                            </span>
                          </div>
                        )}

                        {/* Trip Reference Card */}
                        {referencedTrip && (
                          <div
                            className={`rounded-xl p-2.5 flex items-center justify-between border ${
                              isOwn
                                ? 'bg-blue-700/60 border-blue-400/40 text-white'
                                : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <Compass className="h-4 w-4 shrink-0 text-cyan-400" />
                              <div className="truncate">
                                <p className="font-bold text-[11px] truncate">
                                  Trip: {referencedTrip.name}
                                </p>
                                <p className="text-[10px] opacity-80">
                                  {referencedTrip.locations.join(', ')} • {formatDate(referencedTrip.startDate)} - {formatDate(referencedTrip.endDate)}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-xs shrink-0">
                              {referencedTrip.locations.length} locs
                            </span>
                          </div>
                        )}

                        {/* Reimbursement Reference Card */}
                        {referencedReimb && (
                          <div
                            className={`rounded-xl p-2.5 flex items-center justify-between border ${
                              isOwn
                                ? 'bg-blue-700/60 border-blue-400/40 text-white'
                                : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <DollarSign className="h-4 w-4 shrink-0 text-emerald-400" />
                              <div className="truncate">
                                <p className="font-bold text-[11px] truncate">
                                  Reimbursement: {referencedReimb.reference || 'Payment'}
                                </p>
                                <p className="text-[10px] opacity-80">
                                  {formatDate(referencedReimb.date)} {referencedReimb.notes ? `• ${referencedReimb.notes}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-xs shrink-0 text-emerald-400">
                              +{formatCurrency(referencedReimb.amount)}
                            </span>
                          </div>
                        )}

                        {/* Attachments Display */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                className={`rounded-xl p-2 flex items-center justify-between border ${
                                  isOwn
                                    ? 'bg-blue-700/50 border-blue-500/40'
                                    : 'bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-4 w-4 shrink-0 opacity-80" />
                                  <div className="truncate">
                                    <p className="font-semibold text-[11px] truncate">
                                      {att.fileName}
                                    </p>
                                    <p className="text-[9px] opacity-70">
                                      {(att.fileSize / 1024).toFixed(0)} KB
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={att.fileUrl}
                                  download={att.fileName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-white/20 hover:bg-white/30"
                                >
                                  <Download className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reply button */}
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 px-1 mt-0.5 flex items-center gap-1"
                      >
                        <Reply className="h-2.5 w-2.5" />
                        Reply
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Replying banner */}
            {replyingTo && (
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                <span className="truncate">
                  Replying to <strong>{replyingTo.senderName}</strong>: "{replyingTo.content.substring(0, 40)}..."
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Pending attachments / expense reference banner */}
            {(pendingAttachments.length > 0 || selectedExpenseRef) && (
              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2.5 border-t border-blue-200 dark:border-blue-900 flex flex-wrap items-center gap-2">
                {selectedExpenseRef && (
                  (() => {
                    const exp = expenseMap.get(selectedExpenseRef);
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 shadow-xs dark:bg-slate-800 dark:text-blue-300 dark:border-blue-800">
                        <Receipt className="h-3.5 w-3.5 text-amber-500" />
                        <span>Ref: {exp?.description} ({formatCurrency(exp?.amount)})</span>
                        <button onClick={() => setSelectedExpenseRef(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })()
                )}

                {pendingAttachments.map((att) => (
                  <span
                    key={att.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                    <span className="max-w-[120px] truncate">{att.fileName}</span>
                    <button
                      onClick={() => setPendingAttachments((prev) => prev.filter((p) => p.id !== att.id))}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-200/80 dark:border-slate-800/80 dark:bg-slate-900 flex items-center gap-2 shrink-0"
            >
              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Document / Receipt"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Reference Expense Dropdown Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExpensePickerOpen(!isExpensePickerOpen)}
                  title="Reference Expense"
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  <Receipt className="h-4 w-4 text-amber-500" />
                </button>

                {isExpensePickerOpen && (
                  <div className="absolute bottom-12 left-0 w-80 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-30">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Select Expense to Link
                    </p>
                    {expenses.slice(0, 15).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setSelectedExpenseRef(e.id);
                          setIsExpensePickerOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {e.description}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatDate(e.date)} • {e.category}
                          </p>
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          {formatCurrency(e.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message or discuss with auditor..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              />

              {/* Send Button */}
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation on the left to start coordination.
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Start New Group Conversation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Create a dedicated channel for team review or financial reconciliation.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Conversation Title
                </label>
                <input
                  type="text"
                  required
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  placeholder="e.g. Q3 Mumbai Lodging Audit"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
