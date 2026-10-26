import { ExternalLink } from "lucide-react";

export function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-signal underline underline-offset-2 hover:text-foreground"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden="true" />
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
