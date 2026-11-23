import type { Email } from "../src";
import { ConfigProvider, Console, Effect, Exit, Layer } from "effect";
import { describe, expect, test } from "vitest";
import { layerConfig, Mailer } from "../src";

const email: Email = {
  from: "Facteur <facteur@example.com>",
  to: ["one@example.com", "two@example.com"],
  subject: "Hello",
  html: "<p>Hi there</p>",
  text: "Hi there",
  cc: "cc@example.com",
};

const sendWith = (env: Record<string, string>, message: Email = email) => {
  const logged: Array<unknown> = [];
  const console = new Proxy({} as Console.Console, {
    get: (_, key) => (key === "log" ? (...args: Array<unknown>) => logged.push(...args) : () => {}),
  });
  return Effect.gen(function* () {
    const mailer = yield* Mailer;
    return yield* mailer.send(message);
  }).pipe(
    Effect.provideService(Console.Console, console),
    Effect.provide(
      layerConfig.pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env })))),
    ),
    Effect.runPromiseExit,
    (promise) => promise.then((exit) => ({ exit, logged })),
  );
};

describe("layerConfig with FACTEUR_PROVIDER=CONSOLE", () => {
  test("prints the email and returns a generated id", async () => {
    const { exit, logged } = await sendWith({ FACTEUR_PROVIDER: "CONSOLE" });

    expect(Exit.isSuccess(exit)).toBe(true);
    const id = Exit.isSuccess(exit) ? exit.value.id : "";
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(logged).toStrictEqual([
      [
        `[facteur] Email ${id}`,
        "From: Facteur <facteur@example.com>",
        "To: one@example.com, two@example.com",
        "Cc: cc@example.com",
        "Subject: Hello",
        "",
        "--- text ---",
        "Hi there",
        "",
        "--- html ---",
        "<p>Hi there</p>",
      ].join("\n"),
    ]);
  });

  test("rejects emails without html or text before printing", async () => {
    const { exit, logged } = await sendWith({ FACTEUR_PROVIDER: "CONSOLE" }, {
      from: email.from,
      to: email.to,
      subject: email.subject,
    } as unknown as Email);

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({ error: { _tag: "MailerError", provider: "console" } });
    expect(logged).toStrictEqual([]);
  });

  test("is not used when FACTEUR_PROVIDER is unset", async () => {
    const { exit, logged } = await sendWith({});

    expect(Exit.isFailure(exit)).toBe(true);
    expect(logged).toStrictEqual([]);
  });
});
