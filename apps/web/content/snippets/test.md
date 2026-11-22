```ts
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

await createMailer(MailerTest).sendEmail(email);
```
