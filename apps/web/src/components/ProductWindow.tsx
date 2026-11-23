import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

export type Provider = {
  id: string;
  env: string;
  label: string;
  /** The peer dependency to install, or undefined when the driver needs none. */
  sdk?: string;
  envHtml: string;
};
type Tab = "send.ts" | "effect.ts" | ".env";

/**
 * The landing page's "product window": code on the left, a provider switcher on the right.
 * Switching provider only changes the .env tab, which is the point.
 */
export function ProductWindow({
  providers,
  sendHtml,
  effectHtml,
}: {
  providers: Array<Provider>;
  sendHtml: string;
  effectHtml: string;
}) {
  const [tab, setTab] = useState<Tab>("send.ts");
  const [providerId, setProviderId] = useState(providers[0]!.id);
  const provider = providers.find((p) => p.id === providerId) ?? providers[0]!;

  const html = tab === "send.ts" ? sendHtml : tab === "effect.ts" ? effectHtml : provider.envHtml;

  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-gradient-to-b from-panel to-bg shadow-[0_-24px_120px_-20px_rgb(94_106_210/0.25)]">
      <div className="flex items-center border-b border-line text-xs">
        <div className="flex">
          {(["send.ts", "effect.ts", ".env"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`border-r border-line px-4 py-2.5 font-mono transition-colors ${
                tab === t ? "bg-white/[0.04] text-ink" : "text-faint hover:text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_15rem]">
        <CodeBlock html={html} className="min-h-[19rem] min-w-0" />
        <div className="flex flex-col border-t border-line p-4 md:border-t-0 md:border-l">
          <p className="mb-2 font-mono text-[11px] tracking-wide text-faint">FACTEUR_PROVIDER</p>
          <ul className="space-y-0.5">
            {providers.map((p) => {
              const active = p.id === provider.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setProviderId(p.id)}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left font-mono text-xs transition-colors ${
                      active
                        ? "bg-white/[0.06] text-ink"
                        : "text-muted hover:bg-white/[0.03] hover:text-soft"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-1.5 rounded-full ${active ? "bg-ok" : "bg-faint/50"}`}
                      />
                      {p.env}
                    </span>
                    <span className="font-sans text-[11px] text-faint">{p.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-auto pt-5 text-xs leading-relaxed text-faint">
            {tab === ".env" ? (
              provider.sdk === undefined ? (
                <>Needs no SDK. Prints each email instead of sending it.</>
              ) : (
                <>
                  Needs <span className="font-mono text-muted">{provider.sdk}</span> installed.
                </>
              )
            ) : (
              <>
                {tab} is the same for every provider.{" "}
                <button
                  type="button"
                  onClick={() => setTab(".env")}
                  className="text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  See what changes →
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
