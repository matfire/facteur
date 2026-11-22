---
title: Sending email
description: "Send email with Facteur's Promise client: the email fields, errors, and closing connections with dispose() or await using."
section: Guides
order: 3
---

Every email needs `from`, `to`, `subject`, and at least one of `html` or `text`. `cc`, `bcc` and `replyTo` are optional. `to`, `cc`, `bcc` and `replyTo` accept one address or an array.

## The Promise client

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

## Automatic cleanup with `await using`

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
