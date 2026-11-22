import type { Email } from "../src";
import { ConfigProvider, Effect, Exit, Layer } from "effect";
import { afterEach, describe, expect, test, vi } from "vitest";
import { layerConfig, Mailer } from "../src";

// The resend SDK calls the global fetch, so we intercept it there.
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

const withEnv = (env: Record<string, string>) =>
  ConfigProvider.layer(ConfigProvider.fromEnv({ env }));

const email: Email = {
  from: "Facteur <facteur@example.com>",
  to: "someone@example.com",
  subject: "Hello",
  text: "Hi there",
  replyTo: ["reply@example.com"],
};

const sendWith = (env: Record<string, string>, message: Email = email) =>
  Effect.gen(function* () {
    const mailer = yield* Mailer;
    return yield* mailer.send(message);
  }).pipe(Effect.provide(layerConfig.pipe(Layer.provide(withEnv(env)))), Effect.runPromiseExit);

const resendEnv = { FACTEUR_PROVIDER: "RESEND", FACTEUR_RESEND_KEY: "re_test" };

describe("layerConfig with FACTEUR_PROVIDER=RESEND", () => {
  test("sends through the resend SDK when FACTEUR_RESEND_KEY is set", async () => {
    const fetch = stubFetch(() => Response.json({ id: "email_123" }));

    const exit = await sendWith(resendEnv);

    expect(exit).toStrictEqual(Exit.succeed({ id: "email_123" }));
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer re_test");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      reply_to: email.replyTo,
    });
  });

  test("fails when FACTEUR_RESEND_KEY is missing", async () => {
    const fetch = stubFetch(() => Response.json({ id: "email_123" }));

    const exit = await sendWith({ FACTEUR_PROVIDER: "RESEND" });

    expect(Exit.isFailure(exit)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("fails when FACTEUR_PROVIDER is unknown", async () => {
    const fetch = stubFetch(() => Response.json({ id: "email_123" }));

    const exit = await sendWith({
      FACTEUR_PROVIDER: "NOPE",
      FACTEUR_RESEND_KEY: "re_test",
    });

    expect(Exit.isFailure(exit)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("surfaces Resend error messages as MailerError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(() =>
      Response.json(
        {
          statusCode: 422,
          name: "validation_error",
          message: "Invalid `from` field.",
        },
        { status: 422 },
      ),
    );

    const exit = await sendWith(resendEnv);

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: {
        _tag: "MailerError",
        provider: "resend",
        message: "Invalid `from` field.",
      },
    });
  });

  test("rejects emails without html or text before calling Resend", async () => {
    const fetch = stubFetch(() => Response.json({ id: "email_123" }));

    const exit = await sendWith(resendEnv, {
      from: email.from,
      to: email.to,
      subject: email.subject,
    } as unknown as Email);

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: { _tag: "MailerError", provider: "resend" },
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
