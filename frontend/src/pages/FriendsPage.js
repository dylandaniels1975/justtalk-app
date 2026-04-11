import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { UserPlus, Check, X, ChatDots } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export default function FriendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
      ]);
      setFriends(friendsRes.data.friends || []);
      setRequests(requestsRes.data.requests || []);
    } catch {}
    setLoading(false);
  };

  const acceptRequest = async (id) => {
    try {
      await api.put(`/friends/${id}/accept`);
      loadData();
    } catch {}
  };

  const rejectRequest = async (id) => {
    try {
      await api.put(`/friends/${id}/reject`);
      loadData();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="friends-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-6">FRIENDS</h1>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border border-white/10">
          {[
            { key: 'friends', label: 'Friends', count: friends.length },
            { key: 'requests', label: 'Requests', count: requests.length },
          ].map(t => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${tab === t.key ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {t.label} {t.count > 0 && <span className="ml-1 text-[10px]">({t.count})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <p className="text-zinc-600 font-mono text-sm text-center py-12">no friends yet. start talking to find some.</p>
          ) : (
            <div className="space-y-2">
              {friends.map(({ friendship, friend }) => (
                <motion.div key={friendship.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between px-4 py-3 border border-white/5 hover:border-white/10 transition-colors">
                  <button onClick={() => navigate(`/profile/${friend._id}`)} className="flex items-center gap-3 text-left" data-testid={`friend-${friend.username}`}>
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-zinc-500">
                      {friend.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-mono text-sm text-white">{friend.username}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{friend.tagline || 'no tagline'}</p>
                    </div>
                  </button>
                  <button onClick={() => navigate(`/dm/${friend._id}`)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white" data-testid={`dm-friend-${friend.username}`}>
                    <ChatDots size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <p className="text-zinc-600 font-mono text-sm text-center py-12">no pending requests</p>
          ) : (
            <div className="space-y-2">
              {requests.map(({ request: req, requester }) => (
                <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between px-4 py-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-zinc-500">
                      {requester.username?.[0]?.toUpperCase()}
                    </div>
                    <p className="font-mono text-sm text-white">{requester.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.id)} data-testid={`accept-${req.id}`} className="p-2 hover:bg-[#10B981]/20 rounded-full transition-colors text-[#10B981]">
                      <Check size={16} weight="bold" />
                    </button>
                    <button onClick={() => rejectRequest(req.id)} data-testid={`reject-${req.id}`} className="p-2 hover:bg-[#FF3B30]/20 rounded-full transition-colors text-[#FF3B30]">
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      <Navigation />
    </div>
  );
}
