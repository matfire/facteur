import { ConfigProvider, Effect, Layer } from "effect";
import { afterEach, describe, expect, test } from "vitest";
import { createMailer, layerConfig, Mailer, MailerError } from "../src";
import * as Nodemailer from "../src/drivers/nodemailer";

const email = {
  from: "facteur@example.com",
  to: "someone@example.com",
  subject: "Hello",
  text: "Hi",
};

describe("createMailer", () => {
  let dispose: (() => Promise<void>) | undefined;
  afterEach(async () => {
    await dispose?.();
    dispose = undefined;
  });

  test("sends with the given layer and resolves with the message id", async () => {
    const mailer = createMailer(Nodemailer.layer({ jsonTransport: true }));
    dispose = mailer.dispose;

    const sent = await mailer.sendEmail(email);

    expect(sent.id).toMatch(/^<.+@.+>$/);
  });

  test("rejects with a MailerError when sending fails", async () => {
    const mailer = createMailer(
      Nodemailer.layer({ host: "127.0.0.1", port: 1, connectionTimeout: 1000 }),
    );
    dispose = mailer.dispose;

    const error = await mailer.sendEmail(email).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MailerError);
    expect(error).toMatchObject({
      _tag: "MailerError",
      provider: "nodemailer",
    });
  });

  test("defaults to the env-selected provider and rejects when config is missing", async () => {
    const env = ConfigProvider.layer(ConfigProvider.fromEnv({ env: {} }));
    // Same default as createMailer(), but with an empty environment instead of process.env.
    const mailer = createMailer(layerConfig.pipe(Layer.provide(env)));
    dispose = mailer.dispose;

    await expect(mailer.sendEmail(email)).rejects.toThrow(/FACTEUR_PROVIDER/);
  });

  test("disposes the provider when an `await using` block exits", async () => {
    let released = false;
    const tracked = Layer.effect(
      Mailer,
      Effect.acquireRelease(
        Effect.succeed(Mailer.of({ send: () => Effect.succeed({ id: "test" }) })),
        () =>
          Effect.sync(() => {
            released = true;
          }),
      ),
    );

    {
      await using mailer = createMailer(tracked);
      expect(await mailer.sendEmail(email)).toStrictEqual({ id: "test" });
      expect(released).toBe(false);
    }

    expect(released).toBe(true);
  });
});
