type Tone = "indigo" | "amber" | "green" | "red" | "neutral";

const toneClasses: Record<Tone, string> = {
  indigo: "bg-signal-indigo/10 text-signal-indigo",
  amber: "bg-signal-amber/15 text-[#8a5c17]",
  green: "bg-signal-green/15 text-[#256b45]",
  red: "bg-signal-red/15 text-[#9c2f2f]",
  neutral: "bg-black/5 text-ink/70",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`chip ${toneClasses[tone]}`}>{children}</span>;
}
