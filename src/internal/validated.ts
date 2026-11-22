import type { SentEmail } from "../Mailer";
import { Effect, Schema } from "effect";
import { Email, MailerError } from "../Mailer";

const decodeEmail = Schema.decodeUnknownEffect(Email);

/**
 * Wraps a driver's send so every email is decoded against the `Email` schema
 * before it reaches the provider. The type already rules out bad input, but
 * JavaScript callers and `as` casts can still get past it.
 */
export const validated =
  (provider: string, send: (email: Email) => Effect.Effect<SentEmail, MailerError>) =>
  (email: Email): Effect.Effect<SentEmail, MailerError> =>
    decodeEmail(email).pipe(
      Effect.mapError(
        (cause) =>
          new MailerError({
            provider,
            message: `Invalid email: ${cause.message}`,
            cause,
          }),
      ),
      Effect.flatMap(send),
    );
