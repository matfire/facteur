import { Config, Effect, Layer } from "effect";
import { importPeer as loadDriver } from "./internal/peer";

/**
 * Builds the Mailer from the environment.
 *
 * - `FACTEUR_PROVIDER=RESEND` + `FACTEUR_RESEND_KEY` → Resend driver
 * - `FACTEUR_PROVIDER=NODEMAILER` + `FACTEUR_NODEMAILER_HOST` → nodemailer SMTP driver
 * - `FACTEUR_PROVIDER=SES` + `FACTEUR_SES_REGION` → Amazon SES (v2 API) driver
 * - `FACTEUR_PROVIDER=POSTMARK` + `FACTEUR_POSTMARK_TOKEN` → Postmark driver
 * - `FACTEUR_PROVIDER=BENTO` + `FACTEUR_BENTO_SITE_UUID`, `FACTEUR_BENTO_PUBLISHABLE_KEY`
 *   and `FACTEUR_BENTO_SECRET_KEY` → Bento driver
 * - `FACTEUR_PROVIDER=CONSOLE` → prints emails to the console instead of sending them
 *
 * Drivers are imported on demand, so only the selected one's peer dependency
 * (`resend`, `nodemailer`, `@aws-sdk/client-sesv2`, `postmark` or
 * `@bentonow/bento-node-sdk`) needs to be installed. The console driver needs none.
 */
export const layerConfig = Layer.unwrap(
  Effect.gen(function* () {
    const provider = yield* Config.Literals(
      ["RESEND", "NODEMAILER", "SES", "POSTMARK", "BENTO", "CONSOLE"],
      "FACTEUR_PROVIDER",
    );
    switch (provider) {
      case "RESEND":
        return (yield* loadDriver("resend", () => import("./drivers/resend"))).layerConfig;
      case "NODEMAILER":
        return (yield* loadDriver("nodemailer", () => import("./drivers/nodemailer"))).layerConfig;
      case "SES":
        return (yield* loadDriver("ses", () => import("./drivers/ses"))).layerConfig;
      case "POSTMARK":
        return (yield* loadDriver("postmark", () => import("./drivers/postmark"))).layerConfig;
      case "BENTO":
        return (yield* loadDriver("bento", () => import("./drivers/bento"))).layerConfig;
      case "CONSOLE":
        return (yield* loadDriver("console", () => import("./drivers/console"))).layerConfig;
    }
  }),
);
