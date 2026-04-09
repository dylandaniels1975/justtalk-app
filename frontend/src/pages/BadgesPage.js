import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Lock } from '@phosphor-icons/react';

const RARITY_STYLES = {
  common: { border: 'border-zinc-700', bg: 'bg-zinc-900', text: 'text-zinc-300', label: 'COMMON' },
  uncommon: { border: 'border-cyan-800', bg: 'bg-cyan-950/30', text: 'text-cyan-400', label: 'UNCOMMON' },
  rare: { border: 'border-purple-800', bg: 'bg-purple-950/30', text: 'text-purple-400', label: 'RARE' },
  legendary: { border: 'border-yellow-700', bg: 'bg-yellow-950/30', text: 'text-yellow-400', label: 'LEGENDARY' },
  secret: { border: 'border-white/20', bg: 'bg-black', text: 'text-white', label: 'SECRET' },
};

export default function BadgesPage() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/badges'),
      api.get(`/badges/user/${user?._id}`),
    ]).then(([allRes, userRes]) => {
      setAllBadges(allRes.data.badges || []);
      setUserBadges(userRes.data.user_badges || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const earnedIds = new Set(userBadges.map(ub => ub.badge_id));
  const badgesByType = {};
  allBadges.forEach(b => {
    if (!badgesByType[b.type]) badgesByType[b.type] = [];
    badgesByType[b.type].push(b);
  });

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="badges-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-2">BADGES</h1>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-8">
          {userBadges.length}/{allBadges.filter(b => !b.is_secret).length} unlocked
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>
        ) : (
          Object.entries(badgesByType).map(([type, badges]) => (
            <div key={type} className="mb-8">
              <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3 capitalize">{type}</h3>
              <div className="grid grid-cols-2 gap-2">
                {badges.map((badge, i) => {
                  const earned = earnedIds.has(badge.id);
                  const style = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
                  const hidden = badge.is_secret && !earned;

                  return (
                    <motion.div
                      key={badge.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border p-3 transition-all ${earned ? `${style.border} ${style.bg}` : 'border-white/5 bg-white/[0.01]'} ${!earned && 'opacity-40'}`}
                      data-testid={`badge-${badge.name.replace(/\s/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-mono text-xs font-bold ${earned ? style.text : 'text-zinc-600'}`}>
                          {hidden ? '???' : badge.name}
                        </p>
                        {!earned && <Lock size={12} className="text-zinc-600" />}
                      </div>
                      <p className="font-mono text-[10px] text-zinc-500 leading-tight">
                        {hidden ? 'hidden badge' : badge.description}
                      </p>
                      <p className={`font-mono text-[9px] mt-2 uppercase tracking-wider ${earned ? style.text : 'text-zinc-700'}`}>
                        {style.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Navigation />
    </div>
  );
}
