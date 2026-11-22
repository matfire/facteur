---
title: Testing
description: "Test code that sends email without sending any: swap in a fake Mailer layer for createMailer or Effect.provide."
section: Guides
order: 6
---

`Mailer` is a regular Effect service, so tests can swap in a fake. `sendWelcome` below is the function from [With Effect](/docs/effect).

```ts
import { Effect, Layer } from "effect";
import { createMailer, Mailer } from "@matfire/facteur";

const sent: Array<unknown> = [];
const MailerTest = Layer.succeed(
  Mailer,
  Mailer.of({
    send: (email) =>
      Effect.sync(() => {
        sent.push(email);
        return { id: "test" };
      }),
  }),
);

// With Effect:
await sendWelcome("a@b.com").pipe(Effect.provide(MailerTest), Effect.runPromise);

// Without Effect:
await createMailer(MailerTest).sendEmail({
  from: "a@b.com",
  to: "c@d.com",
  subject: "Hi",
  text: "Hi",
});
```
