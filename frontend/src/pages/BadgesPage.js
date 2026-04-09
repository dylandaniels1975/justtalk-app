import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Lock, Check } from '@phosphor-icons/react';

const RARITY_STYLES = {
  common: { border: 'border-zinc-700', bg: 'bg-zinc-900', text: 'text-zinc-300', label: 'COMMON', bar: 'bg-zinc-500' },
  uncommon: { border: 'border-cyan-800', bg: 'bg-cyan-950/30', text: 'text-cyan-400', label: 'UNCOMMON', bar: 'bg-cyan-500' },
  rare: { border: 'border-purple-800', bg: 'bg-purple-950/30', text: 'text-purple-400', label: 'RARE', bar: 'bg-purple-500' },
  legendary: { border: 'border-yellow-700', bg: 'bg-yellow-950/30', text: 'text-yellow-400', label: 'LEGENDARY', bar: 'bg-yellow-500' },
  secret: { border: 'border-white/20', bg: 'bg-black', text: 'text-white', label: 'SECRET', bar: 'bg-white' },
};

export default function BadgesPage() {
  const { user } = useAuth();
  const [badgeData, setBadgeData] = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/badges/progress').then(r => {
      setBadgeData(r.data.badges || []);
      setEarnedCount(r.data.earned_count || 0);
      setTotalCount(r.data.total_count || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const badgesByType = {};
  badgeData.forEach(b => {
    if (!badgesByType[b.type]) badgesByType[b.type] = [];
    badgesByType[b.type].push(b);
  });

  const typeOrder = ['conversation', 'polaroid', 'friend', 'social', 'special'];

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="badges-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-2">BADGES</h1>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-2">
          {earnedCount}/{badgeData.filter(b => !b.is_secret).length} unlocked
        </p>

        {/* Overall progress bar */}
        <div className="w-full h-1 bg-white/5 mb-8">
          <div className="h-full bg-[#FF3B30] transition-all" style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>
        ) : (
          typeOrder.map(type => {
            const badges = badgesByType[type];
            if (!badges) return null;
            return (
              <div key={type} className="mb-10">
                <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 capitalize">{type} badges</h3>
                <div className="space-y-2">
                  {badges.map((badge, i) => {
                    const style = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
                    const hidden = badge.is_secret && !badge.earned;
                    const hasProgress = badge.max && badge.max > 0;
                    const progressPct = hasProgress ? Math.min((badge.progress / badge.max) * 100, 100) : 0;

                    return (
                      <motion.div
                        key={badge.id || i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border p-4 transition-all ${badge.earned ? `${style.border} ${style.bg}` : 'border-white/5 bg-white/[0.01]'} ${!badge.earned && 'opacity-60'}`}
                        data-testid={`badge-${badge.name?.replace(/\s/g, '-').toLowerCase()}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {badge.earned ? (
                              <Check size={14} weight="bold" className={style.text} />
                            ) : (
                              <Lock size={14} className="text-zinc-600" />
                            )}
                            <p className={`font-mono text-sm font-bold ${badge.earned ? style.text : 'text-zinc-500'}`}>
                              {hidden ? '???' : badge.name}
                            </p>
                          </div>
                          <span className={`font-mono text-[9px] uppercase tracking-wider ${badge.earned ? style.text : 'text-zinc-700'}`}>
                            {style.label}
                          </span>
                        </div>

                        <p className="font-mono text-[11px] text-zinc-500 mb-2 ml-6">
                          {hidden ? 'hidden achievement' : badge.description}
                        </p>

                        {/* Progress bar for threshold-based badges */}
                        {hasProgress && !badge.earned && (
                          <div className="ml-6">
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className={`h-full ${style.bar}`}
                              />
                            </div>
                            <p className="font-mono text-[9px] text-zinc-600 mt-1">
                              {badge.progress}/{badge.max}
                            </p>
                          </div>
                        )}

                        {badge.earned && badge.unlock_message && (
                          <p className="font-mono text-[10px] text-zinc-600 ml-6 italic">"{badge.unlock_message}"</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
      <Navigation />
    </div>
  );
}
