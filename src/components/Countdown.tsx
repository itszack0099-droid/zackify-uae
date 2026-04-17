import { useEffect, useState } from "react";

export function Countdown({ to }: { to: string | Date | null }) {
  const target = to ? new Date(to).getTime() : 0;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center min-w-[58px] px-3 py-2 rounded-xl glass border border-gold/30">
      <span className="font-display font-bold text-2xl text-gold tabular-nums">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
    </div>
  );

  return (
    <div className="flex gap-2">
      <Box v={d} l="Days" />
      <Box v={h} l="Hours" />
      <Box v={m} l="Min" />
      <Box v={s} l="Sec" />
    </div>
  );
}
