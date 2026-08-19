import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

/** Node major required by the CLI packages as of v9 (was `>=18`). */
const REQUIRED_NODE_MAJOR = 22;

/** The CLI packages whose `engines.node` moved to `>=22`. */
const NODE_PACKAGES = [
  '@jsverse/transloco-keys-manager',
  '@jsverse/transloco-optimize',
  '@jsverse/transloco-scoped-libs',
  '@jsverse/transloco-utils',
  '@jsverse/transloco-validator',
];

/**
 * Reports the v9 breaking changes that can't be applied to the source tree.
 *
 * Only Node is checked here. The Angular floor is declared instead - as a peer
 * range, and as `requires` on the migration itself - which is how the rest of
 * the ecosystem does it: `ng update` refuses on an unsatisfiable peer before
 * any migration runs, and Nx evaluates `requires` itself. Parsing a version
 * range by hand would only duplicate that, less reliably.
 *
 * Node has no such mechanism. `engines.node` is a warning under npm rather than
 * a refusal, and it states intent rather than the interpreter actually running,
 * so this reads the live version.
 */
export function reportVersionFloors(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (nodeMajor >= REQUIRED_NODE_MAJOR) return;

    context.logger.warn(
      `  ↳ Node ${nodeMajor} detected. The Transloco CLI packages now require Node >=${REQUIRED_NODE_MAJOR}:\n` +
        `    ${NODE_PACKAGES.join(', ')}.\n` +
        `    chokidar was also bumped 3 -> 5 (ESM-only) in transloco-scoped-libs.`,
    );
  };
}
