export function HelpScreenshot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="space-y-2 mt-4">
      <img
        src={src}
        alt={alt}
        className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
      />
      <figcaption className="text-xs text-[var(--text-tertiary)]">{caption}</figcaption>
    </figure>
  );
}
