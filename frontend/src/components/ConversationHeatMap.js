import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Fire } from '@phosphor-icons/react';

export default function ConversationHeatMap() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/stats/heatmap').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return null;

  const maxCount = Math.max(...data.heatmap.map(h => h.count), 1);
  const currentHour = new Date().getHours();

  return (
    <div className="border border-white/5 p-4" data-testid="conversation-heatmap">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500">activity</p>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
          <span className="font-mono text-[10px] text-zinc-500">{data.active_conversations} live now</span>
        </div>
      </div>

      {/* Heat map bars */}
      <div className="flex items-end gap-[2px] h-12 mb-2">
        {data.heatmap.map((h, i) => {
          const height = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
          const isCurrent = h.hour === currentHour;
          return (
            <motion.div
              key={h.hour}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              className={`flex-1 min-w-0 transition-colors ${isCurrent ? 'bg-[#FF3B30]' : h.count > 0 ? 'bg-white/20' : 'bg-white/5'}`}
              title={`${h.hour}:00 - ${h.count} conversations`}
            />
          );
        })}
      </div>

      {/* Hour labels */}
      <div className="flex justify-between">
        <span className="font-mono text-[8px] text-zinc-700">0</span>
        <span className="font-mono text-[8px] text-zinc-700">6</span>
        <span className="font-mono text-[8px] text-zinc-700">12</span>
        <span className="font-mono text-[8px] text-zinc-700">18</span>
        <span className="font-mono text-[8px] text-zinc-700">23</span>
      </div>

      <p className="font-mono text-[9px] text-zinc-600 mt-2 text-center">
        {data.total_past_7_days} conversations this week
      </p>
    </div>
  );
}
