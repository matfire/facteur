---
title: Choosing a provider in code
description: "Skip environment variables and choose the email provider in code by passing a Resend, SES or nodemailer driver layer to Facteur."
section: Guides
order: 5
---

To skip environment variables, import a driver directly and pass its layer to `createMailer`, or provide it with `Effect.provide`. Each driver also has a `layerConfig` that reads only its own variables.

```ts
import { Redacted } from "effect";
import { createMailer } from "@matfire/facteur";
import * as Nodemailer from "@matfire/facteur/drivers/nodemailer";
import * as Resend from "@matfire/facteur/drivers/resend";
import * as Ses from "@matfire/facteur/drivers/ses";

createMailer(Resend.layer({ apiKey: Redacted.make(process.env.MY_RESEND_KEY!) }));
createMailer(Ses.layer({ region: "eu-west-1" })); // any SESv2 client config
createMailer(Nodemailer.layer("smtps://user:pass@host")); // any nodemailer transport config
```
