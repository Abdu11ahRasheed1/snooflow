import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { apiRequest, getToken, setToken } from './api/client';
import AuthView from './components/AuthView';
import Navbar from './components/Navbar';
import SearchReplyView from './components/SearchReplyView';
import CreatePostView from './components/CreatePostView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setChecking(false);
      return;
    }
    apiRequest('/api/auth')
      .then((data) => {
        setUser(data.user);
        if (!data.user.redditConfigured) {
          setActiveTab('settings');
        }
      })
      .catch(() => {
        setToken('');
      })
      .finally(() => setChecking(false));
  }, []);

  function handleAuth(authedUser) {
    setUser(authedUser);
    setActiveTab(authedUser.redditConfigured ? 'search' : 'settings');
  }

  function handleLogout() {
    setToken('');
    setUser(null);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 sm:pb-10">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={user.username}
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-4 pt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && <SearchReplyView key="search" />}
          {activeTab === 'post' && <CreatePostView key="post" />}
          {activeTab === 'settings' && (
            <SettingsView
              key="settings"
              onStatusChange={(status) =>
                setUser((prev) => ({ ...prev, ...status }))
              }
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
