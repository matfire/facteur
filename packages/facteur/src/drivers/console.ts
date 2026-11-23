import type { Email } from "../Mailer";
import { Console, Effect, Layer } from "effect";
import { validated } from "../internal/validated";
import { Mailer } from "../Mailer";

const PROVIDER = "console";

const addressList = (value: string | ReadonlyArray<string>): string =>
  typeof value === "string" ? value : value.join(", ");

/** Renders an email as a readable block: headers, then each body. */
const format = (id: string, email: Email): string => {
  const headers: Array<[string, string | ReadonlyArray<string> | undefined]> = [
    ["From", email.from],
    ["To", email.to],
    ["Cc", email.cc],
    ["Bcc", email.bcc],
    ["Reply-To", email.replyTo],
    ["Subject", email.subject],
  ];
  const lines = [`[facteur] Email ${id}`];
  for (const [name, value] of headers) {
    if (value !== undefined) lines.push(`${name}: ${addressList(value)}`);
  }
  if (email.text !== undefined) lines.push("", "--- text ---", email.text);
  if (email.html !== undefined) lines.push("", "--- html ---", email.html);
  return lines.join("\n");
};

/**
 * Prints emails to the console instead of sending them, for local development.
 * Each email gets a random UUID as its `id`. Output goes through Effect's
 * `Console` service, so `Effect.provideService(Console.Console, ...)` can
 * redirect it.
 */
export const layer = Layer.succeed(
  Mailer,
  Mailer.of({
    send: validated(
      PROVIDER,
      Effect.fn("facteur/console.send")(function* (email: Email) {
        const id = crypto.randomUUID();
        yield* Console.log(format(id, email));
        return { id };
      }),
    ),
  }),
);

/** The console driver reads no variables; this matches the other drivers' API. */
export const layerConfig = layer;
