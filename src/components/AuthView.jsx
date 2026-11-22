import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, Loader2 } from 'lucide-react';
import { apiRequest, setToken } from '../api/client';

export default function AuthView({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth', {
        method: 'POST',
        body: { action: mode, username, password },
      });
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SnooFlow</h1>
          <p className="text-sm text-zinc-400 mt-1">Reddit Bot Studio</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-2xl mb-6 border border-zinc-800/60">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setMode(tab);
                  setError('');
                }}
                className={`relative py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  mode === tab ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode === tab && (
                  <motion.span
                    layoutId="authTab"
                    className="absolute inset-0 bg-zinc-800 rounded-xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {tab === 'login' ? 'Sign In' : 'Register'}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="unique_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-110 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Continue' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
