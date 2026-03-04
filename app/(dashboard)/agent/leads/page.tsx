"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStage =
  | "NEW"
  | "QUALIFIED"
  | "QUOTED"
  | "NEGOTIATING"
  | "WON"
  | "LOST";
type LeadScore = "HOT" | "WARM" | "COLD";

interface Lead {
  id: string;
  stage: LeadStage;
  score: LeadScore;
  destination: string | null;
  estimatedValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { key: LeadStage; label: string; color: string; accent: string; badgeBg: string }[] = [
  { key: "NEW", label: "New", color: "border-t-blue-500", accent: "bg-blue-500", badgeBg: "bg-blue-100 text-blue-700" },
  { key: "QUALIFIED", label: "Qualified", color: "border-t-yellow-500", accent: "bg-yellow-500", badgeBg: "bg-yellow-100 text-yellow-700" },
  { key: "QUOTED", label: "Quoted", color: "border-t-orange-500", accent: "bg-orange-500", badgeBg: "bg-orange-100 text-orange-700" },
  { key: "NEGOTIATING", label: "Negotiating", color: "border-t-purple-500", accent: "bg-purple-500", badgeBg: "bg-purple-100 text-purple-700" },
  { key: "WON", label: "Won", color: "border-t-green-500", accent: "bg-green-500", badgeBg: "bg-green-100 text-green-700" },
  { key: "LOST", label: "Lost", color: "border-t-red-500", accent: "bg-red-500", badgeBg: "bg-red-100 text-red-700" },
];

const STAGE_ORDER: LeadStage[] = ["NEW", "QUALIFIED", "QUOTED", "NEGOTIATING", "WON", "LOST"];

const SCORE_CONFIG: Record<LeadScore, { label: string; emoji: string; bg: string }> = {
  HOT: { label: "Hot", emoji: "🔥", bg: "bg-red-100 text-red-700" },
  WARM: { label: "Warm", emoji: "🌤", bg: "bg-yellow-100 text-yellow-700" },
  COLD: { label: "Cold", emoji: "❄️", bg: "bg-blue-100 text-blue-700" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getNextStage(current: LeadStage): LeadStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-14" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onMoveNext,
}: {
  lead: Lead;
  onMoveNext: (id: string, nextStage: LeadStage) => void;
}) {
  const nextStage = getNextStage(lead.stage);
  const score = SCORE_CONFIG[lead.score];
  const days = daysSince(lead.createdAt);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {getInitials(lead.client.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {lead.client.name}
          </p>
          {lead.destination && (
            <p className="text-xs text-gray-500 truncate">{lead.destination}</p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${score.bg}`}
        >
          {score.emoji} {score.label}
        </span>
        {lead.estimatedValue != null && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {formatINR(lead.estimatedValue)}
          </span>
        )}
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
          {days === 0 ? "Today" : `${days}d ago`}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/agent/leads/${lead.id}`}
          className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg py-1.5 transition-colors"
        >
          View
        </Link>
        {nextStage && (
          <button
            onClick={() => onMoveNext(lead.id, nextStage)}
            title={`Move to ${nextStage}`}
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-2 py-1.5 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
            <span className="hidden sm:inline">{nextStage.charAt(0) + nextStage.slice(1).toLowerCase()}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (lead: Lead) => void }) {
  const [clientName, setClientName] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientName.trim(), destination: destination.trim(), notes: notes.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create lead");
      }
      const lead: Lead = await res.json();
      onCreated(lead);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Bali, Thailand, Europe"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Travel dates, group size, budget, preferences…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating…" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data: Lead[] = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveNext(id: string, nextStage: LeadStage) {
    setMovingId(id);
    try {
      const res = await fetch(`/api/v1/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      const updated: Lead = await res.json();
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, stage: updated.stage } : l))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setMovingId(null);
    }
  }

  function handleLeadCreated(lead: Lead) {
    setLeads((prev) => [lead, ...prev]);
  }

  const grouped = STAGES.reduce(
    (acc, s) => {
      acc[s.key] = leads.filter((l) => l.stage === s.key);
      return acc;
    },
    {} as Record<LeadStage, Lead[]>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lead Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {leads.length} total leads
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v12M2 8h12" />
            </svg>
            New Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 p-6 min-w-max">
          {STAGES.map((stage) => {
            const stageLeads = grouped[stage.key] || [];
            return (
              <div
                key={stage.key}
                className={`w-72 flex-shrink-0 bg-gray-50 rounded-2xl border-t-4 ${stage.color} border border-gray-200 overflow-hidden`}
              >
                {/* Column Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {stage.label}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.badgeBg}`}
                  >
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="px-3 pb-4 space-y-3 min-h-[200px]">
                  {loading ? (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  ) : stageLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400">No leads</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={
                          movingId === lead.id ? "opacity-50 pointer-events-none" : ""
                        }
                      >
                        <LeadCard lead={lead} onMoveNext={handleMoveNext} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Lead Modal */}
      {showModal && (
        <NewLeadModal
          onClose={() => setShowModal(false)}
          onCreated={handleLeadCreated}
        />
      )}
    </div>
  );
}
