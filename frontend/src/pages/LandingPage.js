import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden" data-testid="landing-page">
      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1750601490153-3f21e2d382a9?w=400)', backgroundSize: 'cover' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10 max-w-2xl"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-8" data-testid="landing-title">
          JUST<br />TALK
        </h1>

        <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-12" data-testid="landing-tagline">
          No selfies, no followers, no bullshit
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            data-testid="get-started-btn"
            onClick={() => navigate('/auth')}
            className="bg-white text-black font-bold uppercase tracking-widest px-8 py-4 hover:bg-zinc-200 transition-colors text-sm"
          >
            Start talking
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-zinc-600 text-sm font-mono"
        >
          20 free conversations / day
        </motion.p>
      </motion.div>

      {/* Decorative dots */}
      <div className="absolute bottom-12 flex gap-3">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}
