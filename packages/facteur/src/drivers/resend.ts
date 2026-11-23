import type { Redacted as RedactedValue } from "effect";
import type { CreateEmailOptions } from "resend";
import type { Email } from "../Mailer";
import { Config, Effect, Layer, Redacted } from "effect";
import { importPeer } from "../internal/peer";
import { recipients } from "../internal/recipients";
import { validated } from "../internal/validated";
import { Mailer, MailerError } from "../Mailer";

const PROVIDER = "resend";

const toCreateEmailOptions = (email: Email): CreateEmailOptions => {
  const base = {
    from: email.from,
    to: recipients(email.to)!,
    subject: email.subject,
    cc: recipients(email.cc),
    bcc: recipients(email.bcc),
    replyTo: recipients(email.replyTo),
  };
  // The Email union guarantees `text` is set whenever `html` isn't, but TS
  // can't narrow on a non-literal field, hence the assertion.
  return email.html !== undefined
    ? { ...base, html: email.html, text: email.text }
    : { ...base, text: email.text! };
};

export interface ResendOptions {
  readonly apiKey: RedactedValue.Redacted<string>;
}

export const layer = (options: ResendOptions) =>
  Layer.effect(
    Mailer,
    Effect.gen(function* () {
      const { Resend } = yield* importPeer(PROVIDER, () => import("resend"));
      const client = new Resend(Redacted.value(options.apiKey));

      const send = Effect.fn("facteur/resend.send")(function* (email: Email) {
        const { data, error } = yield* Effect.tryPromise({
          try: () => client.emails.send(toCreateEmailOptions(email)),
          catch: (cause) =>
            new MailerError({
              provider: PROVIDER,
              message: "Request to Resend failed",
              cause,
            }),
        });
        if (error !== null)
          return yield* new MailerError({
            provider: PROVIDER,
            message: error.message,
            cause: error,
          });

        return { id: data.id };
      });

      return Mailer.of({ send: validated(PROVIDER, send) });
    }),
  );

export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const apiKey = yield* Config.Redacted("FACTEUR_RESEND_KEY");
    return layer({ apiKey });
  }),
);
