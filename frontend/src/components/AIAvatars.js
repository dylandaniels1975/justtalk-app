/**
 * AI Persona Silhouette Avatars
 * Using golden ratio (1.618) proportions for facial structure
 * PHI = 1.618033988749895
 * 
 * Key proportions:
 * - Face width to height = 1:PHI
 * - Eye line at 1/PHI of face height from top
 * - Nose at 1/PHI from eye line to chin
 * - Mouth at 1/PHI from nose to chin
 * - Face divides into thirds: hairline-brow, brow-nose, nose-chin
 */

const PHI = 1.618;

export function JustinAvatar({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} data-testid="avatar-justin">
      <defs>
        <linearGradient id="justin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="#0a0a0a" />
      <g transform="translate(60, 52)">
        {/* Cranium - wider, more angular for masculine */}
        <path d="M-24,-28 C-24,-46 -18,-52 0,-52 C18,-52 24,-46 24,-28 L24,-10 L-24,-10 Z" fill="url(#justin-grad)" />
        {/* Face - strong jaw, wider at cheekbones, angular chin (golden ratio: width 37 = height 23 * PHI) */}
        <path d="M-24,-10 L-26,-2 L-24,8 L-20,16 L-12,24 L0,28 L12,24 L20,16 L24,8 L26,-2 L24,-10" fill="url(#justin-grad)" />
        {/* Brow ridge - pronounced for masculine */}
        <path d="M-22,-12 L-24,-8 L24,-8 L22,-12" fill="#161616" opacity="0.5" />
        {/* Nose bridge - strong, straight */}
        <path d="M-3,-8 L-4,6 L-6,10 L0,12 L6,10 L4,6 L3,-8" fill="#161616" opacity="0.3" />
        {/* Neck - thick, muscular */}
        <rect x="-12" y="26" width="24" height="18" fill="url(#justin-grad)" rx="2" />
        {/* Shoulders - broad */}
        <path d="M-12,42 C-30,44 -42,52 -48,64 L48,64 C42,52 30,44 12,42" fill="url(#justin-grad)" />
        {/* Hair - short, textured, slightly disheveled */}
        <path d="M-26,-28 C-28,-50 -20,-58 0,-58 C20,-58 28,-50 26,-28 L24,-28 C24,-44 18,-52 0,-52 C-18,-52 -24,-44 -24,-28 Z" fill="#222" />
        {/* Short textured strands */}
        <path d="M-18,-52 L-22,-56 M-8,-56 L-10,-60 M2,-56 L0,-62 M12,-56 L14,-60 M20,-52 L24,-56" stroke="#252525" strokeWidth="2" fill="none" />
        {/* Ear hints */}
        <ellipse cx="-26" cy="-2" rx="3" ry="6" fill="#161616" opacity="0.4" />
        <ellipse cx="26" cy="-2" rx="3" ry="6" fill="#161616" opacity="0.4" />
      </g>
    </svg>
  );
}

export function JustineAvatar({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} data-testid="avatar-justine">
      <defs>
        <linearGradient id="justine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="#0a0a0a" />
      <g transform="translate(60, 52)">
        {/* Cranium - rounder, smoother for feminine (golden ratio oval) */}
        <ellipse cx="0" cy="-32" rx="21" ry="24" fill="url(#justine-grad)" />
        {/* Face - heart-shaped, narrower chin, wider cheekbones, delicate */}
        <path d="M-21,-12 L-22,-4 L-20,6 L-16,14 L-10,22 L0,28 L10,22 L16,14 L20,6 L22,-4 L21,-12" fill="url(#justine-grad)" />
        {/* Softer brow area */}
        <path d="M-18,-14 C-10,-16 10,-16 18,-14" stroke="#161616" strokeWidth="1" fill="none" opacity="0.3" />
        {/* Nose - smaller, refined */}
        <path d="M-2,-6 L-3,6 L-4,8 L0,10 L4,8 L3,6 L2,-6" fill="#161616" opacity="0.2" />
        {/* Lips hint - fuller */}
        <path d="M-6,14 C-3,12 3,12 6,14 C3,17 -3,17 -6,14" fill="#161616" opacity="0.15" />
        {/* Neck - slender, elegant */}
        <rect x="-8" y="26" width="16" height="16" fill="url(#justine-grad)" rx="4" />
        {/* Shoulders - narrower, graceful */}
        <path d="M-8,40 C-24,42 -36,50 -40,62 L40,62 C36,50 24,42 8,40" fill="url(#justine-grad)" />
        {/* Hair - long, flowing past shoulders */}
        <path d="M-24,-30 C-26,-50 -18,-58 0,-58 C18,-58 26,-50 24,-30" fill="#222" />
        {/* Hair flowing down left */}
        <path d="M-24,-30 C-28,-20 -30,-6 -30,10 C-30,28 -28,42 -26,54 L-20,54 C-22,42 -24,28 -24,10 C-24,-4 -22,-16 -21,-24" fill="#222" />
        {/* Hair flowing down right */}
        <path d="M24,-30 C28,-20 30,-6 30,10 C30,28 28,42 26,54 L20,54 C22,42 24,28 24,10 C24,-4 22,-16 21,-24" fill="#222" />
        {/* Hair part/volume on top */}
        <path d="M-2,-58 C-2,-62 2,-62 2,-58" stroke="#252525" strokeWidth="1" fill="none" />
      </g>
    </svg>
  );
}

export function JusticeAvatar({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} data-testid="avatar-justice">
      <defs>
        <linearGradient id="justice-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="#0a0a0a" />
      <g transform="translate(60, 52)">
        {/* Cranium - balanced between masculine and feminine, slightly elongated */}
        <path d="M-22,-28 C-22,-48 -16,-54 0,-54 C16,-54 22,-48 22,-28 L22,-10 L-22,-10 Z" fill="url(#justice-grad)" />
        {/* Face - oval, balanced proportions, neither angular nor round */}
        <path d="M-22,-10 L-23,-2 L-21,8 L-16,18 L-8,26 L0,28 L8,26 L16,18 L21,8 L23,-2 L22,-10" fill="url(#justice-grad)" />
        {/* Subtle features */}
        <path d="M-2,-6 L-3,6 L-5,9 L0,11 L5,9 L3,6 L2,-6" fill="#161616" opacity="0.25" />
        {/* Neck - medium */}
        <rect x="-9" y="26" width="18" height="16" fill="url(#justice-grad)" rx="3" />
        {/* Shoulders - medium width */}
        <path d="M-9,40 C-26,42 -38,50 -42,62 L42,62 C38,50 26,42 9,40" fill="url(#justice-grad)" />
        {/* Hair - medium length, asymmetric, deliberately ambiguous */}
        <path d="M-24,-26 C-26,-48 -16,-56 0,-56 C16,-56 26,-48 24,-26" fill="#222" />
        {/* Asymmetric: longer on one side */}
        <path d="M-24,-26 C-26,-14 -26,0 -26,16 C-26,30 -24,40 -22,46 L-16,44 C-18,38 -20,28 -20,16 C-20,2 -20,-12 -20,-22" fill="#222" />
        {/* Shorter on other side */}
        <path d="M24,-26 C26,-16 26,-4 24,8 L18,6 C20,-2 20,-14 20,-22" fill="#222" />
        {/* Textured top */}
        <path d="M-12,-54 L-14,-58 M0,-56 L2,-60 M12,-54 L16,-58" stroke="#252525" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}

export function AIAvatar({ persona, size = 40, className = '' }) {
  switch (persona) {
    case 'justin': return <JustinAvatar size={size} className={className} />;
    case 'justine': return <JustineAvatar size={size} className={className} />;
    case 'justice': return <JusticeAvatar size={size} className={className} />;
    default: return <JustinAvatar size={size} className={className} />;
  }
}
