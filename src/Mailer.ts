import type { Effect } from "effect";
import { Context, Schema } from "effect";

const Recipients = Schema.Union([Schema.String, Schema.Array(Schema.String)]);

const EmailFields = {
  from: Schema.String,
  to: Recipients,
  subject: Schema.String,
  cc: Schema.optionalKey(Recipients),
  bcc: Schema.optionalKey(Recipients),
  replyTo: Schema.optionalKey(Recipients),
};

/**
 * An email needs a body: `html`, `text`, or both. The union makes leaving out
 * both a type error, and decoding enforces it at runtime.
 */
export const Email = Schema.Union([
  Schema.Struct({
    ...EmailFields,
    html: Schema.String,
    text: Schema.optionalKey(Schema.String),
  }),
  Schema.Struct({
    ...EmailFields,
    text: Schema.String,
    html: Schema.optionalKey(Schema.String),
  }),
]);
export type Email = typeof Email.Type;

export const SentEmail = Schema.Struct({
  id: Schema.String,
});
export type SentEmail = typeof SentEmail.Type;

export class MailerError extends Schema.TaggedError<MailerError>()("MailerError", {
  provider: Schema.String,
  message: Schema.String,
  cause: Schema.optionalKey(Schema.Defect()),
}) {}

export class Mailer extends Context.Service<
  Mailer,
  {
    send(email: Email): Effect.Effect<SentEmail, MailerError>;
  }
>()("facteur/Mailer") {}
