"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [aiPersona, setAiPersona] = useState("Aria");
  const [autonomyThreshold, setAutonomyThreshold] = useState(0.85);
  const [newKeyName, setNewKeyName] = useState("");
  const [keys, setKeys] = useState<{ name: string; preview: string; sandbox: boolean; created: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");

  async function createApiKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      setNewKeyValue(data.key);
      setKeys((prev) => [...prev, { name: newKeyName, preview: data.key.slice(-4), sandbox: false, created: new Date().toLocaleDateString() }]);
      setNewKeyName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Agency Brain config */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">🧠 Agency Brain</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">AI Persona Name</label>
            <input
              value={aiPersona}
              onChange={(e) => setAiPersona(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Aria, Max, Luna"
            />
            <p className="text-xs text-gray-400 mt-1">This is the name your AI uses when responding to clients</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Autonomy Threshold: {Math.round(autonomyThreshold * 100)}%
            </label>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.05}
              value={autonomyThreshold}
              onChange={(e) => setAutonomyThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Human reviews everything</span>
              <span>Fully autonomous</span>
            </div>
          </div>
        </div>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Save changes
        </button>
      </section>

      {/* API Keys */}
      <section id="api" className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">🔑 API Keys</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use API keys to integrate TravelOS into your existing tools or access the REST API.
        </p>

        {newKeyValue && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800 mb-2">Your new API key (copy it now — it won&apos;t be shown again):</p>
            <code className="text-xs bg-green-100 px-3 py-2 rounded-lg block break-all text-green-900">
              {newKeyValue}
            </code>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. Production, Zapier)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createApiKey}
            disabled={creating || !newKeyName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Create key"}
          </button>
        </div>

        {keys.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No API keys yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {keys.map((k: any) => (
              <li key={k.name} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{k.name}</p>
                  <p className="text-xs text-gray-400">...{k.preview} · Created {k.created}</p>
                </div>
                <button className="text-xs text-red-500 hover:text-red-700">Revoke</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
