---
title: Introduction
description: "Facteur sends email through Resend, Amazon SES or SMTP with the same TypeScript client. Learn what it does and send your first email."
section: Getting started
order: 0
---

Facteur is a configurable email client for TypeScript. Pick Resend, Amazon SES or SMTP (via nodemailer) with environment variables, and send email through the same client whichever one you use.

It is built on [Effect](https://effect.website), with a Promise API for projects that don't use Effect.

## Features

- Configuration comes from environment variables (config file support is planned).
- Drivers are tree-shakeable, and each provider's SDK is an optional peer dependency.
- The same client works with every provider.
- Missing or invalid configuration fails when the mailer is built, before any email is sent.

## A first email

```ts
import { createMailer } from "@matfire/facteur";

const mailer = createMailer();

await mailer.sendEmail({
  from: "Acme <hello@acme.com>",
  to: "someone@example.com",
  subject: "Welcome!",
  html: "<p>Thanks for signing up.</p>",
});
```

## Next steps

- [Install](/docs/installation) the library and your provider's SDK.
- [Configure](/docs/configuration) the provider with environment variables.
- [Send email](/docs/sending-email) with the Promise client, or [with Effect](/docs/effect).
