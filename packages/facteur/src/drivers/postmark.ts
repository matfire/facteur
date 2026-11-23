import type { Redacted as RedactedValue } from "effect";
import type { Message } from "postmark";
import type { Email } from "../Mailer";
import { Config, Effect, Layer, Redacted } from "effect";
import { importPeer } from "../internal/peer";
import { validated } from "../internal/validated";
import { Mailer, MailerError } from "../Mailer";

const PROVIDER = "postmark";

/** Postmark takes multiple recipients as one comma-separated string. */
const addressList = (value: string | ReadonlyArray<string> | undefined): string | undefined =>
  value === undefined || typeof value === "string" ? value : value.join(", ");

const toMessage = (email: Email): Message => ({
  From: email.from,
  To: addressList(email.to),
  Cc: addressList(email.cc),
  Bcc: addressList(email.bcc),
  ReplyTo: addressList(email.replyTo),
  Subject: email.subject,
  HtmlBody: email.html,
  TextBody: email.text,
});

export interface PostmarkOptions {
  /** A Postmark server API token. */
  readonly serverToken: RedactedValue.Redacted<string>;
}

export const layer = (options: PostmarkOptions) =>
  Layer.effect(
    Mailer,
    Effect.gen(function* () {
      const { ServerClient } = yield* importPeer(PROVIDER, () => import("postmark"));
      const client = new ServerClient(Redacted.value(options.serverToken));

      const send = Effect.fn("facteur/postmark.send")(function* (email: Email) {
        const response = yield* Effect.tryPromise({
          try: () => client.sendEmail(toMessage(email)),
          catch: (cause) =>
            new MailerError({
              provider: PROVIDER,
              message: cause instanceof Error ? cause.message : "Request to Postmark failed",
              cause,
            }),
        });
        return { id: response.MessageID };
      });

      return Mailer.of({ send: validated(PROVIDER, send) });
    }),
  );

/** Postmark client from `FACTEUR_POSTMARK_TOKEN` (a server API token). */
export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const serverToken = yield* Config.Redacted("FACTEUR_POSTMARK_TOKEN");
    return layer({ serverToken });
  }),
);
