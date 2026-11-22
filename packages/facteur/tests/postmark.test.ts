import type { Email } from "../src";
import { ConfigProvider, Effect, Exit, Layer } from "effect";
import { afterEach, describe, expect, test, vi } from "vitest";
import { layerConfig, Mailer } from "../src";

// The postmark SDK calls the global fetch, so we intercept it there.
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
  from: "Facteur <facteur@example.com>",
  to: ["one@example.com", "two@example.com"],
  subject: "Hello",
  html: "<p>Hi there</p>",
  text: "Hi there",
  cc: "cc@example.com",
  replyTo: ["reply@example.com"],
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

const postmarkEnv = { FACTEUR_PROVIDER: "POSTMARK", FACTEUR_POSTMARK_TOKEN: "pm_test" };

describe("layerConfig with FACTEUR_PROVIDER=POSTMARK", () => {
  test("sends through the postmark SDK and returns the MessageID", async () => {
    const fetch = stubFetch(() =>
      Response.json({
        To: "one@example.com, two@example.com",
        SubmittedAt: "2026-11-22T10:00:00Z",
        MessageID: "pm_msg_123",
        ErrorCode: 0,
        Message: "OK",
      }),
    );

    const exit = await sendWith(postmarkEnv);

    expect(exit).toStrictEqual(Exit.succeed({ id: "pm_msg_123" }));
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe("https://api.postmarkapp.com/email");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("x-postmark-server-token")).toBe("pm_test");
    expect(JSON.parse(String(init?.body))).toStrictEqual({
      From: email.from,
      To: "one@example.com, two@example.com",
      Cc: "cc@example.com",
      ReplyTo: "reply@example.com",
      Subject: email.subject,
      HtmlBody: email.html,
      TextBody: email.text,
    });
  });

  test("surfaces Postmark error messages as MailerError", async () => {
    stubFetch(() =>
      Response.json(
        { ErrorCode: 300, Message: "Invalid 'From' address: 'nope'." },
        { status: 422 },
      ),
    );

    const exit = await sendWith(postmarkEnv);

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: {
        _tag: "MailerError",
        provider: "postmark",
        message: "Invalid 'From' address: 'nope'.",
      },
    });
  });

  test("rejects emails without html or text before calling Postmark", async () => {
    const fetch = stubFetch(() => Response.json({ MessageID: "pm_msg_123", ErrorCode: 0 }));

    const exit = await sendWith(postmarkEnv, {
      from: email.from,
      to: email.to,
      subject: email.subject,
    } as unknown as Email);

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({ error: { _tag: "MailerError", provider: "postmark" } });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("fails on config when FACTEUR_POSTMARK_TOKEN is missing", async () => {
    const fetch = stubFetch(() => Response.json({ MessageID: "pm_msg_123", ErrorCode: 0 }));

    const exit = await sendWith({ FACTEUR_PROVIDER: "POSTMARK" });

    expect(Exit.isFailure(exit)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
