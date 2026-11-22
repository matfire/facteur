<!-- Not formatted by oxfmt: lines are wrapped to fit the landing page columns. -->

```ts
import { Effect } from "effect";
import { layerConfig, Mailer } from "@matfire/facteur";

const sendWelcome = Effect.fn("sendWelcome")(
  function* (to: string) {
    const mailer = yield* Mailer;
    return yield* mailer.send({
      from: "Acme <hello@acme.com>",
      to,
      subject: "Welcome!",
      html: "<p>Thanks for signing up.</p>",
    });
  },
);

sendWelcome("someone@example.com").pipe(
  Effect.provide(layerConfig),
  Effect.runPromise,
);
```
