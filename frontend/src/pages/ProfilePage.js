import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import PolaroidCard from '@/components/PolaroidCard';
import { MapPin, Trophy, ChatDots, Camera as CameraIcon, Users } from '@phosphor-icons/react';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const profileId = userId || currentUser?._id;
  const isOwn = !userId || userId === currentUser?._id;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [polaroids, setPolaroids] = useState([]);
  const [badges, setBadges] = useState([]);
  const [country, setCountry] = useState(null);
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    if (!profileId) return;
    api.get(`/users/${profileId}`).then(r => {
      setProfile(r.data.user);
      setStats(r.data.stats || {});
      setPolaroids(r.data.polaroids || []);
      setBadges(r.data.badges || []);
      setCountry(r.data.country);
      setInterests(r.data.interests || []);
    }).catch(() => {});
  }, [profileId]);

  if (!profile) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="profile-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tighter" data-testid="profile-username">@{profile.username}</h1>
            {country && <span className="text-lg">{country.flag}</span>}
          </div>
          {profile.tagline && <p className="text-zinc-400 text-sm">{profile.tagline}</p>}
          {profile.country_code && country && (
            <p className="font-mono text-xs text-zinc-500 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {country.name}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { icon: ChatDots, label: 'talks', value: stats.total_conversations || 0 },
            { icon: CameraIcon, label: 'polaroids', value: stats.total_polaroids || 0 },
            { icon: Users, label: 'friends', value: stats.total_friends || 0 },
            { icon: Trophy, label: 'badges', value: badges.length },
          ].map((s, i) => (
            <div key={i} className="border border-white/5 p-3 text-center">
              <s.icon size={16} className="mx-auto text-zinc-500 mb-1" />
              <p className="text-lg font-black">{s.value}</p>
              <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="mb-8">
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map(name => (
                <span key={name} className="px-2 py-1 border border-white/10 font-mono text-xs text-zinc-400">{name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-8">
            <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, i) => (
                <div key={i} className={`px-3 py-1.5 border text-xs font-mono ${
                  b.rarity === 'legendary' ? 'border-yellow-500/50 text-yellow-400' :
                  b.rarity === 'rare' ? 'border-purple-500/50 text-purple-400' :
                  b.rarity === 'uncommon' ? 'border-cyan-500/50 text-cyan-400' :
                  'border-white/10 text-zinc-400'
                }`}>
                  {b.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polaroids */}
        <div>
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4">Polaroids</h3>
          {polaroids.length === 0 ? (
            <p className="text-zinc-600 font-mono text-sm">no polaroids yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {polaroids.map(p => (
                <PolaroidCard key={p.id} polaroid={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
