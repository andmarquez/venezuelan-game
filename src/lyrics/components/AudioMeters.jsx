export default function AudioMeters({ metrics, accent }) {
  const bars = [
    { label: 'Vol', value: metrics.volume, color: '#ffffff' },
    { label: 'Bass', value: metrics.bass, color: accent },
    { label: 'Mid', value: metrics.mid, color: '#c084fc' },
    { label: 'Treble', value: metrics.treble, color: '#22d3ee' },
  ];

  return (
    <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-20 grid grid-cols-4 gap-2">
      {bars.map((bar) => (
        <div key={bar.label} className="rounded-lg border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
          <div className="mb-1 text-[0.48rem] font-bold uppercase tracking-[0.16em] text-white/45">
            {bar.label}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full origin-left rounded-full transition-transform duration-75"
              style={{
                backgroundColor: bar.color,
                transform: `scaleX(${Math.max(0.06, bar.value)})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
