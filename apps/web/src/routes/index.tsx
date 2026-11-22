import { createFileRoute, Link } from "@tanstack/react-router";
import { allSnippets } from "content-collections";
import { CodeBlock } from "~/components/CodeBlock";
import { CopyCommand } from "~/components/CopyCommand";
import { ProductWindow, type Provider } from "~/components/ProductWindow";
import { SiteFooter } from "~/components/SiteFooter";
import { seo, softwareJsonLd, websiteJsonLd } from "~/lib/seo";
import { external, site } from "~/lib/site";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: site.title,
      description: site.description,
      path: "/",
      jsonLd: [websiteJsonLd, softwareJsonLd],
    }),
  component: Home,
});

function snippet(name: string) {
  const found = allSnippets.find((s) => s.name === name);
  if (!found) throw new Error(`Missing snippet content/snippets/${name}.md`);
  return found.html;
}

const providers: Array<Provider> = [
  { id: "resend", env: "RESEND", label: "Resend", sdk: "resend", envHtml: snippet("env-resend") },
  {
    id: "ses",
    env: "SES",
    label: "Amazon SES",
    sdk: "@aws-sdk/client-sesv2",
    envHtml: snippet("env-ses"),
  },
  {
    id: "nodemailer",
    env: "NODEMAILER",
    label: "SMTP",
    sdk: "nodemailer",
    envHtml: snippet("env-nodemailer"),
  },
];

const features = [
  {
    title: "Configured from the environment",
    body: "Set FACTEUR_PROVIDER and that provider's variables. Moving from SMTP locally to SES in production is a deploy setting.",
  },
  {
    title: "Fails before the first send",
    body: "An unknown provider or a missing required variable is reported when the mailer is built, not halfway through a request.",
  },
  {
    title: "Only the SDK you use",
    body: "Each provider's SDK is an optional peer dependency, and the drivers are tree-shakeable.",
  },
  {
    title: "Promise or Effect",
    body: "createMailer gives you a Promise client. With Effect, depend on the Mailer service and provide a layer.",
  },
  {
    title: "Typed emails",
    body: "from, to and subject are required, plus html, text or both. Leaving out the body fails to type-check and to decode.",
  },
  {
    title: "Clean shutdown",
    body: "dispose() closes SMTP connections and the SES client. Declare the client with await using and it closes itself.",
  },
];

function Home() {
  return (
    <>
      <main className="overflow-x-clip">
        <section className="relative mx-auto max-w-6xl px-5 pt-20 md:pt-28">
          <div className="glow pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[64rem] max-w-[200vw] -translate-x-1/2" />
          <div className="relative">
            <a
              href={site.changelog}
              {...external}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.02] py-1 pr-3 pl-1 text-xs text-muted transition-colors hover:text-ink"
            >
              <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-white">
                v{site.version}
              </span>
              Read the changelog →
            </a>
            <h1 className="text-gradient mt-6 max-w-3xl text-5xl leading-[1.04] font-semibold tracking-[-0.035em] md:text-7xl">
              The email client for every provider
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Resend, Amazon SES and SMTP behind one typed client. Pick the provider with an
              environment variable, and keep the code that sends email exactly as it is.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/docs"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Read the docs
              </Link>
              <CopyCommand command={`npm i ${site.packageName}`} />
            </div>
          </div>
          <div className="relative mt-16 md:mt-20">
            <ProductWindow
              providers={providers}
              sendHtml={snippet("hero")}
              effectHtml={snippet("effect")}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.025em] md:text-4xl">
            Small surface. <span className="text-muted">Sensible defaults.</span>
          </h2>
          <div className="mt-12 grid overflow-hidden rounded-xl border border-line sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="-mb-px -mr-px border-r border-b border-line p-6">
                <h3 className="text-[15px] font-medium tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-16 px-5 pb-24 md:pb-32 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="font-mono text-xs text-accent-ink">Effect</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
              A regular Effect service
            </h2>
            <p className="mt-3 max-w-md text-muted">
              Yield Mailer, provide layerConfig at your entry point, and handle MailerError by its
              tag.
            </p>
            <div className="mt-8 overflow-hidden rounded-xl border border-line bg-panel">
              <CodeBlock html={snippet("effect")} />
            </div>
          </div>
          <div>
            <p className="font-mono text-xs text-accent-ink">Testing</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
              Tests that never send email
            </h2>
            <p className="mt-3 max-w-md text-muted">
              Swap in a fake Mailer layer and pass it to createMailer or Effect.provide. The code
              under test doesn't change.
            </p>
            <div className="mt-8 overflow-hidden rounded-xl border border-line bg-panel">
              <CodeBlock html={snippet("test")} />
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">
              Send your first email.
              <span className="block text-muted">It takes one environment variable.</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/docs"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
              <a
                href={site.repo}
                {...external}
                className="rounded-lg border border-line-strong px-4 py-2 text-sm text-soft transition-colors hover:text-ink"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
