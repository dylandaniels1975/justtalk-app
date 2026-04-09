import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Camera, UserPlus, House, Flag, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ConversationEndPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [friendSent, setFriendSent] = useState(false);
  const [polaroidSaved, setPolaroidSaved] = useState(false);

  useEffect(() => {
    api.get(`/conversations/${conversationId}`).then(r => {
      setConversation(r.data.conversation);
      setPartner(r.data.partner);
    }).catch(() => navigate('/home'));
    api.get(`/conversations/${conversationId}/messages`).then(r => setMessages(r.data.messages || []));
  }, [conversationId, navigate]);

  const sendFriendRequest = async () => {
    if (!partner || partner.is_ai || friendSent) return;
    try {
      await api.post('/friends/request', { addressee_id: partner._id, conversation_id: conversationId });
      setFriendSent(true);
    } catch {}
  };

  const savePolaroid = async () => {
    if (polaroidSaved) return;
    const recentMsgs = messages.slice(-8).map(m => {
      const name = m.sender_id === user?._id ? 'you' : (partner?.username || 'stranger');
      return `${name}: ${m.content}`;
    }).join('\n');
    try {
      await api.post('/polaroids', { conversation_id: conversationId, snapshot_text: recentMsgs });
      setPolaroidSaved(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const reportUser = async () => {
    if (!partner || partner.is_ai) return;
    try {
      await api.post('/reports', { reported_user_id: partner._id, conversation_id: conversationId, category: 'inappropriate' });
      toast.success('Report submitted');
    } catch {}
  };

  const hideUser = async () => {
    if (!partner || partner.is_ai) return;
    try {
      await api.post('/users/hide', { hidden_user_id: partner._id, conversation_id: conversationId });
      toast.success('User hidden');
    } catch {}
  };

  const duration = conversation?.duration_seconds || 0;
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const msgCount = conversation?.message_count || messages.length;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6" data-testid="conversation-end-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm w-full">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4">conversation ended</p>
        <h1 className="text-4xl font-black tracking-tighter mb-6" data-testid="end-title">
          {msgCount > 20 ? 'GOOD TALK.' : msgCount > 5 ? 'NOT BAD.' : 'BRIEF.'}
        </h1>

        <div className="flex gap-6 justify-center mb-10">
          <div>
            <p className="text-2xl font-black">{msgCount}</p>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">messages</p>
          </div>
          <div>
            <p className="text-2xl font-black">{mins}:{secs.toString().padStart(2, '0')}</p>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">duration</p>
          </div>
        </div>

        <div className="space-y-3">
          {!conversation?.is_ai_chat && partner && !partner.is_ai && (
            <button onClick={sendFriendRequest} disabled={friendSent} data-testid="add-friend-btn"
              className={`w-full border px-6 py-4 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors ${friendSent ? 'border-[#10B981] text-[#10B981]' : 'border-white/20 text-white hover:bg-white/5'}`}>
              <UserPlus size={18} />
              {friendSent ? 'REQUEST SENT' : 'ADD FRIEND'}
            </button>
          )}

          <button onClick={savePolaroid} disabled={polaroidSaved} data-testid="save-polaroid-btn"
            className={`w-full border px-6 py-4 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors ${polaroidSaved ? 'border-[#10B981] text-[#10B981]' : 'border-white/20 text-white hover:bg-white/5'}`}>
            <Camera size={18} />
            {polaroidSaved ? 'POLAROID SAVED' : 'SAVE POLAROID'}
          </button>

          <button onClick={() => navigate('/home')} data-testid="go-home-btn"
            className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-zinc-200 transition-colors text-sm flex items-center justify-center gap-2">
            <House size={18} />
            KEEP TALKING
          </button>

          {/* Report / Hide */}
          {!conversation?.is_ai_chat && partner && !partner.is_ai && (
            <div className="flex gap-2 pt-2">
              <button onClick={hideUser} data-testid="hide-user-btn"
                className="flex-1 border border-white/5 py-2 font-mono text-[10px] text-zinc-600 uppercase tracking-widest hover:text-zinc-400 hover:border-white/10 transition-colors flex items-center justify-center gap-1">
                <EyeSlash size={12} /> Hide
              </button>
              <button onClick={reportUser} data-testid="report-user-btn"
                className="flex-1 border border-white/5 py-2 font-mono text-[10px] text-zinc-600 uppercase tracking-widest hover:text-[#FF3B30] hover:border-[#FF3B30]/20 transition-colors flex items-center justify-center gap-1">
                <Flag size={12} /> Report
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
