import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, ExternalLink, FileText, Link2 } from 'lucide-react';
import { apiRequest } from '../api/client';

export default function CreatePostView() {
  const [kind, setKind] = useState('self');
  const [subreddit, setSubreddit] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiRequest('/api/reddit', {
        method: 'POST',
        body: { action: 'post', subreddit, title, kind, text, url },
      });
      setResult(data.post);
      setTitle('');
      setText('');
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">New Post</h2>

        <div className="flex gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          {[
            { id: 'self', label: 'Text', icon: FileText },
            { id: 'link', label: 'Link', icon: Link2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                kind === id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
          Subreddit
        </label>
        <input
          type="text"
          required
          placeholder="r/technology"
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
          className="w-full h-11 px-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
          Title
        </label>
        <input
          type="text"
          required
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-11 px-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {kind === 'self' ? (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
            Body
          </label>
          <textarea
            rows={5}
            placeholder="Write your post..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
            URL
          </label>
          <input
            type="url"
            required
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-11 px-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5">
          {error}
        </div>
      )}

      {result?.url && (
        <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5">
          <span>Published</span>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline font-medium"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

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
            <Send className="w-4 h-4" />
            <span>Publish Post</span>
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
