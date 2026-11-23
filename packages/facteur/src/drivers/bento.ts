import type { Redacted as RedactedValue } from "effect";
import type { Email } from "../Mailer";
import { Config, Effect, Layer, Redacted } from "effect";
import { importPeer } from "../internal/peer";
import { recipientList } from "../internal/recipients";
import { validated } from "../internal/validated";
import { Mailer, MailerError } from "../Mailer";

const PROVIDER = "bento";

/**
 * Bento's email API takes one recipient and an HTML body, with no cc, bcc or
 * reply-to. Emails that need more are rejected rather than sent differently
 * from what the caller asked for.
 */
const unsupported = (email: Email): string | undefined => {
  if ((recipientList(email.to)?.length ?? 0) !== 1)
    return "Bento sends to exactly one `to` address";
  if (email.cc !== undefined || email.bcc !== undefined || email.replyTo !== undefined)
    return "Bento does not support cc, bcc or replyTo";
  if (email.html === undefined) return "Bento needs an `html` body";
  return undefined;
};

export interface BentoOptions {
  readonly siteUuid: string;
  readonly publishableKey: string;
  readonly secretKey: RedactedValue.Redacted<string>;
}

/**
 * Sends through Bento's transactional email API. Emails are sent with
 * `transactional: true`, so they reach recipients who unsubscribed from
 * marketing. `from` must be an author on the Bento account, `text` is not sent
 * (Bento only takes HTML), and Bento renders the HTML as a Liquid template.
 *
 * Bento queues emails without returning a message id, so the result's `id` is
 * an empty string.
 */
export const layer = (options: BentoOptions) =>
  Layer.effect(
    Mailer,
    Effect.gen(function* () {
      const { Analytics } = yield* importPeer(PROVIDER, () => import("@bentonow/bento-node-sdk"));
      const client = new Analytics({
        siteUuid: options.siteUuid,
        authentication: {
          publishableKey: options.publishableKey,
          secretKey: Redacted.value(options.secretKey),
        },
      });

      const send = Effect.fn("facteur/bento.send")(function* (email: Email) {
        const reason = unsupported(email);
        if (reason !== undefined)
          return yield* new MailerError({ provider: PROVIDER, message: reason });

        const accepted = yield* Effect.tryPromise({
          try: () =>
            client.V1.Batch.sendTransactionalEmails({
              emails: [
                {
                  to: recipientList(email.to)![0]!,
                  from: email.from,
                  subject: email.subject,
                  html_body: email.html!,
                  transactional: true,
                },
              ],
            }),
          catch: (cause) =>
            new MailerError({
              provider: PROVIDER,
              message: cause instanceof Error ? cause.message : "Request to Bento failed",
              cause,
            }),
        });
        if (accepted !== 1)
          return yield* new MailerError({
            provider: PROVIDER,
            message: "Bento did not accept the email",
          });

        return { id: "" };
      });

      return Mailer.of({ send: validated(PROVIDER, send) });
    }),
  );

/**
 * Bento client from the environment: `FACTEUR_BENTO_SITE_UUID`,
 * `FACTEUR_BENTO_PUBLISHABLE_KEY` and `FACTEUR_BENTO_SECRET_KEY` (all required).
 */
export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const siteUuid = yield* Config.NonEmptyString("FACTEUR_BENTO_SITE_UUID");
    const publishableKey = yield* Config.NonEmptyString("FACTEUR_BENTO_PUBLISHABLE_KEY");
    const secretKey = yield* Config.Redacted("FACTEUR_BENTO_SECRET_KEY");
    return layer({ siteUuid, publishableKey, secretKey });
  }),
);
