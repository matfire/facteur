import type { Email } from "../src";
import { Readable } from "node:stream";
import { ConfigProvider, Effect, Exit, Layer } from "effect";
import { afterEach, describe, expect, test, vi } from "vitest";
import { layerConfig, Mailer } from "../src";
import * as Ses from "../src/drivers/ses";

const email: Email = {
  from: "facteur@example.com",
  to: "someone@example.com",
  subject: "Hello",
  html: "<p>Hi there</p>",
  text: "Hi there",
  cc: ["cc@example.com"],
  replyTo: "reply@example.com",
};

const send = (message: Email = email) =>
  Effect.gen(function* () {
    const mailer = yield* Mailer;
    return yield* mailer.send(message);
  });

interface CapturedRequest {
  readonly method: string;
  readonly hostname: string;
  readonly path: string;
  readonly headers: Record<string, string>;
  // The SDK serializes JSON bodies to bytes (older versions used a string).
  readonly body: string | Uint8Array;
}

// Decode explicitly: treating the SDK's byte body as a string triggers a
// deprecation warning, and will throw in a future SDK version.
const bodyJson = (request: CapturedRequest | undefined) =>
  JSON.parse(
    typeof request?.body === "string" ? request.body : new TextDecoder().decode(request?.body),
  );

// A stand-in for the SDK's HTTP handler: records the signed request and replies
// with a canned response, so the real serialization/signing path runs.
const stubHandler = (statusCode: number, body: unknown, headers: Record<string, string> = {}) => {
  const requests: Array<CapturedRequest> = [];
  const requestHandler = {
    handle: async (request: CapturedRequest) => {
      requests.push(request);
      return {
        response: {
          statusCode,
          headers: { "content-type": "application/json", ...headers },
          body: Readable.from([Buffer.from(JSON.stringify(body))]),
        },
      };
    },
  };
  return { requests, requestHandler };
};

const testConfig = {
  region: "eu-west-1",
  credentials: { accessKeyId: "AKIATEST", secretAccessKey: "secret" },
};

describe("ses driver", () => {
  test("sends a SendEmail request and returns the MessageId", async () => {
    const { requests, requestHandler } = stubHandler(200, {
      MessageId: "msg_123",
    });

    const exit = await send().pipe(
      Effect.provide(Ses.layer({ ...testConfig, requestHandler: requestHandler as any })),
      Effect.runPromiseExit,
    );

    expect(exit).toStrictEqual(Exit.succeed({ id: "msg_123" }));
    const [request] = requests;
    expect(request?.method).toBe("POST");
    expect(request?.hostname).toBe("email.eu-west-1.amazonaws.com");
    expect(request?.path).toBe("/v2/email/outbound-emails");
    expect(request?.headers.authorization).toContain("Credential=AKIATEST/");
    expect(bodyJson(request)).toStrictEqual({
      FromEmailAddress: email.from,
      Destination: { ToAddresses: [email.to], CcAddresses: email.cc },
      ReplyToAddresses: [email.replyTo],
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: email.html, Charset: "UTF-8" },
            Text: { Data: email.text, Charset: "UTF-8" },
          },
        },
      },
    });
  });

  test("surfaces SES error messages as MailerError", async () => {
    const { requestHandler } = stubHandler(
      400,
      { message: "Email address is not verified." },
      { "x-amzn-errortype": "MessageRejected" },
    );

    const exit = await send().pipe(
      Effect.provide(Ses.layer({ ...testConfig, requestHandler: requestHandler as any })),
      Effect.runPromiseExit,
    );

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: {
        _tag: "MailerError",
        provider: "ses",
        message: "Email address is not verified.",
      },
    });
  });

  test("rejects emails without html or text before calling SES", async () => {
    const { requests, requestHandler } = stubHandler(200, {
      MessageId: "msg_123",
    });

    const exit = await send({
      from: email.from,
      to: email.to,
      subject: email.subject,
    } as unknown as Email).pipe(
      Effect.provide(Ses.layer({ ...testConfig, requestHandler: requestHandler as any })),
      Effect.runPromiseExit,
    );

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: { _tag: "MailerError", provider: "ses" },
    });
    expect(requests).toHaveLength(0);
  });
});

const sendWith = (env: Record<string, string>) =>
  send().pipe(
    Effect.provide(
      layerConfig.pipe(Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env })))),
    ),
    Effect.runPromiseExit,
  );

describe("layerConfig with FACTEUR_PROVIDER=SES", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("builds the SES client from FACTEUR_SES_* settings", async () => {
    // Point the SDK at a closed local port: reaching a connection error proves
    // the SES driver was selected and its config accepted, without calling AWS.
    vi.stubEnv("AWS_ENDPOINT_URL_SESV2", "http://127.0.0.1:1");

    const exit = await sendWith({
      FACTEUR_PROVIDER: "SES",
      FACTEUR_SES_REGION: "eu-west-1",
      FACTEUR_SES_ACCESS_KEY_ID: "AKIATEST",
      FACTEUR_SES_SECRET_ACCESS_KEY: "secret",
    });

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(error).toMatchObject({
      error: { _tag: "MailerError", provider: "ses" },
    });
    expect(String((error as any)?.error?.message)).toMatch(/ECONNREFUSED|connect/i);
  });

  test("fails on config when FACTEUR_SES_REGION is missing", async () => {
    const exit = await sendWith({ FACTEUR_PROVIDER: "SES" });

    const error = Exit.isFailure(exit) ? exit.cause.reasons[0] : undefined;
    expect(Exit.isFailure(exit)).toBe(true);
    expect(error).not.toMatchObject({ error: { _tag: "MailerError" } });
  });
});
