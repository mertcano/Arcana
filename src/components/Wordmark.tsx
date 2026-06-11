export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span
        aria-hidden
        className="relative inline-block h-2.5 w-2.5 rounded-full bg-arcane shadow-glow animate-pulse-glow"
      />
      <span className="font-display text-xl tracking-tight">
        Arcana
      </span>
    </span>
  );
}
