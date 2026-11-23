import type { SendMailOptions, TransportConfig } from "nodemailer";
import type { Email } from "../Mailer";
import { Config, Effect, Layer, Option, Redacted } from "effect";
import { importPeer } from "../internal/peer";
import { recipients } from "../internal/recipients";
import { validated } from "../internal/validated";
import { Mailer, MailerError } from "../Mailer";

const PROVIDER = "nodemailer";

const toSendMailOptions = (email: Email): SendMailOptions => ({
  from: email.from,
  to: recipients(email.to),
  subject: email.subject,
  html: email.html,
  text: email.text,
  cc: recipients(email.cc),
  bcc: recipients(email.bcc),
  replyTo: recipients(email.replyTo),
});

/**
 * Accepts any nodemailer transport config (SMTP options, a connection URL,
 * `{ jsonTransport: true }`, ...). The transport is closed when the layer's
 * scope ends.
 */
export const layer = (transport: TransportConfig | string) =>
  Layer.effect(
    Mailer,
    Effect.gen(function* () {
      const { createTransport } = yield* importPeer(PROVIDER, () => import("nodemailer"));
      const transporter = yield* Effect.acquireRelease(
        Effect.sync(() => createTransport(transport)),
        (created) => Effect.sync(() => created.close()),
      );

      const send = Effect.fn("facteur/nodemailer.send")(function* (email: Email) {
        const info = yield* Effect.tryPromise({
          try: () => transporter.sendMail(toSendMailOptions(email)),
          catch: (cause) =>
            new MailerError({
              provider: PROVIDER,
              message: cause instanceof Error ? cause.message : "Sending with nodemailer failed",
              cause,
            }),
        });
        return { id: info.messageId };
      });

      return Mailer.of({ send: validated(PROVIDER, send) });
    }),
  );

/**
 * SMTP transport from the environment:
 *
 * - `FACTEUR_NODEMAILER_HOST` (required)
 * - `FACTEUR_NODEMAILER_PORT` (optional, nodemailer defaults to 587, or 465 when secure)
 * - `FACTEUR_NODEMAILER_SECURE` (optional, defaults to false)
 * - `FACTEUR_NODEMAILER_USER` / `FACTEUR_NODEMAILER_PASS` (optional, both needed for auth)
 */
export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const host = yield* Config.NonEmptyString("FACTEUR_NODEMAILER_HOST");
    const port = yield* Config.option(Config.Port("FACTEUR_NODEMAILER_PORT"));
    const secure = yield* Config.option(Config.Boolean("FACTEUR_NODEMAILER_SECURE"));
    const user = yield* Config.option(Config.String("FACTEUR_NODEMAILER_USER"));
    const pass = yield* Config.option(Config.Redacted("FACTEUR_NODEMAILER_PASS"));

    return layer({
      host,
      port: Option.getOrUndefined(port),
      secure: Option.getOrUndefined(secure),
      auth:
        Option.isSome(user) && Option.isSome(pass)
          ? { user: user.value, pass: Redacted.value(pass.value) }
          : undefined,
    });
  }),
);
