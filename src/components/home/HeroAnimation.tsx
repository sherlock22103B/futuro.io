/** Due linee — montante pensionistico (blu) e capitale ETF (verde) — che avanzano verso "Il tuo futuro". */
export function HeroAnimation() {
  const dash = { strokeDasharray: 1, ["--dash" as string]: 1 } as React.CSSProperties;
  return (
    <figure className="relative w-full">
      <svg
        viewBox="0 0 480 300"
        className="h-auto w-full"
        role="img"
        aria-labelledby="hero-anim-title hero-anim-desc"
      >
        <title id="hero-anim-title">Le due strade verso il tuo futuro</title>
        <desc id="hero-anim-desc">
          Illustrazione: una linea blu, il montante pensionistico, e una linea verde, il capitale ETF, salgono nel tempo e si incontrano nel punto
          chiamato «Il tuo futuro». È un disegno simbolico, non rappresenta dati.
        </desc>
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[60, 120, 180, 240].map((y) => (
          <line key={y} x1="20" x2="460" y1={y} y2={y} stroke="#22314f" strokeDasharray="4 6" />
        ))}
        <path
          d="M30 250 C 120 240, 200 200, 270 160 S 380 80, 410 60"
          pathLength={1}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="5"
          strokeLinecap="round"
          className="animate-draw-line"
          style={{ ...dash, strokeDashoffset: 0 }}
        />
        <path
          d="M30 275 C 150 270, 230 230, 300 170 S 390 75, 410 60"
          pathLength={1}
          fill="none"
          stroke="#16a34a"
          strokeWidth="5"
          strokeLinecap="round"
          className="animate-draw-line"
          style={{ ...dash, strokeDashoffset: 0, animationDelay: "0.25s" }}
        />
        <g className="animate-fade-in">
          <circle cx="410" cy="60" r="34" fill="url(#glow)" />
          <circle cx="410" cy="60" r="10" fill="#f8fafc" />
          <text x="410" y="28" textAnchor="middle" fill="#f1f5f9" fontSize="15" fontWeight="700">
            Il tuo futuro
          </text>
        </g>
        <text x="36" y="236" fill="#93c5fd" fontSize="12" fontWeight="600">Montante pensionistico</text>
        <text x="36" y="294" fill="#86efac" fontSize="12" fontWeight="600">Capitale ETF</text>
      </svg>
    </figure>
  );
}
