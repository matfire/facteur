```ts
import { createMailer } from "@matfire/facteur";

const mailer = createMailer();

const { id } = await mailer.sendEmail({
  from: "Acme <hello@acme.com>",
  to: "someone@example.com",
  subject: "Welcome!",
  html: "<p>Thanks for signing up.</p>",
});
```
