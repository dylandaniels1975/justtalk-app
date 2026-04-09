import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden" data-testid="landing-page">
      {/* Ambient effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#FF3B30]/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative z-10 max-w-xl"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-8" data-testid="landing-title">
          just talk
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-mono text-xs sm:text-sm leading-relaxed text-zinc-500 mb-12 max-w-md mx-auto"
          data-testid="landing-tagline"
        >
          anonymous conversations with strangers. good talks become polaroids. polaroids become your profile. no selfies. no followers. no bullshit. just talk.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            data-testid="get-started-btn"
            onClick={() => navigate('/auth?mode=register')}
            className="bg-white text-black font-bold uppercase tracking-widest px-8 py-4 hover:bg-zinc-200 transition-colors text-sm"
          >
            get started
          </button>
          <button
            data-testid="sign-in-btn"
            onClick={() => navigate('/auth')}
            className="border border-white/20 text-white bg-transparent hover:bg-white/5 px-8 py-4 uppercase tracking-widest text-sm transition-colors"
          >
            sign in
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-700"
        >
          18+ only &bull; anonymous &bull; encrypted
        </motion.p>
      </motion.div>

      {/* Pulsing dots */}
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
