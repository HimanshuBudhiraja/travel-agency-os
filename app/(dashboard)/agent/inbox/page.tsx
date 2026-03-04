"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  channel: string;
  isOpen: boolean;
  isAiManaged: boolean;
  agentTookOver: boolean;
  intentSentiment: string | null;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
  } | null;
  messages: {
    id: string;
    content: string;
    createdAt: string;
  }[];
}

interface Message {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  content: string;
  isAiGenerated: boolean;
  createdAt: string;
  sentByAgent: { name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CHANNEL_ICON: Record<string, string> = {
  WHATSAPP: "WA",
  EMAIL: "EM",
  WEB_CHAT: "WB",
  SMS: "SM",
};

const CHANNEL_COLOR: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-700",
  EMAIL: "bg-blue-100 text-blue-700",
  WEB_CHAT: "bg-purple-100 text-purple-700",
  SMS: "bg-gray-100 text-gray-600",
};

const SENTIMENT_DOT: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-gray-300",
  negative: "bg-red-500",
  urgent: "bg-orange-500",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InboxPage() {
  // Data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draftReply, setDraftReply] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");

  // UI
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;

  const filteredConvs = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.client?.name?.toLowerCase().includes(q) ||
      c.messages[0]?.content?.toLowerCase().includes(q)
    );
  });

  const openCount = conversations.filter((c) => c.isOpen).length;

  // ── Fetch conversations ──────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await fetch("/api/v1/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? data);
      }
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // ── Fetch messages ───────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    setMessages([]);
    setDraftReply("");
    setReplyText("");
    try {
      const res = await fetch(`/api/v1/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? data);
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const handleSelectConversation = useCallback(
    (convId: string) => {
      setSelectedConvId(convId);
      fetchMessages(convId);
    },
    [fetchMessages]
  );

  // ── Scroll to bottom on new messages ────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Agent takeover ───────────────────────────────────────────────────────────

  const handleTakeover = useCallback(async () => {
    if (!selectedConvId) return;
    setTakingOver(true);
    try {
      const res = await fetch(`/api/v1/conversations/${selectedConvId}/takeover`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? { ...c, agentTookOver: data.agentTookOver, isAiManaged: data.isAiManaged }
              : c
          )
        );
        setDraftReply("");
      }
    } finally {
      setTakingOver(false);
    }
  }, [selectedConvId]);

  // ── Get AI draft ─────────────────────────────────────────────────────────────

  const handleGetDraft = useCallback(async () => {
    if (!selectedConvId) return;
    setLoadingDraft(true);
    try {
      const res = await fetch(`/api/v1/conversations/${selectedConvId}/draft`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setDraftReply(data.draft ?? "");
      }
    } finally {
      setLoadingDraft(false);
    }
  }, [selectedConvId]);

  // ── Send message ─────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConvId || !content.trim()) return;
      setSendingMessage(true);
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        direction: "OUTBOUND",
        channel: selectedConv?.channel ?? "WHATSAPP",
        content: content.trim(),
        isAiGenerated: false,
        createdAt: new Date().toISOString(),
        sentByAgent: { name: "You" },
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setReplyText("");
      setDraftReply("");
      try {
        await fetch(`/api/v1/conversations/${selectedConvId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });
        // Refresh messages after send
        await fetchMessages(selectedConvId);
      } finally {
        setSendingMessage(false);
      }
    },
    [selectedConvId, selectedConv, fetchMessages]
  );

  // ── Handle resolve ───────────────────────────────────────────────────────────

  const handleResolve = useCallback(async () => {
    if (!selectedConvId) return;
    await fetch(`/api/v1/conversations/${selectedConvId}/resolve`, { method: "POST" });
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, isOpen: false } : c))
    );
    setSelectedConvId(null);
  }, [selectedConvId]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">

      {/* ── LEFT PANEL: Conversation List ─────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">Inbox</h2>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
              {openCount} open
            </span>
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {search ? "No results" : "Inbox is empty"}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {search
                  ? "Try a different search term"
                  : "Conversations from WhatsApp, email and web chat appear here"}
              </p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const lastMsg = conv.messages[0];
              const isSelected = selectedConvId === conv.id;
              const clientName = conv.client?.name ?? "Unknown";
              const initials = getInitials(clientName);
              const color = avatarColor(clientName);

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors focus:outline-none ${
                    isSelected ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}
                    >
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + time */}
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {clientName}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {lastMsg ? formatTime(lastMsg.createdAt) : ""}
                        </span>
                      </div>

                      {/* Last message */}
                      <p className="text-xs text-gray-500 truncate mb-1.5">
                        {lastMsg?.content ?? "No messages yet"}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Channel */}
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            CHANNEL_COLOR[conv.channel] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {CHANNEL_ICON[conv.channel] ?? conv.channel}
                        </span>

                        {/* AI badge */}
                        {conv.isAiManaged && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                            AI
                          </span>
                        )}

                        {/* Agent took over badge */}
                        {conv.agentTookOver && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold">
                            Agent
                          </span>
                        )}

                        {/* Sentiment dot */}
                        {conv.intentSentiment && (
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              SENTIMENT_DOT[conv.intentSentiment] ?? "bg-gray-300"
                            }`}
                            title={conv.intentSentiment}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {!selectedConv ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">Select a conversation</p>
              <p className="text-sm text-gray-400">
                AI is actively monitoring and responding to open threads
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Top bar ──────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(
                    selectedConv.client?.name ?? "?"
                  )}`}
                >
                  {getInitials(selectedConv.client?.name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {selectedConv.client?.name ?? "Unknown"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        CHANNEL_COLOR[selectedConv.channel] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {selectedConv.channel}
                    </span>
                    {selectedConv.client?.whatsapp && (
                      <span className="text-xs text-gray-400">{selectedConv.client.whatsapp}</span>
                    )}
                    {selectedConv.intentSentiment && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          SENTIMENT_DOT[selectedConv.intentSentiment] ?? "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleTakeover}
                  disabled={takingOver}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                    selectedConv.isAiManaged
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {takingOver ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedConv.isAiManaged ? "bg-red-500" : "bg-green-500"
                      }`}
                    />
                  )}
                  {selectedConv.isAiManaged ? "Agent Takeover" : "Agent Active"}
                </button>

                <button
                  onClick={handleResolve}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Resolve
                </button>
              </div>
            </div>

            {/* ── Message thread ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-gray-50 min-h-0">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-gray-400">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                          isOutbound ? "items-end" : "items-start"
                        } flex flex-col`}
                      >
                        {/* AI label */}
                        {msg.isAiGenerated && (
                          <span className="text-xs text-blue-500 font-medium mb-1 self-start px-1">
                            AI
                          </span>
                        )}
                        {/* Bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOutbound
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {/* Timestamp */}
                        <span className="text-xs text-gray-400 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                          {msg.sentByAgent && !msg.isAiGenerated && (
                            <span className="ml-1 text-gray-300">· {msg.sentByAgent.name}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── AI Draft bar (when AI is managing) ──────────────────────── */}
            {selectedConv.isAiManaged && (
              <div className="bg-amber-50 border-t border-amber-200 px-5 py-3 flex-shrink-0">
                {draftReply ? (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-amber-800">AI Draft:</span>
                      </div>
                    </div>
                    <p className="text-sm text-amber-900 bg-white/60 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                      {draftReply}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendMessage(draftReply)}
                        disabled={sendingMessage}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {sendingMessage ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send Draft
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setReplyText(draftReply);
                          setDraftReply("");
                          handleTakeover();
                        }}
                        className="flex-1 bg-white border border-amber-300 text-amber-700 py-2 rounded-xl text-xs font-semibold hover:bg-amber-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDraftReply("")}
                        className="w-8 h-8 flex items-center justify-center text-amber-500 hover:text-amber-700 transition-colors rounded-lg hover:bg-amber-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-amber-800">AI is managing this conversation</span>
                    </div>
                    <button
                      onClick={handleGetDraft}
                      disabled={loadingDraft}
                      className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {loadingDraft ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Get AI Draft"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Agent reply box (when agent took over) ───────────────────── */}
            {selectedConv.agentTookOver && !selectedConv.isAiManaged && (
              <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={replyRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSendMessage(replyText);
                      }
                    }}
                    placeholder="Type a message... (Cmd+Enter to send)"
                    rows={3}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={() => handleSendMessage(replyText)}
                    disabled={sendingMessage || !replyText.trim()}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0 mb-0.5"
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 pl-1">
                  Cmd+Enter to send · Agent mode active
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
