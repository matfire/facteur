export function LogoMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className}>
      <defs>
        <linearGradient id="facteur-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f8f8" />
          <stop offset="1" stopColor="#8a8f98" />
        </linearGradient>
      </defs>
      <rect width="16" height="16" rx="4" fill="url(#facteur-mark)" />
      <path
        d="M3.5 5.5 8 8.75l4.5-3.25"
        fill="none"
        stroke="#08090a"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
