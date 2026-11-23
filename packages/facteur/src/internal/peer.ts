import { Effect } from "effect";
import { MailerError } from "../Mailer";

/**
 * Loads an optional peer dependency when a layer is built.
 *
 * Drivers must not import their SDK statically: `layerConfig` reaches every
 * driver through `import()`, so bundlers (Vite, Rollup, ...) follow them all.
 * When a peer isn't installed, Vite swaps it for an empty stub, and a static
 * named import from that stub fails the build with MISSING_EXPORT, even for
 * apps that only use the console driver.
 */
export const importPeer = <A>(provider: string, load: () => Promise<A>) =>
  Effect.tryPromise({
    try: load,
    catch: (cause) =>
      new MailerError({
        provider,
        message: `Could not load the ${provider} driver. Is its peer dependency installed?`,
        cause,
      }),
  });
