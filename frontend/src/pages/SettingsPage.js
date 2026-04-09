import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Switch } from '@/components/ui/switch';
import { SignOut, Bell, SpeakerHigh, Moon, Crown, Pencil, Link as LinkIcon, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', name: 'Instagram', icon: '📷' },
  { key: 'twitter', name: 'Twitter/X', icon: '🐦' },
  { key: 'tiktok', name: 'TikTok', icon: '🎵' },
  { key: 'spotify', name: 'Spotify', icon: '🎧' },
  { key: 'discord', name: 'Discord', icon: '💬' },
  { key: 'youtube', name: 'YouTube', icon: '▶️' },
  { key: 'twitch', name: 'Twitch', icon: '📺' },
  { key: 'linkedin', name: 'LinkedIn', icon: '👔' },
];

export default function SettingsPage() {
  const { user, logout, updateUser, checkAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [tagline, setTagline] = useState(user?.tagline || '');
  const [username, setUsername] = useState(user?.username || '');
  const [socials, setSocials] = useState([]);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [socialUsername, setSocialUsername] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check for Stripe redirect
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setProcessingPayment(true);
      pollPaymentStatus(sessionId);
    }
  }, [searchParams]);

  useEffect(() => {
    api.get('/users/social/me').then(r => setSocials(r.data.socials || [])).catch(() => {});
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) {
      setProcessingPayment(false);
      toast.error('Payment status check timed out');
      return;
    }
    try {
      const { data } = await api.get(`/subscriptions/status/${sessionId}`);
      if (data.payment_status === 'paid') {
        setProcessingPayment(false);
        toast.success('VIP activated!');
        checkAuth();
        return;
      }
    } catch {}
    setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
  };

  const toggleSetting = async (key, value) => {
    try {
      const { data } = await api.put('/settings', { [key]: value });
      updateUser(data.user);
    } catch {}
  };

  const saveProfile = async () => {
    try {
      const { data } = await api.put('/users/profile', { tagline, username });
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const startVipCheckout = async () => {
    try {
      const { data } = await api.post('/subscriptions/create-checkout', { origin_url: window.location.origin });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed');
    }
  };

  const connectSocial = async () => {
    if (!connectingPlatform || !socialUsername.trim()) return;
    try {
      await api.post('/users/social/connect', { platform: connectingPlatform, username: socialUsername.trim() });
      toast.success(`${connectingPlatform} connected!`);
      setConnectingPlatform(null);
      setSocialUsername('');
      api.get('/users/social/me').then(r => setSocials(r.data.socials || []));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const disconnectSocial = async (platform) => {
    try {
      await api.delete(`/users/social/${platform}`);
      setSocials(prev => prev.filter(s => s.platform !== platform));
      toast.success(`${platform} disconnected`);
    } catch {}
  };

  const connectedPlatforms = new Set(socials.map(s => s.platform));

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="settings-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-8">SETTINGS</h1>

        {processingPayment && (
          <div className="border border-yellow-600/30 bg-yellow-900/10 p-4 mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <p className="font-mono text-sm text-yellow-400">Processing payment...</p>
          </div>
        )}

        {/* Profile */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2"><Pencil size={12} /> Profile</h3>
          <div className="border border-white/10 p-4 space-y-4">
            <div>
              <label className="font-mono text-xs text-zinc-500 block mb-1">Username</label>
              {editing ? (
                <input data-testid="settings-username-input" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-transparent border border-white/10 px-3 py-2 text-white focus:border-white outline-none font-mono text-sm" />
              ) : (
                <p className="font-mono text-sm text-white">@{user?.username}</p>
              )}
            </div>
            <div>
              <label className="font-mono text-xs text-zinc-500 block mb-1">Tagline</label>
              {editing ? (
                <input data-testid="settings-tagline-input" value={tagline} onChange={e => setTagline(e.target.value.slice(0, 50))}
                  className="w-full bg-transparent border border-white/10 px-3 py-2 text-white focus:border-white outline-none font-mono text-sm" placeholder="50 chars max" />
              ) : (
                <p className="font-mono text-sm text-zinc-400">{user?.tagline || 'no tagline'}</p>
              )}
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={saveProfile} data-testid="save-profile-btn" className="px-4 py-2 bg-white text-black font-mono text-xs uppercase tracking-widest">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 border border-white/10 font-mono text-xs uppercase tracking-widest text-zinc-400">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} data-testid="edit-profile-btn" className="font-mono text-xs text-[#FF3B30] uppercase tracking-widest hover:underline">Edit</button>
            )}
          </div>
        </section>

        {/* VIP */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2"><Crown size={12} /> VIP Status</h3>
          <div className="border border-white/10 p-4">
            {user?.is_vip ? (
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-yellow-400" />
                <p className="font-mono text-sm text-yellow-400">VIP Active</p>
              </div>
            ) : (
              <div>
                <p className="font-mono text-sm text-zinc-400 mb-1">$9.99/month</p>
                <ul className="space-y-1 mb-4">
                  {['Unlimited conversations', 'No ads', 'Pin polaroids', 'Media messages', 'VIP badge'].map(f => (
                    <li key={f} className="font-mono text-[11px] text-zinc-500 flex items-center gap-2">
                      <Check size={10} className="text-[#10B981]" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={startVipCheckout} data-testid="upgrade-vip-btn"
                  className="w-full py-3 border border-yellow-600 text-yellow-400 font-mono text-xs uppercase tracking-widest hover:bg-yellow-600/10 transition-colors flex items-center justify-center gap-2">
                  <Crown size={14} /> Upgrade to VIP
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Social Connections */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2"><LinkIcon size={12} /> Social Connections</h3>
          <p className="font-mono text-[10px] text-zinc-600 mb-3">Connect platforms to unlock social badges</p>
          <div className="border border-white/10 divide-y divide-white/5">
            {SOCIAL_PLATFORMS.map(p => {
              const connected = connectedPlatforms.has(p.key);
              const social = socials.find(s => s.platform === p.key);
              return (
                <div key={p.key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{p.icon}</span>
                    <div>
                      <span className="font-mono text-sm text-zinc-300">{p.name}</span>
                      {connected && <span className="font-mono text-[10px] text-zinc-500 ml-2">@{social?.username}</span>}
                    </div>
                  </div>
                  {connected ? (
                    <button onClick={() => disconnectSocial(p.key)} data-testid={`disconnect-${p.key}`}
                      className="font-mono text-[10px] text-zinc-600 hover:text-[#FF3B30] transition-colors">disconnect</button>
                  ) : connectingPlatform === p.key ? (
                    <div className="flex items-center gap-1">
                      <input value={socialUsername} onChange={e => setSocialUsername(e.target.value)}
                        className="bg-transparent border border-white/10 px-2 py-1 text-white font-mono text-xs w-24 focus:border-white outline-none" placeholder="username" autoFocus />
                      <button onClick={connectSocial} className="p-1 hover:bg-white/10 rounded-full text-[#10B981]"><Check size={14} /></button>
                      <button onClick={() => setConnectingPlatform(null)} className="p-1 hover:bg-white/10 rounded-full text-zinc-500"><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setConnectingPlatform(p.key)} data-testid={`connect-${p.key}`}
                      className="font-mono text-[10px] text-zinc-500 hover:text-white transition-colors">connect</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2"><Bell size={12} /> Notifications</h3>
          <div className="border border-white/10 divide-y divide-white/5">
            {[
              { key: 'notification_friend_request', label: 'Friend requests' },
              { key: 'notification_dm', label: 'Direct messages' },
              { key: 'notification_polaroid', label: 'Polaroids' },
              { key: 'notification_badge', label: 'Badges' },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-sm text-zinc-300">{s.label}</span>
                <Switch data-testid={`toggle-${s.key}`} checked={user?.[s.key] !== false} onCheckedChange={(checked) => toggleSetting(s.key, checked)} />
              </div>
            ))}
          </div>
        </section>

        {/* Sound */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2"><SpeakerHigh size={12} /> Sound</h3>
          <div className="border border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-sm text-zinc-300">Sound effects</span>
            <Switch data-testid="toggle-sound" checked={user?.sound_enabled !== false} onCheckedChange={(checked) => toggleSetting('sound_enabled', checked)} />
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2"><Moon size={12} /> Quiet Hours</h3>
          <div className="border border-white/10 px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-mono text-sm text-zinc-300">Enable quiet hours</span>
              <p className="font-mono text-[10px] text-zinc-600">10pm - 8am</p>
            </div>
            <Switch data-testid="toggle-quiet-hours" checked={user?.quiet_hours_enabled || false} onCheckedChange={(checked) => toggleSetting('quiet_hours_enabled', checked)} />
          </div>
        </section>

        {/* Logout */}
        <button onClick={logout} data-testid="logout-btn"
          className="w-full border border-[#FF3B30]/30 text-[#FF3B30] px-6 py-4 font-mono text-sm uppercase tracking-widest hover:bg-[#FF3B30]/10 transition-colors flex items-center justify-center gap-2">
          <SignOut size={16} /> Sign Out
        </button>
      </div>
      <Navigation />
    </div>
  );
}
