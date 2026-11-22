import type { SendEmailCommandInput, SESv2ClientConfig } from "@aws-sdk/client-sesv2";
import type { Email } from "../Mailer";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { Config, Effect, Layer, Option, Redacted } from "effect";
import { recipientList } from "../internal/recipients";
import { validated } from "../internal/validated";
import { Mailer, MailerError } from "../Mailer";

const PROVIDER = "ses";

const toSendEmailInput = (email: Email): SendEmailCommandInput => {
  return {
    FromEmailAddress: email.from,
    Destination: {
      ToAddresses: recipientList(email.to),
      CcAddresses: recipientList(email.cc),
      BccAddresses: recipientList(email.bcc),
    },
    ReplyToAddresses: recipientList(email.replyTo),
    Content: {
      Simple: {
        Subject: { Data: email.subject, Charset: "UTF-8" },
        Body: {
          Html: email.html === undefined ? undefined : { Data: email.html, Charset: "UTF-8" },
          Text: email.text === undefined ? undefined : { Data: email.text, Charset: "UTF-8" },
        },
      },
    },
  };
};

/**
 * Accepts any SESv2 client config. Without explicit `credentials`, the AWS SDK
 * default credential chain is used (env vars, shared config, IAM roles, ...).
 * The client is destroyed when the layer's scope ends.
 */
export const layer = (config: SESv2ClientConfig = {}) =>
  Layer.effect(
    Mailer,
    Effect.gen(function* () {
      const client = yield* Effect.acquireRelease(
        Effect.sync(() => new SESv2Client(config)),
        (created) => Effect.sync(() => created.destroy()),
      );

      const send = Effect.fn("facteur/ses.send")(function* (email: Email) {
        const output = yield* Effect.tryPromise({
          try: (signal) =>
            client.send(new SendEmailCommand(toSendEmailInput(email)), {
              abortSignal: signal,
            }),
          catch: (cause) =>
            new MailerError({
              provider: PROVIDER,
              message: cause instanceof Error ? cause.message : "Request to SES failed",
              cause,
            }),
        });
        if (output.MessageId === undefined)
          return yield* new MailerError({
            provider: PROVIDER,
            message: "SES did not return a MessageId",
          });

        return { id: output.MessageId };
      });

      return Mailer.of({ send: validated(PROVIDER, send) });
    }),
  );

/**
 * SES client from the environment:
 *
 * - `FACTEUR_SES_REGION` (required)
 * - `FACTEUR_SES_ACCESS_KEY_ID` / `FACTEUR_SES_SECRET_ACCESS_KEY` (optional, both
 *   needed; otherwise the AWS SDK default credential chain is used)
 */
export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const region = yield* Config.NonEmptyString("FACTEUR_SES_REGION");
    const accessKeyId = yield* Config.option(Config.String("FACTEUR_SES_ACCESS_KEY_ID"));
    const secretAccessKey = yield* Config.option(Config.Redacted("FACTEUR_SES_SECRET_ACCESS_KEY"));

    return layer({
      region,
      credentials:
        Option.isSome(accessKeyId) && Option.isSome(secretAccessKey)
          ? {
              accessKeyId: accessKeyId.value,
              secretAccessKey: Redacted.value(secretAccessKey.value),
            }
          : undefined,
    });
  }),
);
