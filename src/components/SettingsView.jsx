import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];

export default function SettingsView({ onStatusChange }) {
  const [form, setForm] = useState({
    redditClientId: '',
    redditClientSecret: '',
    redditUsername: '',
    redditPassword: '',
    redditUserAgent: '',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
  });
  const [flags, setFlags] = useState({
    hasRedditSecret: false,
    hasRedditPassword: false,
    hasGeminiKey: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    apiRequest('/api/settings')
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          redditClientId: data.redditClientId || '',
          redditUsername: data.redditUsername || '',
          redditUserAgent: data.redditUserAgent || '',
          geminiModel: data.geminiModel || 'gemini-2.5-flash',
        }));
        setFlags({
          hasRedditSecret: data.hasRedditSecret,
          hasRedditPassword: data.hasRedditPassword,
          hasGeminiKey: data.hasGeminiKey,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const res = await apiRequest('/api/settings', {
        method: 'POST',
        body: form,
      });
      setFlags((prev) => ({
        hasRedditSecret: prev.hasRedditSecret || Boolean(form.redditClientSecret),
        hasRedditPassword: prev.hasRedditPassword || Boolean(form.redditPassword),
        hasGeminiKey: prev.hasGeminiKey || Boolean(form.geminiApiKey),
      }));
      setForm((prev) => ({
        ...prev,
        redditClientSecret: '',
        redditPassword: '',
        geminiApiKey: '',
      }));
      onStatusChange?.({
        redditConfigured: res.redditConfigured,
        geminiConfigured: res.geminiConfigured,
        geminiModel: res.geminiModel,
      });
      setToast({ type: 'ok', text: 'Keys saved' });
    } catch (err) {
      setToast({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSave}
      className="space-y-5"
    >
      {/* Reddit API Card */}
      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Reddit API</h2>
          </div>
          {flags.hasRedditSecret && flags.hasRedditPassword && (
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Connected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field
            label="Client ID"
            placeholder="App ID"
            value={form.redditClientId}
            onChange={(v) => setForm({ ...form, redditClientId: v })}
          />
          <Field
            label="Client Secret"
            type="password"
            saved={flags.hasRedditSecret}
            placeholder={flags.hasRedditSecret ? '•••••••• (saved)' : 'App secret'}
            value={form.redditClientSecret}
            onChange={(v) => setForm({ ...form, redditClientSecret: v })}
          />
          <Field
            label="Reddit Username"
            placeholder="u/bot_name"
            value={form.redditUsername}
            onChange={(v) => setForm({ ...form, redditUsername: v })}
          />
          <Field
            label="Reddit Password"
            type="password"
            saved={flags.hasRedditPassword}
            placeholder={flags.hasRedditPassword ? '•••••••• (saved)' : 'Account password'}
            value={form.redditPassword}
            onChange={(v) => setForm({ ...form, redditPassword: v })}
          />
        </div>

        <Field
          label="User Agent (optional)"
          placeholder="web:snooflow:v1.0 (by /u/you)"
          value={form.redditUserAgent}
          onChange={(v) => setForm({ ...form, redditUserAgent: v })}
        />
      </div>

      {/* Gemini LLM Card */}
      <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Gemini LLM</h2>
          </div>
          {flags.hasGeminiKey && (
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field
            label="Gemini API Key"
            type="password"
            saved={flags.hasGeminiKey}
            placeholder={flags.hasGeminiKey ? '•••••••• (saved)' : 'AIza...'}
            value={form.geminiApiKey}
            onChange={(v) => setForm({ ...form, geminiApiKey: v })}
          />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
              Model
            </label>
            <select
              value={form.geminiModel}
              onChange={(e) => setForm({ ...form, geminiModel: e.target.value })}
              className="w-full h-11 px-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`text-xs px-4 py-2.5 rounded-2xl border ${
            toast.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {toast.text}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={saving}
        type="submit"
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-110 disabled:opacity-60 transition-all cursor-pointer"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Save Configuration</span>
          </>
        )}
      </motion.button>
    </motion.form>
  );
}

function Field({ label, type = 'text', placeholder, value, onChange, saved }) {
  return (
    <div>
      <label className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-1.5 ml-1">
        <span>{label}</span>
        {saved && <span className="text-[10px] text-emerald-400">Stored</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
      />
    </div>
  );
}
