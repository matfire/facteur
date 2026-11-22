---
title: Configuration
description: "Every environment variable Facteur reads for Resend, Amazon SES and SMTP, which are required, and how missing configuration is reported."
section: Getting started
order: 2
---

Set `FACTEUR_PROVIDER` and that provider's variables.

## Resend

| Variable                  | Required |
| ------------------------- | -------- |
| `FACTEUR_PROVIDER=RESEND` | yes      |
| `FACTEUR_RESEND_KEY`      | yes      |

## Amazon SES

| Variable                        | Required | Notes                                                                                               |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `FACTEUR_PROVIDER=SES`          | yes      |                                                                                                     |
| `FACTEUR_SES_REGION`            | yes      |                                                                                                     |
| `FACTEUR_SES_ACCESS_KEY_ID`     | no       | Needs `FACTEUR_SES_SECRET_ACCESS_KEY` too                                                           |
| `FACTEUR_SES_SECRET_ACCESS_KEY` | no       | Without both keys, the AWS SDK default credential chain is used (AWS env vars, `~/.aws`, IAM roles) |

## SMTP (nodemailer)

| Variable                      | Required | Notes                                          |
| ----------------------------- | -------- | ---------------------------------------------- |
| `FACTEUR_PROVIDER=NODEMAILER` | yes      |                                                |
| `FACTEUR_NODEMAILER_HOST`     | yes      |                                                |
| `FACTEUR_NODEMAILER_PORT`     | no       | nodemailer defaults to 587, or 465 when secure |
| `FACTEUR_NODEMAILER_SECURE`   | no       | Defaults to `false`                            |
| `FACTEUR_NODEMAILER_USER`     | no       | Needs `FACTEUR_NODEMAILER_PASS` too            |
| `FACTEUR_NODEMAILER_PASS`     | no       |                                                |

An unknown provider or a missing required variable fails when the mailer is built, before any email is sent.
