import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { AIAvatar } from '@/components/AIAvatars';
import { PaperPlaneRight, Camera, SignOut, DotsThree, Flag, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [partner, setPartner] = useState(null);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`/conversations/${conversationId}`).then(r => {
      setConversation(r.data.conversation);
      setPartner(r.data.partner);
    }).catch(() => navigate('/home'));
  }, [conversationId, navigate]);

  const fetchMessages = useCallback(async () => {
    try {
      const params = lastMessageIdRef.current ? { after: lastMessageIdRef.current } : {};
      const { data } = await api.get(`/conversations/${conversationId}/messages`, { params });
      if (data.messages?.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter(m => !ids.has(m.id));
          return newMsgs.length ? [...prev, ...newMsgs] : prev;
        });
        lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
      }
      if (data.conversation_status === 'ended') {
        clearInterval(pollRef.current);
        navigate(`/conversation-end/${conversationId}`);
      }
    } catch {}
  }, [conversationId, navigate]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 1500);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    const tempMsg = { id: `temp_${Date.now()}`, sender_id: user._id, content, created_at: new Date().toISOString(), is_ai_message: false };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
      lastMessageIdRef.current = data.message.id;
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const endConversation = async () => {
    try {
      await api.post(`/conversations/${conversationId}/end`);
      navigate(`/conversation-end/${conversationId}`);
    } catch {}
  };

  const takePolaroid = async () => {
    const recentMsgs = messages.slice(-5).map(m => {
      const name = m.sender_id === user._id ? 'you' : (partner?.username || 'stranger');
      return `${name}: ${m.content}`;
    }).join('\n');
    try {
      await api.post('/polaroids', { conversation_id: conversationId, snapshot_text: recentMsgs });
      toast.success('Polaroid saved!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save polaroid');
    }
  };

  const reportUser = async () => {
    if (!partner || partner.is_ai) return;
    try {
      await api.post('/reports', {
        reported_user_id: partner._id,
        conversation_id: conversationId,
        category: 'inappropriate',
      });
      toast.success('Report submitted');
      setShowMenu(false);
    } catch {}
  };

  const hideUser = async () => {
    if (!partner || partner.is_ai) return;
    try {
      await api.post('/users/hide', {
        hidden_user_id: partner._id,
        conversation_id: conversationId,
      });
      toast.success('User hidden - you won\'t match again');
      setShowMenu(false);
    } catch {}
  };

  const isMyMessage = (msg) => msg.sender_id === user?._id;
  const isAI = conversation?.is_ai_chat;

  return (
    <div className="h-screen bg-[#050505] flex flex-col" data-testid="chat-page">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {isAI && conversation?.ai_persona && <AIAvatar persona={conversation.ai_persona} size={32} className="border border-white/10" />}
          <div>
            <p className="font-mono text-sm text-white" data-testid="chat-partner-name">{partner?.username || 'stranger'}</p>
            {conversation?.shared_interests?.length > 0 && (
              <p className="font-mono text-[10px] text-zinc-500">{conversation.shared_interests.slice(0, 3).join(' / ')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 relative">
          <button onClick={takePolaroid} data-testid="take-polaroid-btn" className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white" title="Take Polaroid">
            <Camera size={18} />
          </button>
          {!isAI && (
            <button onClick={() => setShowMenu(!showMenu)} data-testid="chat-menu-btn" className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
              <DotsThree size={18} weight="bold" />
            </button>
          )}
          <button onClick={endConversation} data-testid="end-conversation-btn" className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-[#FF3B30]" title="End conversation">
            <SignOut size={18} />
          </button>
          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 border border-white/10 bg-[#111] z-50 min-w-[160px]">
              <button onClick={reportUser} data-testid="report-user-btn" className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-white/5 transition-colors font-mono text-xs text-[#FF3B30]">
                <Flag size={14} /> Report user
              </button>
              <button onClick={hideUser} data-testid="hide-user-btn" className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-white/5 transition-colors font-mono text-xs text-zinc-400">
                <EyeSlash size={14} /> Hide user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1" data-testid="messages-container" onClick={() => setShowMenu(false)}>
        {conversation?.shared_interests?.length > 0 && (
          <div className="text-center py-4 mb-4">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-600">shared interests</p>
            <p className="font-mono text-xs text-zinc-500 mt-1">{conversation.shared_interests.join(' / ')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
            className={`py-1.5 ${isMyMessage(msg) ? 'text-right' : ''}`} data-testid={`message-${i}`}>
            {isMyMessage(msg) ? (
              <p className="text-zinc-400 text-sm inline-block max-w-[80%]">{msg.content}</p>
            ) : (
              <div className="border-l-2 border-white/20 pl-4 inline-block max-w-[80%] text-left">
                <p className="text-white text-sm">{msg.content}</p>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {conversation?.status === 'active' && (
        <form onSubmit={sendMessage} className="border-t border-white/10 flex items-center" data-testid="message-form">
          <input ref={inputRef} data-testid="message-input" value={newMessage} onChange={e => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent p-6 text-white outline-none font-mono text-sm placeholder:text-zinc-600"
            placeholder="say something..." maxLength={5000} autoFocus />
          <button type="submit" disabled={!newMessage.trim()} data-testid="send-message-btn" className="p-6 text-zinc-500 hover:text-white transition-colors disabled:opacity-20">
            <PaperPlaneRight size={20} weight="fill" />
          </button>
        </form>
      )}
    </div>
  );
}
