import { useState } from "react";

export function CopyCommand({ command, className = "" }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the command is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`group inline-flex items-center gap-3 rounded-lg border border-line-strong bg-white/[0.02] px-4 py-2 font-mono text-[13px] text-soft transition-colors hover:border-white/20 hover:text-ink ${className}`}
    >
      <span className="text-faint select-none">$</span>
      {command}
      <span className="text-xs text-faint group-hover:text-muted">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
