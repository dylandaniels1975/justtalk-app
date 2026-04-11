import { useLocation, useNavigate } from 'react-router-dom';
import { ChatCircle, Users, ChatDots, User, Crown, Gear } from '@phosphor-icons/react';

const NAV_ITEMS = [
  { path: '/home', icon: ChatCircle, label: 'Talk' },
  { path: '/friends', icon: Users, label: 'Friends' },
  { path: '/dm', icon: ChatDots, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/vip', icon: Crown, label: 'VIP' },
  { path: '/settings', icon: Gear, label: 'Settings' },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 flex justify-around py-2.5 px-1 z-50" data-testid="navigation">
      {NAV_ITEMS.map(item => {
        const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        const isVip = item.path === '/vip';
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            data-testid={`nav-${item.label.toLowerCase()}`}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${active ? (isVip ? 'text-yellow-400' : 'text-white') : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <item.icon size={18} weight={active ? 'fill' : 'regular'} />
            <span className="font-mono text-[8px] uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

