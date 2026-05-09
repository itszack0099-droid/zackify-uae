import { useEffect, useState } from "react";

/**
 * Countdown that never reaches 00:00:00. When the target time is reached
 * (or no target is provided), it auto-rolls forward by 10 minutes so the
 * display always shows a fresh ticker for evergreen "hot deals".
 */
export function Countdown({ to }: { to?: string | Date | null }) {
  const initial = to ? new Date(to).getTime() : Date.now() + 10 * 60 * 1000;
  const [target, setTarget] = useState<number>(initial);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Loop: if we've reached/passed the target, push it 10 minutes ahead.
  useEffect(() => {
    if (now >= target) {
      setTarget((prev) => {
        const base = Math.max(prev, now);
        return base + 10 * 60 * 1000;
      });
    }
  }, [now, target]);

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
      {d > 0 && <Box v={d} l="Days" />}
      <Box v={h} l="Hours" />
      <Box v={m} l="Min" />
      <Box v={s} l="Sec" />
    </div>
  );
}
