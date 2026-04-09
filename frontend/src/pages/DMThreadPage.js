import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { PaperPlaneRight, ArrowLeft } from '@phosphor-icons/react';

export default function DMThreadPage() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMsgIdRef = useRef(null);

  useEffect(() => {
    // Get thread info from dm threads list
    api.get('/dm/threads').then(r => {
      const found = (r.data.threads || []).find(t => t.thread.id === threadId);
      if (found) setOtherUser(found.other_user);
    });
  }, [threadId]);

  const fetchMessages = useCallback(async () => {
    try {
      const params = lastMsgIdRef.current ? { after: lastMsgIdRef.current } : {};
      const { data } = await api.get(`/dm/threads/${threadId}/messages`, { params });
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter(m => !ids.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        lastMsgIdRef.current = data.messages[data.messages.length - 1].id;
      }
    } catch {}
  }, [threadId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
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
    const tempMsg = { id: `temp_${Date.now()}`, sender_id: user._id, content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    try {
      const { data } = await api.post(`/dm/threads/${threadId}/messages`, { content });
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
      lastMsgIdRef.current = data.message.id;
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
    setSending(false);
  };

  return (
    <div className="h-screen bg-[#050505] flex flex-col" data-testid="dm-thread-page">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <button onClick={() => navigate('/dm')} className="p-1 hover:bg-white/10 rounded-full transition-colors" data-testid="dm-back-btn">
          <ArrowLeft size={18} />
        </button>
        <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-zinc-500">
          {otherUser?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <p className="font-mono text-sm text-white" data-testid="dm-other-username">{otherUser?.username || 'loading...'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`py-1.5 ${msg.sender_id === user?._id ? 'text-right' : ''}`}
            data-testid={`dm-message-${i}`}
          >
            {msg.sender_id === user?._id ? (
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
      <form onSubmit={sendMessage} className="border-t border-white/10 flex items-center">
        <input
          data-testid="dm-message-input"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="flex-1 bg-transparent p-6 text-white outline-none font-mono text-sm placeholder:text-zinc-600"
          placeholder="message..."
          maxLength={5000}
          autoFocus
        />
        <button type="submit" disabled={!newMessage.trim()} data-testid="dm-send-btn" className="p-6 text-zinc-500 hover:text-white transition-colors disabled:opacity-20">
          <PaperPlaneRight size={20} weight="fill" />
        </button>
      </form>
    </div>
  );
}
