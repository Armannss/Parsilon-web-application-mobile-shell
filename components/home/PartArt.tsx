// Decorative drawings of what Parsilon makes. Pure SVG, animated with CSS
// (the animations stop for visitors who prefer reduced motion).

const VENT_HOLES = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * 360) / 24;
  const radius = index % 2 === 0 ? 76 : 64;
  const rad = (angle * Math.PI) / 180;
  return { cx: 100 + radius * Math.cos(rad), cy: 100 + radius * Math.sin(rad) };
});

const BOLT_HOLES = Array.from({ length: 4 }, (_, index) => {
  const rad = ((index * 90 + 45) * Math.PI) / 180;
  return { cx: 100 + 27 * Math.cos(rad), cy: 100 + 27 * Math.sin(rad) };
});

export function BrakeDiscArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="disc-surface" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="55%" stopColor="#B6C2D4" />
          <stop offset="100%" stopColor="#64748B" />
        </radialGradient>
        <radialGradient id="disc-hub" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="96" fill="url(#disc-surface)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="#475569" strokeOpacity="0.25" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="54" fill="none" stroke="#475569" strokeOpacity="0.3" strokeWidth="0.8" />

      {VENT_HOLES.map((hole, index) => (
        <circle key={index} cx={hole.cx} cy={hole.cy} r="2.6" fill="#0E2F6D" fillOpacity="0.55" />
      ))}

      <circle cx="100" cy="100" r="44" fill="url(#disc-hub)" />
      {BOLT_HOLES.map((hole, index) => (
        <circle key={index} cx={hole.cx} cy={hole.cy} r="5" fill="#0B1F4A" />
      ))}
      <circle cx="100" cy="100" r="14" fill="#0B1F4A" />
    </svg>
  );
}

const BALLS = Array.from({ length: 9 }, (_, index) => {
  const rad = ((index * 360) / 9 / 180) * Math.PI;
  return { cx: 50 + 30 * Math.cos(rad), cy: 50 + 30 * Math.sin(rad) };
});

export function BearingArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="bearing-ball" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#8CC63F" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="46" fill="none" stroke="#CBD5E1" strokeWidth="7" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="#CBD5E1" strokeWidth="7" />

      {/* The cage of balls rolls between the two rings. */}
      <g className="origin-center animate-spin-reverse" style={{ transformBox: "fill-box" }}>
        {BALLS.map((ball, index) => (
          <circle key={index} cx={ball.cx} cy={ball.cy} r="7.2" fill="url(#bearing-ball)" />
        ))}
      </g>
    </svg>
  );
}
