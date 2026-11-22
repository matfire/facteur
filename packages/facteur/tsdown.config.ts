import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "drivers/resend": "src/drivers/resend.ts",
    "drivers/ses": "src/drivers/ses.ts",
    "drivers/nodemailer": "src/drivers/nodemailer.ts",
    "drivers/postmark": "src/drivers/postmark.ts",
    "drivers/bento": "src/drivers/bento.ts",
  },
  dts: {
    generator: "tsgo",
  },
  exports: true,
});
