import { Config, Effect, Layer } from "effect";
import { MailerError } from "./Mailer";

const loadDriver = <A>(provider: string, load: () => Promise<A>) =>
  Effect.tryPromise({
    try: load,
    catch: (cause) =>
      new MailerError({
        provider,
        message: `Could not load the ${provider} driver. Is its peer dependency installed?`,
        cause,
      }),
  });

/**
 * Builds the Mailer from the environment.
 *
 * - `FACTEUR_PROVIDER=RESEND` + `FACTEUR_RESEND_KEY` → Resend driver
 * - `FACTEUR_PROVIDER=NODEMAILER` + `FACTEUR_NODEMAILER_HOST` → nodemailer SMTP driver
 * - `FACTEUR_PROVIDER=SES` + `FACTEUR_SES_REGION` → Amazon SES (v2 API) driver
 *
 * Drivers are imported on demand, so only the selected one's peer dependency
 * (`resend`, `nodemailer` or `@aws-sdk/client-sesv2`) needs to be installed.
 */
export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const provider = yield* Config.Literals(["RESEND", "NODEMAILER", "SES"], "FACTEUR_PROVIDER");
    switch (provider) {
      case "RESEND":
        return (yield* loadDriver("resend", () => import("./drivers/resend"))).layerConfig;
      case "NODEMAILER":
        return (yield* loadDriver("nodemailer", () => import("./drivers/nodemailer"))).layerConfig;
      case "SES":
        return (yield* loadDriver("ses", () => import("./drivers/ses"))).layerConfig;
    }
  }),
);
