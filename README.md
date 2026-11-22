# Facteur

Monorepo for [`@matfire/facteur`](packages/facteur), a configurable email provider for Effect: Resend, SES and SMTP (nodemailer) behind one Mailer service. See the [package README](packages/facteur/README.md) for usage.

## Layout

| Path               | What                                             |
| ------------------ | ------------------------------------------------ |
| `packages/facteur` | The `@matfire/facteur` library, published to npm |

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
