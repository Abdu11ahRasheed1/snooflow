import { motion } from 'framer-motion';
import { Bot, Search, PenSquare, KeyRound, LogOut } from 'lucide-react';

const TABS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'post', label: 'Post', icon: PenSquare },
  { id: 'settings', label: 'Keys', icon: KeyRound },
];

export default function Navbar({ activeTab, setActiveTab, username, onLogout }) {
  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">SnooFlow</span>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden sm:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800/70">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === id ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {activeTab === id && (
                  <motion.span
                    layoutId="desktopTab"
                    className="absolute inset-0 bg-zinc-800 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
              @{username}
            </span>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/70 pb-safe">
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto px-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-orange-400' : 'text-zinc-500'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobileTabDot"
                    className="absolute top-1.5 w-8 h-1 rounded-full bg-orange-500"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
