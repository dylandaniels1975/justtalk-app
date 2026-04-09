import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import QueueDots from '@/components/QueueDots';
import { AIAvatar } from '@/components/AIAvatars';
import { Lightning, ArrowRight, Television, Crown } from '@phosphor-icons/react';

export default function HomePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [suggestAi, setSuggestAi] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    api.get('/conversations/active/mine').then(r => {
      if (r.data.conversation) setActiveConv(r.data.conversation);
    }).catch(() => {});
  }, []);

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
          setSuggestAi(data.suggest_ai || false);
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
        setSuggestAi(false);
      }
    } catch (err) {
      if (err.response?.data?.detail) alert(err.response.data.detail);
    }
  };

  const matchWithAi = async (persona) => {
    try {
      const { data } = await api.post('/queue/join', { interest_ids: user?.interests || [], prefer_ai: persona });
      if (data.status === 'matched') {
        setInQueue(false);
        navigate(`/chat/${data.conversation.id}`);
      }
    } catch (err) {
      if (err.response?.data?.detail) alert(err.response.data.detail);
    }
  };

  const leaveQueue = async () => {
    try { await api.delete('/queue/leave'); } catch {}
    setInQueue(false);
  };

  const watchAd = async () => {
    setWatchingAd(true);
    // Simulate ad watching (3 seconds)
    setTimeout(async () => {
      try {
        const { data } = await api.post('/users/watch-ad');
        updateUser({ conversations_left: data.conversations_left });
        setWatchingAd(false);
      } catch {
        setWatchingAd(false);
      }
    }, 3000);
  };

  const convosLeft = user?.conversations_left || 0;

  return (
    <div className="min-h-screen bg-[#050505] pb-20" data-testid="home-page">
      <AnimatePresence mode="wait">
        {inQueue ? (
          <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col items-center justify-center px-6">
            <QueueDots />
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mt-8" data-testid="queue-status">searching for connection...</p>
            <p className="font-mono text-xs text-zinc-600 mt-2">{queueTime}s</p>
            {suggestAi && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 space-y-3 w-full max-w-xs">
                <p className="font-mono text-xs text-zinc-500 text-center mb-4">no one around? talk to an ai persona</p>
                {['justin', 'justine', 'justice'].map(p => (
                  <button key={p} onClick={() => matchWithAi(p)} data-testid={`ai-${p}-btn`}
                    className="w-full border border-white/10 px-4 py-3 text-left hover:border-white/30 transition-colors flex items-center gap-3">
                    <AIAvatar persona={p} size={32} />
                    <div>
                      <span className="font-mono text-sm text-white capitalize">{p}</span>
                      <span className="font-mono text-xs text-zinc-500 ml-2">
                        {p === 'justin' ? 'male energy' : p === 'justine' ? 'female energy' : 'non-binary'}
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
            <button onClick={leaveQueue} data-testid="leave-queue-btn" className="mt-8 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest">cancel</button>
          </motion.div>
        ) : (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pt-12">
            <div className="max-w-lg mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2" data-testid="home-title">JUST TALK</h1>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-8">
                {user?.is_vip ? 'unlimited conversations' : `${convosLeft} conversations left today`}
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
                Find someone to talk to
              </button>

              {/* Ad Reward */}
              {!user?.is_vip && convosLeft < 20 && (
                <button data-testid="watch-ad-btn" onClick={watchAd} disabled={watchingAd}
                  className="w-full border border-white/10 py-3 font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center gap-2 mb-6 disabled:opacity-50">
                  <Television size={16} />
                  {watchingAd ? 'watching ad...' : 'watch ad for +5 conversations'}
                </button>
              )}

              {/* AI Personas with SVG silhouettes */}
              <div className="mt-6">
                <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4">or talk to an ai persona</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'justin', desc: 'Underground music and obscure films' },
                    { name: 'justine', desc: 'Read every book, traveled everywhere' },
                    { name: 'justice', desc: 'Exists outside normal categories' },
                  ].map(p => (
                    <button key={p.name} onClick={() => matchWithAi(p.name)} data-testid={`ai-persona-${p.name}`}
                      className="border border-white/10 p-4 hover:border-white/30 transition-all hover:bg-white/[0.02] text-left flex flex-col items-center">
                      <AIAvatar persona={p.name} size={48} className="mb-3 border border-white/10" />
                      <p className="font-mono text-sm capitalize text-white text-center">{p.name}</p>
                      <p className="font-mono text-[10px] text-zinc-500 mt-1 leading-tight text-center">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats preview */}
              <div className="mt-10 grid grid-cols-2 gap-3">
                <div className="border border-white/5 p-4">
                  <p className="font-mono text-xs text-zinc-500">conversations left</p>
                  <p className="text-2xl font-black mt-1">{user?.is_vip ? '\u221e' : convosLeft}</p>
                </div>
                <div className="border border-white/5 p-4">
                  <p className="font-mono text-xs text-zinc-500">status</p>
                  <p className="text-sm font-mono mt-2 flex items-center gap-1">
                    {user?.is_vip ? <><Crown size={14} className="text-yellow-400" /> <span className="text-yellow-400">VIP</span></> : <span className="text-zinc-400">free</span>}
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
