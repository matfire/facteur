import type { Email } from "../src";
import { ConfigProvider, Effect, Exit, Layer } from "effect";
import { afterEach, describe, expect, test, vi } from "vitest";
import { layerConfig, Mailer } from "../src";

// The Bento SDK calls the global fetch, so we intercept it there.
const stubFetch = (respond: () => Response) => {
  const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () =>
    respond(),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const email: Email = {
  from: "facteur@example.com",
  to: ["someone@example.com"],
  subject: "Hello",
  html: "<p>Hi there</p>",
  text: "Hi there",
};

const sendWith = (env: Record<string, string>, message: Email = email) =>
  Effect.gen(function* () {
    const mailer = yield* Mailer;
    return yield* mailer.send(message);
  }).pipe(
    Effect.provide(
      layerConfig.pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env })))),
    ),
    Effect.runPromiseExit,
  );

const bentoEnv = {
  FACTEUR_PROVIDER: "BENTO",
  FACTEUR_BENTO_SITE_UUID: "site_123",
  FACTEUR_BENTO_PUBLISHABLE_KEY: "pub_test",
  FACTEUR_BENTO_SECRET_KEY: "sec_test",
};

const failure = (exit: Exit.Exit<unknown, unknown>) =>
  Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;

describe("layerConfig with FACTEUR_PROVIDER=BENTO", () => {
  test("sends a transactional email through the Bento SDK", async () => {
    const fetch = stubFetch(() => Response.json({ results: 1 }));

    const exit = await sendWith(bentoEnv);

    expect(exit).toStrictEqual(Exit.succeed({ id: "" }));
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://app.bentonow.com/api/v1/batch/emails");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      `Basic ${btoa("pub_test:sec_test")}`,
    );
    expect(JSON.parse(String(init?.body))).toStrictEqual({
      emails: [
        {
          to: "someone@example.com",
          from: email.from,
          subject: email.subject,
          html_body: email.html,
          transactional: true,
        },
      ],
      site_uuid: "site_123",
    });
  });

  test("surfaces Bento API errors as MailerError", async () => {
    stubFetch(() =>
      Response.json({ error: "Author not authorized to send on this account" }, { status: 400 }),
    );

    const exit = await sendWith(bentoEnv);

    expect(failure(exit)).toMatchObject({
      error: {
        _tag: "MailerError",
        provider: "bento",
        message: "Author not authorized to send on this account",
      },
    });
  });

  test("fails when Bento accepts no email", async () => {
    stubFetch(() => Response.json({ results: 0 }));

    const exit = await sendWith(bentoEnv);

    expect(failure(exit)).toMatchObject({
      error: { _tag: "MailerError", provider: "bento", message: "Bento did not accept the email" },
    });
  });

  test.each([
    ["several recipients", { ...email, to: ["a@example.com", "b@example.com"] }],
    ["cc", { ...email, cc: "cc@example.com" }],
    ["bcc", { ...email, bcc: ["bcc@example.com"] }],
    ["replyTo", { ...email, replyTo: "reply@example.com" }],
    ["a text-only body", { from: email.from, to: email.to, subject: email.subject, text: "Hi" }],
  ] satisfies Array<[string, Email]>)("rejects %s before calling Bento", async (_, message) => {
    const fetch = stubFetch(() => Response.json({ results: 1 }));

    const exit = await sendWith(bentoEnv, message);

    expect(failure(exit)).toMatchObject({ error: { _tag: "MailerError", provider: "bento" } });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("fails on config when a Bento key is missing", async () => {
    const fetch = stubFetch(() => Response.json({ results: 1 }));

    const { FACTEUR_BENTO_SECRET_KEY: _, ...env } = bentoEnv;
    const exit = await sendWith(env);

    expect(Exit.isFailure(exit)).toBe(true);
    expect(failure(exit)).not.toMatchObject({ error: { _tag: "MailerError" } });
    expect(fetch).not.toHaveBeenCalled();
  });
});
