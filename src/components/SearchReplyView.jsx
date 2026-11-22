import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../api/client';

const TONES = ['Helpful', 'Casual', 'Witty', 'Direct'];

export default function SearchReplyView() {
  const [query, setQuery] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [sort, setSort] = useState('relevance');
  const [posts, setPosts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [tone, setTone] = useState('Helpful');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [repliedIds, setRepliedIds] = useState({});

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setActivePostId(null);
    try {
      const data = await apiRequest('/api/reddit', {
        method: 'POST',
        body: { action: 'search', query, subreddit, sort, limit: 12 },
      });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleGenerateAI(post) {
    setGenerating(true);
    setError('');
    try {
      const data = await apiRequest('/api/ai', {
        method: 'POST',
        body: {
          postTitle: post.title,
          postBody: post.selftext,
          subreddit: post.subreddit,
          tone,
        },
      });
      setCommentText(data.comment);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendComment(post) {
    if (!commentText.trim()) return;
    setSending(true);
    setError('');
    try {
      await apiRequest('/api/reddit', {
        method: 'POST',
        body: {
          action: 'comment',
          thingId: post.name,
          text: commentText,
        },
      });
      setRepliedIds((prev) => ({ ...prev, [post.id]: true }));
      setCommentText('');
      setActivePostId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Search Bar Card */}
      <form
        onSubmit={handleSearch}
        className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-4 space-y-3"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Search keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={searching}
            type="submit"
            className="h-11 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm flex items-center justify-center shadow-md shadow-orange-500/20 disabled:opacity-60 cursor-pointer shrink-0"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
          </motion.button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="r/subreddit (optional)"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            className="h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 flex-1 min-w-[140px]"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            <option value="relevance">Relevant</option>
            <option value="new">New</option>
            <option value="top">Top</option>
          </select>
        </div>
      </form>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {posts.map((post, idx) => {
          const isOpen = activePostId === post.id;
          const isReplied = repliedIds[post.id];

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-orange-400">r/{post.subreddit}</span>
                  <span>•</span>
                  <span>{post.score} pts</span>
                  <span>•</span>
                  <span>{post.numComments}</span>
                </div>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              <h3 className="text-sm font-semibold text-white leading-snug">
                {post.title}
              </h3>

              {post.selftext && (
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {post.selftext}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                {isReplied ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Replied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePostId(isOpen ? null : post.id);
                      setCommentText('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isOpen ? 'Close' : 'Reply'}</span>
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2 border-t border-zinc-800/80 space-y-3"
                  >
                    {/* Tone & AI Generate */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        {TONES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTone(t)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                              tone === t
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        disabled={generating}
                        onClick={() => handleGenerateAI(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/25 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {generating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>AI Draft</span>
                      </motion.button>
                    </div>

                    <textarea
                      rows={4}
                      placeholder="Write or generate a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
                    />

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      disabled={sending || !commentText.trim()}
                      onClick={() => handleSendComment(post)}
                      className="w-full h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Comment</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
