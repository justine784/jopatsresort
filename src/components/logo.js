export function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Sun */}
          <circle cx="20" cy="14" r="6" fill="#F97316" opacity="0.9" />

          {/* Palm tree trunk */}
          <path d="M22 18 L22 32 L20 32 L20 18" fill="#78350F" stroke="#78350F" strokeWidth="0.5" />

          {/* Palm leaves */}
          <path d="M21 18 Q15 14, 12 16 Q14 17, 21 20" fill="#15803D" opacity="0.9" />
          <path d="M21 18 Q27 14, 30 16 Q28 17, 21 20" fill="#15803D" opacity="0.9" />
          <path d="M21 18 Q18 12, 16 10 Q17 12, 21 18" fill="#16A34A" opacity="0.9" />
          <path d="M21 18 Q24 12, 26 10 Q25 12, 21 18" fill="#16A34A" opacity="0.9" />

          {/* Waves */}
          <path
            d="M4 35 Q8 33, 12 35 T20 35 T28 35 T36 35"
            stroke="#0EA5E9"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M4 38 Q8 36, 12 38 T20 38 T28 38 T36 38"
            stroke="#0EA5E9"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-2xl font-serif font-bold text-primary">Jopats</span>
        <span className="text-xs font-sans tracking-wider text-muted-foreground uppercase">Resort</span>
      </div>
    </div>
  )
}
