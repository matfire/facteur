import { Cause, Effect, Exit, Redacted } from "effect";
import { afterEach, expect, test, vi } from "vitest";

// Simulates an app that hasn't installed the optional `resend` peer.
afterEach(() => {
  vi.doUnmock("resend");
  vi.resetModules();
});

test("a driver module loads without its peer, and fails only when its layer is built", async () => {
  vi.doMock("resend", () => {
    throw new Error("Cannot find package 'resend'");
  });

  // Re-imported after the mock, so take Mailer from the same module graph.
  const Resend = await import("../src/drivers/resend");
  const { Mailer, MailerError } = await import("../src/Mailer");
  const exit = await Effect.gen(function* () {
    return yield* Mailer;
  }).pipe(
    Effect.provide(Resend.layer({ apiKey: Redacted.make("re_test") })),
    Effect.runPromiseExit,
  );

  expect(Exit.isFailure(exit) && Cause.squash(exit.cause)).toStrictEqual(
    new MailerError({
      provider: "resend",
      message: "Could not load the resend driver. Is its peer dependency installed?",
    }),
  );
});
