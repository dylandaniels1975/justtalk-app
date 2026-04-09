import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { formatDistanceToNow } from 'date-fns';

export default function DMPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dm/threads').then(r => {
      setThreads(r.data.threads || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="dm-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-6">MESSAGES</h1>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>
        ) : threads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 font-mono text-sm">no messages yet</p>
            <p className="text-zinc-700 font-mono text-xs mt-2">add friends to start messaging</p>
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map(({ thread, other_user, unread_count }) => (
              <motion.button
                key={thread.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(`/dm/${thread.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors text-left"
                data-testid={`dm-thread-${other_user?.username}`}
              >
                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm text-zinc-500 shrink-0">
                  {other_user?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-white">{other_user?.username || 'unknown'}</p>
                    {thread.last_message_at && (
                      <p className="font-mono text-[10px] text-zinc-600">{formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}</p>
                    )}
                  </div>
                  <p className="font-mono text-xs text-zinc-500 truncate">{thread.last_message_preview || 'no messages yet'}</p>
                </div>
                {unread_count > 0 && (
                  <div className="w-5 h-5 bg-[#FF3B30] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">{unread_count}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
