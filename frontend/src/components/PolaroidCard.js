import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { X, ArrowLeft } from '@phosphor-icons/react';

export default function PolaroidCard({ polaroid }) {
  const [showReplay, setShowReplay] = useState(false);
  const [replayData, setReplayData] = useState(null);
  const [loadingReplay, setLoadingReplay] = useState(false);
  const rotation = polaroid.rotation_degrees || 0;
  const lines = (polaroid.snapshot_text || '').split('\n').slice(0, 6);

  const openReplay = async () => {
    if (!polaroid.conversation_id) return;
    setShowReplay(true);
    setLoadingReplay(true);
    try {
      const { data } = await api.get(`/conversations/${polaroid.conversation_id}/replay`);
      setReplayData(data);
    } catch {
      setReplayData(null);
    }
    setLoadingReplay(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.3)' }}
        onClick={openReplay}
        className="bg-[#111111] border border-white/10 p-3 pb-10 shadow-2xl relative cursor-pointer transition-all"
        style={{ transform: `rotate(${rotation}deg)` }}
        data-testid={`polaroid-${polaroid.id}`}
      >
        <div className="bg-black p-3 min-h-[100px] overflow-hidden">
          {lines.map((line, i) => (
            <p key={i} className="font-mono text-[9px] text-zinc-500 leading-relaxed truncate">{line}</p>
          ))}
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          {polaroid.shared_interests?.length > 0 && (
            <p className="font-mono text-[8px] text-zinc-600 truncate">{polaroid.shared_interests[0]}</p>
          )}
          <p className="font-mono text-[8px] text-zinc-700">
            {polaroid.created_at ? new Date(polaroid.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </p>
        </div>
        {polaroid.is_pinned && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3B30] rounded-full" />}
        {polaroid.is_from_ai_chat && <div className="absolute top-2 right-2 font-mono text-[8px] text-zinc-600">AI</div>}
      </motion.div>

      {/* Conversation Replay Modal */}
      <AnimatePresence>
        {showReplay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
            data-testid="polaroid-replay-modal"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
              <button onClick={() => setShowReplay(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors" data-testid="close-replay-btn">
                <X size={20} />
              </button>
              <div>
                <p className="font-mono text-sm text-white">Conversation Replay</p>
                <p className="font-mono text-[10px] text-zinc-500">
                  {replayData?.partner?.username || 'stranger'}
                  {replayData?.conversation?.shared_interests?.length > 0 && ` / ${replayData.conversation.shared_interests.slice(0, 2).join(', ')}`}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
              {loadingReplay ? (
                <div className="flex justify-center py-12"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>
              ) : replayData?.messages?.length ? (
                replayData.messages.map((msg, i) => {
                  const isAI = msg.is_ai_message || msg.sender_id?.startsWith('ai_');
                  const isMine = !isAI && msg.sender_id !== replayData?.partner?._id;
                  return (
                    <div key={msg.id || i} className={`py-1 ${isMine ? 'text-right' : ''}`}>
                      {isMine ? (
                        <p className="text-zinc-400 text-sm inline-block max-w-[80%]">{msg.content}</p>
                      ) : (
                        <div className="border-l-2 border-white/20 pl-4 inline-block max-w-[80%] text-left">
                          <p className="text-white text-sm">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-zinc-600 font-mono text-sm text-center py-12">conversation data not available</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <p className="font-mono text-[10px] text-zinc-600">
                {replayData?.messages?.length || 0} messages
                {replayData?.conversation?.duration_seconds ? ` / ${Math.floor(replayData.conversation.duration_seconds / 60)}min` : ''}
              </p>
              <p className="font-mono text-[10px] text-zinc-600">
                {replayData?.conversation?.created_at ? new Date(replayData.conversation.created_at).toLocaleDateString() : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
