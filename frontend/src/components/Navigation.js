import { useLocation, useNavigate } from 'react-router-dom';
import { House, Users, User, Gear, ChatDots } from '@phosphor-icons/react';

const NAV_ITEMS = [
  { path: '/home', icon: House, label: 'Home' },
  { path: '/friends', icon: Users, label: 'Friends' },
  { path: '/dm', icon: ChatDots, label: 'DM' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Gear, label: 'Settings' },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 flex justify-around py-3 px-2 z-50" data-testid="navigation">
      {NAV_ITEMS.map(item => {
        const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            data-testid={`nav-${item.label.toLowerCase()}`}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${active ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <item.icon size={20} weight={active ? 'fill' : 'regular'} />
            <span className="font-mono text-[9px] uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
