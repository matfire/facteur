---
title: Choosing a provider in code
description: "Skip environment variables and choose the email provider in code by passing a Resend, SES, Postmark, Bento or nodemailer driver layer to Facteur."
section: Guides
order: 5
---

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
