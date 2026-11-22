import { Effect, Exit, Schema } from "effect";
import { describe, expect, test } from "vitest";
import { Email, Mailer } from "../src";
import * as Nodemailer from "../src/drivers/nodemailer";

const base = {
  from: "facteur@example.com",
  to: "someone@example.com",
  subject: "Hello",
};
const decode = Schema.decodeUnknownExit(Email);

describe("Email schema", () => {
  test.each([
    ["html only", { ...base, html: "<p>Hi</p>" }],
    ["text only", { ...base, text: "Hi" }],
    ["html and text", { ...base, html: "<p>Hi</p>", text: "Hi" }],
  ])("accepts %s", (_, input) => {
    expect(decode(input)).toStrictEqual(Exit.succeed(input));
  });

  test("rejects an email with neither html nor text", () => {
    expect(Exit.isFailure(decode(base))).toBe(true);
  });

  test("makes a body-less email a type error", () => {
    // @ts-expect-error html or text is required
    const email: Email = base;
    expect(email).toBe(base);
  });
});

describe("driver validation", () => {
  test("rejects a body-less email at runtime before it reaches the provider", async () => {
    const exit = await Effect.gen(function* () {
      const mailer = yield* Mailer;
      return yield* mailer.send(base as unknown as Email);
    }).pipe(Effect.provide(Nodemailer.layer({ jsonTransport: true })), Effect.runPromiseExit);

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: { _tag: "MailerError", provider: "nodemailer" },
    });
    expect(String((error as any)?.error?.message)).toMatch(/^Invalid email:/);
  });
});
