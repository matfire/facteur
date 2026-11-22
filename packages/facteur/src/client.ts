import type { Layer } from "effect";
import type { Email, SentEmail } from "./Mailer";
import { ManagedRuntime } from "effect";
import { layerConfig } from "./config";
import { Mailer } from "./Mailer";

export interface MailerClient extends AsyncDisposable {
  /** Sends an email. Rejects with a `MailerError` (or a config error on first use). */
  readonly sendEmail: (email: Email) => Promise<SentEmail>;
  /**
   * Releases the provider's resources (SMTP connections, SES client).
   * `await using mailer = createMailer()` calls this automatically.
   */
  readonly dispose: () => Promise<void>;
}

/**
 * Promise API for projects that don't use Effect.
 *
 * Uses the env-selected provider by default, or any Mailer layer you pass
 * (e.g. `Resend.layer({ apiKey })`). The provider is built on the first
 * `sendEmail` call and reused until `dispose`.
 */
export const createMailer = (layer: Layer.Layer<Mailer, unknown> = layerConfig): MailerClient => {
  const runtime = ManagedRuntime.make(layer);
  const dispose = () => runtime.dispose();
  return {
    sendEmail: (email) => runtime.runPromise(Mailer.use((mailer) => mailer.send(email))),
    dispose,
    [Symbol.asyncDispose]: dispose,
  };
};
