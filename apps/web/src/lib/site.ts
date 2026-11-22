import pkg from "../../../../packages/facteur/package.json";

export const site = {
  name: "Facteur",
  url: "https://facteur.dev",
  packageName: pkg.name,
  version: pkg.version,
  license: pkg.license,
  /** Default title and description, used by the home page and as fallbacks. */
  title: "Facteur: one email client for Resend, Amazon SES and SMTP",
  description:
    "Facteur is a TypeScript email library: send through Resend, Amazon SES or SMTP with the same client, and pick the provider with an environment variable. Promise API or Effect.",
  repo: "https://github.com/matfire/facteur",
  changelog: "https://github.com/matfire/facteur/blob/main/packages/facteur/CHANGELOG.md",
  npm: `https://www.npmjs.com/package/${pkg.name}`,
  author: { name: "Matteo Gassend", url: "https://github.com/matfire" },
};

/** Props for links that leave the site. */
export const external = { target: "_blank", rel: "noopener noreferrer" } as const;
