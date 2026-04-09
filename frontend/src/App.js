import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import OnboardingPage from '@/pages/OnboardingPage';
import HomePage from '@/pages/HomePage';
import ChatPage from '@/pages/ChatPage';
import ConversationEndPage from '@/pages/ConversationEndPage';
import ProfilePage from '@/pages/ProfilePage';
import FriendsPage from '@/pages/FriendsPage';
import DMPage from '@/pages/DMPage';
import DMThreadPage from '@/pages/DMThreadPage';
import BadgesPage from '@/pages/BadgesPage';
import SettingsPage from '@/pages/SettingsPage';
import Navigation from '@/components/Navigation';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : user.onboarding_completed ? <Navigate to="/home" /> : <Navigate to="/onboarding" />} />
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/home" />} />
      <Route path="/onboarding" element={user && !user.onboarding_completed ? <OnboardingPage /> : <Navigate to="/home" />} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/conversation-end/:conversationId" element={<ProtectedRoute><ConversationEndPage /></ProtectedRoute>} />
      <Route path="/profile/:userId?" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
      <Route path="/dm" element={<ProtectedRoute><DMPage /></ProtectedRoute>} />
      <Route path="/dm/:threadId" element={<ProtectedRoute><DMThreadPage /></ProtectedRoute>} />
      <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#050505]">
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#111111', color: '#fff', border: '1px solid #262626', borderRadius: '0', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
