import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { formatApiError } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, MagnifyingGlass } from '@phosphor-icons/react';

const STEPS = ['gender', 'interests', 'country', 'username'];

export default function OnboardingPage() {
  const { updateUser, user } = useAuth();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [countryCode, setCountryCode] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interests, setInterests] = useState([]);
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/interests').then(r => setInterests(r.data.interests || []));
    api.get('/countries').then(r => setCountries(r.data.countries || []));
  }, []);

  const toggleInterest = (name) => {
    setSelectedInterests(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : prev.length < 10 ? [...prev, name] : prev
    );
  };

  const handleComplete = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/onboarding', {
        gender,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        country_code: countryCode || null,
        interest_ids: selectedInterests,
      });
      updateUser(data.user);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!gender;
    if (step === 1) return selectedInterests.length >= 3;
    if (step === 2) return true;
    if (step === 3) return username.length >= 3;
    return false;
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const categories = [...new Set(interests.map(i => i.category))];
  const filteredInterests = searchQuery
    ? interests.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : interests;
  const filteredCountries = searchQuery
    ? countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : countries;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col px-6 py-12" data-testid="onboarding-page">
      {/* Progress */}
      <div className="flex gap-2 mb-12 max-w-lg mx-auto w-full">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-0.5 flex-1 transition-colors ${i <= step ? 'bg-white' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="max-w-lg mx-auto w-full flex-1">
        <AnimatePresence mode="wait">
          {/* Step 0: Gender */}
          {step === 0 && (
            <motion.div key="gender" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-black tracking-tighter mb-2">HOW DO YOU IDENTIFY?</h2>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-8">this helps with matching</p>
              <div className="space-y-3">
                {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other / Prefer not to say' }].map(g => (
                  <button
                    key={g.value}
                    data-testid={`gender-${g.value}`}
                    onClick={() => setGender(g.value)}
                    className={`w-full text-left px-6 py-4 border transition-all ${gender === g.value ? 'border-white bg-white/5 text-white' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}
                  >
                    <span className="font-mono text-sm uppercase tracking-wider">{g.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Interests */}
          {step === 1 && (
            <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-black tracking-tighter mb-2">WHAT ARE YOU INTO?</h2>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">pick at least 3, max 10 ({selectedInterests.length}/10)</p>
              <div className="relative mb-6">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  data-testid="interest-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border border-white/10 pl-10 pr-4 py-3 text-white focus:border-white outline-none transition-colors font-mono text-sm"
                  placeholder="search interests..."
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-6">
                {searchQuery ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredInterests.map(i => (
                      <button
                        key={i.name}
                        data-testid={`interest-${i.name.replace(/\s/g, '-')}`}
                        onClick={() => toggleInterest(i.name)}
                        className={`px-3 py-1.5 border text-sm font-mono transition-all ${selectedInterests.includes(i.name) ? 'border-white bg-white text-black' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}
                      >
                        {i.icon} {i.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  categories.map(cat => (
                    <div key={cat}>
                      <h3 className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-3">{cat}</h3>
                      <div className="flex flex-wrap gap-2">
                        {interests.filter(i => i.category === cat).map(i => (
                          <button
                            key={i.name}
                            data-testid={`interest-${i.name.replace(/\s/g, '-')}`}
                            onClick={() => toggleInterest(i.name)}
                            className={`px-3 py-1.5 border text-sm font-mono transition-all ${selectedInterests.includes(i.name) ? 'border-white bg-white text-black' : 'border-white/10 text-zinc-400 hover:border-white/30'}`}
                          >
                            {i.icon} {i.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Country */}
          {step === 2 && (
            <motion.div key="country" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-black tracking-tighter mb-2">WHERE ARE YOU FROM?</h2>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">optional &mdash; shown as a flag</p>
              <div className="relative mb-4">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  data-testid="country-search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border border-white/10 pl-10 pr-4 py-3 text-white focus:border-white outline-none transition-colors font-mono text-sm"
                  placeholder="search countries..."
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-1">
                {filteredCountries.map(c => (
                  <button
                    key={c.code}
                    data-testid={`country-${c.code}`}
                    onClick={() => setCountryCode(c.code)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-white/5 transition-colors ${countryCode === c.code ? 'bg-white/5 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="font-mono text-sm">{c.name}</span>
                    {countryCode === c.code && <Check size={14} className="ml-auto text-[#FF3B30]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Username */}
          {step === 3 && (
            <motion.div key="username" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-black tracking-tighter mb-2">PICK A NAME</h2>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-zinc-500 mb-8">lowercase, no spaces. this is anonymous.</p>
              <input
                data-testid="username-input"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
                className="w-full bg-transparent border border-white/10 px-4 py-4 text-white focus:border-white outline-none transition-colors font-mono text-lg tracking-wider"
                placeholder="your_username"
              />
              <p className="mt-2 font-mono text-xs text-zinc-500">{username.length}/30</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="mt-4 text-[#FF3B30] text-sm font-mono" data-testid="onboarding-error">{error}</p>}
      </div>

      {/* Next button */}
      <div className="max-w-lg mx-auto w-full mt-8">
        <button
          data-testid="onboarding-next-btn"
          onClick={nextStep}
          disabled={!canProceed() || loading}
          className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-zinc-200 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {step === 3 ? (loading ? '...' : 'START TALKING') : 'CONTINUE'}
          <ArrowRight size={16} weight="bold" />
        </button>
        {step === 2 && (
          <button onClick={nextStep} className="w-full mt-3 text-zinc-500 text-sm font-mono hover:text-white transition-colors" data-testid="skip-country-btn">
            skip
          </button>
        )}
      </div>
    </div>
  );
}
