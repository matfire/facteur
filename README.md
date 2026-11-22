# Facteur

Monorepo for [`@matfire/facteur`](packages/facteur), a configurable email provider for Effect: Resend, SES and SMTP (nodemailer) behind one Mailer service. See the [package README](packages/facteur/README.md) for usage.

## Layout

| Path               | What                                             |
| ------------------ | ------------------------------------------------ |
| `packages/facteur` | The `@matfire/facteur` library, published to npm |
| `apps/web`         | The website: landing page and documentation      |

Tasks run through [Turborepo](https://turborepo.com), which caches results and runs packages in dependency order.

## Development

- Install the tools (bun, [lefthook](https://lefthook.dev), [cocogitto](https://docs.cocogitto.io)) with [mise](https://mise.jdx.dev), then the dependencies and the git hooks:

```bash
mise install
bun install
lefthook install
```

The hooks format staged files with oxfmt and lint them with oxlint before each commit, and check that commit messages follow [Conventional Commits](https://www.conventionalcommits.org) with `cog verify`. Release-please builds the version number and changelog from those messages, so use types such as `feat:`, `fix:` or `feat!:` for breaking changes.

- Run the unit tests, typecheck and build every package from the root:

```bash
bun run test
bun run typecheck
bun run build
```

To run a task for one package, filter it: `bunx turbo run test --filter=@matfire/facteur`.

- Lint with [oxlint](https://oxc.rs/docs/guide/usage/linter) (warnings fail the check) and format with [oxfmt](https://oxc.rs/docs/guide/usage/formatter). Both run over the whole repo:

```bash
bun run lint          # or lint:fix
bun run format        # or format:check
```

## Releases

[Release-please](https://github.com/googleapis/release-please) opens a release PR for `packages/facteur` when commits land on `main`. Merging it tags `facteur-vX.Y.Z`, and the publish workflow then publishes the package to npm.

The website in `apps/web` is not released: release-please doesn't track it, so commits that only change it never open a release PR.

## Website

`apps/web` is a [TanStack Start](https://tanstack.com/start) app. The docs are Markdown files in `apps/web/content/docs`, loaded with [content-collections](https://www.content-collections.dev). Each page needs `title`, `description`, `section` (`Getting started` or `Guides`, its sidebar group) and `order` (its position in the sidebar) in its frontmatter; `index.md` is served at `/docs`. Code samples on the landing page live in `apps/web/content/snippets`.

The site is served at [facteur.dev](https://facteur.dev) and fully pre-rendered. A page's `description` is also its search snippet and social preview text, so keep it to roughly 110–160 characters. The build writes `sitemap.xml`, `llms.txt` and `llms-full.txt` from the docs, so new pages are included without extra steps. The share image (`public/og.png`) and app icons come from HTML templates in `apps/web/scripts/images`; after changing them, rerun `scripts/images/generate.sh` (it needs a Chromium binary in `CHROME`).

```bash
bunx turbo run dev --filter=@facteur/web   # http://localhost:3000
bunx turbo run build --filter=@facteur/web # static site in apps/web/dist/client
```

The site deploys to Cloudflare Workers as static assets (`apps/web/wrangler.jsonc`, no Worker script). Pages are served without a trailing slash, missing URLs get `404.html`, and facteur.dev is attached as a custom domain on deploy. From `apps/web`, after a build: `bun run preview:cloudflare` runs it locally, `bun run deploy` publishes it (log in first with `bunx wrangler login`).
