import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Crown, Check, Lightning, Camera, ChatDots, Star, Image } from '@phosphor-icons/react';
import { toast } from 'sonner';

const VIP_FEATURES = [
  { icon: Lightning, text: 'Unlimited conversations' },
  { icon: Camera, text: 'Video polaroids' },
  { icon: Image, text: 'Send pictures & videos in chat' },
  { icon: Star, text: 'Pin top 3 polaroids' },
  { icon: Crown, text: 'VIP badge on profile' },
  { icon: ChatDots, text: 'No ads ever' },
];

export default function VIPPage() {
  const { user, checkAuth } = useAuth();

  const startCheckout = async () => {
    try {
      const { data } = await api.post('/subscriptions/create-checkout', { origin_url: window.location.origin });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-24" data-testid="vip-page">
      <div className="px-6 pt-16 max-w-lg mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Crown size={48} weight="fill" className="mx-auto mb-6 text-yellow-400" />

          <h1 className="text-4xl font-black tracking-tighter mb-2">VIP</h1>

          {user?.is_vip ? (
            <div className="mt-8">
              <div className="border border-yellow-600/30 bg-yellow-900/10 p-6">
                <p className="font-mono text-sm text-yellow-400 mb-2">Your VIP is active</p>
                <p className="font-mono text-xs text-zinc-500">Thank you for supporting Just Talk</p>
              </div>
            </div>
          ) : (
            <>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-10">
                unlock the full experience
              </p>

              <div className="text-left space-y-0 border border-white/10 divide-y divide-white/5 mb-8">
                {VIP_FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <f.icon size={18} className="text-yellow-400 shrink-0" />
                    <span className="font-mono text-sm text-zinc-300">{f.text}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-3xl font-black">$9.99</p>
                <p className="font-mono text-xs text-zinc-500">/month</p>
              </div>

              <button
                onClick={startCheckout}
                data-testid="subscribe-vip-btn"
                className="w-full py-4 bg-yellow-500 text-black font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
              >
                <Crown size={18} weight="fill" />
                Subscribe
              </button>

              <p className="font-mono text-[10px] text-zinc-600 mt-4">
                cancel anytime. no commitment.
              </p>
            </>
          )}
        </motion.div>
      </div>

      <Navigation />
    </div>
  );
}
