# Facteur

A configurable email provider. Pick Resend, Amazon SES, Postmark, Bento or SMTP (via nodemailer) with environment variables, and send email through the same client whichever one you use.

Built on [Effect](https://effect.website), with a Promise API for projects that don't use Effect.

## Functionality

- define config through environment variables (config file support is planned)
- drivers are tree-shakeable, and each provider's SDK is an optional peer dependency
- import the same client
- send email

## Install

Install the library and the SDK of the provider you use. The other providers' SDKs are not needed.

```bash
npm install @matfire/facteur resend                   # Resend
npm install @matfire/facteur @aws-sdk/client-sesv2    # Amazon SES
npm install @matfire/facteur nodemailer               # SMTP
npm install @matfire/facteur postmark                 # Postmark
npm install @matfire/facteur @bentonow/bento-node-sdk # Bento
```

Effect is installed with the library. Add `effect` to your own dependencies too if you import from it, for example to use the [Effect API](#with-effect), pass a `Redacted` key when [choosing the provider in code](#choose-the-provider-in-code), or write a [test fake](#test-your-app-without-sending-email):

```bash
npm install effect
```

## Configure

Set `FACTEUR_PROVIDER` and that provider's variables.

### Resend

| Variable                  | Required |
| ------------------------- | -------- |
| `FACTEUR_PROVIDER=RESEND` | yes      |
| `FACTEUR_RESEND_KEY`      | yes      |

### Amazon SES

| Variable                        | Required | Notes                                                                                               |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `FACTEUR_PROVIDER=SES`          | yes      |                                                                                                     |
| `FACTEUR_SES_REGION`            | yes      |                                                                                                     |
| `FACTEUR_SES_ACCESS_KEY_ID`     | no       | Needs `FACTEUR_SES_SECRET_ACCESS_KEY` too                                                           |
| `FACTEUR_SES_SECRET_ACCESS_KEY` | no       | Without both keys, the AWS SDK default credential chain is used (AWS env vars, `~/.aws`, IAM roles) |

### Postmark

| Variable                    | Required | Notes              |
| --------------------------- | -------- | ------------------ |
| `FACTEUR_PROVIDER=POSTMARK` | yes      |                    |
| `FACTEUR_POSTMARK_TOKEN`    | yes      | A server API token |

### Bento

| Variable                        | Required |
| ------------------------------- | -------- |
| `FACTEUR_PROVIDER=BENTO`        | yes      |
| `FACTEUR_BENTO_SITE_UUID`       | yes      |
| `FACTEUR_BENTO_PUBLISHABLE_KEY` | yes      |
| `FACTEUR_BENTO_SECRET_KEY`      | yes      |

Bento's email API is narrower than the others: an email must have exactly one `to` address and an `html` body, and no `cc`, `bcc` or `replyTo`. Other emails fail with a `MailerError` before anything is sent. `text` is not sent, `from` must be an author on your Bento account, and the HTML is rendered as a Liquid template. Emails are sent as transactional, so they reach recipients who unsubscribed from marketing. Bento returns no message id, so `id` is an empty string.

### SMTP (nodemailer)

| Variable                      | Required | Notes                                          |
| ----------------------------- | -------- | ---------------------------------------------- |
| `FACTEUR_PROVIDER=NODEMAILER` | yes      |                                                |
| `FACTEUR_NODEMAILER_HOST`     | yes      |                                                |
| `FACTEUR_NODEMAILER_PORT`     | no       | nodemailer defaults to 587, or 465 when secure |
| `FACTEUR_NODEMAILER_SECURE`   | no       | Defaults to `false`                            |
| `FACTEUR_NODEMAILER_USER`     | no       | Needs `FACTEUR_NODEMAILER_PASS` too            |
| `FACTEUR_NODEMAILER_PASS`     | no       |                                                |

An unknown provider or a missing required variable fails when the mailer is built, before any email is sent.

## Send email

Every email needs `from`, `to`, `subject`, and at least one of `html` or `text`. `cc`, `bcc` and `replyTo` are optional. `to`, `cc`, `bcc` and `replyTo` accept one address or an array.

### Without Effect

`createMailer` returns a Promise-based client. Create it once and reuse it.

```ts
import { createMailer } from "@matfire/facteur";

const mailer = createMailer();

const { id } = await mailer.sendEmail({
  from: "Acme <hello@acme.com>",
  to: "someone@example.com",
  subject: "Welcome!",
  html: "<p>Thanks for signing up.</p>",
});

// On shutdown, close SMTP connections / the SES client:
await mailer.dispose();
```

The provider is built from the environment on the first `sendEmail` call. `sendEmail` rejects with a `MailerError` if sending fails, or with a config error if the environment is incomplete.

#### Automatic cleanup with `await using`

The client supports [explicit resource management](https://github.com/tc39/proposal-explicit-resource-management). Declare it with `await using` and it is disposed when the block exits, even if sending throws. This suits short-lived work such as scripts, jobs or a single request:

```ts
import { createMailer } from "@matfire/facteur";

{
  await using mailer = createMailer();
  await mailer.sendEmail({
    from: "Acme <hello@acme.com>",
    to: "someone@example.com",
    subject: "Report ready",
    text: "Your weekly report is attached.",
  });
} // SMTP connections / the SES client are closed here
```

Use `await using`, not plain `using`: closing connections is asynchronous. In a long-running server, create one client at startup and call `dispose()` on shutdown instead.

Requirements:

- **Runtime**: Node.js 24+ supports `await using` natively. Support in other runtimes and browsers varies, so check your target; where it's missing, let TypeScript or your bundler downlevel the syntax to `try`/`finally`.
- **TypeScript**: 5.2+, with `"esnext.disposable"` (or `"esnext"`) in `compilerOptions.lib`. No yearly lib up to `es2025` includes it yet. `@types/node` and `effect` already reference it, so it often works without changes.

### With Effect

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

## Choose the provider in code

To skip environment variables, import a driver directly and pass its layer to `createMailer`, or provide it with `Effect.provide`. Each driver also has a `layerConfig` that reads only its own variables.

```ts
import { Redacted } from "effect";
import { createMailer } from "@matfire/facteur";
import * as Bento from "@matfire/facteur/drivers/bento";
import * as Nodemailer from "@matfire/facteur/drivers/nodemailer";
import * as Postmark from "@matfire/facteur/drivers/postmark";
import * as Resend from "@matfire/facteur/drivers/resend";
import * as Ses from "@matfire/facteur/drivers/ses";

createMailer(Resend.layer({ apiKey: Redacted.make(process.env.MY_RESEND_KEY!) }));
createMailer(Ses.layer({ region: "eu-west-1" })); // any SESv2 client config
createMailer(Nodemailer.layer("smtps://user:pass@host")); // any nodemailer transport config
createMailer(Postmark.layer({ serverToken: Redacted.make(process.env.MY_POSTMARK_TOKEN!) }));
createMailer(
  Bento.layer({
    siteUuid: process.env.MY_BENTO_SITE_UUID!,
    publishableKey: process.env.MY_BENTO_PUBLISHABLE_KEY!,
    secretKey: Redacted.make(process.env.MY_BENTO_SECRET_KEY!),
  }),
);
```

## Test your app without sending email

`Mailer` is a regular Effect service, so tests can swap in a fake:

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

## Development

See the [repository README](https://github.com/matfire/facteur#development).
