import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Switch } from '@/components/ui/switch';
import { SignOut, Bell, SpeakerHigh, Moon, Crown, Pencil } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [tagline, setTagline] = useState(user?.tagline || '');
  const [username, setUsername] = useState(user?.username || '');

  const toggleSetting = async (key, value) => {
    try {
      const { data } = await api.put('/settings', { [key]: value });
      updateUser(data.user);
      toast.success('Setting updated');
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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="settings-page">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-3xl font-black tracking-tighter mb-8">SETTINGS</h1>

        {/* Profile Section */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <Pencil size={12} /> Profile
          </h3>
          <div className="border border-white/10 p-4 space-y-4">
            <div>
              <label className="font-mono text-xs text-zinc-500 block mb-1">Username</label>
              {editing ? (
                <input
                  data-testid="settings-username-input"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-transparent border border-white/10 px-3 py-2 text-white focus:border-white outline-none font-mono text-sm"
                />
              ) : (
                <p className="font-mono text-sm text-white">@{user?.username}</p>
              )}
            </div>
            <div>
              <label className="font-mono text-xs text-zinc-500 block mb-1">Tagline</label>
              {editing ? (
                <input
                  data-testid="settings-tagline-input"
                  value={tagline}
                  onChange={e => setTagline(e.target.value.slice(0, 50))}
                  className="w-full bg-transparent border border-white/10 px-3 py-2 text-white focus:border-white outline-none font-mono text-sm"
                  placeholder="50 chars max"
                />
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
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <Crown size={12} /> VIP Status
          </h3>
          <div className="border border-white/10 p-4">
            {user?.is_vip ? (
              <p className="font-mono text-sm text-yellow-400">VIP Active</p>
            ) : (
              <div>
                <p className="font-mono text-sm text-zinc-400 mb-3">Unlimited conversations, media messages, and more.</p>
                <button data-testid="upgrade-vip-btn" className="px-4 py-2 border border-yellow-600 text-yellow-400 font-mono text-xs uppercase tracking-widest hover:bg-yellow-600/10 transition-colors">
                  Upgrade to VIP
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <Bell size={12} /> Notifications
          </h3>
          <div className="border border-white/10 divide-y divide-white/5">
            {[
              { key: 'notification_friend_request', label: 'Friend requests' },
              { key: 'notification_dm', label: 'Direct messages' },
              { key: 'notification_polaroid', label: 'Polaroids' },
              { key: 'notification_badge', label: 'Badges' },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-sm text-zinc-300">{s.label}</span>
                <Switch
                  data-testid={`toggle-${s.key}`}
                  checked={user?.[s.key] !== false}
                  onCheckedChange={(checked) => toggleSetting(s.key, checked)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Sound */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <SpeakerHigh size={12} /> Sound
          </h3>
          <div className="border border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-sm text-zinc-300">Sound effects</span>
            <Switch
              data-testid="toggle-sound"
              checked={user?.sound_enabled !== false}
              onCheckedChange={(checked) => toggleSetting('sound_enabled', checked)}
            />
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="mb-8">
          <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <Moon size={12} /> Quiet Hours
          </h3>
          <div className="border border-white/10 px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-mono text-sm text-zinc-300">Enable quiet hours</span>
              <p className="font-mono text-[10px] text-zinc-600">10pm - 8am</p>
            </div>
            <Switch
              data-testid="toggle-quiet-hours"
              checked={user?.quiet_hours_enabled || false}
              onCheckedChange={(checked) => toggleSetting('quiet_hours_enabled', checked)}
            />
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="w-full border border-[#FF3B30]/30 text-[#FF3B30] px-6 py-4 font-mono text-sm uppercase tracking-widest hover:bg-[#FF3B30]/10 transition-colors flex items-center justify-center gap-2"
        >
          <SignOut size={16} />
          Sign Out
        </button>
      </div>

      <Navigation />
    </div>
  );
}
