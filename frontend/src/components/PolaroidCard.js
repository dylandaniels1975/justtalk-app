import { motion } from 'framer-motion';

export default function PolaroidCard({ polaroid }) {
  const rotation = polaroid.rotation_degrees || 0;
  const lines = (polaroid.snapshot_text || '').split('\n').slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.3)' }}
      className="bg-[#111111] border border-white/10 p-3 pb-10 shadow-2xl relative cursor-pointer transition-all"
      style={{ transform: `rotate(${rotation}deg)` }}
      data-testid={`polaroid-${polaroid.id}`}
    >
      {/* Chat snapshot */}
      <div className="bg-black p-3 min-h-[100px] overflow-hidden">
        {lines.map((line, i) => (
          <p key={i} className="font-mono text-[9px] text-zinc-500 leading-relaxed truncate">
            {line}
          </p>
        ))}
      </div>

      {/* Bottom area */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
        {polaroid.shared_interests?.length > 0 && (
          <p className="font-mono text-[8px] text-zinc-600 truncate">{polaroid.shared_interests[0]}</p>
        )}
        <p className="font-mono text-[8px] text-zinc-700">
          {polaroid.created_at ? new Date(polaroid.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </p>
      </div>

      {/* Pinned indicator */}
      {polaroid.is_pinned && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3B30] rounded-full" />
      )}
    </motion.div>
  );
}
