---
title: Installation
description: "Install @matfire/facteur and the SDK of your provider: resend, @aws-sdk/client-sesv2 or nodemailer. The other providers' SDKs are optional."
section: Getting started
order: 1
---

Install the library and the SDK of the provider you use. The other providers' SDKs are not needed.

```bash
npm install @matfire/facteur resend                  # Resend
npm install @matfire/facteur @aws-sdk/client-sesv2   # Amazon SES
npm install @matfire/facteur nodemailer              # SMTP
```

Effect is installed with the library. Add `effect` to your own dependencies too if you import from it, for example to use the [Effect API](/docs/effect), pass a `Redacted` key when [choosing the provider in code](/docs/choosing-a-provider), or write a [test fake](/docs/testing):

```bash
npm install effect
```
