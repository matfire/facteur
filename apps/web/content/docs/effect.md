---
title: With Effect
description: "Use Facteur from Effect: depend on the Mailer service, provide layerConfig at your entry point, and handle MailerError by its tag."
section: Guides
order: 4
---

Depend on the `Mailer` service and provide `layerConfig` at your entry point.

```ts
import { Effect } from "effect";
import { layerConfig, Mailer } from "@matfire/facteur";

const sendWelcome = Effect.fn("sendWelcome")(function* (to: string) {
  const mailer = yield* Mailer;
  return yield* mailer.send({
    from: "Acme <hello@acme.com>",
    to,
    subject: "Welcome!",
    html: "<p>Thanks for signing up.</p>",
  });
});

sendWelcome("someone@example.com").pipe(Effect.provide(layerConfig), Effect.runPromise);
```

`send` fails with a `MailerError`, which carries `provider`, `message` and the original `cause`:

```ts
mailer
  .send(email)
  .pipe(Effect.catchTag("MailerError", (e) => Effect.logError(`[${e.provider}] ${e.message}`)));
```
