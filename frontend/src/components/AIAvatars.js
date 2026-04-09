// SVG Silhouette avatars using golden ratio facial proportions
// Justin: masculine, Justine: feminine, Justice: androgynous

export function JustinAvatar({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} data-testid="avatar-justin">
      <rect width="100" height="100" fill="#111111" />
      <g transform="translate(50, 50)">
        {/* Masculine silhouette - strong jaw, angular features */}
        <ellipse cx="0" cy="-12" rx="22" ry="28" fill="#1a1a1a" />
        {/* Strong jawline */}
        <path d="M-18,2 L-20,12 L-14,22 L0,26 L14,22 L20,12 L18,2" fill="#1a1a1a" />
        {/* Neck - broader */}
        <rect x="-10" y="22" width="20" height="16" fill="#1a1a1a" rx="2" />
        {/* Shoulders */}
        <path d="M-10,36 L-34,48 L34,48 L10,36" fill="#1a1a1a" />
        {/* Hair - short, disheveled */}
        <path d="M-22,-14 Q-24,-30 -16,-38 Q-8,-44 0,-42 Q8,-44 16,-38 Q24,-30 22,-14" fill="#222" />
      </g>
    </svg>
  );
}

export function JustineAvatar({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} data-testid="avatar-justine">
      <rect width="100" height="100" fill="#111111" />
      <g transform="translate(50, 50)">
        {/* Feminine silhouette - elegant, softer features */}
        <ellipse cx="0" cy="-10" rx="19" ry="26" fill="#1a1a1a" />
        {/* Softer jawline */}
        <path d="M-15,4 L-16,10 L-10,20 L0,24 L10,20 L16,10 L15,4" fill="#1a1a1a" />
        {/* Slender neck */}
        <rect x="-7" y="20" width="14" height="14" fill="#1a1a1a" rx="3" />
        {/* Shoulders - narrower, elegant */}
        <path d="M-7,32 L-28,46 L28,46 L7,32" fill="#1a1a1a" />
        {/* Hair - flowing, longer */}
        <path d="M-24,-8 Q-26,-28 -18,-36 Q-10,-42 0,-40 Q10,-42 18,-36 Q26,-28 24,-8" fill="#222" />
        <path d="M-24,-8 Q-28,6 -26,24 L-22,24 Q-22,8 -20,-4" fill="#222" />
        <path d="M24,-8 Q28,6 26,24 L22,24 Q22,8 20,-4" fill="#222" />
      </g>
    </svg>
  );
}

export function JusticeAvatar({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} data-testid="avatar-justice">
      <rect width="100" height="100" fill="#111111" />
      <g transform="translate(50, 50)">
        {/* Androgynous silhouette - ambiguous, balanced */}
        <ellipse cx="0" cy="-11" rx="20" ry="27" fill="#1a1a1a" />
        {/* Balanced jawline */}
        <path d="M-16,3 L-17,11 L-12,21 L0,25 L12,21 L17,11 L16,3" fill="#1a1a1a" />
        {/* Medium neck */}
        <rect x="-8" y="21" width="16" height="14" fill="#1a1a1a" rx="2" />
        {/* Balanced shoulders */}
        <path d="M-8,33 L-30,47 L30,47 L8,33" fill="#1a1a1a" />
        {/* Hair - ambiguous length */}
        <path d="M-23,-10 Q-25,-30 -14,-37 Q-6,-42 0,-41 Q6,-42 14,-37 Q25,-30 23,-10" fill="#222" />
        <path d="M-23,-10 Q-24,2 -22,14 L-19,12 Q-20,2 -19,-6" fill="#222" />
        <path d="M23,-10 Q24,2 22,14 L19,12 Q20,2 19,-6" fill="#222" />
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
