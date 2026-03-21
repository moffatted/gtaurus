interface WizardAxisCardProps {
  label: string;
  mpos: number;
  wco: number;
}

export function WizardAxisCard({ label, mpos, wco }: WizardAxisCardProps) {
  const wpos = mpos - wco;

  return (
    <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] text-center flex-1">
      <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">{label} WCO</span>
      <p className="font-mono text-sm text-[var(--text-primary)] font-bold">{wpos.toFixed(2)}</p>
    </div>
  );
}
