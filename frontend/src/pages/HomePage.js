import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import QueueDots from '@/components/QueueDots';
import ConversationHeatMap from '@/components/ConversationHeatMap';
import { Lightning, ArrowRight, Television, Crown, Fire } from '@phosphor-icons/react';

export default function HomePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [activeConv, setActiveConv] = useState(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [userInterests, setUserInterests] = useState([]);

  useEffect(() => {
    api.get('/conversations/active/mine').then(r => {
      if (r.data.conversation) setActiveConv(r.data.conversation);
    }).catch(() => {});
    // Fetch user's interests with trending data
    if (user?.interests?.length) {
      api.get('/interests').then(r => {
        const all = r.data.interests || [];
        const mine = all.filter(i => (user.interests || []).includes(i.name));
        setUserInterests(mine);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!inQueue) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/queue/status');
        if (data.status === 'matched') {
          setInQueue(false);
          navigate(`/chat/${data.conversation.id}`);
        } else if (data.status === 'waiting') {
          setQueueTime(Math.floor(data.wait_seconds || 0));
        } else {
          setInQueue(false);
        }
      } catch { setInQueue(false); }
    }, 2000);
    return () => clearInterval(interval);
  }, [inQueue, navigate]);

  const joinQueue = async () => {
    try {
      const { data } = await api.post('/queue/join', { interest_ids: user?.interests || [] });
      if (data.status === 'matched') {
        navigate(`/chat/${data.conversation.id}`);
      } else {
        setInQueue(true);
        setQueueTime(0);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail?.includes('limit')) navigate('/vip');
      else alert(detail || 'Error');
    }
  };

  const leaveQueue = async () => {
    try { await api.delete('/queue/leave'); } catch {}
    setInQueue(false);
  };

  const watchAd = async () => {
    setWatchingAd(true);
    setTimeout(async () => {
      try {
        const { data } = await api.post('/users/watch-ad');
        updateUser({ conversations_left: data.conversations_left });
      } catch {}
      setWatchingAd(false);
    }, 3000);
  };

  const convosLeft = user?.conversations_left || 0;

  return (
    <div className="min-h-screen bg-[#050505] pb-20" data-testid="home-page">
      <AnimatePresence mode="wait">
        {inQueue ? (
          <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col items-center justify-center px-6">
            <QueueDots />
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mt-8" data-testid="queue-status">searching for someone...</p>
            <p className="font-mono text-xs text-zinc-600 mt-2">{queueTime}s</p>
            <button onClick={leaveQueue} data-testid="leave-queue-btn" className="mt-12 border border-white/10 px-8 py-3 text-zinc-500 hover:text-white hover:border-white/30 transition-colors font-mono text-xs uppercase tracking-widest">cancel</button>
          </motion.div>
        ) : (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pt-12">
            <div className="max-w-lg mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-1" data-testid="home-title">just talk</h1>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-8">
                {user?.is_vip ? 'unlimited' : `${convosLeft} left today`}
              </p>

              {activeConv && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/chat/${activeConv.id}`)}
                  className="w-full border border-[#FF3B30]/50 bg-[#FF3B30]/5 px-6 py-4 mb-6 flex items-center justify-between hover:border-[#FF3B30] transition-colors"
                  data-testid="active-conversation-btn">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
                    <span className="font-mono text-sm">active conversation</span>
                  </div>
                  <ArrowRight size={16} />
                </motion.button>
              )}

              <button data-testid="start-talking-btn" onClick={joinQueue}
                className="w-full bg-white text-black font-bold uppercase tracking-widest py-5 hover:bg-zinc-200 transition-colors text-sm mb-4">
                <Lightning size={18} weight="fill" className="inline mr-2" />
                start talk
              </button>

              {/* Ad Reward */}
              {!user?.is_vip && convosLeft < 20 && (
                <button data-testid="watch-ad-btn" onClick={watchAd} disabled={watchingAd}
                  className="w-full border border-white/10 py-3 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-50">
                  <Television size={16} />
                  {watchingAd ? 'watching...' : 'watch ad +5 conversations'}
                </button>
              )}

              {/* User's interests with trending info */}
              {userInterests.length > 0 && (
                <div className="mb-8">
                  <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3">your interests</p>
                  <div className="flex flex-wrap gap-2">
                    {userInterests.map(i => (
                      <span key={i.name} className={`px-2.5 py-1 border font-mono text-xs flex items-center gap-1.5 ${i.is_trending ? 'border-[#FF3B30]/30 text-[#FF3B30]/80' : 'border-white/10 text-zinc-400'}`}>
                        {i.icon} {i.name}
                        {i.is_trending && <Fire size={10} weight="fill" className="text-[#FF3B30]" />}
                        <span className="text-[9px] text-zinc-600">{i.usage_percentage}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Heat Map */}
              <ConversationHeatMap />

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="border border-white/5 p-4">
                  <p className="font-mono text-xs text-zinc-500">conversations</p>
                  <p className="text-2xl font-black mt-1">{user?.is_vip ? '\u221e' : convosLeft}</p>
                </div>
                <div className="border border-white/5 p-4">
                  <p className="font-mono text-xs text-zinc-500">status</p>
                  <p className="text-sm font-mono mt-2 flex items-center gap-1">
                    {user?.is_vip ? <><Crown size={14} className="text-yellow-400" /><span className="text-yellow-400">VIP</span></> : <span className="text-zinc-400">free</span>}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!inQueue && <Navigation />}
    </div>
  );
}
