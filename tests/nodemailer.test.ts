import { ConfigProvider, Effect, Exit, Layer } from "effect";
import { describe, expect, test } from "vitest";
import { layerConfig, Mailer } from "../src";
import * as Nodemailer from "../src/drivers/nodemailer";

const email = {
  from: "Facteur <facteur@example.com>",
  to: ["someone@example.com", "other@example.com"],
  subject: "Hello",
  text: "Hi there",
  replyTo: "reply@example.com",
};

const send = Effect.gen(function* () {
  const mailer = yield* Mailer;
  return yield* mailer.send(email);
});

const withEnv = (env: Record<string, string>) =>
  ConfigProvider.layer(ConfigProvider.fromEnv({ env }));

describe("nodemailer driver", () => {
  test("sends through the given transport and returns the message id", async () => {
    const exit = await send.pipe(
      Effect.provide(Nodemailer.layer({ jsonTransport: true })),
      Effect.runPromiseExit,
    );

    expect(exit).toMatchObject({
      _tag: "Success",
      value: { id: expect.stringMatching(/^<.+@.+>$/) },
    });
  });

  test("wraps transport failures in MailerError", async () => {
    const exit = await send.pipe(
      Effect.provide(
        Nodemailer.layer({
          host: "127.0.0.1",
          port: 1,
          connectionTimeout: 1000,
        }),
      ),
      Effect.runPromiseExit,
    );

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: { _tag: "MailerError", provider: "nodemailer" },
    });
  });
});

const sendWith = (env: Record<string, string>) =>
  send.pipe(Effect.provide(layerConfig.pipe(Layer.provide(withEnv(env)))), Effect.runPromiseExit);

describe("layerConfig with FACTEUR_PROVIDER=NODEMAILER", () => {
  test("uses SMTP settings from the environment", async () => {
    // Nothing listens on port 1, so reaching the connection error proves the
    // SMTP transport was built from FACTEUR_NODEMAILER_* rather than failing on config.
    const exit = await sendWith({
      FACTEUR_PROVIDER: "NODEMAILER",
      FACTEUR_NODEMAILER_HOST: "127.0.0.1",
      FACTEUR_NODEMAILER_PORT: "1",
      FACTEUR_NODEMAILER_USER: "user",
      FACTEUR_NODEMAILER_PASS: "pass",
    });

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: { _tag: "MailerError", provider: "nodemailer" },
    });
    expect(String((error as any)?.error?.message)).toMatch(/ECONNREFUSED|connect/i);
  });

  test("fails on config when FACTEUR_NODEMAILER_HOST is missing", async () => {
    const exit = await sendWith({ FACTEUR_PROVIDER: "NODEMAILER" });

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).not.toMatchObject({ error: { _tag: "MailerError" } });
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
