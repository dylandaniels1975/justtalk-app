import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatApiError } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6" data-testid="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 text-sm font-mono" data-testid="auth-back-btn">
          <ArrowLeft size={16} /> back
        </button>

        <h1 className="text-4xl font-black tracking-tighter mb-2" data-testid="auth-title">
          {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE VOID'}
        </h1>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-10">
          {mode === 'login' ? 'sign in to continue' : 'create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 block mb-2">Email</label>
            <input
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/10 px-4 py-3 text-white focus:border-white outline-none transition-colors font-mono text-sm"
              placeholder="you@email.com"
              required
            />
          </div>
          <div>
            <label className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 block mb-2">Password</label>
            <input
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-white/10 px-4 py-3 text-white focus:border-white outline-none transition-colors font-mono text-sm"
              placeholder={mode === 'register' ? '6+ characters' : '********'}
              required
              minLength={mode === 'register' ? 6 : undefined}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[#FF3B30] text-sm font-mono" data-testid="auth-error">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          data-testid="auth-toggle-mode"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="mt-8 text-zinc-500 hover:text-white transition-colors text-sm font-mono block mx-auto"
        >
          {mode === 'login' ? "don't have an account? sign up" : 'already have an account? sign in'}
        </button>
      </motion.div>
    </div>
  );
}
